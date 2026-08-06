'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatNumber, formatINR, formatPercent } from '@/lib/finance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

function WaterfallRow({
  label,
  value,
  indent = false,
  type = 'neutral',
  isTotal = false,
  isHeader = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
  type?: 'positive' | 'negative' | 'neutral';
  isTotal?: boolean;
  isHeader?: boolean;
}) {
  const colors = { positive: 'var(--emerald)', negative: 'var(--rose)', neutral: 'var(--text-1)' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isTotal ? '14px 20px' : '10px 20px',
      background: isHeader ? 'var(--bg-surface)' : isTotal ? 'rgba(99,102,241,0.08)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      borderTop: isTotal ? '1px solid var(--border-accent)' : 'none',
    }}>
      <div style={{
        fontSize: isHeader ? '0.65rem' : (isTotal ? '0.85rem' : '0.8rem'),
        fontWeight: isTotal || isHeader ? 700 : 400,
        color: isHeader ? 'var(--text-3)' : 'var(--text-2)',
        paddingLeft: indent ? 20 : 0,
        display: 'flex', alignItems: 'center', gap: 6,
        textTransform: isHeader ? 'uppercase' : 'none',
        letterSpacing: isHeader ? '0.06em' : 0,
      }}>
        {indent && <ArrowRight size={10} style={{ opacity: 0.4 }} />}
        {label}
      </div>
      <div style={{
        fontSize: isTotal ? '0.95rem' : '0.82rem',
        fontWeight: isTotal ? 800 : 600,
        color: isHeader ? 'transparent' : colors[type],
        fontVariantNumeric: 'tabular-nums',
      }}>
        {isHeader ? '' : value}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'revenue' | 'orders'>('revenue');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/overview?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const m = data?.metrics || {};
  const pl = data?.pl || {};

  const dailyRevenue = data?.dailyRevenue || [];
  const orderTrend = data?.orderTrend || dailyRevenue.map((d: any) => ({
    date: d.date,
    count: d.count || 0,
  }));

  // Compute derived metrics
  const cpa = m.successfulPayments?.value > 0 && m.totalMetaCashCost?.value > 0
    ? (m.totalMetaCashCost.value / m.successfulPayments.value)
    : 0;
  const aov = m.avgOrderValue?.value || 0;
  const roas = pl.roas || 0;
  const cashRoas = pl.cashRoas || 0;
  const mer = pl.mer || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">Complete business intelligence at a glance</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">

        {/* ── Section 1: Revenue & Profit ── */}
        <div style={{ marginBottom: 8 }}>
          <div className="section-label">Revenue & Profit</div>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <KPICard
            label="Actual Profit"
            value={formatINR(m.actualProfit?.value || 0)}
            subtext={`Margin: ${formatPercent(m.profitMargin?.value || 0)}`}
            loading={loading}
            highlight={true}
            highlightMode={(m.actualProfit?.value || 0) >= 0 ? 'success' : 'danger'}
          />
          <KPICard
            label="Gross Revenue"
            value={formatINR(m.grossRevenue?.value || 0)}
            change={m.grossRevenue?.change}
            loading={loading}
          />
          <KPICard
            label="Net Razorpay Rev"
            value={formatINR(m.netRazorpayRevenue?.value || 0)}
            change={m.netRazorpayRevenue?.change}
            loading={loading}
          />
          <KPICard
            label="Refunds"
            value={formatINR(m.refunds?.value || 0)}
            change={m.refunds?.change}
            loading={loading}
          />
          <KPICard
            label="Razorpay Fees + GST"
            value={formatINR((m.razorpayFees?.value || 0) + (m.razorpayGST?.value || 0))}
            subtext={`Fees: ${formatINR(m.razorpayFees?.value || 0)}`}
            loading={loading}
          />
          <KPICard
            label="Meta Ad Spend"
            value={formatINR(m.metaMediaSpend?.value || 0)}
            subtext={`Incl. GST: ${formatINR(m.totalMetaCashCost?.value || 0)}`}
            loading={loading}
          />
        </div>

        {/* ── Section 2: Orders & Conversion ── */}
        <div style={{ marginBottom: 8, marginTop: 24 }}>
          <div className="section-label">Orders & Conversion</div>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          <KPICard
            label="Total Orders"
            value={formatNumber(m.totalOrders?.value || 0)}
            change={m.totalOrders?.change}
            loading={loading}
          />
          <KPICard
            label="Successful Payments"
            value={formatNumber(m.successfulPayments?.value || 0)}
            change={m.successfulPayments?.change}
            subtext={`${formatNumber(m.failedPayments?.value || 0)} failed`}
            loading={loading}
          />
          <KPICard
            label="Pending"
            value={formatNumber(m.pendingPayments?.value || 0)}
            loading={loading}
          />
          <KPICard
            label="Payment Conv. Rate"
            value={formatPercent(m.conversionRate?.value || 0)}
            change={m.conversionRate?.change}
            loading={loading}
          />
          <KPICard
            label="Avg Order Value (AOV)"
            value={formatINR(aov)}
            change={m.avgOrderValue?.change}
            loading={loading}
          />
          <KPICard
            label="Master vs Ultimate"
            value={`${m.masterOrders?.value || 0} / ${m.ultimateOrders?.value || 0}`}
            subtext="Master / Ultimate"
            loading={loading}
          />
        </div>

        {/* ── Section 3: Marketing Efficiency ── */}
        <div style={{ marginBottom: 8, marginTop: 24 }}>
          <div className="section-label">Marketing Efficiency</div>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          <KPICard
            label="Media ROAS"
            value={`${roas.toFixed(2)}x`}
            subtext="Gross Rev ÷ Media Spend"
            loading={loading}
          />
          <KPICard
            label="Cash ROAS"
            value={`${cashRoas.toFixed(2)}x`}
            subtext="Gross Rev ÷ Total Cash Cost"
            loading={loading}
          />
          <KPICard
            label="MER"
            value={`${mer.toFixed(2)}x`}
            subtext="Marketing Efficiency Ratio"
            loading={loading}
          />
          <KPICard
            label="CPA / CAC"
            value={formatINR(cpa)}
            subtext="Cost per Acquisition"
            loading={loading}
          />
        </div>

        {/* ── Charts Row ── */}
        <div style={{ marginTop: 32 }}>
          <div className="chart-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <h2 className="chart-title">
                  {chartView === 'revenue' ? 'Revenue & Ad Spend Trend' : 'Daily Order Volume'}
                </h2>
                <div className="chart-subtitle">
                  {chartView === 'revenue' ? 'Gross revenue vs Meta ad spend over time' : 'Paid and failed orders per day'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setChartView('revenue')}
                  className={`date-pill ${chartView === 'revenue' ? 'active' : ''}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setChartView('orders')}
                  className={`date-pill ${chartView === 'orders' ? 'active' : ''}`}
                >
                  Orders
                </button>
              </div>
            </div>

            <div className="chart-area" style={{ minHeight: 260 }}>
              {loading ? (
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              ) : chartView === 'revenue' ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRevOv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => v.substring(5)} />
                    <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                      formatter={(value: any, name: any) => [formatINR(value), name === 'revenue' ? 'Revenue' : 'Orders']}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Legend formatter={(v) => v === 'revenue' ? 'Gross Revenue' : 'Orders'} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--indigo)" fill="url(#colorRevOv)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={orderTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => v.substring(5)} />
                    <YAxis stroke="var(--text-3)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Paid Orders" fill="var(--emerald)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── P&L Waterfall ── */}
        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <h2 className="chart-title">P&L Waterfall</h2>
              <div className="chart-subtitle">Gross Revenue → Deductions → Net Profit</div>
            </div>
            <WaterfallRow label="REVENUE" value="" isHeader />
            <WaterfallRow label="Gross Revenue" value={formatINR(pl.grossRevenue || 0)} type="positive" indent />
            <WaterfallRow label="− Refunds" value={`-${formatINR(pl.refunds || 0)}`} type="negative" indent />
            <WaterfallRow label="Net Sales" value={formatINR(pl.netSales || 0)} type="neutral" isTotal />
            <WaterfallRow label="COSTS" value="" isHeader />
            <WaterfallRow label="− Razorpay Fees" value={`-${formatINR(pl.razorpayFees || 0)}`} type="negative" indent />
            <WaterfallRow label="− Razorpay GST (18%)" value={`-${formatINR(pl.razorpayGST || 0)}`} type="negative" indent />
            <WaterfallRow label="− Meta Media Spend" value={`-${formatINR(pl.metaMediaSpend || 0)}`} type="negative" indent />
            <WaterfallRow label="− Meta GST (18%)" value={`-${formatINR(pl.metaGST || 0)}`} type="negative" indent />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              background: (pl.actualProfit || 0) >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              borderTop: `1px solid ${(pl.actualProfit || 0) >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-1)' }}>= ACTUAL PROFIT</div>
              <div style={{
                fontWeight: 800, fontSize: '1.1rem',
                color: (pl.actualProfit || 0) >= 0 ? 'var(--emerald)' : 'var(--rose)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatINR(pl.actualProfit || 0)}
              </div>
            </div>
          </div>

          {/* Key Ratios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Profit Margin', value: formatPercent(pl.profitMargin || 0), color: (pl.profitMargin || 0) >= 0 ? 'var(--emerald)' : 'var(--rose)', sub: 'Net Profit ÷ Gross Revenue' },
              { label: 'Cash ROAS', value: `${(pl.cashRoas || 0).toFixed(2)}x`, color: 'var(--indigo-2)', sub: 'Revenue ÷ Total Marketing Cash' },
              { label: 'Media ROAS', value: `${(pl.roas || 0).toFixed(2)}x`, color: 'var(--sky)', sub: 'Revenue ÷ Pure Media Spend' },
              { label: 'MER', value: `${(pl.mer || 0).toFixed(2)}x`, color: 'var(--amber)', sub: 'Marketing Efficiency Ratio' },
              { label: 'CPA / CAC', value: formatINR(cpa), color: 'var(--violet)', sub: 'Total Cost ÷ Paid Orders' },
              { label: 'Avg Order Value', value: formatINR(aov), color: 'var(--text-1)', sub: 'Revenue ÷ Successful Orders' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flex: 1,
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
                  {loading ? '—' : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
