import React, { useMemo } from 'react';
import { Navbar, Row, Col, Form, Button, Dropdown, InputGroup } from 'react-bootstrap';
import { FaColumns, FaFileExport, FaFilter, FaSync } from 'react-icons/fa';
import { useTable } from '../context/TableContext';
import { debounce } from '../utils/debounce';
import { exportToCSV, exportToExcel, exportToClipboard } from '../utils/exportUtils';
import { TableData } from '../types';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ToolbarProps<T extends TableData> {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  isLoading: boolean;
  fetchTableData?: () => void;
  className?: string;
  onBulkEditClick: (selectedItems: T[]) => void;
  customButtons?: React.ReactNode[];
  exportOptions?: { csv?: boolean; excel?: boolean; clipboard?: boolean };
  renderColumnToggle?: (columns: any[]) => React.ReactNode;
  rowSelection?: {
    enabled?: boolean;
    bulkAction?: { label: string; onClick: (selectedItems: T[]) => void };
  };
  exportFileName?: string; // New: Pass export file name
}

export const Toolbar = <T extends TableData>({
  globalFilter,
  setGlobalFilter,
  showFilters,
  setShowFilters,
  isLoading,
  fetchTableData,
  className = '',
  onBulkEditClick,
  customButtons = [],
  exportOptions = { csv: true, excel: true, clipboard: true },
  renderColumnToggle,
  rowSelection,
  exportFileName = 'exported_data', // Default if not provided
}: ToolbarProps<T>) => {
  const { table } = useTable<T>();
  const isServerSide = table.options.manualPagination;
  const selectedRows = Object.keys(table.getState().rowSelection).length;
  const allRowsSelected = table.getIsAllRowsSelected();
  const selectedItems = table.getSelectedRowModel().rows.map((row: any) => row.original) as T[];

  const debouncedFilter = useMemo(
    () =>
      debounce((value: string) => {
        table.setGlobalFilter(value);
        table.setPageIndex(0);
      }, 300),
    [table]
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilter(value);
    debouncedFilter(value);
  };

  const visibleColumns = table.getAllColumns().filter((col: any) => col.getIsVisible()).map((col: any) => col.id);
  const exportData = table.getRowModel().rows.map((row: any) => row.original);
  const columns = table.getAllColumns().filter((column: any) => column.getCanHide());

  return (
    <Navbar bg="light" className={`mb-3 rounded shadow-sm ${className}`}>
      <div className="container-fluid">
        <Row className="w-100 align-items-center">
          <Col md={8} className="d-flex justify-content-left align-items-center gap-2">
            <InputGroup style={{ maxWidth: '250px' }}>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={globalFilter}
                onChange={handleFilterChange}
              />
              <Button
                variant={showFilters ? 'primary' : 'outline-primary'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
              </Button>
            </InputGroup>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <FaColumns className='mb-1' /> Columns
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-2" style={{ zIndex: 1050 }}>
                {renderColumnToggle ? (
                  renderColumnToggle(columns)
                ) : (
                  columns.map((column: any) => (
                    <Form.Check
                      key={column.id}
                      className="mb-2 "
                      label={column.columnDef.header as string}
                      checked={column.getIsVisible()}
                      onChange={(e) => column.toggleVisibility(e.target.checked)}
                    />
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <FaFileExport className='mb-1' /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ zIndex: 1050 }}>
                {exportOptions.csv && (
                  <Dropdown.Item onClick={() => exportToCSV(exportData, table.getAllColumns(), visibleColumns, `${exportFileName}.csv`)}>
                    CSV
                  </Dropdown.Item>
                )}
                {exportOptions.excel && (
                  <Dropdown.Item
                    onClick={() => exportToExcel(exportData, table.getAllColumns(), visibleColumns, `${exportFileName}.xlsx`)}
                  >
                    Excel
                  </Dropdown.Item>
                )}
                {exportOptions.clipboard && (
                  <Dropdown.Item onClick={() => exportToClipboard(exportData, table.getAllColumns(), visibleColumns)}>
                    Copy to Clipboard
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
            {isServerSide && fetchTableData && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={fetchTableData}
                disabled={isLoading}
              >
                <FaSync className={`${isLoading ? 'spin' : ''} mb-1`} /> Refresh
              </Button>
            )}
            {customButtons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}
          </Col>
          <Col md={4} className="d-flex justify-content-end gap-2">
            {selectedRows > 0 && rowSelection?.bulkAction && (
              <div className="selected-actions d-flex align-items-center me-3">
                <span className="badge bg-primary me-2">{selectedRows} selected</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() =>
                    allRowsSelected
                      ? onBulkEditClick(selectedItems)
                      : rowSelection.bulkAction?.onClick(selectedItems)
                  }
                  className="me-1"
                >
                  {allRowsSelected ? 'Bulk Edit' : rowSelection.bulkAction?.label ?? 'Action'}
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => table.resetRowSelection()}>
                  Clear
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </Navbar>
  );
};