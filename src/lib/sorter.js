// Single + multi-column sorter — Features 4 & 9
// Multi-col: shift-click builds a priority tree; sort within 200ms tick window

/**
 * sortConfig: Array<{ key: string, dir: 'asc'|'desc' }>
 * First entry = primary sort, subsequent = tiebreakers
 */
export function applySort(rows, sortConfig) {
  if (!sortConfig || sortConfig.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const { key, dir } of sortConfig) {
      const av = a[key];
      const bv = b[key];
      let cmp = 0;

      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = (isNaN(av) ? 0 : av) - (isNaN(bv) ? 0 : bv);
      } else if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) {
        cmp = parseFloat(av) - parseFloat(bv);
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }

      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

/**
 * Toggle or add a sort column.
 * Without shift: replace entire config with this one column.
 * With shift: add/cycle this column in the existing priority tree.
 */
export function buildSortConfig(current, key, shiftHeld) {
  if (!shiftHeld) {
    // Single-column mode
    const existing = current.find(c => c.key === key);
    if (existing && existing.dir === 'asc') return [{ key, dir: 'desc' }];
    return [{ key, dir: 'asc' }];
  }

  // Multi-column mode: shift-click
  const idx = current.findIndex(c => c.key === key);
  if (idx === -1) {
    return [...current, { key, dir: 'asc' }];
  }
  const col = current[idx];
  if (col.dir === 'asc') {
    return current.map((c, i) => i === idx ? { ...c, dir: 'desc' } : c);
  }
  // Remove from priority tree
  return current.filter((_, i) => i !== idx);
}

export function getSortIndicator(sortConfig, key) {
  const idx = sortConfig.findIndex(c => c.key === key);
  if (idx === -1) return null;
  return { dir: sortConfig[idx].dir, priority: idx + 1, total: sortConfig.length };
}
