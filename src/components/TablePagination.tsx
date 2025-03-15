import React, { useMemo } from 'react';
import { Row, Col, Form, Pagination as BootstrapPagination } from 'react-bootstrap';
import { useTable } from '../context/TableContext';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { TablePaginationProps } from 'types';

export const TablePagination = ({
  className = '',
  renderPagination,
}: TablePaginationProps) => {
  const { table } = useTable();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const totalRows = table.options.rowCount ?? 0; // Total rows from config or state

  // Dynamic page size options: 10, 25, 50, 75, and 100% of totalRows
  const pageSizeOptions = useMemo(() => {
    if (totalRows <= 50) return [10, 25, 50]; // Small dataset ke liye fixed options
  
    const dynamicSizes = [
      Math.round(totalRows * 0.25), // 25%
      Math.round(totalRows * 0.5),  // 50%
      Math.round(totalRows * 0.75), // 75%
      totalRows,                    // 100%
    ];
  
    const options = [pageSize, ...dynamicSizes].filter((size, index, self) => 
      size <= totalRows && !self.includes(size, index + 1)
    );
  
    return options.sort((a, b) => a - b);
  }, [totalRows]);
  

  if (renderPagination) {
    return <div className={`pagination mt-3 ${className}`}>{renderPagination(table)}</div>;
  }

  return (
    <Row className={`mt-3 align-items-center ${className}`}>
      <Col md={3} className="d-flex align-items-center">
        <span className="me-2">Show:</span>
        <Form.Select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{ width: 'fit-content' }} // Slightly wider to accommodate larger numbers
          className="me-2"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size === totalRows ? `${size} (All)` : size}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col md={6}>
        <BootstrapPagination className="justify-content-center mb-0">
          <BootstrapPagination.First onClick={() => table.setPageIndex(0)} disabled={!canPreviousPage} />
          <BootstrapPagination.Prev onClick={() => table.previousPage()} disabled={!canPreviousPage} />
          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            const page = pageIndex - 2 + i;
            if (page >= 0 && page < pageCount) {
              return (
                <BootstrapPagination.Item
                  key={page}
                  active={page === pageIndex}
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </BootstrapPagination.Item>
              );
            }
            return null;
          })}
          <BootstrapPagination.Next onClick={() => table.nextPage()} disabled={!canNextPage} />
          <BootstrapPagination.Last onClick={() => table.setPageIndex(pageCount - 1)} disabled={!canNextPage} />
        </BootstrapPagination>
      </Col>
      <Col md={3} className="text-end small text-muted">
        Showing {table.getRowModel().rows.length === 0 ? 0 : pageIndex * pageSize + 1}-
        {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows} rows
      </Col>
    </Row>
  );
};