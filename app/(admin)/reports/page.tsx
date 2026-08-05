'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import DataTable from '@/components/DataTable';
import { formatINR } from '@/lib/finance';

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const columns = [
    { header: 'Product Name', accessorKey: 'name', cell: (info: any) => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{info.getValue()}</span> },
    { header: 'Type', accessorKey: 'type', cell: (info: any) => <span className={`badge ${info.getValue() === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>{info.getValue()}</span> },
    { header: 'Price', accessorKey: 'price', cell: (info: any) => formatINR(info.getValue()) },
    { header: 'Units Sold', accessorKey: 'orders' },
    { header: 'Total Revenue', accessorKey: 'revenue', cell: (info: any) => <span className="val-strong">{formatINR(info.getValue())}</span> },
    { header: 'Avg Order Value', accessorKey: 'aov', cell: (info: any) => formatINR(info.getValue()) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Report & Product Analytics</h1>
          <p className="page-subtitle">Performance breakdown by report type</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {loading ? (
          <div className="skeleton" style={{ height: 300 }}></div>
        ) : (
          <DataTable columns={columns} data={data?.reports || []} title="Product Performance" />
        )}
      </div>
    </div>
  );
}
