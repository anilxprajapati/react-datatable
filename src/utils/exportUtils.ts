import { ColumnDef } from '@tanstack/react-table';

// Optional dependency check
const hasXlsx = () => {
  try {
    require('xlsx');
    return true;
  } catch {
    return false;
  }
};

export const exportToCSV = <T,>(
  data: T[],
  columns: ColumnDef<T>[],
  visibleColumns: string[]
): void => {
  const csvContent = [
    visibleColumns.map((col) => `"${col}"`).join(','),
    ...data.map((row) =>
      visibleColumns.map((col) => `"${(row as any)[col] ?? ''}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = <T,>(
  data: T[],
  columns: ColumnDef<T>[],
  visibleColumns: string[]
): void => {
  if (!hasXlsx()) {
    console.warn('XLSX library not available. Install "xlsx" to enable Excel export.');
    return;
  }
  const XLSX = require('xlsx');
  const worksheetData = [
    visibleColumns,
    ...data.map((row) => visibleColumns.map((col) => (row as any)[col] ?? '')),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, 'export.xlsx');
};

export const exportToClipboard = <T,>(
  data: T[],
  columns: ColumnDef<T>[],
  visibleColumns: string[]
): void => {
  const clipboardData = data
    .map((row) => visibleColumns.map((col) => (row as any)[col] ?? '').join('\t'))
    .join('\n');
  navigator.clipboard
    .writeText(clipboardData)
    .then(() => {
      console.log('Data copied to clipboard!');
    })
    .catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
};