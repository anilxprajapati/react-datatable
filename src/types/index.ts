// types/index.ts
import { SortingState } from '@tanstack/react-table';

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
  exportFileName?: string;
  bulkEditConfig?: BulkEditFieldConfig[];
  onBulkEditComplete?: (updatedRows: T[]) => void;
  defaultFieldType?: 'text' | 'textarea' | 'select';
}

export interface TableMeta<T extends TableData> {
  config: TableConfig<T>;
  isLoading: boolean;
  fetchTableData: () => Promise<void>;
  handleSaveRow?: (updatedRow: T) => void;
  setEditableRowId?: (id: string | null) => void;
}

export interface DataTableProps<T extends TableData> {
  config: TableConfig<T>;
  className?: string;
  style?: React.CSSProperties;
  onRowClick?: (row: T) => void;
  renderToolbar?: (table: any) => React.ReactNode;
  renderFilter?: (column: any) => React.ReactNode;
  filterTypes?: Record<string, 'text' | 'select' | ((column: any) => React.ReactNode)>;
  renderHeader?: (header: any) => React.ReactNode;
  sortIcons?: { asc?: React.ReactNode; desc?: React.ReactNode; unsorted?: React.ReactNode };
  renderCell?: (cell: any) => React.ReactNode;
  renderActions?: (row: T, actions: Action<T>[]) => React.ReactNode;
  formatRawData?: (row: T) => Record<string, any>;
  pageSizeOptions?: number[];
  renderPagination?: (table: any) => React.ReactNode;
  renderBulkEditForm?: (selectedRows: T[], onSubmit: (values: Record<string, any>) => void) => React.ReactNode;
  onSave?: (updatedRow: T) => void;
}

export interface TablePaginationProps {
  className?: string;
  renderPagination?: (table: any) => React.ReactNode;
  pageSizeOptions?: number[];
}

export interface DependentFieldConfig {
  accessorKey: string;
  header: string;
  fieldType: 'text' | 'textarea' | 'select';
  isRequired?: boolean;
  isEditable?: boolean;
  options?: { value: string; label: string }[];
}

export interface BulkEditFieldConfig {
  accessorKey: string;
  header: string;
  isEditable?: boolean; // Added to control editability
  isRequired?: boolean;
  fieldType?: 'text' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  dependencies?: Record<string, DependentFieldConfig[]>;
}

export interface BulkEditModalProps<T extends TableData> {
  show: boolean;
  onHide: () => void;
  bulkEditConfig: BulkEditFieldConfig[];
  selectedRows: T[];
  onBulkEditSubmit: (selectedItems: T[]) => void;
  onBulkEditComplete?: (updatedRows: T[]) => void;
  renderBulkEditForm?: (selectedRows: T[], onSubmit: (values: Record<string, any>) => void) => React.ReactNode;
}

export interface TableBodyProps<T extends TableData> {
  className?: string;
  onRowClick?: (row: T) => void;
  renderCell?: (cell: any) => React.ReactNode;
  renderActions?: (row: T, actions: Action<T>[]) => React.ReactNode;
  formatRawData?: (row: T) => Record<string, any>;
  onRenderComplete?: () => void;
}

export interface TableFiltersProps {
  className?: string;
  renderFilter?: (column: any) => React.ReactNode;
  filterTypes?: Record<string, 'text' | 'select' | ((column: any) => React.ReactNode)>;
}

export interface TableHeaderProps<T extends TableData> {
  className?: string;
  renderHeader?: (header: any) => React.ReactNode;
  sortIcons?: { asc?: React.ReactNode; desc?: React.ReactNode; unsorted?: React.ReactNode };
  rowSelection?: { enabled?: boolean; bulkAction?: { label: string; onClick: (selectedItems: T[]) => void } };
  actions?: Action<T>[];
  showActionColumn: boolean;
}

export interface ToolbarProps<T extends TableData> {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  isLoading: boolean;
  fetchTableData?: () => void;
  className?: string;
  onBulkEditClick: (selectedItems: T[]) => void;
  customButtons?: React.ReactNode[];
  exportOptions?: { csv?: boolean; excel?: boolean; clipboard?: boolean };
  renderColumnToggle?: (columns: any[]) => React.ReactNode;
  rowSelection?: {
    enabled?: boolean;
    bulkAction?: { label: string; onClick: (selectedItems: T[]) => void };
  };
  exportFileName?: string;
}