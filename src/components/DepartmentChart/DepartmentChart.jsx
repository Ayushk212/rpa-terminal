// DepartmentChart — signal-aware dept breakdown
// Shows: bar = savings, dot = anomaly count per dept
// Canvas-based, no lib

import { useEffect, useRef, useMemo } from 'react';
import { SIGNAL_COLORS } from '../../lib/anomaly';


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

    const maxSavings  = Math.max(...deptData.map(d => d.savings), 1);
    const maxAnomalies = Math.max(...deptData.map(d => d.anomalies), 1);
    const rowH        = Math.floor((H - 8) / deptData.length) - 3;
    const labelW      = 72;
    const barMaxW     = W - labelW - 70;

    deptData.forEach((d, i) => {
      const y        = 4 + i * (rowH + 3);
      const barW     = (d.savings / maxSavings) * barMaxW;
      // Magnitude-based sky blue: top bar is full brightness, lowest is dim
      const ratio    = d.savings / maxSavings; // 0..1
      // opacity for fill: scale from 0.12 (dimmest) to 0.55 (brightest)
      const fillAlpha = Math.round((0.12 + ratio * 0.43) * 255).toString(16).padStart(2, '0');
      // accent leading strip: scale from 0.3 to 1.0
      const accentAlpha = Math.round((0.30 + ratio * 0.70) * 255).toString(16).padStart(2, '0');
      const labelAlpha  = Math.round((0.35 + ratio * 0.65) * 255).toString(16).padStart(2, '0');

      // Background track
      ctx.fillStyle = 'rgba(30,41,59,0.5)';
      ctx.fillRect(labelW, y, barMaxW, rowH);

      // Bar fill — uniform hue, magnitude-scaled opacity
      ctx.fillStyle = `#38bdf8${fillAlpha}`;
      ctx.fillRect(labelW, y, barW, rowH);

      // Leading accent strip
      ctx.fillStyle = `#38bdf8${accentAlpha}`;
      ctx.fillRect(labelW, y, Math.min(barW, 3), rowH);

      // Dept label — magnitude-scaled brightness
      ctx.font = `500 9px "JetBrains Mono", monospace`;
      ctx.fillStyle = `#38bdf8${labelAlpha}`;
      ctx.fillText(d.dept.slice(0, 9), 2, y + rowH * 0.68);

      // Anomaly indicator — dot radius scaled to anomaly severity vs max (min 2, max 5)
      let dotX = W - 4;
      if (d.anomalies > 0) {
        const anomRatio = d.anomalies / maxAnomalies;
        const dotR = Math.max(2, Math.round(2 + anomRatio * 3)); // 2–5px
        const dotOpacity = (0.4 + anomRatio * 0.6).toFixed(2);
        ctx.globalAlpha = parseFloat(dotOpacity);
        ctx.beginPath();
        ctx.arc(dotX, y + rowH / 2, dotR, 0, Math.PI * 2);
        ctx.fillStyle = SIGNAL_COLORS.anomaly;
        ctx.fill();
        ctx.globalAlpha = 1;
        dotX -= (dotR * 2 + 4);
        // Only show count if more than 1 and meaningfully elevated (>10% of max)
        if (d.anomalies > 1 && anomRatio > 0.1) {
          ctx.font = `8px "JetBrains Mono", monospace`;
          ctx.fillStyle = '#ef4444';
          ctx.fillText(d.anomalies, dotX - 4, y + rowH * 0.68);
          dotX -= 14;
        }
      }
      if (d.drifts > 0) {
        const driftRatio = d.drifts / Math.max(...deptData.map(dd => dd.drifts), 1);
        const dR = Math.max(2, Math.round(1.5 + driftRatio * 2));
        ctx.globalAlpha = 0.4 + driftRatio * 0.6;
        ctx.beginPath();
        ctx.arc(dotX, y + rowH / 2, dR, 0, Math.PI * 2);
        ctx.fillStyle = SIGNAL_COLORS.drift;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Value label — magnitude-scaled brightness
      const val = d.savings >= 1e6
        ? `$${(d.savings/1e6).toFixed(1)}M`
        : `$${(d.savings/1e3).toFixed(0)}k`;
      ctx.font = `9px "JetBrains Mono", monospace`;
      ctx.fillStyle = `#38bdf8${labelAlpha}`;
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
      <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
        <canvas 
          ref={canvasRef} 
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} 
        />
      </div>
    </div>
  );
}
