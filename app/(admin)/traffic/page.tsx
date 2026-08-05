'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import DataTable from '@/components/DataTable';

export default function TrafficPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traffic?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const columns = [
    { header: 'Source', accessorKey: 'source', cell: (info: any) => <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{info.getValue()}</span> },
    { header: 'Medium', accessorKey: 'medium', cell: (info: any) => <span style={{ textTransform: 'capitalize', color: 'var(--text-2)' }}>{info.getValue()}</span> },
    { header: 'Sessions', accessorKey: 'sessionCount', cell: (info: any) => <span className="val-strong">{info.getValue().toLocaleString()}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Traffic & Attribution</h1>
          <p className="page-subtitle">Acquisition sources and UTM tracking</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {loading ? (
          <div className="skeleton" style={{ height: 400 }}></div>
        ) : (
          <DataTable columns={columns} data={data?.traffic || []} title="Top Traffic Sources" />
        )}
      </div>
    </div>
  );
}
