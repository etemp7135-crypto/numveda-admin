'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import { formatINR, formatPercent } from '@/lib/finance';
import { Calculator, Wallet, Plus, Trash2 } from 'lucide-react';

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
          <p className="page-subtitle">Strict cash-based P&L and wallet reconciliation</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        <div className="grid-2">
          {/* P&L Statement */}
          <div className="chart-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 className="chart-title">Profit & Loss Statement</h2>
                <div className="chart-subtitle">Cash-Based Analysis (INR)</div>
              </div>
              <Calculator className="icon" style={{ opacity: 0.5 }} />
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
                
                {/* Revenue Section */}
                <div className="pl-row total" style={{ background: 'var(--bg-surface)' }}>
                  <div className="pl-label">REVENUE</div>
                </div>
                <div className="pl-row">
                  <div className="pl-label indent">Gross Razorpay Revenue</div>
                  <div className="pl-amount">{formatINR(pl?.grossRevenue || 0)}</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">Razorpay Fees & GST</div>
                  <div className="pl-amount">-{formatINR((pl?.razorpayFees || 0) + (pl?.razorpayGST || 0))}</div>
                </div>
                <div className="pl-row total">
                  <div className="pl-label">Net Razorpay Revenue</div>
                  <div className="pl-amount">{formatINR(pl?.netRazorpayRevenue || 0)}</div>
                </div>

                <div className="divider" style={{ margin: 0 }} />

                {/* Advertising Section */}
                <div className="pl-row total" style={{ background: 'var(--bg-surface)' }}>
                  <div className="pl-label">ADVERTISING COST</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">Meta Media Spend</div>
                  <div className="pl-amount">-{formatINR(pl?.metaMediaSpend || 0)}</div>
                </div>
                <div className="pl-row negative">
                  <div className="pl-label indent">Meta GST / Taxes (18%)</div>
                  <div className="pl-amount">-{formatINR(pl?.metaGST || 0)}</div>
                </div>
                <div className="pl-row total">
                  <div className="pl-label">Total Meta Cash Cost</div>
                  <div className="pl-amount">-{formatINR(pl?.totalMetaCashCost || 0)}</div>
                </div>

                <div className="divider" style={{ margin: 0 }} />

                {/* Final Section */}
                <div className={`pl-row total ${pl?.actualProfit >= 0 ? 'positive' : 'negative'}`} style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
                  <div className="pl-label" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>ACTUAL PROFIT</div>
                  <div className="pl-amount" style={{ fontSize: '1.2rem' }}>{formatINR(pl?.actualProfit || 0)}</div>
                </div>
              </div>
            )}

            <div className="grid-2" style={{ marginTop: 24 }}>
              <div style={{ padding: 20, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 8 }}>Profit Margin</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: pl?.profitMargin >= 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                  {loading ? '-' : formatPercent(pl?.profitMargin || 0)}
                </div>
              </div>
              <div style={{ padding: 20, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 8 }}>Cash ROAS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--indigo)' }}>
                  {loading ? '-' : (pl?.cashRoas?.toFixed(2) || '0.00') + 'x'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 4 }}>Media ROAS: {pl?.roas?.toFixed(2) || '0.00'}x</div>
              </div>
            </div>
          </div>

          {/* Meta Wallet Reconciliation */}
          <div className="chart-card">
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 className="chart-title">Meta Wallet Reconciliation</h2>
                <div className="chart-subtitle">Track actual cash added vs consumed</div>
              </div>
              <Wallet className="icon" style={{ color: 'var(--indigo)' }} />
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 4 }}>Opening Balance</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatINR(wallet?.openingBalance || 0)}</div>
                  </div>
                  <div style={{ flex: 1, padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 4 }}>Amount Added</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--emerald)' }}>+{formatINR(wallet?.totalAdded || 0)}</div>
                  </div>
                  <div style={{ flex: 1, padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 4 }}>Cost Consumed</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--rose)' }}>-{formatINR(wallet?.totalConsumed || 0)}</div>
                  </div>
                </div>

                <div style={{ padding: 20, background: 'var(--indigo-dark)', borderRadius: 8, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>Estimated Closing Balance</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatINR(wallet?.closingBalance || 0)}</span>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>Add Funds</h3>
                <form onSubmit={handleAddTopup} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <input 
                    type="date" 
                    value={topupDate} 
                    onChange={e => setTopupDate(e.target.value)}
                    style={{ padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-1)' }}
                  />
                  <input 
                    type="number" 
                    placeholder="₹ Amount Paid (inc. GST)" 
                    value={topupAmount} 
                    onChange={e => setTopupAmount(e.target.value)}
                    required
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-1)' }}
                  />
                  <button type="submit" disabled={addingTopup} style={{ padding: '8px 16px', background: 'var(--indigo)', color: 'white', borderRadius: 6, border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Plus size={16} /> Add
                  </button>
                </form>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-2)' }}>Recent Top-ups (Selected Period)</h3>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {wallet?.topups?.length === 0 && <div style={{ padding: 16, color: 'var(--text-3)', fontSize: '0.8rem', textAlign: 'center' }}>No top-ups found in this period.</div>}
                  {wallet?.topups?.map((t: any) => (
                    <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{formatINR(t.amount)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{new Date(t.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 16 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>Budget: {formatINR(t.media_budget_added)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>GST: {formatINR(t.gst_amount)}</div>
                      </div>
                      <button onClick={() => handleDeleteTopup(t._id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={16} />
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
  );
}
