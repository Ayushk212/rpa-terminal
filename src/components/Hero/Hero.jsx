import { useEffect, useRef } from 'react';

/* ─── tiny sub-components ──────────────────────────────────────────── */

function Clock() {
  const ref = useRef(null);
  useEffect(() => {
    function tick() {
      const n = new Date();
      const p = v => String(v).padStart(2, '0');
      if (ref.current)
        ref.current.textContent = `UTC ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} style={{ color: '#fbbf24', fontFamily: '"JetBrains Mono",monospace', fontSize: '10px' }} />;
}

function LatencyBadge() {
  const ref = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (ref.current) ref.current.textContent = (Math.floor(Math.random() * 6) + 2) + 'ms';
    }, 800);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ color: '#38bdf8', fontFamily: '"JetBrains Mono",monospace', fontSize: '10px' }} ref={ref}>4ms</span>
  );
}

/* ─── KPI counters (direct DOM writes, no re-render) ──────────────── */
function KPIStrip() {
  const rowsEl    = useRef(null);
  const robotsEl  = useRef(null);
  const savingsEl = useRef(null);
  const rowsDelta = useRef(null);
  const saveDelta = useRef(null);

  const rRef   = useRef(847.3);
  const botRef = useRef(142.6);
  const savRef = useRef(94.2);

  useEffect(() => {
    const id = setInterval(() => {
      const rInc   = +(Math.random() * 0.08 + 0.02).toFixed(2);
      const botInc = +(Math.random() * 0.04 + 0.01).toFixed(2);
      const sInc   = +(Math.random() * 0.03 + 0.01).toFixed(2);

      rRef.current   += rInc;
      botRef.current += botInc;
      savRef.current += sInc;

      if (rowsEl.current)    rowsEl.current.firstChild.nodeValue    = rRef.current.toFixed(1);
      if (robotsEl.current)  robotsEl.current.firstChild.nodeValue  = botRef.current.toFixed(1);
      if (savingsEl.current) savingsEl.current.firstChild.nodeValue = '$' + savRef.current.toFixed(1);
      if (rowsDelta.current) rowsDelta.current.textContent = '▲ +' + rInc.toFixed(2) + 'M / tick';
      if (saveDelta.current) saveDelta.current.textContent = '▲ +$' + sInc.toFixed(2) + 'B / sec';
    }, 200);
    return () => clearInterval(id);
  }, []);

  const cellBase = {
    padding: '16px 28px',
    borderRight: '1px solid #1e293b',
    minWidth: '190px',
  };
  const labelStyle = {
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: '9px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#334155',
    marginBottom: '6px',
  };
  const valBase = {
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  };
  const unit = {
    fontSize: '13px',
    fontWeight: 400,
    color: '#475569',
    marginLeft: '2px',
  };
  const delta = {
    fontFamily: '"JetBrains Mono",monospace',
    fontSize: '10px',
    color: '#4ade80',
    marginTop: '4px',
  };

  return (
    <div role="region" aria-label="Live key performance metrics" style={{
      display: 'flex',
      border: '1px solid #1e293b',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '48px',
      width: 'fit-content',
      background: '#020617',
      animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both',
    }}>

      {/* Rows Processed */}
      <div style={cellBase}>
        <div style={labelStyle}>Rows Processed</div>
        <div ref={rowsEl} style={{ ...valBase, color: '#f8fafc' }}>
          847.3<span style={unit}>M</span>
        </div>
        <div ref={rowsDelta} style={delta}>▲ +0.02M / tick</div>
      </div>

      {/* Robots Deployed */}
      <div style={cellBase}>
        <div style={labelStyle}>Robots Deployed</div>
        <div ref={robotsEl} style={{ ...valBase, color: '#FFC801' }}>
          142.6<span style={unit}>K</span>
        </div>
        <div style={delta}>▲ live stream</div>
      </div>

      {/* Cumulative Savings */}
      <div style={{ ...cellBase, borderRight: 'none' }}>
        <div style={labelStyle}>Cumulative Savings</div>
        <div ref={savingsEl} style={{ ...valBase, color: '#4ade80' }}>
          $94.2<span style={unit}>B</span>
        </div>
        <div ref={saveDelta} style={delta}>▲ +$0.01B / sec</div>
      </div>

    </div>
  );
}

/* ─── SVG Orbit ───────────────────────────────────────────────────── */
function OrbitSVG() {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute',
      top: '50%',
      right: '5%',
      transform: 'translateY(-50%) scale(1.8)',
      width: '800px',
      height: '800px',
      zIndex: 0,
      opacity: 0.55,
      pointerEvents: 'none',
    }}>
      <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <filter id="glow-sky">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-gold">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Rings */}
        <circle cx="210" cy="210" r="160" stroke="#1e293b" strokeWidth="1"/>
        <circle cx="210" cy="210" r="140" stroke="rgba(56,189,248,0.08)" strokeWidth="1" strokeDasharray="4 6"/>
        <circle cx="210" cy="210" r="90"  stroke="#1e293b" strokeWidth="1"/>
        <circle cx="210" cy="210" r="80"  stroke="rgba(56,189,248,0.06)" strokeWidth="1" strokeDasharray="3 8"/>

        {/* Outer orbit — forsythia dot */}
        <g style={{ transformOrigin:'210px 210px', animation:'orbit-cw 12s linear infinite' }}>
          <circle cx="350" cy="210" r="6" fill="#FFC801" filter="url(#glow-gold)" opacity="0.9"/>
          <circle cx="350" cy="210" r="3" fill="#fff"/>
          <line x1="370" y1="210" x2="376" y2="210" stroke="#FFC801" strokeWidth="1.5" opacity="0.4"/>
        </g>

        {/* Second outer dot, 180° offset */}
        <g style={{ transformOrigin:'210px 210px', animation:'orbit-cw 12s linear infinite', animationDelay:'-6s' }}>
          <circle cx="350" cy="210" r="4" fill="rgba(255,200,1,0.25)"/>
          <circle cx="350" cy="210" r="2" fill="rgba(255,200,1,0.5)"/>
        </g>

        {/* Inner orbit — sky-blue dot */}
        <g style={{ transformOrigin:'210px 210px', animation:'orbit-ccw 7s linear infinite' }}>
          <circle cx="290" cy="210" r="5" fill="#38bdf8" filter="url(#glow-sky)" opacity="0.95"/>
          <circle cx="290" cy="210" r="2.5" fill="#fff"/>
        </g>

        {/* Third inner dot */}
        <g style={{ transformOrigin:'210px 210px', animation:'orbit-ccw 7s linear infinite', animationDelay:'-2.3s' }}>
          <circle cx="290" cy="210" r="3" fill="rgba(56,189,248,0.3)"/>
        </g>

        {/* Data-flow dashes on guide ring */}
        <circle cx="210" cy="210" r="140"
          stroke="#38bdf8" strokeWidth="1.5"
          strokeDasharray="30 280"
          opacity="0.25"
          style={{ transformOrigin:'210px 210px', animation:'orbit-cw 4s linear infinite' }}/>

        <circle cx="210" cy="210" r="140"
          stroke="#FFC801" strokeWidth="1"
          strokeDasharray="14 296"
          opacity="0.35"
          style={{ transformOrigin:'210px 210px', animation:'orbit-cw 4s linear infinite', animationDelay:'-1.3s' }}/>

        {/* Core */}
        <circle cx="210" cy="210" r="36" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5"/>
        <circle cx="210" cy="210" r="22" fill="#0f172a" stroke="rgba(56,189,248,0.3)" strokeWidth="1"/>
        <circle cx="210" cy="210" fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth="1.5"
          style={{ animation:'core-pulse 2.4s ease-in-out infinite', transformOrigin:'210px 210px', r:18 }}/>

        {/* Core crosshair */}
        <line x1="210" y1="196" x2="210" y2="224" stroke="rgba(56,189,248,0.5)" strokeWidth="0.75"/>
        <line x1="196" y1="210" x2="224" y2="210" stroke="rgba(56,189,248,0.5)" strokeWidth="0.75"/>
        <circle cx="210" cy="210" r="2.5" fill="#38bdf8" opacity="0.9"/>

        {/* Cardinal tick marks */}
        <line x1="210" y1="48"  x2="210" y2="56"  stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="210" y1="364" x2="210" y2="372" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="48"  y1="210" x2="56"  y2="210" stroke="#1e293b" strokeWidth="1.5"/>
        <line x1="364" y1="210" x2="372" y2="210" stroke="#1e293b" strokeWidth="1.5"/>

        {/* 45° node markers */}
        <circle cx="323" cy="97"  r="3" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
        <circle cx="97"  cy="323" r="3" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
        <circle cx="97"  cy="97"  r="3" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
        <circle cx="323" cy="323" r="3" fill="#1e293b" stroke="#334155" strokeWidth="1"/>

        {/* Labels */}
        <text x="216" y="197" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#475569" letterSpacing="0.08em">RPA</text>
        <text x="208" y="223" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="#475569" letterSpacing="0.06em">2026</text>
      </svg>
    </div>
  );
}

/* ─── Bottom tape ticker ──────────────────────────────────────────── */
const TAPE = [
  ['DEPT','Finance'],['STATUS','ACTIVE'],['ROI','+312.45%'],['PARTNER','Deloitte'],['COUNTRY','IN'],['TYPE','Cloud'],
  ['DEPT','HR'],['STATUS','COMPLETED'],['ROI','+189.20%'],['PARTNER','Accenture'],['COUNTRY','US'],['SAVED','$2.4M'],
  // duplicate for seamless loop
  ['DEPT','Finance'],['STATUS','ACTIVE'],['ROI','+312.45%'],['PARTNER','Deloitte'],['COUNTRY','IN'],['TYPE','Cloud'],
  ['DEPT','HR'],['STATUS','COMPLETED'],['ROI','+189.20%'],['PARTNER','Accenture'],['COUNTRY','US'],['SAVED','$2.4M'],
];

/* ─── Main Hero ───────────────────────────────────────────────────── */
export function Hero({ onEnter }) {
  return (
    <section
      aria-label="Enterprise RPA Control Terminal hero section"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 48px',
        overflow: 'hidden',
        background: '#0f172a',
        fontFamily: '"Inter",sans-serif',
        color: '#e2e8f0',
      }}
    >
      {/* ── Scanline overlay (pseudo-element via style tag) ── */}
      <style>{`
        .hero-section::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.04) 2px,
            rgba(0,0,0,0.04) 4px
          );
          pointer-events: none;
          z-index: 100;
        }
      `}</style>

      {/* ── Grid background ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* ── Top status bar ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '32px',
        background: '#020617',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        gap: '24px',
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: '10px',
        color: '#475569',
        zIndex: 10,
      }}>
        {/* STREAM LIVE */}
        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4ade80',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          <span style={{ color:'#334155' }}>STREAM</span>
          <span style={{ color:'#38bdf8' }}>LIVE</span>
        </span>

        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ color:'#334155' }}>NODE</span>
          <span style={{ color:'#38bdf8' }}>rpa-db-2026.global</span>
        </span>

        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ color:'#334155' }}>LATENCY</span>
          <LatencyBadge />
        </span>

        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ color:'#334155' }}>TICK</span>
          <span style={{ color:'#38bdf8' }}>200ms</span>
        </span>

        <span style={{ flex: 1 }} />
        <Clock />
      </div>

      {/* ── Animated SVG orbit ── */}
      <OrbitSVG />

      {/* ── Main content ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '780px',
        paddingTop: '32px',
        animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#FFC801',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px',
        }}>
          <span style={{ display:'block', width:'28px', height:'1px', background:'#FFC801', flexShrink:0 }} />
          Worldwide RPA Database 2026
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontWeight: 700,
          fontSize: 'clamp(28px, 4vw, 52px)',
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          color: '#f8fafc',
          marginBottom: '10px',
        }}>
          <span style={{ color:'#38bdf8', position:'relative', display:'inline-block' }}>
            Control.
            {/* Animated underline */}
            <span style={{
              position: 'absolute',
              bottom: '-2px', left: 0,
              height: '2px',
              background: '#38bdf8',
              width: 0,
              animation: 'draw-underline 1.4s cubic-bezier(0.22,1,0.36,1) 0.6s forwards',
            }} />
          </span><br />
          Every robot.<br />
          <span style={{ color:'#FFC801' }}>Every millisecond.</span>
        </h1>

        {/* Subhead */}
        <p style={{
          fontFamily: '"Inter",sans-serif',
          fontSize: '15px',
          fontWeight: 400,
          color: '#64748b',
          lineHeight: 1.7,
          maxWidth: '540px',
          marginBottom: '52px',
          marginTop: '20px',
        }}>
          Enterprise telemetry terminal for operators running global RPA infrastructure.
          Stream{' '}
          <code style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: '13px',
            background: 'rgba(56,189,248,0.08)',
            color: '#38bdf8',
            border: '1px solid rgba(56,189,248,0.15)',
            padding: '1px 6px',
            borderRadius: '3px',
          }}>500+ live rows</code>
          , sort multi-column, filter by department —
          at locked 60 FPS with zero dropped records.
        </p>

        {/* KPI strip */}
        <KPIStrip />

        {/* CTA row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          animation: 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both',
        }}>

          {/* Terminal CTA button */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Launch terminal"
            onClick={onEnter}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onEnter()}
            className="cta-terminal-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255,200,1,0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'rgba(255,200,1,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#FFC801';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(255,200,1,0.12)';
              const arrow = e.currentTarget.querySelector('.cta-arrow');
              if (arrow) arrow.style.transform = 'translateX(3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,200,1,0.3)';
              e.currentTarget.style.boxShadow = 'none';
              const arrow = e.currentTarget.querySelector('.cta-arrow');
              if (arrow) arrow.style.transform = 'translateX(0)';
            }}
          >
            <span style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: '12px',
              color: '#FFC801',
              padding: '13px 14px',
              borderRight: '1px solid rgba(255,200,1,0.2)',
              background: 'rgba(255,200,1,0.06)',
              userSelect: 'none',
            }}>$</span>

            <span style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: '13px',
              fontWeight: 500,
              color: '#f8fafc',
              padding: '13px 18px',
              letterSpacing: '0.01em',
            }}>
              ./launch-terminal
              <span aria-hidden="true" style={{
                display: 'inline-block',
                width: '8px',
                height: '14px',
                background: '#FFC801',
                verticalAlign: 'middle',
                marginLeft: '2px',
                animation: 'blink-cursor 1s step-end infinite',
              }} />
            </span>

            <span className="cta-arrow" aria-hidden="true" style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: '16px',
              color: '#FFC801',
              padding: '13px 16px 13px 4px',
              transition: 'transform 0.2s',
              userSelect: 'none',
            }}>→</span>
          </div>

          {/* Secondary link */}
          <button
            aria-label="View architecture documentation"
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: '11px',
              color: '#475569',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'color 0.2s',
              border: 'none',
              background: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            <span style={{ color:'#1e293b', fontSize:'13px' }}>//</span>
            view architecture
          </button>
        </div>
      </div>

      {/* ── Bottom status tape ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '28px',
        background: '#020617',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          gap: '48px',
          animation: 'ticker-scroll 18s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {TAPE.map(([k, v], i) => (
            <span key={i} style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: '10px',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color:'#475569' }}>{k}</span>
              <span style={{ color:'#1e293b' }}>│</span>
              <span style={{ color:'#38bdf8' }}>{v}</span>
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}
