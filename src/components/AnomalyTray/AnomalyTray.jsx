// AnomalyTray — floating strip of live anomaly chips
// Auto-clears after 8s of inactivity per chip

import { useState, useEffect, useRef, useCallback } from 'react';
import { SIGNAL_COLORS } from '../../lib/anomaly';

const METRIC_LABELS = {
  roi_percent:    'ROI',
  error_rate:     'ERR%',
  uptime_percent: 'UP%',
  status:         'STATUS',
};

function AnomalyChip({ row, onExpire }) {
  const [dying, setDying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDying(true);
      setTimeout(onExpire, 400);
    }, 8000);
    return () => clearTimeout(timerRef.current);
  }, [onExpire]);

  const color = SIGNAL_COLORS[row._signal] || '#4ade80';

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'8px',
      padding:'4px 10px 4px 6px',
      border:`1px solid ${color}40`,
      borderLeft:`3px solid ${color}`,
      borderRadius:'4px',
      background:`${color}0d`,
      flexShrink:0,
      opacity: dying ? 0 : 1,
      transform: dying ? 'translateY(4px)' : 'translateY(0)',
      transition:'opacity 0.4s ease, transform 0.4s ease',
      maxWidth:'200px',
    }}
      title={`${row.project_name} · z=${row._zScore}σ`}
    >
      <div style={{
        width:'6px', height:'6px', borderRadius:'50%',
        background:color, flexShrink:0,
        animation: row._signal === 'anomaly' ? 'pulse-dot 1s ease-in-out infinite' : 'none',
      }}/>
      <span style={{
        fontFamily:'"JetBrains Mono",monospace', fontSize:'10px',
        color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden',
        textOverflow:'ellipsis', maxWidth:'110px', fontWeight: 500,
      }}>
        {row.project_name?.split(' ').slice(0,2).join(' ')}
      </span>
      <span style={{
        fontFamily:'"JetBrains Mono",monospace', fontSize:'10px',
        color, flexShrink:0, fontWeight:700, paddingLeft:'4px'
      }}>
        {row._zScore?.toFixed(1)}σ
      </span>
    </div>
  );
}

export function AnomalyTray({ anomalies }) {
  const [chips, setChips] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!anomalies?.length) return;
    anomalies.forEach(row => {
      const key = `${row.id}:${row.last_updated}`;
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      setChips(prev => [row, ...prev].slice(0, 14));
    });
  }, [anomalies]);

  const removeChip = useCallback((rowId) => {
    setChips(prev => prev.filter(c => c.id !== rowId));
  }, []);

  const anomalyCount = chips.filter(c => c._signal === 'anomaly').length;
  const driftCount   = chips.filter(c => c._signal === 'drift').length;

  return (
    <div style={{
      display:'flex', alignItems:'center',
      padding:'5px 12px',
      background:'#020617',
      borderTop:'1px solid #1e293b',
      minHeight:'38px', maxHeight:'38px', flexShrink:0,
      overflow:'hidden',
    }}>
      {/* Label Badge */}
      <div style={{
        display:'flex', flexDirection:'column', justifyContent:'center',
        background:'#0f172a', border:'1px solid #1e293b', borderRadius:'4px',
        padding:'4px 8px', marginRight:'16px', flexShrink:0, minWidth:'80px',
      }}>
        <div style={{
          fontFamily:'"JetBrains Mono",monospace', fontSize:'8px',
          letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569',
          marginBottom:'2px',
        }}>
          LIVE SIGNALS
        </div>
        <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
          {anomalyCount > 0 && <span style={{color:'#ef4444',fontSize:'10px',fontWeight:700}}>{anomalyCount} ANOM</span>}
          {driftCount   > 0 && <span style={{color:'#FFC801',fontSize:'10px',fontWeight:700}}>{driftCount} DRIFT</span>}
          {chips.length === 0 && <span style={{color:'#334155',fontSize:'10px',fontWeight:700}}>NOMINAL</span>}
        </div>
      </div>

      {/* Chip scroll area */}
      <div style={{
        display:'flex', gap:'12px', alignItems:'center',
        flex:1, overflowX:'auto', overflowY:'hidden',
        padding:'0 4px',
      }}>
        {chips.length === 0
          ? <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#334155'}}>No active signals...</span>
          : chips.map(row => (
              <AnomalyChip
                key={`${row.id}:${row.last_updated}`}
                row={row}
                onExpire={() => removeChip(row.id)}
              />
            ))
        }
      </div>

      {/* Legend */}
      <div style={{flexShrink:0,display:'flex',gap:'12px',paddingLeft:'16px',borderLeft:'1px solid #1e293b'}}>
        {[['ANOMALY','#ef4444'],['DRIFT','#FFC801'],['NOMINAL','#4ade80']].map(([label,color]) => (
          <div key={label} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,opacity:0.8}}/>
            <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'8px',color:'#475569',letterSpacing:'0.08em'}}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
