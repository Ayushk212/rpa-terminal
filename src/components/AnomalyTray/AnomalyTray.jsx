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
      display:'flex', alignItems:'center', gap:'6px',
      padding:'3px 8px 3px 6px',
      border:`1px solid ${color}40`,
      borderLeft:`3px solid ${color}`,
      borderRadius:'2px',
      background:`${color}0d`,
      flexShrink:0,
      opacity: dying ? 0 : 1,
      transform: dying ? 'translateY(4px)' : 'translateY(0)',
      transition:'opacity 0.4s ease, transform 0.4s ease',
      maxWidth:'220px',
    }}
      title={`${row.project_name} · z=${row._zScore}σ`}
    >
      <div style={{
        width:'5px', height:'5px', borderRadius:'50%',
        background:color, flexShrink:0,
        animation: row._signal === 'anomaly' ? 'pulse-dot 1s ease-in-out infinite' : 'none',
      }}/>
      <span style={{
        fontFamily:'"JetBrains Mono",monospace', fontSize:'9px',
        color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden',
        textOverflow:'ellipsis', maxWidth:'100px',
      }}>
        {row.project_name?.split(' ').slice(0,2).join(' ')}
      </span>
      {row._sigMetric && (
        <span style={{
          fontFamily:'"JetBrains Mono",monospace', fontSize:'8px',
          color, background:`${color}1a`, padding:'1px 4px',
          borderRadius:'2px', flexShrink:0,
        }}>
          {METRIC_LABELS[row._sigMetric] || row._sigMetric}
        </span>
      )}
      <span style={{
        fontFamily:'"JetBrains Mono",monospace', fontSize:'9px',
        color, flexShrink:0, fontWeight:700,
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
      display:'flex', alignItems:'center', gap:'8px',
      padding:'5px 12px',
      background:'#020617',
      borderTop:'1px solid #1e293b',
      minHeight:'38px', maxHeight:'38px', flexShrink:0,
      overflow:'hidden',
    }}>
      {/* Label */}
      <div style={{
        fontFamily:'"JetBrains Mono",monospace', fontSize:'9px',
        letterSpacing:'0.1em', textTransform:'uppercase',
        color:'#334155', flexShrink:0, paddingRight:'8px',
        borderRight:'1px solid #1e293b',
      }}>
        <div>SIGNAL</div>
        <div style={{display:'flex', gap:'6px', marginTop:'2px'}}>
          {anomalyCount > 0 && <span style={{color:'#ef4444',fontSize:'8px'}}>{anomalyCount} anom</span>}
          {driftCount   > 0 && <span style={{color:'#FFC801',fontSize:'8px'}}>{driftCount} drift</span>}
          {chips.length === 0 && <span style={{color:'#1e293b',fontSize:'8px'}}>nominal</span>}
        </div>
      </div>

      {/* Chip scroll area */}
      <div style={{
        display:'flex', gap:'6px', alignItems:'center',
        flex:1, overflowX:'auto', overflowY:'hidden',
      }}>
        {chips.length === 0
          ? <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'9px',color:'#1e293b'}}>all streams nominal —</span>
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
      <div style={{flexShrink:0,display:'flex',gap:'10px',paddingLeft:'8px',borderLeft:'1px solid #1e293b'}}>
        {[['ANOMALY','#ef4444'],['DRIFT','#FFC801'],['NOMINAL','#4ade80']].map(([label,color]) => (
          <div key={label} style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,opacity:0.7}}/>
            <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'8px',color:'#334155',letterSpacing:'0.08em'}}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
