'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';

const CATEGORIES = ['All', 'personal', 'business', 'relationship', 'health', 'career'];

// Gradient colors for answer bars by rank
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#94a3b8'];

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const period = searchParams.get('period') || '30d';
  const category = searchParams.get('category') || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = `/api/questions?period=${period}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
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

  const questions = data?.questions || {};
  const questionKeys = Object.keys(questions);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Q&A Analytics</h1>
          <p className="page-subtitle">User responses, answer distribution & purchase conversion by answer</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
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

        {loading ? (
          <div className="grid-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="chart-card skeleton" style={{ height: 280, border: 'none' }} />
            ))}
          </div>
        ) : questionKeys.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-md)', borderRadius: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 16, opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>No Q&A Data Available</h3>
            <p>Wait for users to complete the quiz, or ensure event tracking is configured.</p>
          </div>
        ) : (
          <div className="grid-2">
            {questionKeys.map((qId) => {
              const qData = questions[qId];
              const maxCount = Math.max(...(qData.answers || []).map((a: any) => a.count || 0), 1);

              return (
                <div key={qId} className="chart-card" style={{ marginBottom: 0 }}>
                  {/* Question Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <h2 className="chart-title" style={{ marginBottom: 4 }}>{qId}</h2>
                      {qData.category && (
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {qData.category}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                        {(qData.totalAnswers || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 2 }}>total answers</div>
                    </div>
                  </div>

                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Responses</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Share</div>
                  </div>

                  {/* Answer Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(qData.answers || []).map((ans: any, idx: number) => {
                      const widthPct = maxCount > 0 ? (ans.count / maxCount) * 100 : 0;
                      const color = BAR_COLORS[idx % BAR_COLORS.length];
                      const isTop = idx === 0;

                      return (
                        <div key={idx} style={{ position: 'relative' }}>
                          {/* Bar background */}
                          <div style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0,
                            width: `${widthPct}%`,
                            background: `${color}18`,
                            borderRadius: 6,
                            transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
                          }} />

                          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 80px 60px', gap: 8, padding: '8px 10px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: isTop ? `0 0 6px ${color}` : 'none' }} />
                              <span style={{ fontWeight: isTop ? 700 : 500, color: isTop ? 'var(--text-1)' : 'var(--text-2)', fontSize: '0.82rem' }}>
                                {ans.value}
                              </span>
                              {isTop && (
                                <span style={{ fontSize: '0.55rem', background: `${color}25`, color, padding: '2px 6px', borderRadius: '100px', fontWeight: 700 }}>
                                  TOP
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-1)', fontSize: '0.82rem' }}>
                              {(ans.count || 0).toLocaleString()}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.78rem', color, fontWeight: 600 }}>
                              {(ans.percentage || 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom stat row */}
                  {qData.totalAnswers > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      <span>{(qData.answers || []).length} unique answers</span>
                      <span>Top: <strong style={{ color: 'var(--text-2)' }}>{qData.answers?.[0]?.value || '—'}</strong> ({(qData.answers?.[0]?.percentage || 0).toFixed(1)}%)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
