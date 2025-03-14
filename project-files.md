# Project File Structure and List

**Generated on:** 14/3/2025, 10:32:15 pm

## 📂 Folder Structure
```
C:\Users\anilp\Documents\projects\react-datatable\src/
├── components
│   ├── BulkEditModal.tsx
│   ├── DataTable.tsx
│   ├── Demo.tsx
│   ├── TableBody.tsx
│   ├── TableFilters.tsx
│   ├── TableHeader.tsx
│   ├── TablePagination.tsx
│   └── Toolbar.tsx
├── context
│   └── TableContext.tsx
├── styles
│   └── DataTable.css
├── types
│   └── index.ts
├── utils
│   ├── debounce.ts
│   └── exportUtils.ts
├── index.ts
└── main.tsx

```

## 📄 File List with Contents

### `components\BulkEditModal.tsx`

```tsx

import React, { useState } from 'react';
import { TableData } from '../types';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface BulkEditModalProps<T extends TableData> {
  show: boolean;
  onHide: () => void;
  columns: any[];
  selectedRows: T[];
  onBulkEditSubmit: (selectedItems: T[]) => void;
  renderBulkEditForm?: (selectedRows: T[], onSubmit: (values: Record<string, any>) => void) => React.ReactNode; // New: Custom form rendering
}

export const BulkEditModal = <T extends TableData>({
  show,
  onHide,
  columns,
  selectedRows,
  onBulkEditSubmit,
  renderBulkEditForm,
}: BulkEditModalProps<T>) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRows = selectedRows.map((row) => ({ ...row, ...formValues }));
    onBulkEditSubmit(updatedRows);
    onHide();
    setFormValues({});
  };

  if (!show) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Edit ({selectedRows.length} items)</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {renderBulkEditForm ? (
              renderBulkEditForm(selectedRows, (values) => {
                const updatedRows = selectedRows.map((row) => ({ ...row, ...values }));
                onBulkEditSubmit(updatedRows);
                onHide();
              })
            ) : (
              <form onSubmit={handleSubmit}>
                {columns
                  .filter((col) => col.accessorKey && col.enableColumnFilter !== false)
                  .map((col) => (
                    <div key={col.accessorKey} className="mb-3">
                      <label className="form-label">{col.header}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formValues[col.accessorKey] || ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [col.accessorKey]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
              </form>
            )}
          </div>
          {!renderBulkEditForm && (
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

```

### `components\DataTable.tsx`

```tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
  GroupingState,
} from '@tanstack/react-table';
import { TableConfig, TableData, PaginationResponse, Action } from '../types';
import { Toolbar } from './Toolbar';
import { TableFilters } from './TableFilters';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TablePagination } from './TablePagination';
import { BulkEditModal } from './BulkEditModal';
import { TableProvider } from '../context/TableContext';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface DataTableProps<T extends TableData> {
  config: TableConfig<T>;
  className?: string;
  style?: React.CSSProperties;
  onRowClick?: (row: T) => void;
  renderToolbar?: (table: any) => React.ReactNode;
  renderFilter?: (column: any) => React.ReactNode;
  filterTypes?: Record<string, 'text' | 'select' | ((column: any) => React.ReactNode)>;
  renderHeader?: (header: any) => React.ReactNode;
  sortIcons?: { asc?: React.ReactNode; desc?: React.ReactNode; unsorted?: React.ReactNode };
  renderCell?: (cell: any) => React.ReactNode;
  renderActions?: (row: T, actions: Action<T>[]) => React.ReactNode;
  formatRawData?: (row: T) => Record<string, any>;
  pageSizeOptions?: number[];
  renderPagination?: (table: any) => React.ReactNode;
  renderBulkEditForm?: (selectedRows: T[], onSubmit: (values: Record<string, any>) => void) => React.ReactNode;
}

export const DataTable = <T extends TableData>({
  config,
  className,
  style,
  onRowClick,
  renderToolbar,
  renderFilter,
  filterTypes,
  renderHeader,
  sortIcons,
  renderCell,
  renderActions,
  formatRawData,
  pageSizeOptions,
  renderPagination,
  renderBulkEditForm,
}: DataTableProps<T>) => {
  const {
    columns,
    fetchData,
    data: initialData = [],
    pagination = { mode: 'client' },
    rowSelection = { enabled: false },
    actions = [],
    styleConfig = { padding: 'standard', theme: 'light' },
    enableRawData = false,
    exportFileName = 'exported_data',
  } = config;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<T[]>(initialData);
  const [totalRows, setTotalRows] = useState<number>(pagination.initialState?.totalRows ?? initialData.length);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination.initialState?.pageIndex ?? 0,
    pageSize: pagination.initialState?.pageSize ?? 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelectionState, setRowSelectionState] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedRowsForModal, setSelectedRowsForModal] = useState<T[]>([]);

  const isServerSide = pagination.mode === 'server';

  // Custom sorting function for both strings and numbers
  const customSortFn = (rowA: any, rowB: any, columnId: string) => {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);
    
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    }
    
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    
    return String(a).localeCompare(String(b));
  };

  // Custom global filter function
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const value = row.getValue(columnId);
    return String(value)
      .toLowerCase()
      .includes(String(filterValue).toLowerCase());
  };

  const fetchTableData = async () => {
    if (!fetchData || !isServerSide) return;
    setIsLoading(true);
    try {
      const params = {
        pageIndex: paginationState.pageIndex,
        pageSize: paginationState.pageSize,
        sortBy: sorting,
        filters: {
          globalFilter: globalFilter || '',
          columnFilters: columnFilters.reduce((acc, filter) => ({ ...acc, [filter.id]: filter.value }), {}),
        },
      };
      const response: PaginationResponse<T> = await fetchData(params);
      setData(response.data);
      setTotalRows(response.totalSize);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isServerSide) {
      const debouncedFetch = setTimeout(() => fetchTableData(), 300);
      return () => clearTimeout(debouncedFetch);
    }
  }, [paginationState.pageIndex, paginationState.pageSize, sorting, globalFilter, JSON.stringify(columnFilters)]);

  const table = useReactTable({
    data: isServerSide ? data : initialData,
    columns: useMemo(() => 
      columns.map(col => ({
        ...col,
        sortingFn: col.sortingFn || customSortFn
      })), [columns]),
    state: {
      pagination: paginationState,
      sorting,
      globalFilter,
      columnFilters,
      rowSelection: rowSelectionState,
      columnVisibility,
      expanded,
      grouping,
    },
    onPaginationChange: setPaginationState,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelectionState,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
    pageCount: isServerSide ? Math.ceil(totalRows / paginationState.pageSize) : undefined,
    rowCount: totalRows,
    enableRowSelection: rowSelection.enabled,
    enableMultiRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    getRowCanExpand: () => !!enableRawData,
    meta: { config, isLoading, fetchTableData },
  });

  const showActionColumn = Object.keys(rowSelectionState).length === 1;

  const handleBulkEditClick = (rows: T[]) => {
    console.log('Bulk edit clicked with rows:', rows);
    setSelectedRowsForModal(rows);
    setShowBulkEditModal(true);
  };

  if (!table.getHeaderGroups().length && isLoading) {
    return <div>Loading table...</div>;
  }

  return (
    <div className={`data-table-container theme-${styleConfig.theme} ${className}`} style={style}>
      <TableProvider table={table}>
        {renderToolbar ? (
          renderToolbar(table)
        ) : (
          <Toolbar
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isLoading={isLoading}
            fetchTableData={fetchTableData}
            className=""
            onBulkEditClick={handleBulkEditClick}
            customButtons={[]}
            exportOptions={{ csv: true, excel: true, clipboard: true }}
            renderColumnToggle={undefined}
            rowSelection={rowSelection}
            exportFileName={exportFileName}
          />
        )}
        {showFilters && (
          <TableFilters
            className=""
            renderFilter={renderFilter}
            filterTypes={filterTypes}
          />
        )}
        <div ref={tableContainerRef} className="table-container" style={{ height: '450px', overflowY: 'auto', overflowX: 'auto' }}>
          <table className={`data-table table table-striped table-hover table-${styleConfig.padding}`}>
            <TableHeader
              className=""
              renderHeader={renderHeader}
              sortIcons={
                sortIcons || {
                  asc: <span>↑</span>,
                  desc: <span>↓</span>,
                  unsorted: <span>↕</span>,
                }
              }
              rowSelection={rowSelection}
              actions={actions}
              showActionColumn={showActionColumn}
            />
            <TableBody
              className=""
              onRowClick={onRowClick}
              renderCell={renderCell}
              renderActions={renderActions}
              formatRawData={formatRawData}
            />
          </table>
        </div>
        <TablePagination
          className=""
          pageSizeOptions={pageSizeOptions}
          renderPagination={renderPagination}
        />
        {rowSelection?.bulkAction && (
          <BulkEditModal
            show={showBulkEditModal}
            onHide={() => setShowBulkEditModal(false)}
            columns={columns}
            selectedRows={selectedRowsForModal}
            onBulkEditSubmit={rowSelection.bulkAction?.onClick ?? (() => {})}
            renderBulkEditForm={renderBulkEditForm}
          />
        )}
      </TableProvider>
    </div>
  );
};

export default DataTable;

```

### `components\Demo.tsx`

```tsx

import React, { useState } from 'react';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import DataTable from './DataTable';
import { PaginationResponse, TableConfig } from 'types';

interface MockData {
  id: number;
  name: string;
  age: number;
  email: string;
}

const fetchMockData = async ({ pageIndex, pageSize }: any): Promise<PaginationResponse<MockData>> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const data = Array.from({ length: pageSize }, (_, i) => ({
    id: pageIndex * pageSize + i + 1,
    name: `User ${pageIndex * pageSize + i + 1}`,
    age: Math.floor(Math.random() * 50) + 18,
    email: `user${pageIndex * pageSize + i + 1}@example.com`,
  }));
  return { data, totalSize: 100 };
};

const columns = [
  { accessorKey: 'id', header: 'ID', meta: { sortable: true, width: 100, align: 'center' } },
  { accessorKey: 'name', header: 'Name', meta: { sortable: true } },
  { accessorKey: 'age', header: 'Age', meta: { sortable: true } },
  { accessorKey: 'email', header: 'Email', meta: { sortable: true } },
];

const Demo = () => {
  const [tableData, setTableData] = useState<MockData[]>([]);

  const handleEdit = (row: MockData) => {
    console.log('Edit:', row);
    alert(`Editing row ${row.id}`);
    // Add your edit logic here
  };

  const handleDelete = (row: MockData) => {
    console.log('Delete:', row);
    setTableData(prev => prev.filter(item => item.id !== row.id));
    alert(`Deleted row ${row.id}`);
  };

  const handleSave = (row: MockData) => {
    console.log('Save:', row);
    alert(`Saved row ${row.id}`);
    // Add your save logic here
  };

  const handleBulkEdit = (selectedRows: MockData[]) => {
    console.log('Bulk Edit:', selectedRows);
    alert(`Bulk editing ${selectedRows.length} rows`);
    // Add your bulk edit logic here
  };

  const tableConfig: TableConfig<MockData> = {
    columns,
    fetchData: fetchMockData,
    pagination: { 
      mode: 'server', 
      initialState: { pageIndex: 0, pageSize: 10, totalRows: 100 } 
    },
    rowSelection: {
      enabled: true,
      bulkAction: { 
        label: 'Bulk Edit', 
        onClick: handleBulkEdit 
      },
    },
    styleConfig: { padding: 'standard', theme: 'light' },
    enableRawData: true,
    actions: [
      { 
        label: 'Edit', 
        icon: <FaEdit />, 
        onClick: handleEdit, 
        visible: (row) => row.age >= 18 // Example visibility condition
      },
      { 
        label: 'Delete', 
        icon: <FaTrash />, 
        onClick: handleDelete, 
        visible: () => true // Always visible
      },
      { 
        label: 'Save', 
        icon: <FaSave />, 
        onClick: handleSave, 
        visible: (row) => row.id % 2 === 0 // Example: visible for even IDs
      },
    ],
    exportFileName: 'users_report',
  };

  return (
    <div style={{ padding: '20px' }}>
      <DataTable config={tableConfig} />
    </div>
  );
};

export default Demo;

```

### `components\TableBody.tsx`

```tsx

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTable } from '../context/TableContext';
import { Action, TableData } from '../types';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface TableBodyProps<T extends TableData> {
  className?: string;
  onRowClick?: (row: T) => void; // From DataTable
  renderCell?: (cell: any) => React.ReactNode; // New: Custom cell rendering
  renderActions?: (row: T, actions: Action<T>[]) => React.ReactNode; // New: Custom actions rendering
  formatRawData?: (row: T) => Record<string, any>; // New: Custom raw data formatting
}

export const TableBody = <T extends TableData>({
  className = '',
  onRowClick,
  renderCell,
  renderActions,
  formatRawData,
}: TableBodyProps<T>) => {
  const { table } = useTable<T>();
  const { isLoading, config } = table.options.meta as { isLoading: boolean; config: any };
  const rowSelection = config.rowSelection;
  const actions = config.actions || [];
  const enableRawData = config.enableRawData || false;

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => document.querySelector('.table-container') as HTMLElement,
    estimateSize: () =>
      config.styleConfig?.padding === 'compact'
        ? 35
        : config.styleConfig?.padding === 'comfortable'
        ? 55
        : 45,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  const colSpan =
    table.getVisibleFlatColumns().length +
    (actions.length > 0 && Object.keys(table.getState().rowSelection).length === 1 ? 1 : 0) +
    (rowSelection?.enabled ? 1 : 0);

  const defaultFormatRawData = (data: T) => ({
    id: (data as any).id,
    name: (data as any).name,
    age: (data as any).age,
    email: (data as any).email,
  });

  const showActionColumn = Object.keys(table.getState().rowSelection).length === 1;

  return (
    <tbody className={className}>
      {isLoading ? (
        <tr>
          <td colSpan={colSpan} className="text-center py-4">
            <span>Loading...</span> {/* Spinner can be added via prop if needed */}
          </td>
        </tr>
      ) : table.getRowModel().rows.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="text-center py-4">
            No data available
          </td>
        </tr>
      ) : (
        <>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={colSpan} style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualItems.map((virtualRow: any) => {
            const row = table.getRowModel().rows[virtualRow.index];
            const isSingleSelected =
              row.getIsSelected() && Object.keys(table.getState().rowSelection).length === 1;

            return (
              <React.Fragment key={row.id}>
                <tr
                  className={`${row.getIsSelected() ? 'table-primary' : ''}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      if (config.enableRawData) row.toggleExpanded();
                      if (onRowClick) onRowClick(row.original);
                      if (rowSelection?.enabled) row.toggleSelected();
                    }
                  }}
                >
                  {rowSelection?.enabled && (
                    <td className="selection-cell" style={{ width: '50px', minWidth: '50px' }}>
                      <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {row.getVisibleCells().map((cell: any) => (
                    <td
                      key={cell.id}
                      className={`text-${cell.column.columnDef.meta?.align || 'center'}`}
                      style={{
                        width: `${cell.column.getSize()}px`,
                        maxWidth: '200px',
                        minWidth: '100px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                      }}
                    >
                      {renderCell ? renderCell(cell) : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {showActionColumn && actions.length > 0 && (
                    <td
                      className="actions-cell"
                      style={{ width: '180px', minWidth: '180px', textAlign: 'center' }}
                    >
                      {isSingleSelected &&
                        (renderActions ? (
                          renderActions(row.original, actions)
                        ) : (
                          <div className="d-flex gap-2 justify-content-center">
                            {actions.map((action: Action<T>, index: number) =>
                              (action.visible ? action.visible(row.original) : true) ? (
                                <button
                                  key={index}
                                  className={`btn btn-${
                                    action.label === 'Delete'
                                      ? 'outline-danger'
                                      : action.label === 'Save'
                                      ? 'outline-success'
                                      : 'outline-primary'
                                  } btn-sm p-2`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row.original);
                                  }}
                                  disabled={action.disabled ? action.disabled(row.original) : false}
                                >
                                  {action.icon || action.label}
                                </button>
                              ) : null
                            )}
                          </div>
                        ))}
                    </td>
                  )}
                </tr>
                {row.getIsExpanded() && enableRawData && (
                  <tr className="expanded-row">
                    <td colSpan={colSpan} className="p-3 bg-light">
                      <pre className="mb-0">
                        {JSON.stringify(
                          formatRawData ? formatRawData(row.original) : defaultFormatRawData(row.original),
                          null,
                          2
                        )}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td colSpan={colSpan} style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </>
      )}
    </tbody>
  );
};

```

### `components\TableFilters.tsx`

```tsx

import React from 'react';
import { useTable } from '../context/TableContext';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface TableFiltersProps {
  className?: string;
  renderFilter?: (column: any) => React.ReactNode; // New: Custom filter rendering
  filterTypes?: Record<string, 'text' | 'select' | ((column: any) => React.ReactNode)>; // New: Filter type customization
}

export const TableFilters = ({
  className = '',
  renderFilter,
  filterTypes = {},
}: TableFiltersProps) => {
  const { table } = useTable();

  const columns = table
    .getAllColumns()
    .filter((column: any) => column.getCanFilter() && column.getIsVisible());

  return (
    <div className={`column-filters mb-3 p-2 border rounded ${className}`}>
      <div className="row">
        {columns.map((column: any) => {
          const filterType = filterTypes[column.id] || 'text';
          const header = column.columnDef.header as string;

          if (renderFilter) {
            return (
              <div key={column.id} className="col-md-3 mb-2">
                {renderFilter(column)}
              </div>
            );
          }

          if (filterType === 'text' || typeof filterType === 'function') {
            return (
              <div key={column.id} className="col-md-3 mb-2">
                <div className="form-group">
                  <label className="small">{header}</label>
                  {typeof filterType === 'function' ? (
                    filterType(column)
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={`Filter ${header}...`}
                      value={(column.getFilterValue() as string) || ''}
                      onChange={(e) => {
                        column.setFilterValue(e.target.value);
                        table.setPageIndex(0);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          }

          if (filterType === 'select') {
            // Example select filter; assumes column provides options via meta
            const options = column.columnDef.meta?.filterOptions || [];
            return (
              <div key={column.id} className="col-md-3 mb-2">
                <div className="form-group">
                  <label className="small">{header}</label>
                  <select
                    className="form-control form-control-sm"
                    value={(column.getFilterValue() as string) || ''}
                    onChange={(e) => {
                      column.setFilterValue(e.target.value);
                      table.setPageIndex(0);
                    }}
                  >
                    <option value="">All</option>
                    {options.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

```

### `components\TableHeader.tsx`

```tsx

import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { useTable } from '../context/TableContext';
import { Action, TableData } from '../types';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface TableHeaderProps<T extends TableData> {
  className?: string;
  renderHeader?: (header: any) => React.ReactNode;
  sortIcons?: { asc?: React.ReactNode; desc?: React.ReactNode; unsorted?: React.ReactNode };
  rowSelection?: { enabled?: boolean; bulkAction?: { label: string; onClick: (selectedItems: T[]) => void } };
  actions?: Action<T>[];
  showActionColumn: boolean;
}

export const TableHeader = <T extends TableData>({
  className = '',
  renderHeader,
  sortIcons = { asc: <FaSortUp />, desc: <FaSortDown />, unsorted: <FaSort className="text-muted" /> },
  rowSelection,
  actions = [],
  showActionColumn,
}: TableHeaderProps<T>) => {
  const { table } = useTable<T>();
  const headerGroups = table.getHeaderGroups();

  if (!headerGroups || !Array.isArray(headerGroups) || headerGroups.length === 0) {
    console.error('TableHeader - No header groups available');
    return (
      <thead>
        <tr>
          <th>No headers available</th>
        </tr>
      </thead>
    );
  }

  return (
    <thead className={`sticky-top bg-white ${className}`} style={{ zIndex: 1000 }}>
      {headerGroups.map((headerGroup: any) => (
        <tr key={headerGroup.id}>
          {rowSelection?.enabled && (
            <th className="selection-cell" style={{ width: '50px', minWidth: '50px' }}>
              <input
                type="checkbox"
                checked={table.getIsAllRowsSelected()}
                onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
              />
            </th>
          )}
          {headerGroup.headers.map((header: any) => {
            const canSort = header.column.getCanSort();
            const isSorted = header.column.getIsSorted();
            const canResize = header.column.getCanResize();
            const meta = header.column.columnDef.meta || {};
            const align = meta.align || 'center';
            const headerWidth = Math.max((header.column.columnDef.header?.length || 10) * 10, 100);

            return (
              <th
                key={header.id}
                className={`${canSort ? 'sortable-header' : ''} ${canResize ? 'resizable-header' : ''} text-${align}`}
                style={{
                  width: `${headerWidth}px`,
                  maxWidth: '200px',
                  minWidth: '100px',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  position: 'relative',
                  cursor: canSort ? 'pointer' : 'default',
                }}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
              >
                <div className="header-content d-flex justify-content-center align-items-center">
                  {renderHeader ? (
                    renderHeader(header)
                  ) : (
                    <>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className="sort-icon ms-1">
                          {isSorted === 'asc' ? sortIcons.asc : isSorted === 'desc' ? sortIcons.desc : sortIcons.unsorted}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {canResize && (
                  <div
                    className="resizer"
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                  />
                )}
              </th>
            );
          })}
          {showActionColumn && actions.length > 0 && (
            <th style={{ width: '180px', minWidth: '180px', textAlign: 'center' }}>Actions</th>
          )}
        </tr>
      ))}
    </thead>
  );
};

```

### `components\TablePagination.tsx`

```tsx

import React from 'react';
import { Row, Col, Form, Pagination as BootstrapPagination } from 'react-bootstrap';
import { useTable } from '../context/TableContext';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface TablePaginationProps {
  className?: string;
  pageSizeOptions?: number[];
  renderPagination?: (table: any) => React.ReactNode;
}

export const TablePagination = ({
  className = '',
  pageSizeOptions = [10, 25, 50, 100],
  renderPagination,
}: TablePaginationProps) => {
  const { table } = useTable();
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const totalRows = table.options.rowCount ?? 0; // Default to 0 if undefined

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
          style={{ width: '80px' }}
          className="me-2"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
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

```

### `components\Toolbar.tsx`

```tsx

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
                <FaColumns /> Columns
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
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <FaFileExport /> Export
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
                <FaSync className={isLoading ? 'spin' : ''} /> Refresh
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

```

### `context\TableContext.tsx`

```tsx

// context/TableContext.ts
import React, { createContext, useContext, ReactNode } from 'react';
import { Table } from '@tanstack/react-table';
import { TableData } from '../types';

// Define the context type
interface TableContextValue<T extends TableData> {
  table: Table<T>;
}

// Create the context with undefined as the default value
export const TableContext = createContext<TableContextValue<any> | undefined>(undefined);

// Provider component with explicit props typing
interface TableProviderProps<T extends TableData> {
  table: Table<T>;
  children: ReactNode;
}

export function TableProvider<T extends TableData>({ table, children }: TableProviderProps<T>) {
  return <TableContext.Provider value={{ table }}>{children}</TableContext.Provider>;
}

// Hook to access the context
export function useTable<T extends TableData>(): TableContextValue<T> {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context as TableContextValue<T>;
}

```

### `index.ts`

```typescript

export { DataTable } from './components/DataTable';
export type { TableConfig, TableData, PaginationResponse, Action } from './types';
export { TableProvider } from './context/TableContext';

```

### `main.tsx`

```tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './components/Demo';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);


```

### `styles\DataTable.css`

```css

/* Root variables for theming */
:root {
  --dt-bg-light: #ffffff;
  --dt-bg-dark: #212529;
  --dt-text-light: #212529;
  --dt-text-dark: #ffffff;
  --dt-border: #dee2e6;
  --dt-hover: #f5f5f5;
  --dt-primary: #007bff;
  --dt-danger: #dc3545;
  --dt-success: #28a745;
}

/* Base container */
.data-table-container {
  font-family: Arial, sans-serif;
}

.theme-light {
  background-color: var(--dt-bg-light);
  color: var(--dt-text-light);
}

.theme-dark {
  background-color: var(--dt-bg-dark);
  color: var(--dt-text-dark);
}

/* Toolbar */
.toolbar {
  padding: 10px;
  background-color: var(--dt-bg-light);
  border-bottom: 1px solid var(--dt-border);
}

.theme-dark .toolbar {
  background-color: var(--dt-bg-dark);
}

.dropdown-menu {
  min-width: 150px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Filters */
.column-filters {
  background-color: var(--dt-bg-light);
}

.theme-dark .column-filters {
  background-color: var(--dt-bg-dark);
}

.column-filters .form-group {
  margin-bottom: 0.5rem;
}

.column-filters .form-control {
  width: 100%;
}

/* Table */
.table-container {
  position: relative;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border: 1px solid var(--dt-border);
  padding: 8px;
}

.sortable-header:hover {
  background-color: var(--dt-hover);
  cursor: pointer;
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 5px;
  background: var(--dt-border);
  cursor: col-resize;
}

.resizer:hover {
  background-color: #bbb;
}

.selection-cell {
  vertical-align: middle;
}

.actions-cell button {
  margin: 0 2px;
}

.expanded-row pre {
  font-size: 0.9em;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.theme-dark .expanded-row pre {
  background: #343a40;
}

/* Padding variations */
.table-compact th,
.table-compact td {
  padding: 4px;
}

.table-standard th,
.table-standard td {
  padding: 8px;
}

.table-comfortable th,
.table-comfortable td {
  padding: 12px;
}

/* Pagination */
.pagination {
  padding: 10px 0;
}

```

### `types\index.ts`

```typescript

import { SortingState } from '@tanstack/react-table';

export interface TableData {
  [key: string]: any;
}

export interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  visible?: (row: T) => boolean;
}

export interface FetchState {
  pageIndex: number;
  pageSize: number;
  sortBy: SortingState;
  filters: {
    globalFilter: string;
    columnFilters: Record<string, unknown>;
  };
}

export interface PaginationResponse<T> {
  data: T[];
  totalSize: number;
}

export interface TableConfig<T extends TableData> {
  columns: any[];
  fetchData?: (params: FetchState) => Promise<PaginationResponse<T>>;
  data?: T[];
  pagination?: {
    mode?: 'server' | 'client';
    initialState?: {
      pageIndex?: number;
      pageSize?: number;
      totalRows?: number;
    };
  };
  rowSelection?: {
    enabled?: boolean;
    bulkAction?: {
      label: string;
      onClick: (selectedItems: T[]) => void;
    };
  };
  actions?: Action<T>[];
  styleConfig?: {
    padding?: 'standard' | 'compact' | 'comfortable';
    theme?: 'light' | 'dark';
  };
  enableRawData?: boolean;
  exportFileName?: string; // New: Optional export file name
}

export interface TableMeta<T extends TableData> {
  config: TableConfig<T>;
  isLoading: boolean;
  fetchTableData: () => Promise<void>;
}

```

### `utils\debounce.ts`

```typescript

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

```

### `utils\exportUtils.ts`

```typescript

import { ColumnDef } from '@tanstack/react-table';
import * as XLSX from 'xlsx';

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
  visibleColumns: string[],
  fileName: string = 'exported_data.csv'
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
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = <T>(
  data: T[],
  columns: ColumnDef<T>[],
  visibleColumns: string[],
  fileName: string = 'exported_data.xlsx'
): void => {
  const worksheetData = [
    visibleColumns,
    ...data.map((row) => visibleColumns.map((col) => (row as any)[col] ?? '')),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, fileName);
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

```