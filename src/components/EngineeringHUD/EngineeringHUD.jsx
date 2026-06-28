import { useState, useEffect, useRef } from 'react';
import { usePerfMetrics } from '../../hooks/usePerfMetrics';

export function EngineeringHUD({ gridRef, tickDurationRef }) {
  const [visible, setVisible] = useState(true);
  const metrics = usePerfMetrics(gridRef, tickDurationRef);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle on backtick (`), avoiding events from input fields
      if (e.key === '`' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="fixed top-4 right-4 z-[9999] bg-[#020617] border border-[#1e293b] text-[#38bdf8] p-1.5 rounded opacity-50 hover:opacity-100 transition-opacity"
        title="Show Engineering HUD (`)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      </button>
    );
  }

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };
    
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    // Only drag from the header area, not the whole body
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  const getFpsColor = (fps) => {
    if (fps >= 55) return '#4ade80'; // Green
    if (fps >= 30) return '#fbbf24'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] rounded font-mono text-[11px] select-none shadow-2xl"
      style={{
        background: '#020617',
        border: '1px solid #1e293b',
        padding: '8px 12px',
        backdropFilter: 'blur(4px)',
        minWidth: '140px',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : 'none'
      }}
    >
      <div 
        className="flex justify-between items-center mb-2 pb-1 border-b border-[#1e293b] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>PERF HUD</span>
        <button 
          onClick={() => setVisible(false)}
          onMouseDown={e => e.stopPropagation()}
          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer ml-4"
          title="Hide HUD (`)"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <span style={{ color: '#38bdf8' }}>FPS:</span>
          <span style={{ color: getFpsColor(metrics.fps), fontWeight: 'bold' }}>{metrics.fps}</span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: '#38bdf8' }}>DOM ROWS:</span>
          <span className="text-slate-200 font-bold">{metrics.domNodeCount}</span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: '#38bdf8' }}>HEAP MB:</span>
          <span className="text-slate-200 font-bold">{metrics.heapMB || '--'}</span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: '#38bdf8' }}>TICK MS:</span>
          <span className="text-slate-200 font-bold">{metrics.tickDurationMs}</span>
        </div>
      </div>
    </div>
  );
}
