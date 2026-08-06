'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import { formatINR } from '@/lib/finance';
import { Search, Filter, X } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'paid', 'failed', 'pending', 'refunded', 'expired'];
const TYPE_OPTIONS = ['All', 'master', 'ultimate'];

export default function OrdersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (query) params.set('q', query);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (typeFilter !== 'All') params.set('type', typeFilter);

    fetch(`/api/orders?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, query, statusFilter, typeFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
    setPage(0);
  }

  function clearFilters() {
    setQuery('');
    setSearchInput('');
    setStatusFilter('All');
    setTypeFilter('All');
    setPage(0);
  }

  const hasActiveFilters = query || statusFilter !== 'All' || typeFilter !== 'All';

  const columns = [
    {
      header: 'Order ID',
      accessorKey: 'order_id',
      cell: (info: any) => (
        <Link href={`/orders/${info.row.original._id}`} className="mono" style={{ color: 'var(--indigo-2)', textDecoration: 'none', fontSize: '0.75rem' }}>
          {info.getValue() || '—'}
        </Link>
      )
    },
    {
      header: 'Date',
      accessorKey: 'created_at',
      cell: (info: any) => {
        const d = new Date(info.getValue());
        return (
          <div>
            <div style={{ fontSize: '0.8rem' }}>{d.toLocaleDateString('en-IN')}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      }
    },
    {
      header: 'Customer',
      accessorKey: 'customer_details',
      cell: (info: any) => {
        const d = info.getValue();
        if (!d) return <span style={{ color: 'var(--text-3)' }}>—</span>;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.82rem' }}>{d.name || '—'}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>{d.phone || '—'}</div>
          </div>
        );
      }
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (info: any) => <span className="val-strong">{formatINR(info.getValue() || 0)}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (info: any) => {
        const s = info.getValue();
        const cls = s === 'paid' ? 'badge-success' : s === 'failed' ? 'badge-danger' : s === 'refunded' ? 'badge-warning' : 'badge-neutral';
        return <span className={`badge ${cls}`}>{s}</span>;
      }
    },
    {
      header: 'Type',
      accessorKey: 'customer_details.type',
      cell: (info: any) => {
        const type = info.getValue();
        if (!type) return <span style={{ color: 'var(--text-3)' }}>—</span>;
        return <span className={`badge ${type === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>{type}</span>;
      }
    },
    {
      header: 'Payment ID',
      accessorKey: 'payment_id',
      cell: (info: any) => <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{info.getValue() || '—'}</span>
    },
  ];

  const pagination = data?.pagination || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Explorer</h1>
          <p className="page-subtitle">Search and investigate individual transactions</p>
        </div>
        {!loading && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px' }}>
            <strong style={{ color: 'var(--text-1)' }}>{(pagination.total || 0).toLocaleString()}</strong> total orders
          </div>
        )}
      </div>

      <div className="page-body">
        {/* ── Search & Filter Bar ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280, maxWidth: 520 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search by ID, Name, Phone..."
                  style={{ paddingLeft: 36 }}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Filter size={14} /> Filters
              {hasActiveFilters && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800 }}>!</span>}
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-ghost" style={{ color: 'var(--rose)' }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                <div className="date-pills">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(0); }}
                      className={`date-pill ${statusFilter === s ? 'active' : ''}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Type</div>
                <div className="date-pills">
                  {TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setPage(0); }}
                      className={`date-pill ${typeFilter === t ? 'active' : ''}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        {loading && !data ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.orders || []}
              title={`Orders${query ? ` matching "${query}"` : ''} — showing ${(page * limit) + 1}–${Math.min((page + 1) * limit, pagination.total || 0)} of ${(pagination.total || 0).toLocaleString()}`}
            />

            {/* ── Pagination Controls ── */}
            {pagination.total > limit && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: '0.82rem', color: 'var(--text-2)' }}>
                <div>
                  Page {page + 1} of {Math.ceil(pagination.total / limit)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    ← Prev
                  </button>
                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, Math.ceil(pagination.total / limit)) }, (_, i) => {
                    const pageNum = Math.max(0, page - 2) + i;
                    if (pageNum >= Math.ceil(pagination.total / limit)) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`btn ${pageNum === page ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '6px 12px', minWidth: 36 }}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * limit >= (pagination.total || 0)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
