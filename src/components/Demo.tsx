import React, { useState } from 'react';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import DataTable from './DataTable';
import { PaginationResponse, TableConfig } from 'types';

interface MockData {
  id: number;
  name: string;
  age: number;
  email: string;
  emailee: string;
  emaile: string;
  email4: string;
  email6: string;
  emailr: string;
  emailt: string;
  email8: string;
}

// components/Demo.tsx
const fetchMockData = async ({ pageIndex, pageSize, sortBy, filters }: any): Promise<PaginationResponse<MockData>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate full dataset
    const fullData = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: Math.floor(Math.random() * 50) + 18,
      email: `user${i + 1}@example.com`,
      emaile: `user1${i + 1}@example.com`,
      emailee: `user2${i + 1}@example.com`,
      email4: `user3${i + 1}@example.com`,
      email6: `user4${i + 1}@example.com`,
      emailt: `user5${i + 1}@example.com`,
      emadil6: `user6${i + 1}@example.com`,
      email8: `user66${i + 1}@example.com`,

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

const columns = [
  { accessorKey: 'id', header: 'ID', meta: { enableSorting: true, width: 100, align: 'center' } },
  { accessorKey: 'name', header: 'Name', meta: { enableSorting: true } },
  { accessorKey: 'age', header: 'Age', meta: { enableSorting: true } },
  { accessorKey: 'email', header: 'Email', meta: { enableSorting: true } },
  { accessorKey: 'emailee', header: 'Emaile', meta: { enableSorting: true } },
  { accessorKey: 'emaile', header: 'Emaile', meta: { enableSorting: true } },
  { accessorKey: 'email4', header: 'Email4', meta: { enableSorting: true } },
  { accessorKey: 'email6', header: 'Email6', meta: { enableSorting: true } },
  { accessorKey: 'emailr', header: 'Emailr', meta: { enableSorting: true } },
  { accessorKey: 'emailt', header: 'Emailt', meta: { enableSorting: true } },
  { accessorKey: 'email6', header: 'Email6', meta: { enableSorting: true } },
  { accessorKey: 'email8', header: 'Email8', meta: { enableSorting: true } },

];

const Demo = () => {
  const [tableData, setTableData] = useState<MockData[]>([]);

  const handleEdit = (row: MockData) => {
    console.log('Edit:', row);
    alert(`Editing row ${row.id}`);
    // Add your edit logic here
  };

  const handleDelete = (row: MockData) => {
    console.log('Delete:', row);
    setTableData(prev => prev.filter(item => item.id !== row.id));
    alert(`Deleted row ${row.id}`);
  };

  const handleSave = (row: MockData) => {
    console.log('Save:', row);
    alert(`Saved row ${row.id}`);
    // Add your save logic here
  };

  const handleBulkEdit = (selectedRows: MockData[]) => {
    console.log('Bulk Edit:', selectedRows);
    alert(`Bulk editing ${selectedRows.length} rows`);
    // Add your bulk edit logic here
  };

  const tableConfig: TableConfig<MockData> = {
    columns,
    fetchData: fetchMockData,
    pagination: { 
      mode: 'server', 
      initialState: { pageIndex: 0, pageSize: 10, totalRows: 100 } 
    },
    rowSelection: {
      enabled: false,
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