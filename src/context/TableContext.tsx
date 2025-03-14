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