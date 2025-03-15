// components/Toolbar.tsx
import React, { useMemo, useState } from 'react';
import { Navbar, Row, Col, Form, Button, Dropdown, InputGroup, Spinner } from 'react-bootstrap';
import { FaColumns, FaFileExport, FaFilter, FaSync } from 'react-icons/fa';
import { useTable } from '../context/TableContext';
import { debounce } from '../utils/debounce';
import { exportToCSV, exportToExcel, exportToClipboard } from '../utils/exportUtils';
import { TableData, ToolbarProps } from '../types';

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
  exportFileName = 'exported_data',
}: ToolbarProps<T>) => {
  const { table, editableRowId } = useTable<T>();
  const isServerSide = table.options.manualPagination;
  // Count only rows where the selection value is true
  const selectedRows = Object.values(table.getState().rowSelection).filter(Boolean).length;
  const allRowsSelected = table.getIsAllRowsSelected();
  const selectedItems = table.getSelectedRowModel().rows.map((row: any) => row.original) as T[];
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const debouncedFilter = useMemo(
    () => debounce((value: string) => {
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

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await exportToExcel(exportData, table.getAllColumns(), visibleColumns, `${exportFileName}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleBulkEdit = () => {
    if (editableRowId) {
      alert('Please save the currently edited row before proceeding with bulk edit.');
      return;
    }
    onBulkEditClick(selectedItems);
  };

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
                <FaColumns className="mb-1" /> Columns
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-2" style={{ zIndex: 1050 }}>
                {renderColumnToggle ? (
                  renderColumnToggle(columns)
                ) : (
                  columns.map((column: any) => (
                    <Form.Check
                      key={column.id}
                      className="mb-2"
                      label={column.columnDef.header as string}
                      checked={column.getIsVisible()}
                      onChange={(e) => column.toggleVisibility(e.target.checked)}
                    />
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-primary"
                size="sm"
                disabled={isExportingExcel}
              >
                <FaFileExport className="mb-1" /> Export
                {isExportingExcel && (
                  <Spinner
                    animation="border"
                    size="sm"
                    variant="primary"
                    className="ms-2"
                  />
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ zIndex: 1050 }}>
                {exportOptions.csv && (
                  <Dropdown.Item onClick={() => exportToCSV(exportData, table.getAllColumns(), visibleColumns, `${exportFileName}.csv`)}>
                    CSV
                  </Dropdown.Item>
                )}
                {exportOptions.excel && (
                  <Dropdown.Item onClick={handleExcelExport} disabled={isExportingExcel}>
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
                <FaSync className={`mb-1 me-1 ${isLoading ? 'spin' : ''}`} />
                Refresh
              </Button>
            )}
            {customButtons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}
          </Col>
          <Col md={4} className="d-flex justify-content-end gap-2">
            {selectedRows > 1 && rowSelection?.bulkAction && (
              <div className="selected-actions d-flex align-items-center me-3">
                <span className="badge bg-primary me-2">{selectedRows} selected</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleBulkEdit}
                  className="me-1"
                >
                  {rowSelection.bulkAction.label || 'Bulk Edit'}
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