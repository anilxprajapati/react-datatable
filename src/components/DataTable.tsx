// components/DataTable.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
} from '@tanstack/react-table';
import { TableConfig, TableData, PaginationResponse, Action, DataTableProps } from '../types';
import { Toolbar } from './Toolbar';
import { TableFilters } from './TableFilters';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TablePagination } from './TablePagination';
import { BulkEditModal } from './BulkEditModal';
import { TableProvider } from '../context/TableContext';
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
  onSave,
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
    bulkEditConfig,
    onBulkEditComplete,
  } = config;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<T[]>(initialData);
  const [totalRows, setTotalRows] = useState<number>(pagination.initialState?.totalRows ?? initialData.length);
  const [isFetching, setIsFetching] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination.initialState?.pageIndex ?? 0,
    pageSize: pagination.initialState?.pageSize ?? 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelectionState, setRowSelectionState] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedRowsForModal, setSelectedRowsForModal] = useState<T[]>([]);
  const [editableRowId, setEditableRowId] = useState<string | null>(null); // Added state

  const isServerSide = pagination.mode === 'server';
  const isLoading = isFetching || isRendering;

  const fetchTableData = async () => {
    if (!fetchData || !isServerSide) return;
    setIsFetching(true);
    setIsRendering(true);
    setData([]);
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
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isServerSide) {
      const debouncedFetch = setTimeout(() => fetchTableData(), 300);
      return () => clearTimeout(debouncedFetch);
    }
  }, [paginationState.pageIndex, paginationState.pageSize, sorting, globalFilter, JSON.stringify(columnFilters)]);

  const handleSaveRow = (updatedRow: T) => {
    if (!isServerSide) {
      setData((prev) =>
        prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
      );
    }
    if (onSave) onSave(updatedRow);
  };

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
    },
    onPaginationChange: setPaginationState,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelectionState,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
    meta: { 
      config, 
      isLoading, 
      fetchTableData, 
      handleSaveRow,
      setEditableRowId, // Pass setter to TableBody
    },
  });

  const showActionColumn = actions.length > 0;

  const handleBulkEditClick = (rows: T[]) => {
    setSelectedRowsForModal(rows);
    setShowBulkEditModal(true);
  };

  const handleBulkEditSubmit = (updatedRows: T[]) => {
    if (isServerSide) {
      fetchTableData();
    } else {
      setData((prev) =>
        prev.map((row) =>
          updatedRows.some((u) => u.id === row.id) ? updatedRows.find((u) => u.id === row.id)! : row
        )
      );
    }
    if (onBulkEditComplete) onBulkEditComplete(updatedRows);
  };

  const handleRenderingComplete = () => {
    if (!isFetching) setIsRendering(false);
  };

  const effectiveBulkEditConfig = bulkEditConfig || columns.map((col) => ({
    accessorKey: col.accessorKey,
    header: col.header,
    isEditable: col.enableColumnFilter !== false,
    fieldType: 'text',
  }));

  if (!table.getHeaderGroups().length && isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`data-table-container theme-${styleConfig.theme} ${className}`} style={style}>
      <TableProvider table={table} editableRowId={editableRowId}>
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
            rowSelection={rowSelection}
            exportFileName={exportFileName}
          />
        )}
        {showFilters && <TableFilters className="" renderFilter={renderFilter} filterTypes={filterTypes} />}
        <div
          ref={tableContainerRef}
          className="table-container"
          style={{ height: '485px', overflowY: 'auto', overflowX: 'auto', position: 'relative' }}
        >
          <table
            className={`data-table table table-striped table-hover table-${styleConfig.padding}`}
            style={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}
          >
            <TableHeader
              className=""
              renderHeader={renderHeader}
              sortIcons={sortIcons || { asc: <span>↑</span>, desc: <span>↓</span>, unsorted: <span>↕</span> }}
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
              onRenderComplete={handleRenderingComplete}
            />
          </table>
        </div>
        <TablePagination className="" pageSizeOptions={pageSizeOptions} renderPagination={renderPagination} />
        {rowSelection?.bulkAction && (
          <BulkEditModal
            show={showBulkEditModal}
            onHide={() => setShowBulkEditModal(false)}
            bulkEditConfig={effectiveBulkEditConfig}
            selectedRows={selectedRowsForModal}
            onBulkEditSubmit={handleBulkEditSubmit}
            onBulkEditComplete={onBulkEditComplete}
            renderBulkEditForm={renderBulkEditForm}
          />
        )}
      </TableProvider>
    </div>
  );
};

export default DataTable;