export function exportSnapshot(rows, columns) {
  return new Promise((resolve) => {
    setTimeout(() => {
      function sanitizeCell(value) {
        let str = String(value ?? '');
        if (/^[=+\-@]/.test(str)) {
          str = '\t' + str;
        }
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }

      const header = columns.map(c => sanitizeCell(c.label)).join(',');
      const body = rows.map(row =>
        columns.map(c => sanitizeCell(row[c.key])).join(',')
      ).join('\r\n');
      const csvContent = header + '\r\n' + body;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `rpa_export_${rows.length}rows_${timestamp}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
      resolve(filename);
    }, 0);
  });
}
