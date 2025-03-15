// context/TableContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { Table } from '@tanstack/react-table';
import { TableData } from '../types';

interface TableContextValue<T extends TableData> {
  table: Table<T>;
  editableRowId: string | null;
}

export const TableContext = createContext<TableContextValue<any> | undefined>(undefined);

interface TableProviderProps<T extends TableData> {
  table: Table<T>;
  editableRowId: string | null;
  children: ReactNode;
}

export function TableProvider<T extends TableData>({ table, editableRowId, children }: TableProviderProps<T>) {
  return (
    <TableContext.Provider value={{ table, editableRowId }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable<T extends TableData>(): TableContextValue<T> {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context as TableContextValue<T>;
}