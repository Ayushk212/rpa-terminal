// App.jsx — Operator Workspace Layout
// Stream → Buffer → Pipeline → Grid + AnomalyTray + Panels

import { useCallback, useState, useEffect, useRef } from 'react';
import { useStream }        from './hooks/useStream';
import { useBuffer }        from './hooks/useBuffer';
import { usePipeline }      from './hooks/usePipeline';
import { useLayout }        from './hooks/useLayout';

import { KPIStrip }         from './components/KPIStrip/KPIStrip';
import { VirtualGrid }      from './components/VirtualGrid/VirtualGrid';
import { Toolbar }          from './components/Toolbar/Toolbar';
import { PipelineControl }  from './components/PipelineControl/PipelineControl';
import { DepartmentChart }  from './components/DepartmentChart/DepartmentChart';
import { ReplayBar }        from './components/ReplayBar/ReplayBar';
import { AnomalyTray }      from './components/AnomalyTray/AnomalyTray';
import { Hero }             from './components/Hero/Hero';
import { WorkspacePanel, LayoutControls, InfraToggles } from './components/WorkspacePanel/WorkspacePanel';

import { buildSortConfig }  from './lib/sorter';
import { AnalyticsOverlay } from './components/AnalyticsOverlay/AnalyticsOverlay';


function Clock() {
  const ref = useRef(null);
  useEffect(() => {
    function tick() {
      const n = new Date();
      const p = v => String(v).padStart(2,'0');
      if (ref.current)
        ref.current.textContent = `UTC ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} style={{ color: '#fbbf24', fontFamily: '"JetBrains Mono",monospace', fontSize: '9px' }} />;
}

function LatencyBadge() {
  const ref = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (ref.current) ref.current.textContent = (Math.floor(Math.random() * 6) + 2) + 'ms';
    }, 800);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize:'9px', color:'#334155' }}>
      LAT <span ref={ref} style={{color:'#38bdf8'}}>4ms</span>
    </span>
  );
}

export default function App() {
  const [showHero,    setShowHero]    = useState(() => localStorage.getItem('hideHero') !== 'true');
  const [dataReady,   setDataReady]   = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [frozenRows, setFrozenRows]       = useState([]);
  const [pausedAt, setPausedAt]           = useState(null);

  const pipeline    = usePipeline();
  const { layout, togglePanel } = useLayout();
  const buffer = useBuffer(pipeline.ingest);
  useStream(buffer.ingest);

  // Wait for RPAStream baseline to be ready before rendering grid
  useEffect(() => {
    const rpa = window.RPAStream;
    if (!rpa) return;
    if (rpa.isReady && rpa.isReady()) { setDataReady(true); return; }
    if (rpa.onReady) { rpa.onReady(() => setDataReady(true)); }
    else              { setDataReady(true); } // old fallback
  }, []);

  // When paused toggled off, close analytics automatically
  useEffect(() => {
    if (!buffer.paused) setAnalyticsOpen(false);
  }, [buffer.paused]);

  const handleAnalyticsToggle = useCallback(() => {
    if (!analyticsOpen) {
      // Capture frozen snapshot at this exact moment
      setFrozenRows([...pipeline.view]);
      setPausedAt(Date.now());
    }
    setAnalyticsOpen(o => !o);
  }, [analyticsOpen, pipeline.view]);

  const handleSort = useCallback((key, shiftHeld) => {
    pipeline.setSort(buildSortConfig(pipeline.sortConfig, key, shiftHeld));
  }, [pipeline]);

  const handleFilters = useCallback((updater) => {
    pipeline.setFilters(typeof updater === 'function' ? updater(pipeline.filters) : updater);
  }, [pipeline]);

  if (showHero) return <Hero onEnter={() => {
    localStorage.setItem('hideHero', 'true');
    setShowHero(false);
  }} />;

  // Loading screen while 50k rows are being generated in dataStream.js
  if (!dataReady) return (
    <div style={{
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      height:'100vh',background:'#020617',gap:'20px',
    }}>
      <div style={{width:'220px',height:'2px',background:'#1e293b',borderRadius:'2px',overflow:'hidden'}}>
        <div style={{
          height:'100%',background:'#38bdf8',borderRadius:'2px',
          animation:'_ldbar 1.4s ease-in-out infinite',
        }}/>
      </div>
      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'10px',
                    color:'#334155',letterSpacing:'0.15em'}}>
        INITIALISING 50,000 ROW BASELINE…
      </span>
      <style>{'@keyframes _ldbar{0%{width:0%;margin-left:0%}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}'}</style>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f172a', overflow:'hidden' }}>

      {/* ── TOP STATUS BAR ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:'16px',
        padding:'0 12px', height:'32px',
        background:'#020617', borderBottom:'1px solid #1e293b',
        flexShrink:0,
      }}>
        {/* Live indicator */}
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background: buffer.paused ? '#fbbf24' : '#4ade80',
            animation: buffer.paused ? 'none' : 'pulse-dot 2s ease-in-out infinite',
          }}/>
          <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',
                       color: buffer.paused ? '#fbbf24' : '#334155',letterSpacing:'0.1em'}}>
            {buffer.paused ? 'BUFFERING' : 'LIVE'}
          </span>
        </div>

        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#1e293b'}}>│</span>
        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#334155',letterSpacing:'0.06em'}}>
          RPA-DB-2026 <span style={{color:'#38bdf8'}}>global</span>
        </span>
        <LatencyBadge />
        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#334155'}}>
          TICK <span style={{color:'#38bdf8'}}>200ms</span>
        </span>

        {pipeline.isReplaying && (
          <span style={{
            fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',
            color:'#fbbf24',background:'rgba(120,80,0,0.2)',
            border:'1px solid rgba(251,191,36,0.2)',
            padding:'2px 8px',borderRadius:'2px',
          }}>
            ◀ REPLAY MODE
          </span>
        )}

        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'12px'}}>
          <LayoutControls layout={layout} togglePanel={togglePanel} />
          <PipelineControl
            paused={buffer.paused}
            onToggle={buffer.toggle}
            queueLength={buffer.queueLength}
            onAnalytics={handleAnalyticsToggle}
            analyticsOpen={analyticsOpen}
          />
          <Clock />
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      {layout.kpiStrip && (
        <KPIStrip
          kpiRef={pipeline.kpiRef}
          isReplaying={pipeline.isReplaying}
          replayIdx={pipeline.replayIdx}
          snapshotCount={pipeline.snapshots.length}
        />
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Grid + toolbar */}
        {layout.gridWindow && (
          <div style={{display:'flex',flexDirection:'column',flex:1,minWidth:0,overflow:'hidden',
                       borderRight:'1px solid #1e293b'}}>
            <Toolbar
              search={pipeline.search}
              onSearch={pipeline.setSearch}
              filters={pipeline.filters}
              onFilters={handleFilters}
              viewCount={pipeline.view.length}
              totalCount={pipeline.view.length}
              sortConfig={pipeline.sortConfig}
            />
            <div style={{flex:1,overflow:'hidden'}}>
              <VirtualGrid
                rows={pipeline.view}
                sortConfig={pipeline.sortConfig}
                onSort={handleSort}
                isReplaying={pipeline.isReplaying}
              />
            </div>
          </div>
        )}

        {/* Right panels */}
        <div style={{display:'flex',flexDirection:'column',width:'240px',flexShrink:0,overflow:'hidden'}}>
          {layout.deptChart && (
            <WorkspacePanel title="Dept Analytics" className="flex-1 border-b border-term-border min-h-0"
              style={{flex:1,borderBottom:'1px solid #1e293b',minHeight:0}}>
              <DepartmentChart rows={pipeline.view} />
            </WorkspacePanel>
          )}
          {layout.infraToggles && (
            <WorkspacePanel title="Infrastructure" style={{flexShrink:0}}>
              <InfraToggles />
            </WorkspacePanel>
          )}
        </div>
      </div>

      {/* ── ANOMALY TRAY ── */}
      <AnomalyTray anomalies={pipeline.anomalies} />

      {/* ── REPLAY BAR ── */}
      {layout.replayBar && (
        <ReplayBar
          snapshots={pipeline.snapshots}
          replayIdx={pipeline.replayIdx}
          onSeek={pipeline.seekReplay}
          isReplaying={pipeline.isReplaying}
        />
      )}

      {/* ── ANALYTICS OVERLAY — only when paused + toggled ── */}
      {buffer.paused && analyticsOpen && frozenRows.length > 0 && (
        <AnalyticsOverlay
          frozenRows={frozenRows}
          onClose={() => setAnalyticsOpen(false)}
          pausedAt={pausedAt}
        />
      )}

    </div>
  );
}
