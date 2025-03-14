# @aneelap/react-datatable

A customizable, TypeScript-based React DataTable component built with `@tanstack/react-table` and `@tanstack/react-virtual`. It supports features like server-side and client-side pagination, row selection, bulk actions, filtering, sorting, exporting, and virtualization for large datasets.

## Features
- **Modular Components**: Includes `DataTable`, `TableHeader`, `TableBody`, `TableFilters`, `TablePagination`, `Toolbar`, and `BulkEditModal`.
- **Pagination**: Supports both client-side and server-side modes.
- **Row Selection**: Enable single or multi-row selection with bulk actions.
- **Filtering**: Global and column-level filters with customizable filter types.
- **Sorting**: Sortable columns with custom icons.
- **Exporting**: Export to CSV, Excel, or clipboard (Excel requires `xlsx` as a peer dependency).
- **Virtualization**: Efficient rendering of large datasets using `@tanstack/react-virtual`.
- **Theming**: Light and dark themes with customizable padding options.
- **TypeScript Support**: Fully typed with generics for type safety.

## Installation

Install the library and its peer dependencies:

```bash
npm install @myorg/react-datatable react react-dom @tanstack/react-table react-bootstrap xlsx
```

### Peer Dependencies
- `react` (>= 18.0.0)
- `react-dom` (>= 18.0.0)
- `@tanstack/react-table` (>= 8.21.2)
- `react-bootstrap` (>= 2.0.0)
- `xlsx` (>= 0.18.5, optional for Excel export)

### Additional Dependencies
The library includes some runtime dependencies that will be installed automatically:
- `@tanstack/react-virtual`
- `bootstrap`
- `react-icons`

## Usage

### Basic Example (Client-Side Pagination)

```jsx
import React from 'react';
import { DataTable } from '@myorg/react-datatable';
import 'bootstrap/dist/css/bootstrap.min.css'; // Required for styling

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: { enableSorting: true, width: 100, align: 'center' },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { enableSorting: true },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    meta: { enableSorting: true },
  },
];

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

const App = () => {
  return (
    <div>
      <DataTable
        config={{
          columns,
          data,
          pagination: {
            mode: 'client',
            initialState: { pageIndex: 0, pageSize: 10 },
          },
          styleConfig: { theme: 'light', padding: 'standard' }
        }}
      />
    </div>
  );
};

export default App;
```

### Server-Side Pagination Example with Sorting and Filtering

```jsx
import React, { useState } from 'react';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import DataTable from '@myorg/react-datatable';
import { PaginationResponse, TableConfig } from '@myorg/react-datatable/types';
import 'bootstrap/dist/css/bootstrap.min.css';

interface MockData {
  id: number;
  name: string;
  age: number;
  email: string;
}

const Demo = () => {
  const [tableData, setTableData] = useState<MockData[]>([]);

  const fetchMockData = async ({ pageIndex, pageSize, sortBy, filters }: any): Promise<PaginationResponse<MockData>> => {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate full dataset
    const fullData = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: Math.floor(Math.random() * 50) + 18,
      email: `user${i + 1}@example.com`,
    }));
  
    // Apply global filter
    let filteredData = fullData;
    if (filters.globalFilter) {
      const filterValue = filters.globalFilter.toLowerCase();
      filteredData = fullData.filter(item =>
        String(item.id).includes(filterValue) ||
        item.name.toLowerCase().includes(filterValue) ||
        String(item.age).includes(filterValue) ||
        item.email.toLowerCase().includes(filterValue)
      );
    }
  
    // Apply sorting
    if (sortBy && sortBy.length > 0) {
      const { id, desc } = sortBy[0]; // Assuming single-column sorting for simplicity
      filteredData.sort((a, b) => {
        const aValue = a[id as keyof MockData];
        const bValue = b[id as keyof MockData];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return desc ? bValue - aValue : aValue - bValue;
        }
        return 0;
      });
    }
  
    // Apply pagination
    const start = pageIndex * pageSize;
    const paginatedData = filteredData.slice(start, start + pageSize);
  
    return {
      data: paginatedData,
      totalSize: filteredData.length, // Update totalSize based on filtered data
    };
  };

  const handleEdit = (row: MockData) => {
    console.log('Edit:', row);
    // Add your edit logic here
  };

  const handleDelete = (row: MockData) => {
    console.log('Delete:', row);
    setTableData(prev => prev.filter(item => item.id !== row.id));
  };

  const handleSave = (row: MockData) => {
    console.log('Save:', row);
    // Add your save logic here
  };

  const handleBulkEdit = (selectedRows: MockData[]) => {
    console.log('Bulk Edit:', selectedRows);
    // Add your bulk edit logic here
  };

  const columns = [
    { accessorKey: 'id', header: 'ID', meta: { enableSorting: true, width: 100, align: 'center' } },
    { accessorKey: 'name', header: 'Name', meta: { enableSorting: true } },
    { accessorKey: 'age', header: 'Age', meta: { enableSorting: true } },
    { accessorKey: 'email', header: 'Email', meta: { enableSorting: true } },
  ];

  const tableConfig: TableConfig<MockData> = {
    columns,
    fetchData: fetchMockData,
    pagination: { 
      mode: 'server', 
      initialState: { pageIndex: 0, pageSize: 10, totalRows: 100 } 
    },
    rowSelection: {
      enabled: true,
      bulkAction: { 
        label: 'Bulk Edit', 
        onClick: handleBulkEdit 
      },
    },
    styleConfig: { padding: 'standard', theme: 'light' },
    enableRawData: true,
    actions: [
      { 
        label: 'Edit', 
        icon: <FaEdit />, 
        onClick: handleEdit, 
        visible: (row) => row.age >= 18 // Example visibility condition
      },
      { 
        label: 'Delete', 
        icon: <FaTrash />, 
        onClick: handleDelete, 
        visible: () => true // Always visible
      },
      { 
        label: 'Save', 
        icon: <FaSave />, 
        onClick: handleSave, 
        visible: (row) => row.id % 2 === 0 // Example: visible for even IDs
      },
    ],
    exportFileName: 'users_report',
  };

  return (
    <div style={{ padding: '20px' }}>
      <DataTable config={tableConfig} />
    </div>
  );
};

export default Demo;
```

## Configuration Options

The `DataTable` component accepts a `TableConfig` object with the following properties:

| Property            | Type                                      | Description                                                                 |
|---------------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `columns`           | `ColumnDef<T>[]`                         | Array of column definitions with meta properties for sorting, width, align. |
| `data`              | `T[]`                                    | Data array for client-side pagination.                                      |
| `fetchData`         | `(params: FetchState) => Promise<PaginationResponse<T>>` | Function for server-side data fetching with sorting and filtering.                     |
| `pagination`        | `{ mode?: 'server' \| 'client'; initialState?: { pageIndex?: number; pageSize?: number; totalRows?: number } }` | Pagination configuration.                  |
| `rowSelection`      | `{ enabled?: boolean; bulkAction?: { label: string; onClick: (selectedItems: T[]) => void } }` | Row selection and bulk action settings.    |
| `actions`           | `Action<T>[]`                            | Array of row-level actions with icons and conditional visibility.           |
| `styleConfig`       | `{ padding?: 'standard' \| 'compact' \| 'comfortable'; theme?: 'light' \| 'dark' }` | Styling options.                          |
| `enableRawData`     | `boolean`                                | Enable expandable rows to show raw data in JSON format.                     |
| `exportFileName`    | `string`                                 | Custom filename for exported data.                                          |

### Column Definition
Columns use extended `ColumnDef` type with additional meta properties:
```jsx
const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { 
      enableSorting: true,
      width: 200,
      align: 'left',
      filterOptions: ['Option1', 'Option2'] 
    }
  },
];
```

### Row Actions
Define actions with icons and conditional visibility:
```jsx
const actions = [
  { 
    label: 'Edit', 
    icon: <FaEdit />, 
    onClick: handleEdit, 
    visible: (row) => row.age >= 18 // Conditional visibility
  },
  { 
    label: 'Delete', 
    icon: <FaTrash />, 
    onClick: handleDelete, 
    visible: () => true // Always visible
  }
];
```

### Server-Side Data Fetching
The `fetchData` function receives pagination, sorting, and filtering parameters:
```jsx
const fetchData = async ({ 
  pageIndex,    // Current page index (0-based)
  pageSize,     // Number of items per page
  sortBy,       // Array of { id, desc } sorting objects
  filters       // Object containing filter values
}) => {
  // Fetch and process data...
  
  return {
    data: processedData,       // Array of items for current page
    totalSize: totalItemCount  // Total number of items after filtering
  };
};
```

### Custom Rendering
You can customize rendering for headers, cells, filters, and pagination:
```jsx
<DataTable
  config={{
    columns,
    data,
    renderHeader: (header) => <strong>{header.column.columnDef.header}</strong>,
    renderCell: (cell) => <span>{cell.getValue()}</span>,
    renderFilter: (column) => (
      <input
        type="text"
        value={column.getFilterValue() || ''}
        onChange={(e) => column.setFilterValue(e.target.value)}
      />
    ),
    renderPagination: (table) => (
      <div>
        <button onClick={() => table.previousPage()}>Prev</button>
        <span>Page {table.getState().pagination.pageIndex + 1}</span>
        <button onClick={() => table.nextPage()}>Next</button>
      </div>
    )
  }}
/>
```

## Styling
- The library uses Bootstrap classes for layout and buttons. Include Bootstrap CSS in your project.
- Custom styles are defined in `DataTable.css`. Override them by targeting `.data-table-container`, `.theme-light`, `.theme-dark`, etc.
- Use `styleConfig` to switch between `light`/`dark` themes and `standard`/`compact`/`comfortable` padding.

## Exporting
- **CSV**: Enabled by default.
- **Excel**: Requires `xlsx` to be installed.
- **Clipboard**: Copies data as tab-separated values.

Customize export options:
```jsx
<DataTable
  config={{
    columns,
    data,
    exportOptions: { csv: true, excel: false, clipboard: true },
    exportFileName: 'custom_export_name'  // Default filename for exports
  }}
/>
```

## Development

### Build the Library
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## License
MIT

## Contributing
Feel free to submit issues or pull requests to the [GitHub repository](https://github.com/AneelAP/react-datatable).
