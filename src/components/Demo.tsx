import React, { useMemo, useState } from 'react';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import DataTable from './DataTable';
import { PaginationResponse, TableConfig } from '../types';

interface MockData {
  id: number;
  name: string;
  age: number;
  [key: string]: any; // Dynamic fields ke liye
}

const fetchMockData = async ({
  pageIndex,
  pageSize,
  sortBy,
  filters,
}: any): Promise<PaginationResponse<MockData>> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate full dataset with dynamic columns
  const fullData = Array.from({ length: 90000 }, (_, i) => {
    const baseData = {
      id: i + 1,
      name: `User ${i + 1}`,
      age: Math.floor(Math.random() * 50) + 18,
    };

    // Generate 100 dynamic fields (email1, email2, ..., email100)
    const dynamicFields = Array.from({ length: 6 }, (_, j) => ({
      [`email${j + 1}`]: `user${j + 1}_${i + 1}@example.com`,
    })).reduce((acc, field) => ({ ...acc, ...field }), {});

    return { ...baseData, ...dynamicFields };
  });

  // Apply global filter
  let filteredData = fullData;
  if (filters?.globalFilter) {
    const filterValue = filters.globalFilter.toLowerCase();
    filteredData = fullData.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(filterValue)
      )
    );
  }

  // Apply sorting
  if (sortBy && sortBy.length > 0) {
    const { id, desc } = sortBy[0];
    filteredData.sort((a, b) => {
      const aValue = a[id];
      const bValue = b[id];
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
    totalSize: filteredData.length,
  };
};

const Demo = () => {
  const [tableData, setTableData] = useState<MockData[]>([]);

  const handleEdit = (row: MockData) => {
    console.log('Edit:', row);
    alert(`Editing row ${row.id}`);
  };

  const handleDelete = (row: MockData) => {
    console.log('Delete:', row);
    setTableData(prev => prev.filter(item => item.id !== row.id));
    alert(`Deleted row ${row.id}`);
  };

  const handleSave = (row: MockData) => {
    console.log('Save:', row);
    alert(`Saved row ${row.id}`);
  };

  const handleBulkEdit = (selectedRows: MockData[]) => {
    console.log('Bulk Edit:', selectedRows);
    alert(`Bulk editing ${selectedRows.length} rows`);
  };

  // Create static + dynamic columns
  const columns = useMemo(() => {
    // Static columns
    const baseColumns = [
      { accessorKey: 'id', header: 'ID', meta: { enableSorting: true, width: 100, align: 'center' } },
      { accessorKey: 'name', header: 'Name', meta: { enableSorting: true } },
      { accessorKey: 'age', header: 'Age', meta: { enableSorting: true } },
    ];

    // Dynamic columns (100 columns)
    const dynamicColumns = Array.from({ length: 6 }, (_, i) => ({
      accessorKey: `email${i + 1}`,
      header: `Email ${i + 1}`,
      meta: { enableSorting: true },
    }));

    return [...baseColumns, ...dynamicColumns];
  }, []);

  const tableConfig: TableConfig<MockData> = {
    columns,
    fetchData: fetchMockData,
    pagination: {
      mode: 'server',
      initialState: { pageIndex: 0, pageSize: 10, totalRows: 90000 },
    },
    rowSelection: {
      enabled: true,
      bulkAction: {
        label: 'Bulk Edit',
        onClick: handleBulkEdit,
      },
    },
    styleConfig: { padding: 'standard', theme: 'light' },
    enableRawData: true,
    actions: [
      {
        label: 'Edit',
        icon: <FaEdit />,
        onClick: handleEdit,
        visible: row => row.age >= 18,
      },
      {
        label: 'Delete',
        icon: <FaTrash />,
        onClick: handleDelete,
        visible: () => true,
      },
      {
        label: 'Save',
        icon: <FaSave />,
        onClick: handleSave,
        visible: row => row.id % 2 === 0,
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
