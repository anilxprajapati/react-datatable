import React, { useState } from 'react';
import { TableData } from '../types';
import '../styles/DataTable.css';

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