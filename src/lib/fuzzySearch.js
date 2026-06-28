// Multi-field fuzzy search — Feature 10
// Parses space-separated partial tokens, matches across 4 fields simultaneously
// No regex, no external lib — pure string ops for zero thread blockage

const SEARCH_FIELDS = ['project_name', 'company_id', 'implementation_partner', 'country'];

/**
 * Split query into tokens, filter row if ALL tokens match at least one field.
 * Out-of-order partial matching: 'Tata Fin Completed Cloud' matches a row
 * where each token appears in at least one of the four search fields.
 */
export function fuzzyMatch(row, query) {
  if (!query || !query.trim()) return true;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every(token =>
    SEARCH_FIELDS.some(field => {
      const val = row[field];
      return val && String(val).toLowerCase().includes(token);
    }) ||
    // Also match status and department for convenience
    (row.status && row.status.toLowerCase().includes(token)) ||
    (row.department && row.department.toLowerCase().includes(token))
  );
}

export function applySearch(rows, query) {
  if (!query || !query.trim()) return rows;
  return rows.filter(r => fuzzyMatch(r, query));
}
