// KPIStrip — Feature 1 & 2
// Deliberate hierarchy: Savings is dominant (biggest number operators care about in a crisis)
// Direct DOM writes every 200ms — zero parent re-renders

import { useEffect, useRef } from 'react';

const USD_FMT  = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', notation:'compact', maximumFractionDigits:1 });
const NUM_FMT  = new Intl.NumberFormat('en-US', { notation:'compact', maximumFractionDigits:1 });

export function KPIStrip({ kpiRef, isReplaying, replayIdx, snapshotCount }) {
  const rafRef  = useRef(null);
  const prevRef = useRef({ rows:0, robots:0, savings:0 });

  useEffect(() => {
    function tick() {
      const k = kpiRef.current;
      const p = prevRef.current;

      // Direct DOM writes — no setState, no reconciliation
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

      set('kpi-rows',           NUM_FMT.format(k.rows));
      set('kpi-robots',         NUM_FMT.format(Math.max(0, k.robots)));
      set('kpi-savings',        USD_FMT.format(Math.max(0, k.savings)));
      set('kpi-rows-delta',     `+${(k.rows   - p.rows).toFixed(0)} /tick`);
      set('kpi-robots-delta',   `+${Math.max(0,(k.robots  - p.robots)).toFixed(0)} robots`);
      set('kpi-savings-delta',  `+${USD_FMT.format(Math.max(0,(k.savings - p.savings)))} /tick`);

      prevRef.current = { ...k };
      rafRef.current  = setTimeout(tick, 200);
    }
    rafRef.current = setTimeout(tick, 200);
    return () => clearTimeout(rafRef.current);
  }, [kpiRef]);

  return (
    <div style={{
      display:'flex', alignItems:'stretch',
      background:'#020617', borderBottom:'1px solid #1e293b',
      flexShrink:0, height:'64px',
    }} role="region" aria-label="Live KPI metrics">

      {isReplaying && (
        <div style={{
          display:'flex',alignItems:'center',padding:'0 14px',
          borderRight:'1px solid #1e293b',
          background:'rgba(120,80,0,0.15)',flexShrink:0,
        }}>
          <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#fbbf24',letterSpacing:'0.1em'}}>
            ◀ REPLAY<br/>
            <span style={{color:'#334155'}}>T-{snapshotCount - replayIdx - 1}s</span>
          </span>
        </div>
      )}

      {/* Savings — DOMINANT: operator's primary crisis indicator */}
      <div style={{
        padding:'0 24px', borderRight:'1px solid #1e293b',
        display:'flex', flexDirection:'column', justifyContent:'center',
        minWidth:'200px',
        borderLeft:'3px solid #4ade80',
      }}>
        <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',letterSpacing:'0.14em',color:'#1e4030',textTransform:'uppercase',marginBottom:'2px'}}>
          Cumulative Savings
        </div>
        <div id="kpi-savings" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'26px',fontWeight:700,color:'#4ade80',lineHeight:1,letterSpacing:'-0.02em'}}>
          —
        </div>
        <div id="kpi-savings-delta" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#1e4030',marginTop:'2px'}}>&nbsp;</div>
      </div>

      {/* Rows — secondary */}
      <div style={{padding:'0 20px', borderRight:'1px solid #1e293b', display:'flex',flexDirection:'column',justifyContent:'center',minWidth:'160px'}}>
        <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',letterSpacing:'0.14em',color:'#1e293b',textTransform:'uppercase',marginBottom:'2px'}}>
          Rows Processed
        </div>
        <div id="kpi-rows" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'18px',fontWeight:700,color:'#e2e8f0',lineHeight:1,letterSpacing:'-0.01em'}}>
          —
        </div>
        <div id="kpi-rows-delta" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#334155',marginTop:'2px'}}>&nbsp;</div>
      </div>

      {/* Robots — tertiary, forsythia accent */}
      <div style={{padding:'0 20px', borderRight:'1px solid #1e293b', display:'flex',flexDirection:'column',justifyContent:'center',minWidth:'160px'}}>
        <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',letterSpacing:'0.14em',color:'#2a2000',textTransform:'uppercase',marginBottom:'2px'}}>
          Robots Deployed
        </div>
        <div id="kpi-robots" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'18px',fontWeight:700,color:'#FFC801',lineHeight:1,letterSpacing:'-0.01em'}}>
          —
        </div>
        <div id="kpi-robots-delta" style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#2a2000',marginTop:'2px'}}>&nbsp;</div>
      </div>

      {/* Spacer — right side shows stream health */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 16px', gap:'16px'}}>
        <StreamHealthSparkline />
      </div>
    </div>
  );
}

// Mini sparkline of last 20 row-count ticks — canvas, no lib
function StreamHealthSparkline() {
  const canvasRef = useRef(null);
  const histRef   = useRef(Array(20).fill(0));

  useEffect(() => {
    let prev = 0;
    const id = setInterval(() => {
      const el = document.getElementById('kpi-rows');
      if (!el) return;
      const curr = parseFloat(el.textContent) || 0;
      const delta = Math.max(0, curr - prev);
      prev = curr;

      histRef.current = [...histRef.current.slice(1), delta];

      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.width  = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      const data = histRef.current;
      const max  = Math.max(...data, 1);
      const step = W / (data.length - 1);

      ctx.beginPath();
      data.forEach((v, i) => {
        const x = i * step;
        const y = H - (v / max) * H * 0.85;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#4ade8066';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fill
      ctx.lineTo((data.length - 1) * step, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = '#4ade8011';
      ctx.fill();
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
      <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'8px',color:'#1e293b',letterSpacing:'0.1em',textTransform:'uppercase'}}>
        row/tick
      </span>
      <canvas ref={canvasRef} style={{width:'80px',height:'24px',display:'block'}} />
    </div>
  );
}
