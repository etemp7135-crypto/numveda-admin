'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import DataTable from '@/components/DataTable';
import KPICard from '@/components/KPICard';
import { formatINR } from '@/lib/finance';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RazorpayPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/razorpay?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const columns = [
    { header: 'Payment ID', accessorKey: 'id', cell: (info: any) => <span className="mono">{info.getValue()}</span> },
    { header: 'Amount', accessorKey: 'amount', cell: (info: any) => <span className="val-strong">{formatINR(info.getValue())}</span> },
    { header: 'Status', accessorKey: 'status', cell: (info: any) => {
        const status = info.getValue();
        let badge = 'badge-neutral';
        if (status === 'captured') badge = 'badge-success';
        if (status === 'failed') badge = 'badge-danger';
        return <span className={`badge ${badge}`}>{status}</span>;
    }},
    { header: 'Method', accessorKey: 'method', cell: (info: any) => <span style={{ textTransform: 'capitalize' }}>{info.getValue() || '—'}</span> },
    { header: 'Contact', accessorKey: 'contact' },
    { header: 'Date', accessorKey: 'createdAt', cell: (info: any) => new Date(info.getValue()).toLocaleString() },
  ];

  const pieColors = ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9', '#8b5cf6'];
  const pieData = data?.methodBreakdown?.map((m: any) => ({ name: m.method || 'other', value: m.amount })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Razorpay Analytics</h1>
          <p className="page-subtitle">Live payment gateway data & reconciliation</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {data && !data.connected && (
          <div className="alert-banner danger">
            <strong>Connection Error:</strong> Could not connect to Razorpay API. Please check your keys in .env.local.
          </div>
        )}

        <div className="kpi-grid">
          <KPICard label="Gross Payments" value={formatINR(data?.summary?.grossRevenue || 0)} loading={loading} />
          <KPICard label="Net Settlement" value={formatINR(data?.summary?.netSettlement || 0)} loading={loading} />
          <KPICard label="Fees & Taxes" value={formatINR((data?.summary?.totalFees || 0) + (data?.summary?.totalFeeGST || 0))} loading={loading} />
          <KPICard label="Refunds" value={formatINR(data?.summary?.totalRefunds || 0)} loading={loading} />
        </div>

        <div className="grid-2" style={{ marginTop: 24, marginBottom: 24 }}>
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">Payment Methods</h2>
            <div className="chart-subtitle">Breakdown by volume</div>
            <div className="chart-area" style={{ minHeight: 200 }}>
              {loading ? <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }}></div> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {pieData.map((e: any, index: number) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatINR(value)} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">Database Reconciliation</h2>
            <div className="chart-subtitle">Razorpay orders vs MongoDB orders</div>
            <div style={{ marginTop: 20 }}>
              {loading ? <div className="skeleton" style={{ height: 100 }}></div> : (
                <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}>Razorpay Orders</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{data?.reconciliation?.razorpayOrderCount || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 4 }}>MongoDB Orders</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{data?.reconciliation?.dbOrderCount || 0}</div>
                    </div>
                  </div>
                  
                  {data?.reconciliation?.missingInDB > 0 ? (
                    <div className="alert-banner warning" style={{ margin: 0, padding: 10, fontSize: '0.75rem' }}>
                      <strong>Warning:</strong> {data.reconciliation.missingInDB} paid orders missing from database. Webhook failure likely.
                    </div>
                  ) : (
                    <div className="alert-banner info" style={{ margin: 0, padding: 10, fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--emerald)' }}>
                      <strong>Perfect Match:</strong> All Razorpay orders are properly recorded in the database.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={data?.recentPayments || []} title="Recent Payments" />
      </div>
    </div>
  );
}
