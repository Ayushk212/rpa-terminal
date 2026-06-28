// ReplayBar — Ghost Replay Scrubber
// Diff-patch circular buffer → scrub back 60s of history
// The feature that makes judges stop

import { useRef, useCallback } from 'react';

export function ReplayBar({ snapshots, replayIdx, onSeek, isReplaying }) {
  const sliderRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = parseInt(e.target.value, 10);
    const max = snapshots.length - 1;
    if (val >= max) {
      onSeek(null); // back to live
    } else {
      onSeek(val);
    }
  }, [snapshots.length, onSeek]);

  const goLive = () => {
    onSeek(null);
    if (sliderRef.current) sliderRef.current.value = snapshots.length;
  };

  const count = snapshots.length;
  const currentVal = replayIdx === null ? count : replayIdx;
  const secsBack   = replayIdx === null ? 0 : (count - replayIdx - 1) * 2;

  return (
    <div className={`
      flex items-center gap-3 px-4 py-2 border-t border-term-border
      transition-colors duration-300
      ${isReplaying ? 'bg-yellow-950/20' : 'bg-term-bg'}
    `}>

      {/* Mode indicator */}
      <div className={`font-mono text-[9px] tracking-widest uppercase shrink-0 w-20
        ${isReplaying ? 'text-warning' : 'text-slate-700'}`}>
        {isReplaying ? `◀ T-${secsBack}s` : '● LIVE'}
      </div>

      {/* Timeline label */}
      <span className="font-mono text-[9px] text-slate-700 shrink-0">-60s</span>

      {/* Scrubber */}
      <div className="relative flex-1 flex items-center">
        {/* Snapshot tick marks */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {snapshots.map((_, i) => (
            <div
              key={i}
              className={`absolute w-px h-2 transition-colors duration-150
                ${replayIdx !== null && i <= replayIdx ? 'bg-warning/60' : 'bg-term-border'}`}
              style={{ left: `${(i / Math.max(count, 1)) * 100}%` }}
            />
          ))}
        </div>

        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={Math.max(count, 1)}
          value={currentVal}
          onChange={handleChange}
          className="replay-slider w-full relative z-10"
          style={{
            '--track-color': isReplaying ? 'rgba(251,191,36,0.3)' : 'rgba(30,41,59,0.8)',
            '--thumb-color': isReplaying ? '#fbbf24' : '#475569',
            appearance: 'none',
            height: '2px',
            background: `linear-gradient(to right, ${isReplaying ? '#fbbf24' : '#38bdf8'} 0%, ${isReplaying ? '#fbbf24' : '#38bdf8'} ${(currentVal/Math.max(count,1))*100}%, #1e293b ${(currentVal/Math.max(count,1))*100}%, #1e293b 100%)`,
            outline: 'none',
            cursor: 'pointer',
          }}
          aria-label="Replay scrubber — drag to rewind stream history"
          aria-valuetext={isReplaying ? `Replaying ${secsBack} seconds ago` : 'Live'}
        />
      </div>

      <span className="font-mono text-[9px] text-slate-700 shrink-0">NOW</span>

      {/* Live button */}
      {isReplaying && (
        <button
          onClick={goLive}
          className="font-mono text-[9px] text-sky border border-sky/30 px-2.5 py-1 rounded hover:bg-sky/10 transition-colors shrink-0"
        >
          ↩ LIVE
        </button>
      )}

      {/* Snapshot count */}
      <div className="font-mono text-[9px] text-slate-700 shrink-0">
        {count} snaps · {count * 2}s buffer
      </div>
    </div>
  );
}
