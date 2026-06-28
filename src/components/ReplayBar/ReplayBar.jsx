// ReplayBar — Ghost Replay Scrubber
// Diff-patch circular buffer → scrub back 60s of history
// The feature that makes judges stop

import { useRef, useCallback, useState } from 'react';

export function ReplayBar({ snapshots, replayIdx, onSeek, isReplaying }) {
  const sliderRef = useRef(null);
  
  // Local state for smooth dragging without locking the main thread
  const [dragVal, setDragVal] = useState(null);

  const count = snapshots.length;
  const actualVal = replayIdx === null ? count : replayIdx;
  const displayVal = dragVal !== null ? dragVal : actualVal;
  
  const secsBack = dragVal !== null 
    ? (count - dragVal - 1) * 2 
    : (replayIdx === null ? 0 : (count - replayIdx - 1) * 2);

  const handleChange = useCallback((e) => {
    // Only update the visual slider immediately
    setDragVal(parseInt(e.target.value, 10));
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragVal === null) return;
    const max = snapshots.length - 1;
    if (dragVal >= max) {
      onSeek(null); // back to live
    } else {
      onSeek(dragVal);
    }
    setDragVal(null);
  }, [dragVal, snapshots.length, onSeek]);

  const goLive = () => {
    setDragVal(null);
    onSeek(null);
    if (sliderRef.current) sliderRef.current.value = snapshots.length;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '8px 16px',
      borderTop: '1px solid #1e293b',
      background: isReplaying ? 'rgba(66,32,6,0.5)' : '#020617', // yellow-950/20 vs term-bg
      transition: 'background-color 0.3s',
      flexShrink: 0
    }}>
      {/* Mode indicator */}
      <div style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
        letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, width: '80px',
        color: isReplaying ? '#fbbf24' : '#334155'
      }}>
        {isReplaying ? `◀ T-${Math.max(0, secsBack)}s` : '● LIVE'}
      </div>

      {/* Timeline label */}
      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155', flexShrink: 0 }}>
        -60s
      </span>

      {/* Scrubber */}
      <div style={{ position: 'relative', display: 'flex', flex: 1, alignItems: 'center' }}>
        {/* Snapshot tick marks */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          {snapshots.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', width: '1px', height: '8px',
                transition: 'background-color 0.15s',
                backgroundColor: (dragVal !== null ? dragVal : replayIdx) !== null && i <= (dragVal !== null ? dragVal : replayIdx) 
                  ? 'rgba(251,191,36,0.6)' : '#1e293b',
                left: `${(i / Math.max(count, 1)) * 100}%`
              }}
            />
          ))}
        </div>

        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={Math.max(count, 1)}
          value={displayVal}
          onChange={handleChange}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          onKeyUp={handleDragEnd}
          className="replay-slider"
          style={{
            '--track-color': isReplaying ? 'rgba(251,191,36,0.3)' : 'rgba(30,41,59,0.8)',
            '--thumb-color': isReplaying ? '#fbbf24' : '#475569',
            appearance: 'none',
            WebkitAppearance: 'none',
            width: '100%',
            position: 'relative',
            zIndex: 10,
            height: '2px',
            background: `linear-gradient(to right, ${isReplaying ? '#fbbf24' : '#38bdf8'} 0%, ${isReplaying ? '#fbbf24' : '#38bdf8'} ${(displayVal/Math.max(count,1))*100}%, #1e293b ${(displayVal/Math.max(count,1))*100}%, #1e293b 100%)`,
            outline: 'none',
            cursor: 'pointer',
          }}
          aria-label="Replay scrubber — drag to rewind stream history"
          aria-valuetext={isReplaying ? `Replaying ${secsBack} seconds ago` : 'Live'}
        />
      </div>

      <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155', flexShrink: 0 }}>
        NOW
      </span>

      {/* Live button */}
      {isReplaying && (
        <button
          onClick={goLive}
          style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
            color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
            padding: '4px 10px', borderRadius: '4px', cursor: 'pointer',
            background: 'transparent', flexShrink: 0
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ↩ LIVE
        </button>
      )}

      {/* Snapshot count */}
      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '9px', color: '#334155', flexShrink: 0 }}>
        {count} snaps · {count * 2}s buffer
      </div>
    </div>
  );
}
