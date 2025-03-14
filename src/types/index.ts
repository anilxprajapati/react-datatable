// types/index.ts
import { SortingState } from "@tanstack/react-table";

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
}

export interface TableMeta<T extends TableData> {
  config: TableConfig<T>;
  isLoading: boolean;
  fetchTableData: () => Promise<void>;
}