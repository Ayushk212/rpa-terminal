// RowInspector — portal-rendered row detail panel
// Trap 3: mounted via createPortal at document.body, never inside VirtualGrid's tree
// Trap 7: backdrop click closes, stopPropagation prevents inner clicks from bubbling

import { createPortal } from 'react-dom';
import {
  formatCurrency, formatROI, formatPercent, formatHours, formatNumber
} from '../../lib/formatter';

// ── Status color map (reuse terminal tokens) ──
function statusColor(status) {
  switch (status) {
    case 'Active':    return '#4ade80';
    case 'Completed': return '#38bdf8';
    case 'Failed':    return '#ef4444';
    case 'Pending':   return '#FFC801';
    case 'On Hold':   return '#64748b';
    default:          return '#94a3b8';
  }
}

function signalColor(signal) {
  switch (signal) {
    case 'anomaly': return '#ef4444';
    case 'drift':   return '#FFC801';
    default:        return '#4ade80';
  }
}

function Field({ label, value, color }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      padding: '5px 0', borderBottom: '1px solid rgba(30,41,59,0.6)',
    }}>
      <span style={{
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: '9px', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#475569',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: '10px', color: color || '#e2e8f0',
        textAlign: 'right', wordBreak: 'break-all',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: '8px', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: '#38bdf8',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '5px', marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function RowInspector({ row, onClose }) {
  if (!row) return null;

  const roiNum = Number(row.roi_percent);
  const roiColor = roiNum < 0 ? '#ef4444' : roiNum > 200 ? '#4ade80' : '#38bdf8';

  const uptimeNum = Number(row.uptime_percent);
  const uptimeColor = uptimeNum < 90 ? '#ef4444' : uptimeNum < 95 ? '#FFC801' : '#4ade80';

  const lastUpdated = row.last_updated
    ? new Date(row.last_updated).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : '—';

  return createPortal(
    <>
      {/* Backdrop — Trap 7: clicks here close panel */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(2,6,23,0.75)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel — Trap 7: stopPropagation prevents backdrop close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 901,
          transform: 'translate(-50%, -50%)',
          width: '520px', maxHeight: '80vh',
          background: '#020617',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid #1e293b',
          background: '#020617',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div>
            <div style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: '8px',
              letterSpacing: '0.18em', color: '#334155', marginBottom: '4px',
            }}>
              ROW INSPECTOR
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: '12px',
              color: '#e2e8f0', fontWeight: 600,
            }}>
              {row.project_name || '—'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Signal badge */}
            <span style={{
              fontFamily: '"JetBrains Mono",monospace', fontSize: '9px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: signalColor(row._signal),
              border: `1px solid ${signalColor(row._signal)}40`,
              background: `${signalColor(row._signal)}10`,
              padding: '3px 8px', borderRadius: '2px',
            }}>
              {row._signal || 'nominal'}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid #1e293b',
                color: '#64748b', cursor: 'pointer',
                width: '24px', height: '24px', borderRadius: '2px',
                fontFamily: '"JetBrains Mono",monospace', fontSize: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px' }}>

          <Section title="Identification">
            <Field label="Project ID" value={row.id} />
            <Field label="Company ID" value={row.company_id} />
            <Field label="Department" value={row.department} />
            <Field label="Industry" value={row.industry} />
            <Field label="Country" value={row.country} />
            <Field label="Automation Type" value={row.automation_type} />
            <Field label="Implementation Partner" value={row.implementation_partner} />
          </Section>

          <Section title="Financials">
            <Field label="Budget" value={formatCurrency(row.budget)} />
            <Field label="Cumulative Savings" value={formatCurrency(row.cumulative_savings)} color="#4ade80" />
            <Field label="ROI %" value={formatROI(row.roi_percent)} color={roiColor} />
            <Field label="Employee Hrs Saved" value={formatHours(row.employee_hours_saved)} />
          </Section>

          <Section title="Operations">
            <Field
              label="Status"
              value={row.status}
              color={statusColor(row.status)}
            />
            <Field label="Active Robots" value={formatNumber(row.active_robots)} />
            <Field label="Error Rate" value={row.error_rate != null ? formatPercent(row.error_rate) : '—'} color={Number(row.error_rate) > 10 ? '#ef4444' : '#94a3b8'} />
            <Field label="Uptime" value={row.uptime_percent != null ? formatPercent(row.uptime_percent) : '—'} color={uptimeColor} />
          </Section>

          <Section title="Signal Analysis">
            <Field label="Signal" value={row._signal} color={signalColor(row._signal)} />
            <Field label="Z-Score (σ)" value={row._zScore != null ? row._zScore.toFixed(3) + 'σ' : '—'} color={row._signal === 'anomaly' ? '#ef4444' : row._signal === 'drift' ? '#FFC801' : '#94a3b8'} />
            <Field label="Signal Metric" value={row._sigMetric} />
            <Field label="Last Updated" value={lastUpdated} />
          </Section>

        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid #1e293b',
          background: '#020617',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: '8px', color: '#1e293b', letterSpacing: '0.1em',
          }}>
            SNAPSHOT AT CLICK TIME · ESC TO CLOSE
          </span>
          <span style={{
            fontFamily: '"JetBrains Mono",monospace',
            fontSize: '8px', color: '#334155',
          }}>
            {row.id}
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}
