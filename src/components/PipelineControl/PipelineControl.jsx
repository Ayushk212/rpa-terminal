// PipelineControl — Feature 5: Global Pause/Play with queue status overlay

import { useEffect, useRef, useState } from 'react';

export function PipelineControl({ paused, onToggle, queueLength }) {
  const [qLen, setQLen] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);

  // Poll queue length when paused
  useEffect(() => {
    if (!paused) {
      setQLen(0);
      return;
    }
    const id = setInterval(() => setQLen(queueLength()), 300);
    return () => clearInterval(id);
  }, [paused, queueLength]);

  const handleToggle = () => {
    if (paused) {
      setReconnecting(true);
      setTimeout(() => setReconnecting(false), 1200);
    }
    onToggle();
  };

  return (
    <div className="flex items-center gap-3">
      {paused && qLen > 0 && (
        <div className="font-mono text-[9px] text-warning bg-yellow-950/40 border border-yellow-900/40 px-2 py-0.5 rounded">
          {qLen} queued
        </div>
      )}

      {reconnecting && (
        <div className="font-mono text-[9px] text-sky reconnect-blink">
          RECONNECTING...
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5
          border rounded transition-colors duration-150
          ${paused
            ? 'border-forsythia text-forsythia bg-forsythia/5 hover:bg-forsythia/10'
            : 'border-term-border text-slate-400 hover:border-slate-500 hover:text-subdued'
          }
        `}
        aria-label={paused ? 'Resume stream' : 'Pause stream'}
      >
        {paused ? (
          <><span>▶</span> RESUME</>
        ) : (
          <><span>⏸</span> PAUSE</>
        )}
      </button>
    </div>
  );
}
