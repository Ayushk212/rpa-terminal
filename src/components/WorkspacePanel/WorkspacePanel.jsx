// WorkspacePanel — Feature 6: Toggleable layout panels with localStorage

export function WorkspacePanel({ children, title, className = '' }) {
  return (
    <div className={`flex flex-col border border-term-border bg-term-bg overflow-hidden ${className}`}>
      {title && (
        <div className="font-mono text-[9px] tracking-widest uppercase text-slate-600 px-3 py-1.5 border-b border-term-border shrink-0"
             style={{ background: 'rgba(15,23,42,0.4)' }}>
          {title}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export function LayoutControls({ layout, togglePanel }) {
  const panels = [
    { key: 'kpiStrip',     label: 'KPIs'   },
    { key: 'deptChart',    label: 'CHART'  },
    { key: 'infraToggles', label: 'INFRA'  },
    { key: 'replayBar',    label: 'REPLAY' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {panels.map(p => (
        <button
          key={p.key}
          onClick={() => togglePanel(p.key)}
          aria-pressed={layout[p.key]}
          title={`Toggle ${p.label}`}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '8px',
            letterSpacing: '0.12em',
            padding: '3px 8px',
            border: `1px solid ${layout[p.key] ? 'rgba(56,189,248,0.4)' : '#1e293b'}`,
            borderRadius: '3px',
            background: layout[p.key] ? 'rgba(56,189,248,0.08)' : 'transparent',
            color: layout[p.key] ? '#38bdf8' : '#475569',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function InfraToggles({ infraState, toggleInfra }) {
  const items = [
    { key: 'streamIngestion', label: 'STREAM INGESTION', color: '#4ade80' },
    { key: 'alertDispatch',   label: 'ALERT DISPATCH',   color: '#fbbf24' },
    { key: 'auditLogging',    label: 'AUDIT LOGGING',    color: '#38bdf8' },
    { key: 'coldArchival',    label: 'COLD ARCHIVAL',    color: '#64748b' },
    { key: 'failoverReplica', label: 'FAILOVER REPLICA', color: '#FFC801' },
  ];

  if (!infraState) return null;

  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {items.map(item => (
        <InfraToggle 
          key={item.key} 
          label={item.label} 
          color={item.color} 
          on={infraState[item.key]} 
          onToggle={() => toggleInfra(item.key)} 
        />
      ))}
    </div>
  );
}

function InfraToggle({ label, on, color, onToggle }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 0', cursor: 'pointer',
      borderBottom: '1px solid rgba(30,41,59,0.5)',
    }}>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: '9px',
        color: '#475569', letterSpacing: '0.06em',
      }}>
        {label}
      </span>
      <div
        onClick={onToggle}
        style={{
          position: 'relative', width: '28px', height: '14px',
          borderRadius: '7px',
          background: on ? color : '#1e293b',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'background 0.2s',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '2px',
          left: on ? '14px' : '2px',
          width: '10px', height: '10px', borderRadius: '50%',
          background: on ? '#fff' : '#475569',
          transition: 'left 0.15s, background 0.2s',
        }} />
      </div>
    </label>
  );
}

// Need React in scope for useState
import React from 'react';
