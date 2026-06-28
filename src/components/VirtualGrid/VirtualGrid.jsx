// VirtualGrid — Feature 8 & 9: Custom virtualized DOM grid
// Fixed node pool = ceil(viewportH / ROW_H) + BUFFER
// Scroll handler swaps textContent in-place — zero React reconciliation
// Signal strip: 4px left border, CSS-transitioned color per _signal tag
// Features 3, 4, 9 + anomaly signal strip

import { useRef, useEffect, useCallback } from 'react';
import { buildSortConfig, getSortIndicator } from '../../lib/sorter';
import {
  formatCurrency, formatROI, formatHours,
  roiClass, statusClass,
} from '../../lib/formatter';
import { SIGNAL_COLORS } from '../../lib/anomaly';

const ROW_H  = 28;
const BUFFER = 6;

const COLUMNS = [
  { key: 'project_name',           label: 'PROJECT',   w: 180, sortable: true  },
  { key: 'department',             label: 'DEPT',      w: 100, sortable: true  },
  { key: 'status',                 label: 'STATUS',    w: 88,  sortable: true  },
  { key: 'budget',                 label: 'BUDGET',    w: 104, sortable: true  },
  { key: 'roi_percent',            label: 'ROI %',     w: 88,  sortable: true  },
  { key: 'employee_hours_saved',   label: 'HRS SAVED', w: 88,  sortable: true  },
  { key: 'cumulative_savings',     label: 'SAVINGS',   w: 104, sortable: true  },
  { key: 'active_robots',          label: 'ROBOTS',    w: 72,  sortable: true  },
  { key: '_zScore',                label: 'σ',         w: 52,  sortable: false },
  { key: 'country',                label: 'CTY',       w: 52,  sortable: false },
  { key: 'implementation_partner', label: 'PARTNER',   w: 108, sortable: false },
];

function cellValue(row, key) {
  switch (key) {
    case 'budget':               return formatCurrency(row.budget);
    case 'roi_percent':          return formatROI(row.roi_percent);
    case 'employee_hours_saved': return formatHours(row.employee_hours_saved);
    case 'cumulative_savings':   return formatCurrency(row.cumulative_savings);
    case '_zScore':              return row._zScore != null ? row._zScore.toFixed(1) + 'σ' : '—';
    default:                     return row[key] != null ? String(row[key]) : '—';
  }
}

function cellColor(row, key) {
  if (key === 'roi_percent')  return roiClass(row.roi_percent);
  if (key === 'status')       return statusClass(row.status);
  if (key === '_zScore') {
    if (row._signal === 'anomaly') return '#ef4444';
    if (row._signal === 'drift')   return '#FFC801';
    return '#334155';
  }
  return '#94a3b8';
}

function rowBgColor(row) {
  if (row._signal === 'anomaly') return 'rgba(239,68,68,0.06)';
  if (row._signal === 'drift')   return 'rgba(255,200,1,0.04)';
  return 'transparent';
}

function flashClass(row) {
  if (row.status === 'Failed' || Number(row.roi_percent) < 0) return 'row-flash-fail';
  if (row._isNew)     return 'row-flash-new';
  return '';
}

export function VirtualGrid({ rows, sortConfig, onSort, isReplaying, gridRef }) {
  const containerRef  = useRef(null);
  const scrollRef     = useRef(null);
  const rowNodesRef   = useRef([]);
  const flashKeysRef  = useRef({});
  const scrollTopRef  = useRef(0);
  const rowsRef       = useRef(rows);
  const poolSizeRef   = useRef(0);

  useEffect(() => { rowsRef.current = rows; }, [rows]);

  // ── Build fixed DOM node pool ──
  const buildPool = useCallback(() => {
    const container = containerRef.current;
    const scroll    = scrollRef.current;
    if (!container || !scroll) return;

    const needed = Math.ceil(container.clientHeight / ROW_H) + BUFFER;
    if (needed === poolSizeRef.current) return;
    poolSizeRef.current = needed;

    while (scroll.firstChild) scroll.removeChild(scroll.firstChild);
    rowNodesRef.current = [];

    for (let i = 0; i < needed; i++) {
      const row = document.createElement('div');
      row.setAttribute('data-row', 'true');
      row.style.cssText = `
        display:flex; align-items:center; height:${ROW_H}px;
        position:absolute; left:0; right:0;
        border-bottom:1px solid rgba(30,41,59,0.5);
        transition: background-color 0.3s ease;
      `;

      // Signal strip — 4px left border indicator
      const strip = document.createElement('div');
      strip.style.cssText = `
        width:3px; height:100%; flex-shrink:0;
        transition: background-color 0.4s ease;
        background: #1e293b;
      `;
      row.appendChild(strip);

      // Cells
      COLUMNS.forEach(col => {
        const td = document.createElement('div');
        td.style.cssText = `
          font-family:'JetBrains Mono',monospace;
          font-size:10px; line-height:1;
          padding:0 8px; overflow:hidden;
          white-space:nowrap; text-overflow:ellipsis;
          width:${col.w}px; flex-shrink:0;
          color:#94a3b8;
          transition: color 0.2s ease;
        `;
        row.appendChild(td);
      });

      scroll.appendChild(row);
      rowNodesRef.current.push(row);
    }
  }, []);

  // ── Paint visible slice into pool ──
  const paint = useCallback((scrollTop) => {
    const data = rowsRef.current;
    if (!rowNodesRef.current.length) return;

    const firstIdx = Math.floor(scrollTop / ROW_H);

    rowNodesRef.current.forEach((rowEl, poolIdx) => {
      const dataIdx = firstIdx + poolIdx;
      const row     = data[dataIdx];

      if (!row) {
        rowEl.style.visibility = 'hidden';
        return;
      }

      rowEl.style.visibility = 'visible';
      rowEl.style.top        = `${(firstIdx + poolIdx) * ROW_H}px`;
      rowEl.style.backgroundColor = isReplaying ? 'rgba(251,191,36,0.03)' : rowBgColor(row);

      // Signal strip color
      const strip = rowEl.children[0];
      strip.style.backgroundColor = SIGNAL_COLORS[row._signal] || '#1e293b';
      strip.style.opacity = row._signal === 'nominal' ? '0.25' : '1';

      // Flash — only on mutation, tracked by composite key
      const flashKey = row.id + ':' + (row.last_updated || '');
      if (!isReplaying && flashKeysRef.current[row.id] !== flashKey) {
        flashKeysRef.current[row.id] = flashKey;
        const fc = flashClass(row);
        if (fc) {
          rowEl.classList.add(fc);
          rowEl.addEventListener('animationend', () => rowEl.classList.remove(fc), { once: true });
        }
      }

      // Write cell values directly
      COLUMNS.forEach((col, ci) => {
        const td  = rowEl.children[ci + 1]; // offset for strip
        if (!td) return;
        const val   = cellValue(row, col.key);
        const color = cellColor(row, col.key);
        if (td.textContent !== val)         td.textContent    = val;
        if (td.style.color   !== color)     td.style.color    = color;
      });
    });
  }, [isReplaying]);

  const onScroll = useCallback(e => {
    scrollTopRef.current = e.target.scrollTop;
    paint(scrollTopRef.current);
  }, [paint]);

  useEffect(() => { paint(scrollTopRef.current); }, [rows, paint]);

  useEffect(() => {
    buildPool();
    paint(0);
    const ro = new ResizeObserver(() => { buildPool(); paint(scrollTopRef.current); });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [buildPool, paint]);

  const handleHeaderClick = useCallback((e, key) => {
    onSort(key, e.shiftKey);
  }, [onSort]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Column headers ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#020617', borderBottom: '1px solid #1e293b',
        flexShrink: 0, paddingLeft: '3px', // align with signal strip
      }}>
        {/* Strip spacer */}
        <div style={{ width: '3px', flexShrink: 0 }} />

        {COLUMNS.map(col => {
          const ind = getSortIndicator(sortConfig, col.key);
          return (
            <div
              key={col.key}
              onClick={col.sortable ? e => handleHeaderClick(e, col.key) : undefined}
              title={col.sortable ? 'Click · Shift+click multi-col' : col.label}
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: '9px', letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '7px 8px',
                width: `${col.w}px`, flexShrink: 0,
                color: ind ? '#38bdf8' : '#334155',
                cursor: col.sortable ? 'pointer' : 'default',
                userSelect: 'none',
                whiteSpace: 'nowrap', overflow: 'hidden',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (col.sortable) e.target.style.color = '#38bdf8'; }}
              onMouseLeave={e => { if (col.sortable) e.target.style.color = ind ? '#38bdf8' : '#334155'; }}
            >
              {col.label}
              {ind && (
                <span style={{ marginLeft: '3px', color: '#FFC801' }}>
                  {ind.dir === 'asc' ? '↑' : '↓'}
                  {ind.total > 1 && <sup style={{ fontSize: '7px' }}>{ind.priority}</sup>}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Virtual scroll viewport ── */}
      <div
        ref={(el) => {
          containerRef.current = el;
          if (gridRef) gridRef.current = el;
        }}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}
        onScroll={onScroll}
        role="grid"
        aria-label="RPA telemetry data grid"
        aria-rowcount={rows.length}
      >
        {/* Total height spacer */}
        <div style={{ height: rows.length * ROW_H, position: 'relative', minWidth: '860px' }}>
          <div ref={scrollRef} style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
        color: '#1e293b', padding: '4px 12px',
        borderTop: '1px solid #1e293b', background: '#020617',
        flexShrink: 0, display: 'flex', gap: '16px',
      }}>
        <span style={{ color: '#334155' }}>{rows.length.toLocaleString()} rows</span>
        <span>DOM pool: {poolSizeRef.current} nodes</span>
        <span>cols: {COLUMNS.length}</span>
        {isReplaying && <span style={{ color: '#fbbf24' }}>REPLAY MODE</span>}
      </div>
    </div>
  );
}
