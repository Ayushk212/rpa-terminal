// anomaly.js — Welford online mean/variance per department
// O(1) update per row, no array scans, no jank on 200ms ticks
//
// Welford's algorithm:
//   n++
//   delta  = x - mean
//   mean  += delta / n
//   delta2 = x - mean
//   M2    += delta * delta2
//   variance = M2 / (n - 1)   [sample variance]

const METRICS = ['roi_percent', 'error_rate', 'uptime_percent'];

// One Welford accumulator per (department, metric)
// Shape: { [dept]: { [metric]: { n, mean, M2 } } }
const stats = {};

function getAcc(dept, metric) {
  if (!stats[dept]) stats[dept] = {};
  if (!stats[dept][metric]) stats[dept][metric] = { n: 0, mean: 0, M2: 0 };
  return stats[dept][metric];
}

function welfordUpdate(acc, x) {
  acc.n++;
  const delta  = x - acc.mean;
  acc.mean    += delta / acc.n;
  const delta2 = x - acc.mean;
  acc.M2      += delta * delta2;
}

function welfordStdDev(acc) {
  if (acc.n < 2) return 0;
  return Math.sqrt(acc.M2 / (acc.n - 1));
}

// Z-score: how many σ away from the dept mean
function zScore(acc, x) {
  const sd = welfordStdDev(acc);
  if (sd === 0) return 0;
  return Math.abs((x - acc.mean) / sd);
}

// Thresholds
const DRIFT_Z    = 1.5;   // amber
const ANOMALY_Z  = 2.5;   // red pulse

export function classifyRow(row) {
  const dept = row.department;
  if (!dept) return { signal: 'nominal', zScore: 0, metric: null };

  let maxZ = 0;
  let worstMetric = null;

  METRICS.forEach(m => {
    const val = Number(row[m]);
    if (!isFinite(val)) return;
    const acc = getAcc(dept, m);
    const z   = zScore(acc, val);
    if (z > maxZ) { maxZ = z; worstMetric = m; }
  });

  // Special rule: Failed status is always anomaly regardless of z-score
  if (row.status === 'Failed') {
    return { signal: 'anomaly', zScore: Math.max(maxZ, ANOMALY_Z), metric: 'status' };
  }

  let signal = 'nominal';
  if (maxZ >= ANOMALY_Z) signal = 'anomaly';
  else if (maxZ >= DRIFT_Z) signal = 'drift';

  return { signal, zScore: +maxZ.toFixed(2), metric: worstMetric };
}

// Call this AFTER classifyRow so the new value is included in future comparisons
export function updateStats(row) {
  const dept = row.department;
  if (!dept) return;
  METRICS.forEach(m => {
    const val = Number(row[m]);
    if (!isFinite(val)) return;
    welfordUpdate(getAcc(dept, m), val);
  });
}

export function getDeptStats(dept) {
  if (!stats[dept]) return null;
  return Object.fromEntries(
    METRICS.map(m => [m, {
      mean: +(stats[dept]?.[m]?.mean ?? 0).toFixed(2),
      sd:   +welfordStdDev(stats[dept]?.[m] ?? {}).toFixed(2),
      n:    stats[dept]?.[m]?.n ?? 0,
    }])
  );
}

export const SIGNAL_COLORS = {
  nominal: '#4ade80',   // success green
  drift:   '#FFC801',   // forsythia
  anomaly: '#ef4444',   // red
};
