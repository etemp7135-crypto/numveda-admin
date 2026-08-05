'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import { formatINR } from '@/lib/finance';
import { Search } from 'lucide-react';

export default function OrdersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?page=${page}&limit=20${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
    setPage(0);
  }

  const columns = [
    { header: 'Order ID', accessorKey: 'order_id', cell: (info: any) => <Link href={`/orders/${info.row.original._id}`} className="mono" style={{ color: 'var(--indigo-2)', textDecoration: 'none' }}>{info.getValue()}</Link> },
    { header: 'Date', accessorKey: 'created_at', cell: (info: any) => new Date(info.getValue()).toLocaleString() },
    { header: 'Customer', accessorKey: 'customer_details', cell: (info: any) => {
      const d = info.getValue();
      if (!d) return '—';
      return (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{d.name || '—'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{d.phone || '—'}</div>
        </div>
      );
    }},
    { header: 'Amount', accessorKey: 'amount', cell: (info: any) => <span className="val-strong">{formatINR(info.getValue() || 0)}</span> },
    { header: 'Status', accessorKey: 'status', cell: (info: any) => {
        const s = info.getValue();
        return <span className={`badge ${s === 'paid' ? 'badge-success' : s === 'failed' ? 'badge-danger' : 'badge-neutral'}`}>{s}</span>;
    }},
    { header: 'Type', accessorKey: 'customer_details.type', cell: (info: any) => {
        const type = info.getValue();
        if (!type) return '—';
        return <span className={`badge ${type === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>{type}</span>;
    }}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Explorer</h1>
          <p className="page-subtitle">Search and investigate individual transactions</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-3)' }} />
              <input 
                type="text" 
                className="input" 
                placeholder="Search by ID, Name, or Phone..." 
                style={{ paddingLeft: 40 }}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>

        {loading && !data ? (
          <div className="skeleton" style={{ height: 400 }}></div>
        ) : (
          <DataTable columns={columns} data={data?.orders || []} title={`Recent Orders (${data?.pagination?.total || 0} total)`} />
        )}
      </div>
    </div>
  );
}
