// Financial & numeric formatting — Feature 2
// Prevents raw string leakage and ensures 2dp on percentages

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: 0, maximumFractionDigits: 0,
});

const USD_SHORT = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  notation: 'compact', maximumFractionDigits: 1,
});

export function formatCurrency(val) {
  const n = Number(val);
  if (!isFinite(n)) return '$—';
  return USD.format(n);
}

export function formatCurrencyShort(val) {
  const n = Number(val);
  if (!isFinite(n)) return '$—';
  return USD_SHORT.format(n);
}

export function formatROI(val) {
  const n = Number(val);
  if (!isFinite(n)) return '—%';
  // Clamp to 2dp — Feature 2 exact requirement
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

export function formatPercent(val) {
  const n = Number(val);
  if (!isFinite(n)) return '—%';
  return n.toFixed(2) + '%';
}

export function formatNumber(val) {
  const n = Number(val);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US');
}

export function formatHours(val) {
  const n = Number(val);
  if (!isFinite(n)) return '—';
  if (n >= 1000) return (n/1000).toFixed(1) + 'k hrs';
  return n + ' hrs';
}

export function roiClass(val) {
  const n = Number(val);
  if (n < 0)   return 'text-red-400';
  if (n > 200) return 'text-success';
  return 'text-sky';
}

export function statusClass(status) {
  switch (status) {
    case 'Active':    return 'text-success';
    case 'Completed': return 'text-sky';
    case 'Failed':    return 'text-red-400';
    case 'Pending':   return 'text-warning';
    case 'On Hold':   return 'text-subdued opacity-60';
    default:          return 'text-subdued';
  }
}
