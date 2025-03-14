import React from 'react';
import { useTable } from '../context/TableContext';
import '../styles/DataTable.css';

interface TablePaginationProps {
  className?: string;
  pageSizeOptions?: number[]; // New: Custom page sizes
  renderPagination?: (table: any) => React.ReactNode; // New: Custom pagination rendering
}

export const TablePagination = ({
  className = '',
  pageSizeOptions = [10, 20, 50, 100], // Default options
  renderPagination,
}: TablePaginationProps) => {
  const { table } = useTable();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  if (renderPagination) {
    return <div className={`pagination mt-3 ${className}`}>{renderPagination(table)}</div>;
  }

  return (
    <div className={`pagination mt-3 d-flex justify-content-between align-items-center ${className}`}>
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => table.previousPage()}
          disabled={!canPreviousPage}
        >
          Previous
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageCount || 1}
          </strong>
        </span>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => table.nextPage()}
          disabled={!canNextPage}
        >
          Next
        </button>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span>Rows per page:</span>
        <select
          className="form-select form-select-sm"
          value={pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          style={{ width: '80px' }}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};