import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
  GroupingState,
} from '@tanstack/react-table';
import { TableConfig, TableData, PaginationResponse, Action, DataTableProps } from '../types';
import { Toolbar } from './Toolbar';
import { TableFilters } from './TableFilters';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TablePagination } from './TablePagination';
import { BulkEditModal } from './BulkEditModal';
import { TableProvider } from '../context/TableContext';
import { getFilteredRowModel } from '@tanstack/react-table';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    exportFileName = 'exported_data', // Default file name if not provided
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

  const fetchTableData = async () => {
    if (!fetchData || !isServerSide) return;
    setIsLoading(true);
    try {
      const params = {
        pageIndex: paginationState.pageIndex,
        pageSize: paginationState.pageSize,
        sortBy: sorting,
        filters: {
          globalFilter,
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
    columns: useMemo(() => columns, [columns]),
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
            exportFileName={exportFileName} // Pass exportFileName to Toolbar
          />
        )}
        {showFilters && (
          <TableFilters
            className=""
            renderFilter={renderFilter}
            filterTypes={filterTypes}
          />
        )}
        <div ref={tableContainerRef} className="table-container" style={{ height: '485px', overflowY: 'auto', overflowX: 'auto' }}>
        <table 
            className={`data-table table table-striped table-hover table-${styleConfig.padding}`}
            style={{ 
              tableLayout: 'auto', // Allow columns to size naturally within constraints
              width: 'max-content', // Prevent shrinking, allow scrolling
              minWidth: '100%', // Ensure it fills container when fewer columns
            }}
          >
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