// components/Demo.tsx
import React, { useState } from 'react';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';
import DataTable from './DataTable';
import { PaginationResponse, TableConfig } from '../types';

let mockServerData: MockData[] = [];

interface MockData {
  id: number;
  name: string;
  age: number;
  category?: string;
  status?: string;
  priorityReason?: string;
  cancellationReason?: string;
  [key: string]: any;
}

const initializeMockData = () => {
  if (mockServerData.length === 0) {
    mockServerData = Array.from({ length: 90000 }, (_, i) => {
      const category = Math.random() > 0.5 ? 'urgent' : 'normal';
      const status = Math.random() > 0.5 ? 'open' : 'closed';
      return {
        id: i + 1,
        name: `User ${i + 1}`,
        age: Math.floor(Math.random() * 50) + 18,
        category,
        status,
        priorityReason: category === 'urgent' && Math.random() > 0.5 ? 'High priority task' : '',
        cancellationReason: status === 'closed' && Math.random() > 0.5 ? 'User requested' : '',
      };
    });
  }
};

const fetchMockData = async ({
  pageIndex,
  pageSize,
  sortBy,
  filters,
}: any): Promise<PaginationResponse<MockData>> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  initializeMockData();

  let filteredData = [...mockServerData];
  if (filters?.globalFilter) {
    const filterValue = filters.globalFilter.toLowerCase();
    filteredData = filteredData.filter((item) =>
      Object.values(item).some((value) => String(value).toLowerCase().includes(filterValue))
    );
  }

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
  };

  const handleDelete = (row: MockData) => {
    console.log('Deleted row:', row); // Logging the deleted row
    mockServerData = mockServerData.filter((item) => item.id !== row.id);
    setTableData((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleSave = (row: MockData) => {
    mockServerData = mockServerData.map((item) =>
      item.id === row.id ? { ...item, ...row } : item
    );
    setTableData((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, ...row } : item))
    );
    console.log('Saved row:', row);
  };

  const handleBulkEditComplete = (updatedRows: MockData[]) => {
    mockServerData = mockServerData.map((row) =>
      updatedRows.some((u) => u.id === row.id) ? updatedRows.find((u) => u.id === row.id)! : row
    );
    setTableData((prev) =>
      prev.map((row) =>
        updatedRows.some((u) => u.id === row.id) ? updatedRows.find((u) => u.id === row.id)! : row
      )
    );
    console.log('Bulk edit completed:', updatedRows);
  };

  const tableConfig: TableConfig<MockData> = {
    columns: [
      { accessorKey: 'id', header: 'ID', meta: { enableSorting: true, width: 100, align: 'center' } },
      { accessorKey: 'name', header: 'Name', meta: { enableSorting: true } },
      { accessorKey: 'age', header: 'Age', meta: { enableSorting: true } },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'priorityReason', header: 'Priority Reason' },
      { accessorKey: 'cancellationReason', header: 'Cancellation Reason' },
    ],
    fetchData: fetchMockData,
    pagination: {
      mode: 'server',
      initialState: { pageIndex: 0, pageSize: 10, totalRows: 90000 },
    },
    rowSelection: {
      enabled: true,
      bulkAction: {
        label: 'Bulk Edit',
        onClick: handleBulkEditComplete,
      },
    },
    styleConfig: { padding: 'standard', theme: 'light' },
    enableRawData: true,
    actions: [
      { label: 'Edit', icon: <FaEdit />, onClick: handleEdit, visible: (row) => row.age >= 18 },
      { label: 'Delete', icon: <FaTrash />, onClick: handleDelete, visible: () => true },
      { label: 'Save', icon: <FaSave />, onClick: handleSave, visible: () => true },
    ],
    exportFileName: 'users_report',
    bulkEditConfig: [
      { accessorKey: 'id', header: 'ID', fieldType: 'text', isEditable: false },
      { accessorKey: 'name', header: 'Name', fieldType: 'text', isRequired: true, isEditable: true },
      {
        accessorKey: 'category',
        header: 'Category',
        fieldType: 'select',
        isEditable: true,
        options: [
          { value: 'urgent', label: 'Urgent' },
          { value: 'normal', label: 'Normal' },
        ],
        dependencies: {
          urgent: [
            {
              accessorKey: 'priorityReason',
              header: 'Priority Reason',
              fieldType: 'textarea',
              isRequired: true,
              isEditable: true,
            },
          ],
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        fieldType: 'select',
        isEditable: true,
        options: [
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ],
        dependencies: {
          closed: [
            {
              accessorKey: 'cancellationReason',
              header: 'Cancellation Reason',
              fieldType: 'textarea',
              isRequired: true,
              isEditable: true,
            },
          ],
        },
      },
      { accessorKey: 'age', header: 'Age', fieldType: 'text', isEditable: true },
    ],
    onBulkEditComplete: handleBulkEditComplete,
    defaultFieldType: 'text',
  };

  return (
    <div style={{ padding: '20px' }}>
      <DataTable config={tableConfig} onSave={handleSave} />
    </div>
  );
};

export default Demo;