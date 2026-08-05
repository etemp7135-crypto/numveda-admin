'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatNumber, formatINR, formatPercent } from '@/lib/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function OverviewPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/overview?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">High-level business intelligence & performance</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        <h2 className="chart-title" style={{ marginBottom: 16 }}>Financial Performance</h2>
        <div className="kpi-grid">
          <KPICard 
            label="Gross Revenue" 
            value={formatINR(data?.metrics?.grossRevenue?.value || 0)} 
            change={data?.metrics?.grossRevenue?.change}
            loading={loading} 
          />
          <KPICard 
            label="Net Razorpay Rev" 
            value={formatINR(data?.metrics?.netRazorpayRevenue?.value || 0)}
            change={data?.metrics?.netRazorpayRevenue?.change}
            loading={loading} 
          />
          <KPICard 
            label="Total Meta Cash Cost" 
            value={formatINR(data?.metrics?.totalMetaCashCost?.value || 0)}
            subtext={`Media Spend + GST`}
            loading={loading} 
          />
          <KPICard 
            label="Actual Profit" 
            value={formatINR(data?.metrics?.actualProfit?.value || 0)} 
            subtext={`Margin: ${formatPercent(data?.metrics?.profitMargin?.value || 0)}`}
            loading={loading} 
          />
        </div>

        <h2 className="chart-title" style={{ marginTop: 32, marginBottom: 16 }}>Conversion & Operations</h2>
        <div className="kpi-grid">
          <KPICard 
            label="Total Orders" 
            value={formatNumber(data?.metrics?.totalOrders?.value || 0)} 
            change={data?.metrics?.totalOrders?.change}
            loading={loading} 
          />
          <KPICard 
            label="Successful Payments" 
            value={formatNumber(data?.metrics?.successfulPayments?.value || 0)} 
            change={data?.metrics?.successfulPayments?.change}
            subtext={`${formatNumber(data?.metrics?.failedPayments?.value || 0)} failed`}
            loading={loading} 
          />
          <KPICard 
            label="Payment Conv. Rate" 
            value={formatPercent(data?.metrics?.conversionRate?.value || 0)} 
            change={data?.metrics?.conversionRate?.change}
            loading={loading} 
          />
          <KPICard 
            label="Refunds" 
            value={formatINR(data?.metrics?.refunds?.value || 0)} 
            change={data?.metrics?.refunds?.change}
            loading={loading} 
          />
        </div>

        <div className="grid-2" style={{ marginTop: 32 }}>
          <div className="chart-card">
            <h2 className="chart-title">Revenue Trend</h2>
            <div className="chart-subtitle">Daily gross revenue across the selected period</div>
            <div className="chart-area">
              {loading ? <div className="skeleton" style={{ width: '100%', height: '100%' }}></div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.dailyRevenue || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-3)" fontSize={12} tickFormatter={(v) => v.substring(5)} />
                    <YAxis stroke="var(--text-3)" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                      formatter={(value: any) => [formatINR(value), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--indigo)" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Unit Economics</h2>
            <div className="chart-subtitle">Cost breakdown and efficiency</div>
            <div style={{ marginTop: 20 }}>
              {loading ? (
                <div>
                  <div className="skeleton" style={{ height: 40, marginBottom: 12 }}></div>
                  <div className="skeleton" style={{ height: 40, marginBottom: 12 }}></div>
                  <div className="skeleton" style={{ height: 40 }}></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Marketing Efficiency (MER)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)' }}>{data?.metrics?.mer?.value?.toFixed(2) || '0.00'}x</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Razorpay Fees (Est.)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--rose)' }}>{formatINR(data?.metrics?.razorpayFees?.value || 0)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Master vs Ultimate Split</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>
                      {data?.metrics?.masterOrders?.value || 0} / {data?.metrics?.ultimateOrders?.value || 0}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
