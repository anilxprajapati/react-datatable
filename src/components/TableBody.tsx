// components/TableBody.tsx
import React, { useEffect, useState } from 'react';
import { flexRender, Row } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTable } from '../context/TableContext';
import { Action, TableBodyProps, TableData, BulkEditFieldConfig } from '../types';
import { Spinner, Form } from 'react-bootstrap';
import Select from 'react-select';

export const TableBody = <T extends TableData>({
  className = '',
  onRowClick,
  renderCell,
  renderActions,
  formatRawData,
  onRenderComplete,
}: TableBodyProps<T> & { onRenderComplete?: () => void }) => {
  const { table } = useTable<T>();
  const { isLoading, config, setEditableRowId } = table.options.meta as { 
    isLoading: boolean; 
    config: any; 
    setEditableRowId?: (id: string | null) => void 
  };
  const rowSelection = config.rowSelection;
  const actions = config.actions || [];
  const enableRawData = config.enableRawData || false;
  const bulkEditConfig: BulkEditFieldConfig[] = config.bulkEditConfig || [];
  const defaultFieldType = config.defaultFieldType;

  const [editableRowId, setLocalEditableRowId] = useState<string | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => document.querySelector('.table-container') as HTMLElement,
    estimateSize: () => (config.styleConfig?.padding === 'compact' ? 35 : config.styleConfig?.padding === 'comfortable' ? 55 : 45),
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  const colSpan = table.getVisibleFlatColumns().length + (actions.length > 0 ? 1 : 0) + (rowSelection?.enabled ? 1 : 0);

  const defaultFormatRawData = (data: T) => data;

  const getCurrentRowData = (row: Row<T>) => ({ ...row.original, ...cellValues });

  const shouldShowField = (field: BulkEditFieldConfig, currentRowData: T) => {
    const parentField = bulkEditConfig.find((f) =>
      f.dependencies && Object.values(f.dependencies).flat().some((d) => d.accessorKey === field.accessorKey)
    );
    
    if (!parentField) {
      return bulkEditConfig.some((f) => f.accessorKey === field.accessorKey && (f.isEditable !== false));
    }

    const parentValue = currentRowData[parentField.accessorKey];
    return parentField.dependencies?.[parentValue]?.some((d) => d.accessorKey === field.accessorKey) ?? false;
  };

  const getDependentFields = (accessorKey: string, currentRowData: T) => {
    const parentField = bulkEditConfig.find((f) => f.accessorKey === accessorKey);
    if (!parentField?.dependencies) return [];
    const parentValue = currentRowData[accessorKey];
    return parentField.dependencies[parentValue]?.map((dep) => dep.accessorKey) || [];
  };

  const findFieldConfig = (accessorKey: string, rowData: T): BulkEditFieldConfig => {
    const currentRowData = getCurrentRowData({ original: rowData } as Row<T>);
    const directConfig = bulkEditConfig.find((f) => f.accessorKey === accessorKey);

    for (const field of bulkEditConfig) {
      if (field.dependencies) {
        const parentValue = currentRowData[field.accessorKey];
        const depConfig = field.dependencies[parentValue]?.find((dep) => dep.accessorKey === accessorKey);
        if (depConfig) return depConfig;
      }
    }

    if (directConfig) return directConfig;

    return { accessorKey, header: accessorKey };
  };

  const renderField = (
    rowId: string,
    field: BulkEditFieldConfig,
    value: any,
    isEditable: boolean,
    rowData: T
  ) => {
    const currentRowData = getCurrentRowData({ original: rowData } as Row<T>);
    if (!shouldShowField(field, currentRowData)) return null;

    const key = `${rowId}-${field.accessorKey}`;
    const error = validationErrors[field.accessorKey];
    const currentValue = cellValues[field.accessorKey] !== undefined ? cellValues[field.accessorKey] : value;
    const effectiveFieldType = field.fieldType || defaultFieldType;
    const canEditField = isEditable && (field.isEditable !== false);

    if (!effectiveFieldType || !canEditField) {
      return renderCell ? renderCell({ getValue: () => currentValue, column: { id: field.accessorKey } }) : currentValue;
    }

    switch (effectiveFieldType) {
      case 'select':
        const options = field.options?.map((opt) => ({ value: opt.value, label: opt.label })) || [];
        const selectedOption = options.find((opt) => opt.value === currentValue) || null;
        return (
          <div>
            <Select
              options={options}
              value={selectedOption}
              isDisabled={!isEditable}
              onChange={(option) => {
                const newValue = option ? option.value : '';
                setCellValues((prev) => ({ ...prev, [field.accessorKey]: newValue }));
                setValidationErrors({});
              }}
              placeholder={`Select ${field.header}`}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <Form.Control
              as="textarea"
              value={currentValue ?? ''}
              rows={2}
              disabled={!isEditable}
              onChange={(e) => {
                const newValue = e.target.value;
                setCellValues((prev) => ({ ...prev, [field.accessorKey]: newValue }));
                setValidationErrors({});
              }}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );
      case 'text':
        return (
          <div>
            <Form.Control
              type="text"
              value={currentValue ?? ''}
              disabled={!isEditable}
              onChange={(e) => {
                const newValue = e.target.value;
                setCellValues((prev) => ({ ...prev, [field.accessorKey]: newValue }));
                setValidationErrors({});
              }}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );
      default:
        return renderCell ? renderCell({ getValue: () => currentValue, column: { id: field.accessorKey } }) : currentValue;
    }
  };

  const validateRow = (rowData: T): Record<string, string> => {
    const errors: Record<string, string> = {};
    bulkEditConfig.forEach((field) => {
      const value = rowData[field.accessorKey];
      if (field.isRequired && (value === '' || value === undefined || value === null) && shouldShowField(field, rowData)) {
        errors[field.accessorKey] = `${field.header} is required`;
      }
      if (field.dependencies) {
        Object.entries(field.dependencies).forEach(([triggerValue, dependents]) => {
          if (value === triggerValue) {
            dependents.forEach((dep) => {
              const depValue = rowData[dep.accessorKey];
              if (dep.isRequired && (depValue === '' || depValue === undefined || depValue === null)) {
                errors[dep.accessorKey] = `${dep.header} is required when ${field.header} is ${triggerValue}`;
              }
            });
          }
        });
      }
    });
    return errors;
  };

  const handleEditClick = (row: Row<T>) => {
    if (editableRowId && editableRowId !== row.id) {
      alert('Please save the current row before editing another one.');
      return;
    }
    setLocalEditableRowId(row.id);
    if (setEditableRowId) setEditableRowId(row.id);
    setCellValues(row.original);
    setValidationErrors({});
    const editAction = actions.find((a: Action<T>) => a.label === 'Edit');
    if (editAction) editAction.onClick(row.original);
    if (rowSelection?.enabled) table.setRowSelection((prev) => ({ ...prev, [row.id]: true }));
  };

  const handleSaveClick = (row: Row<T>) => {
    const updatedRow = { ...row.original, ...cellValues };
    const errors = validateRow(updatedRow);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const saveAction = actions.find((a: Action<T>) => a.label === 'Save');
    if (saveAction) saveAction.onClick(updatedRow);
    const { handleSaveRow, fetchTableData } = table.options.meta as { 
      handleSaveRow?: (row: T) => void; 
      fetchTableData?: () => Promise<void> 
    };
    if (handleSaveRow) handleSaveRow(updatedRow);
    setLocalEditableRowId(null);
    if (setEditableRowId) setEditableRowId(null);
    setCellValues({});
    setValidationErrors({});
    // Explicitly update row selection state to deselect this row
    if (rowSelection?.enabled) {
      table.setRowSelection((prev) => {
        const newSelection = { ...prev };
        delete newSelection[row.id]; // Remove the row ID entirely from the selection object
        return newSelection;
      });
    }
    if (fetchTableData) fetchTableData();
  };

  const handleActionClick = (action: Action<T>, row: Row<T>) => {
    action.onClick(row.original);
    const { fetchTableData } = table.options.meta as { fetchTableData?: () => Promise<void> };
    if (action.label === 'Delete' && fetchTableData) {
      fetchTableData(); // Refresh table after delete
    }
    if (rowSelection?.enabled) {
      // Deselect row on delete, keep selected on other actions
      table.setRowSelection((prev) => ({
        ...prev,
        [row.id]: action.label === 'Delete' ? false : prev[row.id] || false,
      }));
    }
  };

  useEffect(() => {
    if (virtualItems.length > 0 && onRenderComplete) onRenderComplete();
  }, [virtualItems.length, onRenderComplete]);

  return (
    <tbody className={className}>
      {isLoading || virtualItems.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="position-relative" style={{ height: '200px' }}>
            <div className="loading-overlay">
              <Spinner animation="border" variant="primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          </td>
        </tr>
      ) : table.getRowModel().rows.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className="text-center py-4">No data available</td>
        </tr>
      ) : (
        <>
          {paddingTop > 0 && (
            <tr>
              <td colSpan={colSpan} style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualItems.map((virtualRow: any) => {
            const row: Row<T> = table.getRowModel().rows[virtualRow.index];
            const isEditable = editableRowId === row.id;

            return (
              <React.Fragment key={row.id}>
                <tr
                  className={`${row.getIsSelected() ? 'table-primary' : ''} ${isEditable ? 'editable-row' : ''}`}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).tagName !== 'INPUT' &&
                      (e.target as HTMLElement).tagName !== 'SELECT' &&
                      (e.target as HTMLElement).tagName !== 'TEXTAREA' &&
                      (e.target as HTMLElement).tagName !== 'BUTTON'
                    ) {
                      if (config.enableRawData) row.toggleExpanded();
                      if (onRowClick) onRowClick(row.original);
                      if (rowSelection?.enabled && !isEditable) row.toggleSelected();
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
                  {row.getVisibleCells().map((cell: any) => {
                    const fieldConfig = findFieldConfig(cell.column.id, row.original);
                    const cellValue = cell.getValue();

                    return (
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
                        {isEditable ? (
                          renderField(row.id, fieldConfig, cellValue, isEditable, row.original)
                        ) : renderCell ? (
                          renderCell(cell)
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    );
                  })}
                  {actions.length > 0 && (
                    <td className="actions-cell" style={{ width: '180px', minWidth: '180px', textAlign: 'center' }}>
                      <div className="d-flex gap-2 justify-content-center">
                        {isEditable ? (
                          <>
                            <button
                              className="btn btn-outline-success btn-sm px-2 py-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveClick(row);
                              }}
                            >
                              {actions.find((a) => a.label === 'Save')?.icon || 'Save'}
                            </button>
                            {actions.map((action: Action<T>, index: number) =>
                              (action.visible ? action.visible(row.original) : true) &&
                              action.label !== 'Save' &&
                              action.label !== 'Edit' ? (
                                <button
                                  key={index}
                                  className={`btn btn-${
                                    action.label === 'Delete' ? 'outline-danger' : 'outline-primary'
                                  } btn-sm px-2 py-1`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActionClick(action, row);
                                  }}
                                  disabled={action.disabled ? action.disabled(row.original) : false}
                                >
                                  {action.icon || action.label}
                                </button>
                              ) : null
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-outline-primary btn-sm px-2 py-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(row);
                              }}
                            >
                              {actions.find((a) => a.label === 'Edit')?.icon || 'Edit'}
                            </button>
                            {actions.map((action: Action<T>, index: number) =>
                              (action.visible ? action.visible(row.original) : true) &&
                              action.label !== 'Edit' &&
                              action.label !== 'Save' ? (
                                <button
                                  key={index}
                                  className={`btn btn-${
                                    action.label === 'Delete' ? 'outline-danger' : 'outline-primary'
                                  } btn-sm px-2 py-1`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActionClick(action, row);
                                  }}
                                  disabled={action.disabled ? action.disabled(row.original) : false}
                                >
                                  {action.icon || action.label}
                                </button>
                              ) : null
                            )}
                          </>
                        )}
                      </div>
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