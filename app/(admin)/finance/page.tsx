'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatINR, formatNumber, formatPercent } from '@/lib/finance';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line, ReferenceLine
} from 'recharts';
import { Calculator, Wallet, Plus, Trash2, TrendingUp } from 'lucide-react';

export default function FinancePage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Top-up Form State
  const [topupAmount, setTopupAmount] = useState('');
  const [topupDate, setTopupDate] = useState('');
  const [addingTopup, setAddingTopup] = useState(false);

  const fetchFinance = () => {
    setLoading(true);
    fetch(`/api/finance?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFinance();
  }, [period]);

  const pl = data?.pl;
  const wallet = data?.wallet;

  // Break-even calculations
  const breakEvenCPA = pl?.metaMediaSpend > 0 && pl?.netSales > 0
    ? pl.metaMediaSpend / (pl.netSales / (pl.grossRevenue / Math.max((data?.totalOrders || 1), 1)))
    : 0;
  const breakEvenROAS = pl?.razorpayFees != null
    ? 1 / (1 - (pl.razorpayFees + pl.razorpayGST) / Math.max(pl.grossRevenue, 1))
    : 0;

  // Simulate trend data from dailyRevenue if available
  const trendData = data?.dailyRevenue || [];

  const handleAddTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTopup(true);
    await fetch('/api/meta/topups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(topupAmount),
        date: topupDate ? new Date(topupDate) : new Date(),
        reference: 'Manual Entry'
      })
    });
    setTopupAmount('');
    setAddingTopup(false);
    fetchFinance();
  };

  const handleDeleteTopup = async (id: string) => {
    if (!confirm('Delete this top-up?')) return;
    await fetch(`/api/meta/topups?id=${id}`, { method: 'DELETE' });
    fetchFinance();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profit & Finance Center</h1>
          <p className="page-subtitle">Strict cash-based P&L, break-even analytics & wallet reconciliation</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">

        {/* ── Top KPI Row ── */}
        <div className="kpi-grid">
          <KPICard
            label="Actual Profit"
            value={formatINR(pl?.actualProfit || 0)}
            highlight={true}
            highlightMode={(pl?.actualProfit || 0) >= 0 ? 'success' : 'danger'}
            subtext={`Margin: ${formatPercent(pl?.profitMargin || 0)}`}
            loading={loading}
          />
          <KPICard label="Gross Revenue" value={formatINR(pl?.grossRevenue || 0)} loading={loading} />
          <KPICard label="Net Sales (After Refunds)" value={formatINR(pl?.netSales || 0)} loading={loading} />
          <KPICard label="Total Costs" value={formatINR(pl?.totalCosts || 0)} loading={loading} />
          <KPICard label="Cash ROAS" value={`${(pl?.cashRoas || 0).toFixed(2)}x`} loading={loading} />
          <KPICard label="MER" value={`${(pl?.mer || 0).toFixed(2)}x`} loading={loading} />
        </div>

        {/* ── Revenue Trend Chart ── */}
        {trendData.length > 0 && (
          <div className="chart-card" style={{ marginTop: 8 }}>
            <h2 className="chart-title">Revenue, Spend & Profit Trend</h2>
            <div className="chart-subtitle">Daily financial performance over the selected period</div>
            <div className="chart-area" style={{ minHeight: 260 }}>
              {loading ? (
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRevFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--indigo)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--indigo)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => v.substring(5)} />
                    <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                      formatter={(value: any) => [formatINR(value), '']}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--indigo)" fill="url(#colorRevFin)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: trendData.length > 0 ? 16 : 0 }}>
          {/* P&L Statement */}
          <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="chart-title">Profit & Loss Statement</h2>
                <div className="chart-subtitle">Cash-Based Analysis (INR)</div>
              </div>
              <Calculator size={18} style={{ opacity: 0.4 }} />
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 20 }}>
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 4 }} />)}
              </div>
            ) : (
              <div>
                {/* Revenue Section */}
                <div style={{ background: 'var(--bg-surface)', padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>REVENUE</div>
                </div>
                <div className="pl-row">
                  <div className="pl-label indent">Gross Razorpay Revenue</div>
                  <div className="pl-amount">{formatINR(pl?.grossRevenue || 0)}</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">− Refunds</div>
                  <div className="pl-amount">-{formatINR(pl?.refunds || 0)}</div>
                </div>
                <div className="pl-row total">
                  <div className="pl-label">Net Sales</div>
                  <div className="pl-amount">{formatINR(pl?.netSales || 0)}</div>
                </div>

                {/* Processing Fees */}
                <div style={{ background: 'var(--bg-surface)', padding: '8px 20px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PROCESSING FEES</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">− Razorpay Fees (~2%)</div>
                  <div className="pl-amount">-{formatINR(pl?.razorpayFees || 0)}</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">− GST on Razorpay (18%)</div>
                  <div className="pl-amount">-{formatINR(pl?.razorpayGST || 0)}</div>
                </div>
                <div className="pl-row total">
                  <div className="pl-label">Net Razorpay Revenue</div>
                  <div className="pl-amount">{formatINR(pl?.netRazorpayRevenue || 0)}</div>
                </div>

                {/* Advertising */}
                <div style={{ background: 'var(--bg-surface)', padding: '8px 20px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ADVERTISING COST</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">− Meta Media Spend</div>
                  <div className="pl-amount">-{formatINR(pl?.metaMediaSpend || 0)}</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">− GST on Meta Ads (18%)</div>
                  <div className="pl-amount">-{formatINR(pl?.metaGST || 0)}</div>
                </div>
                <div className="pl-row total">
                  <div className="pl-label">Total Meta Cash Cost</div>
                  <div className="pl-amount">-{formatINR(pl?.totalMetaCashCost || 0)}</div>
                </div>

                {/* Final */}
                <div className={`pl-row ${pl?.actualProfit >= 0 ? 'positive' : 'negative'}`} style={{ padding: '18px 20px', background: pl?.actualProfit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', borderTop: `1px solid ${pl?.actualProfit >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}` }}>
                  <div className="pl-label" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-1)' }}>= ACTUAL PROFIT</div>
                  <div className="pl-amount" style={{ fontSize: '1.2rem', color: pl?.actualProfit >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>{formatINR(pl?.actualProfit || 0)}</div>
                </div>
              </div>
            )}

            {/* Key Ratios */}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 20, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                {[
                  { label: 'Profit Margin', value: formatPercent(pl?.profitMargin || 0), color: pl?.profitMargin >= 0 ? 'var(--emerald)' : 'var(--rose)' },
                  { label: 'Cash ROAS', value: `${(pl?.cashRoas || 0).toFixed(2)}x`, color: 'var(--indigo-2)' },
                  { label: 'Media ROAS', value: `${(pl?.roas || 0).toFixed(2)}x`, color: 'var(--sky)' },
                  { label: 'MER', value: `${(pl?.mer || 0).toFixed(2)}x`, color: 'var(--amber)' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Break-Even Calculator */}
            <div className="chart-card" style={{ flex: '0 0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={18} style={{ color: 'var(--indigo)' }} />
                <div>
                  <h2 className="chart-title">Break-Even Analysis</h2>
                  <div className="chart-subtitle" style={{ margin: 0 }}>Minimum performance required to break even</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Break-Even ROAS', value: breakEvenROAS > 0 ? `${breakEvenROAS.toFixed(2)}x` : 'N/A', sub: 'Min ROAS to cover processing fees', color: 'var(--amber)' },
                  { label: 'Current Cash ROAS', value: `${(pl?.cashRoas || 0).toFixed(2)}x`, sub: 'vs break-even', color: (pl?.cashRoas || 0) > breakEvenROAS ? 'var(--emerald)' : 'var(--rose)' },
                  { label: 'Total Ad Cash Spent', value: formatINR(pl?.totalMetaCashCost || 0), sub: 'Media spend + 18% GST', color: 'var(--rose)' },
                  { label: 'Net Revenue (Settlement)', value: formatINR(pl?.netRazorpayRevenue || 0), sub: 'After Razorpay fees & GST', color: 'var(--emerald)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)' }}>{item.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{item.sub}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Wallet Reconciliation */}
            <div className="chart-card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 className="chart-title">Meta Wallet</h2>
                  <div className="chart-subtitle" style={{ margin: 0 }}>Track actual cash added vs consumed</div>
                </div>
                <Wallet size={18} style={{ color: 'var(--indigo)', opacity: 0.7 }} />
              </div>

              {loading ? (
                <div className="skeleton" style={{ height: 120 }} />
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Added', value: formatINR(wallet?.totalAdded || 0), color: 'var(--emerald)' },
                      { label: 'Consumed', value: formatINR(wallet?.totalConsumed || 0), color: 'var(--rose)' },
                      { label: 'Balance', value: formatINR(wallet?.closingBalance || 0), color: 'var(--indigo-2)' },
                    ].map(item => (
                      <div key={item.label} style={{ flex: 1, padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddTopup} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      type="date"
                      value={topupDate}
                      onChange={e => setTopupDate(e.target.value)}
                      className="input"
                      style={{ width: 140, flexShrink: 0 }}
                    />
                    <input
                      type="number"
                      placeholder="₹ Amount Paid (inc. GST)"
                      value={topupAmount}
                      onChange={e => setTopupAmount(e.target.value)}
                      required
                      className="input"
                    />
                    <button type="submit" disabled={addingTopup} className="btn btn-primary">
                      <Plus size={14} />
                    </button>
                  </form>

                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {wallet?.topups?.length === 0 && (
                      <div style={{ padding: 12, color: 'var(--text-3)', fontSize: '0.78rem', textAlign: 'center' }}>No top-ups in this period</div>
                    )}
                    {wallet?.topups?.map((t: any) => (
                      <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', borderRadius: 6, marginBottom: 4 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{formatINR(t.amount)}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{new Date(t.date).toLocaleDateString()} · Budget: {formatINR(t.media_budget_added)} · GST: {formatINR(t.gst_amount)}</div>
                        </div>
                        <button onClick={() => handleDeleteTopup(t._id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
