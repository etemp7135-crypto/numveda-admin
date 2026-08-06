'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatPercent, formatINR } from '@/lib/finance';
import { Target, Users, Repeat } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

export default function CohortsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cohorts?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const c = data?.cohorts;

  // Pie chart: new vs repeat customers
  const customerTypePie = !loading && c ? [
    { name: 'New Customers', value: (c.uniqueCustomers || 0) - (c.repeatCustomers || 0), fill: '#6366f1' },
    { name: 'Repeat Customers', value: c.repeatCustomers || 0, fill: '#10b981' },
  ] : [];

  // Report type distribution
  const reportTypePie = !loading && c ? [
    { name: 'Master Only', value: c.masterOnlyCustomers || 0, fill: '#6366f1' },
    { name: 'Ultimate Only', value: c.ultimateOnlyCustomers || 0, fill: '#8b5cf6' },
    { name: 'Both Reports', value: c.bothReportsCustomers || 0, fill: '#10b981' },
  ] : [];

  // Revenue per customer type
  const revenueData = !loading && c ? [
    { name: 'Master Only', avgRevenue: c.masterOnlyAvgRevenue || 0, fill: '#6366f1' },
    { name: 'Ultimate Only', avgRevenue: c.ultimateOnlyAvgRevenue || 0, fill: '#8b5cf6' },
    { name: 'Both', avgRevenue: c.bothAvgRevenue || 0, fill: '#10b981' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cohorts & Behavior</h1>
          <p className="page-subtitle">Customer retention, repeat purchase behavior & LTV analysis</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {/* ── KPI Grid ── */}
        <div className="kpi-grid">
          <KPICard label="Unique Customers" value={(c?.uniqueCustomers || 0).toLocaleString()} loading={loading} />
          <KPICard label="Repeat Customers" value={(c?.repeatCustomers || 0).toLocaleString()} loading={loading} />
          <KPICard
            label="Repeat Rate"
            value={formatPercent(c?.repeatRate || 0)}
            highlight={(c?.repeatRate || 0) > 15}
            highlightMode="success"
            loading={loading}
          />
          <KPICard label="Avg Orders / Customer" value={(c?.avgOrdersPerCustomer || 0).toFixed(2)} loading={loading} />
          <KPICard
            label="Master Only"
            value={(c?.masterOnlyCustomers || 0).toLocaleString()}
            subtext="Bought only Master"
            loading={loading}
          />
          <KPICard
            label="Ultimate Only"
            value={(c?.ultimateOnlyCustomers || 0).toLocaleString()}
            subtext="Bought only Ultimate"
            loading={loading}
          />
          <KPICard
            label="Both Reports"
            value={(c?.bothReportsCustomers || 0).toLocaleString()}
            subtext="Cross-sell customers"
            loading={loading}
            highlight={(c?.bothReportsCustomers || 0) > 0}
            highlightMode="success"
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="grid-2" style={{ marginTop: 16 }}>
          {/* New vs Repeat */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">New vs Repeat Customers</h2>
            <div className="chart-subtitle">Customer retention breakdown</div>
            <div className="chart-area" style={{ minHeight: 200 }}>
              {loading ? (
                <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }} />
              ) : customerTypePie.every(d => d.value === 0) ? (
                <div className="empty-state"><p>No customer data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={customerTypePie}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {customerTypePie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Report Type Distribution */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">Report Type Distribution</h2>
            <div className="chart-subtitle">What customers purchased</div>
            <div className="chart-area" style={{ minHeight: 200 }}>
              {loading ? (
                <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }} />
              ) : reportTypePie.every(d => d.value === 0) ? (
                <div className="empty-state"><p>No distribution data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={reportTypePie}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {reportTypePie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Avg Revenue per Customer Type ── */}
        {!loading && revenueData.some(d => d.avgRevenue > 0) && (
          <div className="chart-card" style={{ marginTop: 16 }}>
            <h2 className="chart-title">Average Revenue by Customer Type</h2>
            <div className="chart-subtitle">Revenue contribution per customer segment</div>
            <div className="chart-area" style={{ minHeight: 180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-3)" fontSize={11} />
                  <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    formatter={(v: any) => [formatINR(v), 'Avg Revenue']}
                  />
                  <Bar dataKey="avgRevenue" name="Avg Revenue" radius={[4, 4, 0, 0]}>
                    {revenueData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Cross-Sell Insights ── */}
        <div className="chart-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Repeat size={20} style={{ color: 'var(--indigo)' }} />
            </div>
            <div>
              <h2 className="chart-title">Cross-Sell & Upsell Insights</h2>
              <div className="chart-subtitle" style={{ margin: 0 }}>Customers who purchased multiple report types</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              {
                label: 'Master → Ultimate Upgrade Rate',
                value: loading ? '—' : (c?.masterOnlyCustomers > 0
                  ? formatPercent((c?.bothReportsCustomers || 0) / (c?.masterOnlyCustomers + c?.bothReportsCustomers) * 100)
                  : '0%'),
                icon: '⬆️',
                color: 'var(--emerald)',
              },
              {
                label: 'Avg Revenue: Master Customer',
                value: loading ? '—' : formatINR(c?.masterOnlyAvgRevenue || 49),
                icon: '📊',
                color: 'var(--indigo-2)',
              },
              {
                label: 'Avg Revenue: Ultimate Customer',
                value: loading ? '—' : formatINR(c?.ultimateOnlyAvgRevenue || 149),
                icon: '💎',
                color: 'var(--violet)',
              },
              {
                label: 'Avg Revenue: Both Reports',
                value: loading ? '—' : formatINR(c?.bothAvgRevenue || 198),
                icon: '🏆',
                color: 'var(--amber)',
              },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
