import React from 'react';
import { useTable } from '../context/TableContext';
import '../styles/DataTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { TableFiltersProps } from 'types';

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