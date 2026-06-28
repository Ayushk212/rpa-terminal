// Toolbar — Features 7, 10: Categorical dropdowns + fuzzy search
// Filters operate on pipeline layer, not grid directly

import { useState, useRef, useEffect, useCallback } from 'react';

const FILTER_KEYS = [
  { key: 'status',          label: 'STATUS' },
  { key: 'department',      label: 'DEPT' },
  { key: 'automation_type', label: 'TYPE' },
  { key: 'country',         label: 'COUNTRY' },
];

function FilterDropdown({ def, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter(x => x !== opt)
      : [...selected, opt];
    onChange(def.key, next);
  };

  const hasActive = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5
          border rounded transition-colors duration-100
          ${hasActive
            ? 'border-sky/50 text-sky bg-sky/5'
            : 'border-term-border text-slate-500 hover:border-slate-600 hover:text-slate-400'
          }
        `}
      >
        {def.label}
        {hasActive && <span className="ml-1 text-sky font-bold">{selected.length}</span>}
        <span className="ml-1 opacity-50">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-[140px] bg-term-bg border border-term-border rounded shadow-xl">
          {def.options.map(opt => (
            <label
              key={opt}
              onClick={() => toggle(opt)}
              className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] text-slate-400 hover:bg-white/5 cursor-pointer select-none"
            >
              <span className={`w-3 h-3 border rounded-sm flex items-center justify-center text-[8px]
                ${selected.includes(opt) ? 'border-sky bg-sky/20 text-sky' : 'border-slate-600'}`}>
                {selected.includes(opt) ? '✓' : ''}
              </span>
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => onChange(def.key, [])}
              className="w-full text-left px-3 py-1.5 font-mono text-[9px] text-slate-600 hover:text-red-400 border-t border-term-border"
            >
              clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Toolbar({ search, onSearch, filters, onFilters, filterOptions, viewCount, totalCount, sortConfig, isExporting, onExport }) {
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(val), 80);
  };

  const handleFilter = useCallback((key, vals) => {
    onFilters(prev => ({ ...prev, [key]: vals }));
  }, [onFilters]);

  const activeFilterCount = Object.values(filters).filter(v => v?.length > 0).length;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-term-bg border-b border-term-border flex-wrap">

      {/* Fuzzy search */}
      <div className="relative flex-shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-600">⌕</span>
        <input
          type="text"
          defaultValue={search}
          onChange={handleSearch}
          placeholder="search rows..."
          className="
            font-mono text-[11px] bg-term-border/30 border border-term-border
            text-slate-300 placeholder-slate-600 rounded px-2 py-1.5 pl-6
            focus:outline-none focus:border-sky/40 focus:bg-term-border/50
            w-52 transition-colors duration-100
          "
          aria-label="Fuzzy search across project name, company ID, partner, country"
        />
      </div>

      {/* Filter dropdowns */}
      {FILTER_KEYS.map(def => (
        <FilterDropdown
          key={def.key}
          def={{ ...def, options: filterOptions?.[def.key] || [] }}
          selected={filters[def.key] || []}
          onChange={handleFilter}
        />
      ))}

      {activeFilterCount > 0 && (
        <button
          onClick={() => onFilters({})}
          className="font-mono text-[9px] text-red-500/70 hover:text-red-400 border border-red-900/30 px-2 py-1.5 rounded"
        >
          ✕ clear all
        </button>
      )}

      {/* Sort indicators */}
      {sortConfig.length > 0 && (
        <div className="flex items-center gap-1 ml-1">
          {sortConfig.map((s, i) => (
            <span key={s.key} className="font-mono text-[9px] text-slate-600 bg-term-border/40 px-1.5 py-0.5 rounded">
              {i+1}:{s.key.replace(/_/g,' ')} {s.dir === 'asc' ? '↑' : '↓'}
            </span>
          ))}
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <div className="font-mono text-[9px] text-slate-600 whitespace-nowrap">
          {viewCount.toLocaleString()} / {totalCount.toLocaleString()} rows
        </div>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="
            font-mono text-[9px] font-bold tracking-wider px-3 py-1.5 rounded transition-colors
            border border-term-border text-slate-300 bg-term-border/30 hover:bg-term-border/50
            disabled:opacity-50 disabled:cursor-wait
          "
        >
          {isExporting ? 'EXPORTING...' : 'EXPORT'}
        </button>
      </div>
    </div>
  );
}
