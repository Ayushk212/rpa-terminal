// usePipeline — master data pipeline
// raw rows → anomaly tag → filter → search → sort → derived view
// Snapshot/replay engine: diff-patch circular buffer, 30 × 2s = 60s history

import { useRef, useState, useCallback, useEffect } from 'react';
import { applySort }            from '../lib/sorter';
import { applySearch }          from '../lib/fuzzySearch';
import { classifyRow, updateStats } from '../lib/anomaly';

const SNAPSHOT_INTERVAL_MS = 2000;
const SNAPSHOT_MAX         = 30;

export function usePipeline() {
  const rowMapRef  = useRef(new Map());   // id → row (with _signal tags)
  const searchRef  = useRef('');
  const filtersRef = useRef({});
  const sortRef    = useRef([]);

  const [view, setView]               = useState([]);
  const [sortConfig, setSortConfigState]  = useState([]);
  const [filters, setFiltersState]        = useState({});
  const [search, setSearchState]          = useState('');
  const [anomalies, setAnomalies]         = useState([]); // rows with signal !== 'nominal'

  // KPI counters — direct DOM writes, no state
  const kpiRef = useRef({ rows: 0, robots: 0, savings: 0 });

  // Replay
  const [replayIdx, setReplayIdx]     = useState(null);
  const [snapshots, setSnapshots]     = useState([]);
  const snapshotsRef                  = useRef([]);
  const baselineSnapshotRef           = useRef(null);

  // ── Derive view from rowMap + current pipeline params ──
  const recompute = useCallback(() => {
    let rows = Array.from(rowMapRef.current.values());

    const f = filtersRef.current;
    if (f.department?.length)      rows = rows.filter(r => f.department.includes(r.department));
    if (f.industry?.length)        rows = rows.filter(r => f.industry.includes(r.industry));
    if (f.automation_type?.length) rows = rows.filter(r => f.automation_type.includes(r.automation_type));
    if (f.status?.length)          rows = rows.filter(r => f.status.includes(r.status));
    if (f.country?.length)         rows = rows.filter(r => f.country.includes(r.country));

    rows = applySearch(rows, searchRef.current);
    rows = applySort(rows, sortRef.current);

    setView(rows);

    // Surface anomalies separately for the tray
    const anom = rows.filter(r => r._signal === 'anomaly' || r._signal === 'drift');
    setAnomalies(anom.slice(0, 12)); // cap tray at 12 chips
  }, []);

  // ── Tag a row with its anomaly classification ──
  function tagRow(row) {
    const classification = classifyRow(row);
    updateStats(row); // O(1) Welford update
    return { ...row, _signal: classification.signal, _zScore: classification.zScore, _sigMetric: classification.metric };
  }

  // ── Ingest chunk ──
  const ingest = useCallback((rows, isBaseline) => {
    if (isBaseline) {
      const tagged = rows.map(tagRow);
      rowMapRef.current = new Map(tagged.map(r => [r.id, r]));
      baselineSnapshotRef.current = new Map(rowMapRef.current);
      kpiRef.current.rows    = tagged.length;
      kpiRef.current.robots  = tagged.reduce((s, r) => s + (r.active_robots || 0), 0);
      kpiRef.current.savings = tagged.reduce((s, r) => s + (r.cumulative_savings || 0), 0);
    } else {
      rows.forEach(r => {
        const tagged = tagRow(r);
        const prev   = rowMapRef.current.get(r.id);
        rowMapRef.current.set(r.id, tagged);
        if (!prev) {
          kpiRef.current.rows    += 1;
          kpiRef.current.robots  += tagged.active_robots || 0;
          kpiRef.current.savings += tagged.cumulative_savings || 0;
        } else {
          kpiRef.current.robots  += (tagged.active_robots || 0) - (prev.active_robots || 0);
          kpiRef.current.savings += (tagged.cumulative_savings || 0) - (prev.cumulative_savings || 0);
        }
      });
    }
    recompute();
  }, [recompute]);

  // ── Snapshot engine (diff-patch) ──
  useEffect(() => {
    let prevSnapshot = new Map();

    const id = setInterval(() => {
      if (replayIdx !== null) return;
      const patch = { added: [], mutated: [], ts: Date.now() };
      rowMapRef.current.forEach((row, rid) => {
        if (!prevSnapshot.has(rid)) patch.added.push(row);
        else if (prevSnapshot.get(rid).last_updated !== row.last_updated) patch.mutated.push(row);
      });
      prevSnapshot = new Map(rowMapRef.current);
      snapshotsRef.current = [...snapshotsRef.current.slice(-(SNAPSHOT_MAX - 1)), patch];
      setSnapshots([...snapshotsRef.current]);
    }, SNAPSHOT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [replayIdx]);

  // ── Replay seek ──
  const seekReplay = useCallback((idx) => {
    if (idx === null) { setReplayIdx(null); recompute(); return; }
    const snaps = snapshotsRef.current;
    if (!snaps.length || !baselineSnapshotRef.current) return;

    const reconstructed = new Map(baselineSnapshotRef.current);
    snaps.slice(0, idx + 1).forEach(snap => {
      snap.added.forEach(r => reconstructed.set(r.id, r));
      snap.mutated.forEach(r => reconstructed.set(r.id, r));
    });

    setReplayIdx(idx);
    let rows = Array.from(reconstructed.values());
    const f = filtersRef.current;
    if (f.department?.length) rows = rows.filter(r => f.department.includes(r.department));
    rows = applySearch(rows, searchRef.current);
    rows = applySort(rows, sortRef.current);
    setView(rows);
    setAnomalies(rows.filter(r => r._signal === 'anomaly' || r._signal === 'drift').slice(0, 12));
  }, [recompute]);

  // ── Pipeline param setters ──
  const setSort = useCallback((config) => {
    sortRef.current = config;
    setSortConfigState(config);
    recompute();
  }, [recompute]);

  const setFilters = useCallback((f) => {
    filtersRef.current = f;
    setFiltersState(f);
    recompute();
  }, [recompute]);

  const setSearch = useCallback((q) => {
    searchRef.current = q;
    setSearchState(q);
    recompute();
  }, [recompute]);

  return {
    view, ingest,
    sortConfig, setSort,
    filters, setFilters,
    search, setSearch,
    kpiRef,
    anomalies,
    snapshots, replayIdx, seekReplay,
    isReplaying: replayIdx !== null,
  };
}
