'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import FunnelChart from '@/components/FunnelChart';
import KPICard from '@/components/KPICard';
import { AlertTriangle } from 'lucide-react';

const CATEGORIES = ['All', 'personal', 'business', 'relationship', 'health', 'career'];

export default function FunnelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const period = searchParams.get('period') || '30d';
  const category = searchParams.get('category') || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = `/api/funnel?period=${period}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, category]);

  function setCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat && cat !== 'All') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  }

  const funnel = data?.funnel || [];
  const summary = data?.summary || {};

  // Find biggest drop-off step
  let biggestDropIdx = -1;
  let biggestDrop = 0;
  funnel.forEach((step: any, i: number) => {
    if (i > 0 && step.dropoffRate > biggestDrop) {
      biggestDrop = step.dropoffRate;
      biggestDropIdx = i;
    }
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Funnel Analytics</h1>
          <p className="page-subtitle">Complete customer journey from landing to purchase</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {/* ── KPI Summary ── */}
        <div className="kpi-grid">
          <KPICard label="Landing → Quiz" value={(summary.landingToQuiz || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Quiz → Checkout" value={(summary.quizToCheckout || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Checkout → Purchase" value={(summary.checkoutToPurchase || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Overall Conv. Rate" value={(summary.overallConversion || 0).toFixed(2)} suffix="%" loading={loading} />
        </div>

        {/* ── Category Filter ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>Filter by Category:</span>
          <div className="date-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`date-pill ${(category === cat || (cat === 'All' && !category)) ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Biggest Drop-Off Alert ── */}
        {!loading && biggestDropIdx > 0 && biggestDrop > 30 && (
          <div className="alert-banner warning" style={{ marginBottom: 16, maxWidth: 700 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Biggest Drop-off:</strong> You lose {biggestDrop.toFixed(1)}% of users at
              "{funnel[biggestDropIdx]?.label}" (Step {biggestDropIdx + 1}).
              This is your highest priority optimization opportunity.
            </div>
          </div>
        )}

        {/* ── Funnel Chart ── */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="chart-title">User Journey Funnel</h2>
              <div className="chart-subtitle">Users at each step · click-through & drop-off rates</div>
            </div>
            {category && (
              <span className="badge badge-violet" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                Category: {category}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[95, 80, 65, 55, 45, 35, 25, 18, 12, 8, 5].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 36, width: `${w}%`, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <div>
              {/* Enhanced Funnel with drop-off highlighting */}
              {funnel.length === 0 ? (
                <div className="empty-state">
                  <p>No funnel data for this period or category</p>
                </div>
              ) : (
                <div style={{ maxWidth: 900 }}>
                  {funnel.map((step: any, idx: number) => {
                    const maxUsers = funnel[0]?.users || 1;
                    const width = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
                    const isBiggestDrop = idx === biggestDropIdx;

                    return (
                      <div key={step.step} className="funnel-step" style={{ marginBottom: isBiggestDrop ? 12 : 8 }}>
                        <div className="funnel-label" style={{ color: isBiggestDrop ? 'var(--amber)' : undefined }}>
                          {step.label}
                        </div>
                        <div className="funnel-bar-wrap" style={{ border: isBiggestDrop ? '1px solid rgba(245,158,11,0.4)' : 'none' }}>
                          <div
                            className="funnel-bar-fill"
                            style={{
                              width: `${Math.max(width, 2)}%`,
                              background: isBiggestDrop
                                ? 'linear-gradient(90deg, var(--amber), var(--rose))'
                                : 'linear-gradient(90deg, var(--indigo), var(--violet))',
                            }}
                          >
                            {step.users > 0 && width > 15 ? step.users.toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="funnel-count">{step.users.toLocaleString()}</div>
                        <div className="funnel-pct" style={{ color: idx > 0 && step.conversionRate < 50 ? 'var(--rose)' : 'var(--text-3)' }}>
                          {idx === 0 ? '100%' : `${step.conversionRate.toFixed(1)}%`}
                        </div>
                        {idx > 0 && step.dropoffRate > 20 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--rose)', width: 55, textAlign: 'right', flexShrink: 0 }}>
                            −{step.dropoffRate.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="alert-banner info" style={{ maxWidth: 800 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>Note on tracking:</strong> Funnel tracks events within browser sessions. Users who clear cookies or switch devices before purchasing may undercount checkout-to-purchase conversion.
          </div>
        </div>
      </div>
    </div>
  );
}
