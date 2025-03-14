// components/TableHeader.tsx
import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { useTable } from '../context/TableContext';
import { Action, TableData } from '../types';
import '../styles/DataTable.css';

interface TableHeaderProps<T extends TableData> {
  className?: string;
  renderHeader?: (header: any) => React.ReactNode;
  sortIcons?: {
    asc?: React.ReactNode;
    desc?: React.ReactNode;
    unsorted?: React.ReactNode;
  };
  rowSelection?: { enabled?: boolean; bulkAction?: { label: string; onClick: (selectedItems: T[]) => void } }; // Add rowSelection
  actions?: Action<T>[]; // Add actions
  showActionColumn: boolean; // Add showActionColumn
}

export const TableHeader = <T extends TableData>({
  className = '',
  renderHeader,
  sortIcons = {
    asc: '↑',
    desc: '↓',
    unsorted: '↕',
  },
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
            const align = meta.align || 'left';
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
                          {isSorted === 'asc'
                            ? sortIcons.asc
                            : isSorted === 'desc'
                            ? sortIcons.desc
                            : sortIcons.unsorted}
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
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      height: '100%',
                      width: '5px',
                      cursor: 'col-resize',
                      background: '#ddd',
                    }}
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