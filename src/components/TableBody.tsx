import React, { useEffect } from 'react';
import { flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTable } from '../context/TableContext';
import { Action, TableBodyProps, TableData } from '../types';
import { Spinner } from 'react-bootstrap';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export const TableBody = <T extends TableData>({
  className = '',
  onRowClick,
  renderCell,
  renderActions,
  formatRawData,
  onRenderComplete,
}: TableBodyProps<T> & { onRenderComplete?: () => void }) => {
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

  const defaultFormatRawData = (data: T) => data;
  const showActionColumn = Object.keys(table.getState().rowSelection).length === 1;

  useEffect(() => {
    if (virtualItems.length > 0 && onRenderComplete) {
      onRenderComplete(); // Notify when virtual items are fully rendered
    }
  }, [virtualItems.length, onRenderComplete]);

  return (
    <tbody className={className}>
      {isLoading || virtualItems.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="position-relative" style={{ height: '200px' }}>
            <div
              className="loading-overlay"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Spinner animation="border" variant="primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
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
                        minWidth: `${cell.column.columnDef.minSize}px`,
                        maxWidth: `${cell.column.columnDef.maxSize}px`,
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
                                  } btn-sm px-2 py-1`}
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