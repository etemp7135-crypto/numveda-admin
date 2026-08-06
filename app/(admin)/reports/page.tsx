'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatINR, formatPercent } from '@/lib/finance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const REPORT_COLORS: Record<string, string> = {
  master: '#6366f1',
  ultimate: '#8b5cf6',
};

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

  const reports = data?.reports || [];
  const totalRevenue = reports.reduce((s: number, r: any) => s + (r.revenue || 0), 0);
  const totalOrders = reports.reduce((s: number, r: any) => s + (r.orders || 0), 0);

  // Comparison chart data
  const comparisonData = reports.map((r: any) => ({
    name: r.name,
    orders: r.orders,
    revenue: r.revenue,
    fill: REPORT_COLORS[r.type] || '#6366f1',
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Report & Product Analytics</h1>
          <p className="page-subtitle">Performance breakdown by report type — revenue, conversions & rankings</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {/* ── Summary KPIs ── */}
        <div className="kpi-grid">
          <KPICard label="Total Revenue" value={formatINR(totalRevenue)} loading={loading} highlight highlightMode="success" />
          <KPICard label="Total Orders" value={totalOrders.toLocaleString()} loading={loading} />
          <KPICard
            label="Avg Order Value"
            value={formatINR(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
            loading={loading}
          />
          <KPICard
            label="Best Performer"
            value={!loading && reports.length > 0 ? (reports.sort((a: any, b: any) => b.revenue - a.revenue)[0]?.name || '—') : '—'}
            loading={loading}
          />
        </div>

        {/* ── Report Cards ── */}
        <div className="grid-2" style={{ marginTop: 16 }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
            </>
          ) : (
            reports.map((report: any) => {
              const color = REPORT_COLORS[report.type] || '#6366f1';
              const revenueShare = totalRevenue > 0 ? (report.revenue / totalRevenue) * 100 : 0;
              const orderShare = totalOrders > 0 ? (report.orders / totalOrders) * 100 : 0;

              return (
                <div
                  key={report.type}
                  className="chart-card"
                  style={{
                    border: `1px solid ${color}40`,
                    background: `linear-gradient(135deg, var(--bg-card) 0%, ${color}08 100%)`,
                    marginBottom: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background watermark */}
                  <div style={{
                    position: 'absolute', top: -20, right: -20,
                    width: 100, height: 100, borderRadius: '50%',
                    background: `${color}10`,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <span className={`badge ${report.type === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ marginBottom: 8 }}>
                        {report.type?.toUpperCase()}
                      </span>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>{report.name}</h2>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Price: {formatINR(report.price)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{formatINR(report.revenue)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>total revenue</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Units Sold', value: report.orders.toLocaleString() },
                      { label: 'AOV', value: formatINR(report.aov || report.price) },
                      { label: 'Revenue Share', value: `${revenueShare.toFixed(1)}%` },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Share Bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 6 }}>
                      <span>Order share</span>
                      <span>{orderShare.toFixed(1)}% of all orders</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${orderShare}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Comparison Chart ── */}
        {!loading && comparisonData.length > 0 && (
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h2 className="chart-title">Orders Comparison</h2>
              <div className="chart-subtitle">Units sold by report type</div>
              <div className="chart-area" style={{ minHeight: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-3)" fontSize={11} />
                    <YAxis stroke="var(--text-3)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    />
                    <Bar dataKey="orders" name="Orders Sold" radius={[4, 4, 0, 0]}>
                      {comparisonData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card" style={{ marginBottom: 0 }}>
              <h2 className="chart-title">Revenue Comparison</h2>
              <div className="chart-subtitle">Revenue generated by report type</div>
              <div className="chart-area" style={{ minHeight: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-3)" fontSize={11} />
                    <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                      formatter={(v: any) => [formatINR(v), 'Revenue']}
                    />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {comparisonData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Raw Table ── */}
        <div className="table-card" style={{ marginTop: 16 }}>
          <div className="table-header">
            <div className="table-title">Product Performance Table</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                  <th>AOV</th>
                  <th>Revenue Share</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5,6,7].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                      No product data available
                    </td>
                  </tr>
                ) : (
                  reports.map((report: any) => {
                    const share = totalRevenue > 0 ? (report.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={report.type}>
                        <td><span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{report.name}</span></td>
                        <td>
                          <span className={`badge ${report.type === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>
                            {report.type}
                          </span>
                        </td>
                        <td>{formatINR(report.price)}</td>
                        <td><span className="val-strong">{report.orders.toLocaleString()}</span></td>
                        <td><span className="val-strong">{formatINR(report.revenue)}</span></td>
                        <td>{formatINR(report.aov || report.price)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 6, flex: 1, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ width: `${share}%`, height: '100%', background: REPORT_COLORS[report.type] || 'var(--indigo)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', minWidth: 36 }}>{share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
