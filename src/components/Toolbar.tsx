// components/Toolbar.tsx
import React, { useMemo } from 'react';
import { useTable } from '../context/TableContext';
import { debounce } from '../utils/debounce';
import { exportToCSV, exportToExcel, exportToClipboard } from '../utils/exportUtils';
import { TableData } from '../types';
import '../styles/DataTable.css';

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
    bulkAction?: {
      label: string;
      onClick: (selectedItems: T[]) => void;
    };
  };
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

  const visibleColumns = table
    .getAllColumns()
    .filter((col: any) => col.getIsVisible())
    .map((col: any) => col.id);
  const exportData = table.getRowModel().rows.map((row: any) => row.original);

  const columns = table
    .getAllColumns()
    .filter((column: any) => column.getCanHide());

  return (
    <div className={`toolbar mb-3 rounded shadow-sm ${className}`} style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container-fluid">
        <div className="row w-100 align-items-center">
          {/* Left Section: Search, Filters, Columns, Export */}
          <div className="col-md-8 d-flex justify-content-left align-items-center gap-2">
            {/* Search Input */}
            <div className="input-group" style={{ maxWidth: '250px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={globalFilter}
                onChange={handleFilterChange}
              />
              <button
                className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span>Filter</span>
              </button>
            </div>

            {/* Column Toggle */}
            {renderColumnToggle ? (
              renderColumnToggle(columns)
            ) : (
              <div className="dropdown">
                <button
                  className="btn btn-outline-primary btn-sm dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  style={{ cursor: 'pointer' }}
                >
                  <span>Columns</span>
                </button>
                <ul className="dropdown-menu p-2" style={{ zIndex: 1050 }}>
                  {columns.map((column: any) => (
                    <li key={column.id} className="mb-2">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={column.getIsVisible()}
                          onChange={(e) => column.toggleVisibility(e.target.checked)}
                        />
                        <span className="form-check-label">{column.columnDef.header as string}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Export Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-outline-primary btn-sm dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <span>Export</span>
              </button>
              <ul className="dropdown-menu" style={{ zIndex: 1050 }}>
                {exportOptions.csv && (
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => exportToCSV(exportData, table.getAllColumns(), visibleColumns)}
                    >
                      CSV
                    </button>
                  </li>
                )}
                {exportOptions.excel && (
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => exportToExcel(exportData, table.getAllColumns(), visibleColumns)}
                    >
                      Excel
                    </button>
                  </li>
                )}
                {exportOptions.clipboard && (
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => exportToClipboard(exportData, table.getAllColumns(), visibleColumns)}
                    >
                      Copy to Clipboard
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Refresh Button */}
            {isServerSide && fetchTableData && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={fetchTableData}
                disabled={isLoading}
              >
                <span className={isLoading ? 'spin' : ''}>Refresh</span>
              </button>
            )}

            {/* Custom Buttons */}
            {customButtons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}
          </div>

          {/* Right Section: Selection Actions */}
          <div className="col-md-4 d-flex justify-content-end gap-2">
            {selectedRows > 0 && rowSelection?.bulkAction && (
              <div className="selected-actions d-flex align-items-center me-3">
                <span className="badge bg-primary me-2">{selectedRows} selected</span>
                <button
                  className="btn btn-outline-primary btn-sm me-1"
                  onClick={() =>
                    allRowsSelected
                      ? onBulkEditClick(selectedItems)
                      : rowSelection.bulkAction?.onClick(selectedItems) // Safe access with optional chaining
                  }
                >
                  {allRowsSelected ? 'Bulk Edit' : rowSelection.bulkAction?.label ?? 'Action'} {/* Fallback label */}
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => table.resetRowSelection()}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};