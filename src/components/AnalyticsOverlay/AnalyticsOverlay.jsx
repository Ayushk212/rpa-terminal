// AnalyticsOverlay.jsx
// Bonus feature: aggregated analytics overlay, active only while stream is paused.
// Uses Chart.js directly (no react-chartjs-2 wrapper — matches bonus task wording).
//
// DESIGN DECISIONS that prevent bugs:
// 1. Snapshot is captured ONCE when overlay opens (frozenRows prop, locked in App.jsx).
//    Charts never re-render from live data — avoids flicker and stale ref issues.
// 2. Each canvas gets its own useRef. Chart instances stored in refs (not state)
//    so they never trigger re-renders.
// 3. Cleanup: every Chart instance is destroyed in the useEffect return.
//    Prevents "Canvas already in use" error on re-open.
// 4. Chart.js tree-shaken: only the controllers/elements/plugins we use are registered.
// 5. The overlay is only mounted when (paused && analyticsOpen) — canvases are
//    guaranteed to exist in the DOM when useEffect fires.

import { useEffect, useRef } from 'react';
import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  RadarController,
  DoughnutController,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register only what we need — keeps bundle tight
Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  RadarController, DoughnutController, BarController, LineController,
  CategoryScale, LinearScale, RadialLinearScale,
  Tooltip, Legend, Filler
);

// ── Shared Chart.js theme ──────────────────────────────────────────────────
const FONT = { family: '"JetBrains Mono", monospace', size: 10 };
const GRID_COLOR  = 'rgba(30,41,59,0.8)';
const LABEL_COLOR = '#475569';

const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      labels: { color: LABEL_COLOR, font: FONT, boxWidth: 10, padding: 10 },
    },
    tooltip: {
      backgroundColor: '#020617',
      borderColor: '#1e293b',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      titleFont: FONT,
      bodyFont: FONT,
      padding: 8,
    },
  },
};

// ── Data aggregation helpers ───────────────────────────────────────────────
function getStatusDist(rows) {
  const map = {};
  rows.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
  const labels = Object.keys(map);
  const data   = labels.map(l => map[l]);
  const colors = labels.map(l => ({
    Active:    '#4ade80', Completed: '#38bdf8',
    Failed:    '#ef4444', Pending:   '#fbbf24', 'On Hold': '#475569',
  }[l] || '#334155'));
  return { labels, data, colors };
}

function getDeptSavings(rows) {
  const map = {};
  rows.forEach(r => {
    map[r.department] = (map[r.department] || 0) + (r.cumulative_savings || 0);
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return {
    labels: sorted.map(([k]) => k),
    data:   sorted.map(([, v]) => +(v / 1e6).toFixed(2)),
  };
}

function getRoiBuckets(rows) {
  const buckets = { '< 0': 0, '0–50': 0, '50–200': 0, '200–500': 0, '500+': 0 };
  rows.forEach(r => {
    const v = Number(r.roi_percent);
    if (v < 0)        buckets['< 0']++;
    else if (v < 50)  buckets['0–50']++;
    else if (v < 200) buckets['50–200']++;
    else if (v < 500) buckets['200–500']++;
    else              buckets['500+']++;
  });
  return { labels: Object.keys(buckets), data: Object.values(buckets) };
}

function getRadarByType(rows) {
  const types = ['Cloud', 'On-Premise', 'Hybrid', 'SaaS', 'Edge'];
  const metrics = { roi: {}, err: {}, up: {} };
  const counts  = {};
  types.forEach(t => {
    metrics.roi[t] = 0; metrics.err[t] = 0; metrics.up[t] = 0; counts[t] = 0;
  });
  rows.forEach(r => {
    const t = r.automation_type;
    if (!types.includes(t)) return;
    metrics.roi[t] += Number(r.roi_percent) || 0;
    metrics.err[t] += Number(r.error_rate)  || 0;
    metrics.up[t]  += Number(r.uptime_percent) || 0;
    counts[t]++;
  });
  // Normalize to 0-100 scale so radar axes are comparable
  const normalize = (val, max) => Math.min(100, Math.max(0, (val / max) * 100));
  const maxRoi = 500;
  return {
    labels: types,
    roi:  types.map(t => counts[t] ? normalize(metrics.roi[t] / counts[t], maxRoi) : 0),
    err:  types.map(t => counts[t] ? Math.min(100, metrics.err[t] / counts[t] * 6.67) : 0),
    up:   types.map(t => counts[t] ? metrics.up[t] / counts[t] : 0),
  };
}

// ── Individual chart hooks ─────────────────────────────────────────────────
function useChart(canvasRef, buildConfig) {
  const chartRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Destroy previous instance to avoid "Canvas already in use" error
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    chartRef.current = new Chart(canvas, buildConfig());
    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once per mount — data is frozen at mount time
}

// ── Chart panel wrapper ────────────────────────────────────────────────────
function ChartPanel({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#020617',
      border: '1px solid #1e293b',
      borderRadius: '3px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'baseline', gap: '8px',
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: '9px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#334155',
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '8px', color: '#1e293b' }}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{ flex: 1, padding: '12px', position: 'relative', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────
export function AnalyticsOverlay({ frozenRows, onClose, pausedAt }) {
  // Canvas refs — one per chart
  const doughnutRef = useRef(null);
  const barRef      = useRef(null);
  const lineRef     = useRef(null);
  const radarRef    = useRef(null);

  // Pre-aggregate all data ONCE from frozen snapshot
  const status   = getStatusDist(frozenRows);
  const dept     = getDeptSavings(frozenRows);
  const roi      = getRoiBuckets(frozenRows);
  const radar    = getRadarByType(frozenRows);
  const total    = frozenRows.length;
  const failRate = total > 0
    ? ((frozenRows.filter(r => r.status === 'Failed').length / total) * 100).toFixed(1)
    : '0.0';
  const avgRoi   = total > 0
    ? (frozenRows.reduce((s, r) => s + Number(r.roi_percent || 0), 0) / total).toFixed(1)
    : '0.0';

  // ── Doughnut: status distribution ──
  useChart(doughnutRef, () => ({
    type: 'doughnut',
    data: {
      labels: status.labels,
      datasets: [{
        data: status.data,
        backgroundColor: status.colors.map(c => c + 'cc'),
        borderColor:     status.colors,
        borderWidth: 1,
        hoverOffset: 4,
      }],
    },
    options: {
      ...BASE_OPTS,
      cutout: '65%',
      plugins: {
        ...BASE_OPTS.plugins,
        legend: { ...BASE_OPTS.plugins.legend, position: 'right' },
      },
    },
  }));

  // ── Bar: dept savings ──
  useChart(barRef, () => ({
    type: 'bar',
    data: {
      labels: dept.labels,
      datasets: [{
        label: 'Savings ($M)',
        data: dept.data,
        backgroundColor: '#38bdf822',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      ...BASE_OPTS,
      indexAxis: 'y',
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: {
        x: {
          ticks: { color: LABEL_COLOR, font: FONT },
          grid:  { color: GRID_COLOR },
          border:{ color: '#1e293b' },
        },
        y: {
          ticks: { color: LABEL_COLOR, font: FONT },
          grid:  { display: false },
          border:{ color: '#1e293b' },
        },
      },
    },
  }));

  // ── Line: ROI distribution ──
  useChart(lineRef, () => ({
    type: 'line',
    data: {
      labels: roi.labels,
      datasets: [{
        label: 'Projects',
        data: roi.data,
        borderColor: '#FFC801',
        backgroundColor: '#FFC80114',
        borderWidth: 1.5,
        pointBackgroundColor: '#FFC801',
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: {
        x: {
          ticks: { color: LABEL_COLOR, font: FONT },
          grid:  { color: GRID_COLOR },
          border:{ color: '#1e293b' },
        },
        y: {
          ticks: { color: LABEL_COLOR, font: FONT },
          grid:  { color: GRID_COLOR },
          border:{ color: '#1e293b' },
        },
      },
    },
  }));

  // ── Radar: metrics by automation type ──
  useChart(radarRef, () => ({
    type: 'radar',
    data: {
      labels: radar.labels,
      datasets: [
        {
          label: 'ROI (norm.)',
          data: radar.roi,
          borderColor: '#4ade80',
          backgroundColor: '#4ade8018',
          borderWidth: 1.5,
          pointBackgroundColor: '#4ade80',
          pointRadius: 2,
        },
        {
          label: 'Uptime %',
          data: radar.up,
          borderColor: '#38bdf8',
          backgroundColor: '#38bdf818',
          borderWidth: 1.5,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 2,
        },
        {
          label: 'Err Rate (inv.)',
          data: radar.err.map(v => Math.max(0, 100 - v)),
          borderColor: '#ef444488',
          backgroundColor: '#ef444410',
          borderWidth: 1,
          pointBackgroundColor: '#ef4444',
          pointRadius: 2,
        },
      ],
    },
    options: {
      ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { position: 'bottom' } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid:  { color: GRID_COLOR },
          angleLines: { color: GRID_COLOR },
          pointLabels: { color: LABEL_COLOR, font: { ...FONT, size: 9 } },
        },
      },
    },
  }));

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(2,6,23,0.88)',
        backdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column',
        animation: 'fade-up 0.2s ease both',
      }}
      role="dialog"
      aria-label="Analytics overlay"
    >
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 16px', height: '40px',
        background: '#020617',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
      }}>
        {/* Frozen indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }} />
          <span style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
            letterSpacing: '0.12em', color: '#fbbf24',
          }}>
            STREAM FROZEN
          </span>
        </div>

        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#1e293b' }}>│</span>

        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155' }}>
          ANALYTICS VIEW
        </span>

        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#1e293b' }}>│</span>

        {/* Snapshot summary */}
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155' }}>
          snapshot: <span style={{ color: '#e2e8f0' }}>{total.toLocaleString()}</span> rows
        </span>
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155' }}>
          fail rate: <span style={{ color: Number(failRate) > 15 ? '#ef4444' : '#e2e8f0' }}>{failRate}%</span>
        </span>
        <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155' }}>
          avg ROI: <span style={{ color: Number(avgRoi) < 0 ? '#ef4444' : '#4ade80' }}>{Number(avgRoi) >= 0 ? '+' : ''}{avgRoi}%</span>
        </span>

        {pausedAt && (
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#1e293b' }}>
            frozen at {new Date(pausedAt).toLocaleTimeString()}
          </span>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 12px',
            border: '1px solid #1e293b',
            borderRadius: '2px',
            background: 'transparent',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#1e293b'; e.target.style.color = '#475569'; }}
        >
          ✕ close
        </button>
      </div>

      {/* ── 2×2 chart grid ── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '1px',
        background: '#1e293b', // gap color
        overflow: 'hidden',
        padding: '1px',
      }}>
        <ChartPanel title="Status Distribution" subtitle={`${total} rows`}>
          <canvas ref={doughnutRef} />
        </ChartPanel>

        <ChartPanel title="Dept Savings" subtitle="$M · top 6">
          <canvas ref={barRef} />
        </ChartPanel>

        <ChartPanel title="ROI Distribution" subtitle="project count by bracket">
          <canvas ref={lineRef} />
        </ChartPanel>

        <ChartPanel title="Automation Type Profile" subtitle="ROI · uptime · error inverse">
          <canvas ref={radarRef} />
        </ChartPanel>
      </div>

      {/* ── Footer note ── */}
      <div style={{
        padding: '5px 16px',
        background: '#020617', borderTop: '1px solid #1e293b',
        fontFamily: '"JetBrains Mono",monospace', fontSize: '8px',
        color: '#1e293b', flexShrink: 0,
        display: 'flex', gap: '16px',
      }}>
        <span>Charts powered by Chart.js</span>
        <span>Data frozen at pause · resume stream to update</span>
        <span style={{ marginLeft: 'auto' }}>Radar: higher = better for all three metrics</span>
      </div>
    </div>
  );
}
