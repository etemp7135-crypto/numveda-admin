'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import { formatINR, formatPercent } from '@/lib/finance';

export default function MetaAdsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meta?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const columns = [
    { header: 'Campaign Name', accessorKey: 'name', cell: (info: any) => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{info.getValue()}</span> },
    { header: 'Status', accessorKey: 'status', cell: (info: any) => {
        const s = info.getValue();
        return <span className={`badge ${s === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{s}</span>;
    }},
    { header: 'Spend', accessorKey: 'spend', cell: (info: any) => formatINR(info.getValue()) },
    { header: 'Purchases (Meta)', accessorKey: 'purchases' },
    { header: 'CPA', accessorKey: 'cpa', cell: (info: any) => formatINR(info.getValue()) },
    { header: 'ROAS', accessorKey: 'roas', cell: (info: any) => `${info.getValue().toFixed(2)}x` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meta Ads</h1>
          <p className="page-subtitle">Marketing API integration & ad performance</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {data && !data.configured && (
          <div className="empty-state" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-md)', borderRadius: 12 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-1)', marginBottom: 8 }}>Meta Marketing API Not Configured</h3>
            <p style={{ maxWidth: 400, margin: '0 auto 24px', fontSize: '0.85rem' }}>
              To view ad performance here, you need to add your Meta System User Access Token to the environment variables.
            </p>
            <div style={{ textAlign: 'left', background: 'var(--bg-base)', padding: 16, borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace', width: '100%', maxWidth: 500, color: 'var(--text-2)' }}>
              META_ACCESS_TOKEN=EAAG...<br/>
              META_AD_ACCOUNT_ID=act_123456789
            </div>
          </div>
        )}

        {data && data.configured && (
          <>
            {!data.connected && (
              <div className="alert-banner danger">
                <strong>Connection Error:</strong> Could not connect to Meta API. Token may be invalid or expired.
              </div>
            )}
            
            <div className="kpi-grid">
              <KPICard label="Total Spend" value={formatINR(data.account?.spend || 0)} loading={loading} />
              <KPICard label="Purchases (Meta)" value={data.account?.purchases || 0} loading={loading} />
              <KPICard label="Cost Per Acq (CPA)" value={formatINR(data.account?.cpa || 0)} loading={loading} />
              <KPICard label="Platform ROAS" value={(data.account?.roas || 0).toFixed(2)} suffix="x" loading={loading} />
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
              <KPICard label="Impressions" value={(data.account?.impressions || 0).toLocaleString()} loading={loading} />
              <KPICard label="Link Clicks" value={(data.account?.clicks || 0).toLocaleString()} loading={loading} />
              <KPICard label="Conv. Rate (Click to Pur)" value={formatPercent(data.account?.conversionRate || 0)} loading={loading} />
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 400 }}></div>
            ) : (
              <DataTable columns={columns} data={data.campaigns || []} title="Campaign Performance" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
