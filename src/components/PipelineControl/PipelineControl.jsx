// PipelineControl — Feature 5: Pause/Play + Analytics View toggle

import { useEffect, useRef, useState } from 'react';

export function PipelineControl({ paused, onToggle, queueLength, onAnalytics, analyticsOpen, onStressTest }) {
  const [qLen, setQLen]               = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [stressThrottled, setStressThrottled] = useState(false);
  const [showStressMenu, setShowStressMenu] = useState(false);

  useEffect(() => {
    if (!paused) { setQLen(0); return; }
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

  const handleStress = (count) => {
    if (stressThrottled || !onStressTest) return;
    onStressTest(count);
    setShowStressMenu(false);
    setStressThrottled(true);
    setTimeout(() => setStressThrottled(false), 2000);
  };

  const btn = (label, onClick, active, accentColor) => ({
    onClick,
    style: {
      display: 'flex', alignItems: 'center', gap: '5px',
      fontFamily: '"JetBrains Mono",monospace', fontSize: '10px',
      letterSpacing: '0.06em',
      padding: '4px 10px',
      border: `1px solid ${active ? accentColor + '80' : '#1e293b'}`,
      borderRadius: '2px',
      background: active ? accentColor + '0f' : 'transparent',
      color: active ? accentColor : '#475569',
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    },
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

      {/* Queue count badge */}
      {paused && qLen > 0 && (
        <span style={{
          fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
          color: '#fbbf24',
          background: 'rgba(120,80,0,0.25)',
          border: '1px solid rgba(120,80,0,0.4)',
          padding: '2px 6px', borderRadius: '2px',
        }}>
          {qLen} queued
        </span>
      )}

      {reconnecting && (
        <span style={{
          fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
          color: '#38bdf8', animation: 'reconnect-blink 0.4s ease-in-out 3',
        }}>
          RECONNECTING...
        </span>
      )}

      {/* Analytics View button — only visible when paused */}
      {paused && (
        <button
          {...btn('ANALYTICS', onAnalytics, analyticsOpen, '#FFC801')}
          aria-pressed={analyticsOpen}
          aria-label="Toggle analytics overlay"
          onMouseEnter={e => {
            if (!analyticsOpen) {
              e.currentTarget.style.borderColor = '#FFC80180';
              e.currentTarget.style.color = '#FFC801';
            }
          }}
          onMouseLeave={e => {
            if (!analyticsOpen) {
              e.currentTarget.style.borderColor = '#1e293b';
              e.currentTarget.style.color = '#475569';
            }
          }}
        >
          <span>◈</span> ANALYTICS
        </button>
      )}

      {/* Pause / Resume button */}
      <button
        onClick={handleToggle}
        aria-label={paused ? 'Resume stream' : 'Pause stream'}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontFamily: '"JetBrains Mono",monospace', fontSize: '10px',
          letterSpacing: '0.06em',
          padding: '4px 10px',
          border: `1px solid ${paused ? '#FFC80180' : '#1e293b'}`,
          borderRadius: '2px',
          background: paused ? '#FFC8010a' : 'transparent',
          color: paused ? '#FFC801' : '#475569',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!paused) {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#e2e8f0';
          }
        }}
        onMouseLeave={e => {
          if (!paused) {
            e.currentTarget.style.borderColor = '#1e293b';
            e.currentTarget.style.color = '#475569';
          }
        }}
      >
        {paused ? <><span>▶</span> RESUME</> : <><span>⏸</span> PAUSE</>}
      </button>

      {/* Stress Test Injector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => !stressThrottled && setShowStressMenu(!showStressMenu)}
          disabled={stressThrottled}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: '"JetBrains Mono",monospace', fontSize: '10px',
            letterSpacing: '0.06em',
            padding: '4px 10px',
            border: `1px solid ${stressThrottled ? '#ef444450' : '#1e293b'}`,
            borderRadius: '2px',
            background: stressThrottled ? '#ef444410' : 'transparent',
            color: stressThrottled ? '#ef4444' : '#ef4444',
            cursor: stressThrottled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            opacity: stressThrottled ? 0.5 : 1,
          }}
          title="Inject synthetic load for performance testing"
        >
          <span>⚡</span> STRESS TEST {stressThrottled ? '(WAIT)' : '▼'}
        </button>

        {showStressMenu && !stressThrottled && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 50,
            background: '#020617', border: '1px solid #1e293b', borderRadius: '4px',
            display: 'flex', flexDirection: 'column', padding: '4px', minWidth: '120px'
          }}>
            <button 
              onClick={() => handleStress(5000)}
              style={{ padding: '6px 12px', fontSize: '10px', fontFamily: '"JetBrains Mono",monospace', color: '#e2e8f0', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              + 5,000 ROWS
            </button>
            <button 
              onClick={() => handleStress(10000)}
              style={{ padding: '6px 12px', fontSize: '10px', fontFamily: '"JetBrains Mono",monospace', color: '#e2e8f0', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              + 10,000 ROWS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
