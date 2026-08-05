'use client';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getSortedRowModel, SortingState } from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';

interface DataTableProps {
  columns: any[];
  data: any[];
  title?: string;
}

export default function DataTable({ columns, data, title }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 15 } }
  });

  return (
    <div className="table-card">
      {title && (
        <div className="table-header">
          <div className="table-title">{title}</div>
        </div>
      )}
      
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ChevronsUpDown size={12} style={{ opacity: 0.5 }} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {table.getPageCount() > 1 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-2)' }}>
          <div>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length} entries
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '4px 8px' }}
              onClick={() => table.previousPage()} 
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ padding: '4px 8px' }}
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
