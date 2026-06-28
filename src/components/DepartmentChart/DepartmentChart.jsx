// DepartmentChart — signal-aware dept breakdown
// Shows: bar = savings, dot = anomaly count per dept
// Canvas-based, no lib

import { useEffect, useRef, useMemo } from 'react';
import { SIGNAL_COLORS } from '../../lib/anomaly';

const DEPT_COLORS = {
  Finance:'#38bdf8', HR:'#4ade80', Operations:'#FFC801',
  IT:'#FF9932', Legal:'#a78bfa', 'Supply Chain':'#f472b6',
  Marketing:'#fb923c', Procurement:'#34d399',
};

export function DepartmentChart({ rows }) {
  const canvasRef = useRef(null);

  const deptData = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      if (!map[r.department]) map[r.department] = { savings:0, count:0, anomalies:0, drifts:0 };
      map[r.department].savings   += r.cumulative_savings || 0;
      map[r.department].count     += 1;
      if (r._signal === 'anomaly') map[r.department].anomalies += 1;
      if (r._signal === 'drift')   map[r.department].drifts    += 1;
    });
    return Object.entries(map)
      .map(([k,v]) => ({ dept:k, ...v }))
      .sort((a,b) => b.savings - a.savings)
      .slice(0, 8);
  }, [rows]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !deptData.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const maxSavings = Math.max(...deptData.map(d => d.savings), 1);
    const rowH       = Math.floor((H - 8) / deptData.length) - 3;
    const labelW     = 72;
    const barMaxW    = W - labelW - 36;

    deptData.forEach((d, i) => {
      const y     = 4 + i * (rowH + 3);
      const barW  = (d.savings / maxSavings) * barMaxW;
      const color = DEPT_COLORS[d.dept] || '#38bdf8';

      // Background track
      ctx.fillStyle = 'rgba(30,41,59,0.5)';
      ctx.fillRect(labelW, y, barMaxW, rowH);

      // Bar fill
      ctx.fillStyle = color + '33';
      ctx.fillRect(labelW, y, barW, rowH);

      // Bar accent — leading 3px
      ctx.fillStyle = color;
      ctx.fillRect(labelW, y, Math.min(barW, 3), rowH);
      if (barW > 3) {
        ctx.fillStyle = color + '88';
        ctx.fillRect(labelW + 3, y, barW - 3, rowH);
      }

      // Dept label
      ctx.font = `500 9px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#475569';
      ctx.fillText(d.dept.slice(0, 9), 2, y + rowH * 0.68);

      // Anomaly/drift dots
      let dotX = W - 4;
      if (d.anomalies > 0) {
        ctx.beginPath();
        ctx.arc(dotX, y + rowH / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = SIGNAL_COLORS.anomaly;
        ctx.fill();
        dotX -= 10;
        if (d.anomalies > 1) {
          ctx.font = `8px "JetBrains Mono", monospace`;
          ctx.fillStyle = '#ef4444';
          ctx.fillText(d.anomalies, dotX - 4, y + rowH * 0.68);
          dotX -= 14;
        }
      }
      if (d.drifts > 0) {
        ctx.beginPath();
        ctx.arc(dotX, y + rowH / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = SIGNAL_COLORS.drift;
        ctx.fill();
      }

      // Value
      const val = d.savings >= 1e6
        ? `$${(d.savings/1e6).toFixed(1)}M`
        : `$${(d.savings/1e3).toFixed(0)}k`;
      ctx.font = `9px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#334155';
      ctx.fillText(val, labelW + barW + 5, y + rowH * 0.68);
    });
  }, [deptData]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',padding:'8px 10px'}}>
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:'8px',
                   letterSpacing:'0.12em',textTransform:'uppercase',
                   color:'#1e293b',marginBottom:'6px',display:'flex',justifyContent:'space-between'}}>
        <span>Dept · Savings</span>
        <span style={{color:'#1e293b'}}>● anom</span>
      </div>
      <canvas ref={canvasRef} style={{flex:1,width:'100%',display:'block'}} />
    </div>
  );
}
