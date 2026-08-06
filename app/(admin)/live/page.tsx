'use client';
import { useEffect, useState, useRef } from 'react';
import { Clock, ShoppingCart, XCircle, Activity, Radio } from 'lucide-react';
import Link from 'next/link';
import { formatINR } from '@/lib/finance';

type EventFeedItem = {
  id: string;
  type: 'purchase' | 'failure' | 'session' | 'event';
  message: string;
  time: Date;
  amount?: number;
  meta?: any;
};

const stepLabels: Record<string, string> = {
  page_view: 'Viewing Landing Page',
  quiz_start: 'Started Quiz',
  question_view_1: 'Q1: Chose Category',
  question_view_2: 'Q2: Sub-question',
  question_view_3: 'Q3: Details',
  question_view_4: 'Q4: More Info',
  question_view_5: 'Q5: Birth Day',
  question_view_6: 'Q6: Birth Month',
  question_view_7: 'Q7: Birth Year',
  question_view_8: 'Q8: Name',
  question_view_9: 'Q9: Gender',
  question_view_10: 'Q10: Phone',
  analysis_start: 'Running Analysis',
  checkout_view: 'Viewing Checkout',
  payment_initiated: 'Initiating Payment',
  payment_success: 'Completed Purchase',
  report_view: 'Reading Report',
};

function getFunnelColor(step: string): string {
  if (step === 'payment_success') return 'var(--emerald)';
  if (step === 'payment_initiated' || step === 'checkout_view') return 'var(--amber)';
  if (step === 'analysis_start') return 'var(--indigo-2)';
  if (step?.startsWith('question_view')) return 'var(--sky)';
  return 'var(--text-3)';
}

export default function LivePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<EventFeedItem[]>([]);
  const [connected, setConnected] = useState(false);
  const eventsRef = useRef<EventFeedItem[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/live');

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const sessionList = Array.isArray(data) ? data : data.sessions || [];
        setSessions(sessionList);

        // Infer event feed items from sessions
        const newFeedItems: EventFeedItem[] = [];
        const now = new Date();

        sessionList.forEach((s: any) => {
          if (s.lastEvent === 'payment_success') {
            const existing = eventsRef.current.find(e => e.id === `pay_${s._id}`);
            if (!existing) {
              newFeedItems.push({
                id: `pay_${s._id}`,
                type: 'purchase',
                message: `New purchase — ${s.category || 'Unknown'} category`,
                time: new Date(s.lastSeen),
                meta: s,
              });
            }
          }
        });

        if (newFeedItems.length > 0) {
          const updated = [...newFeedItems, ...eventsRef.current].slice(0, 30);
          eventsRef.current = updated;
          setEvents([...updated]);
        }
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Count sessions by funnel stage
  const funnelStages = {
    'Early (Landing/Quiz)': sessions.filter(s => ['page_view', 'quiz_start'].includes(s.lastEvent)).length,
    'Questions (Q1–Q10)': sessions.filter(s => s.lastEvent?.startsWith('question_view')).length,
    'Analysis/Checkout': sessions.filter(s => ['analysis_start', 'checkout_view'].includes(s.lastEvent)).length,
    'Paying': sessions.filter(s => s.lastEvent === 'payment_initiated').length,
    'Converted': sessions.filter(s => s.lastEvent === 'payment_success').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Live Activity
            {connected ? (
              <span className="live-indicator">
                <span className="live-dot" />
                Live
              </span>
            ) : (
              <span className="badge badge-warning">Connecting...</span>
            )}
          </h1>
          <p className="page-subtitle">Real-time users currently in the funnel (last 5 mins)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{sessions.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>active users</div>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* ── Funnel Stage Distribution ── */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {Object.entries(funnelStages).map(([stage, count]) => (
            <div key={stage} className="kpi-card">
              <div className="kpi-card-accent" style={{ background: 'linear-gradient(90deg, var(--bg-hover), var(--indigo))' }} />
              <div className="kpi-label">{stage}</div>
              <div className="kpi-value">{count}</div>
              <div className="kpi-sub">
                {sessions.length > 0 ? `${((count / sessions.length) * 100).toFixed(0)}% of active` : 'No active users'}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginTop: 16 }}>
          {/* ── Active Sessions ── */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className="chart-title">Active Sessions</h2>
                <div className="chart-subtitle" style={{ margin: 0 }}>{sessions.length} users active right now</div>
              </div>
              <Activity size={18} style={{ opacity: 0.4 }} />
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <Clock size={36} style={{ opacity: 0.2 }} />
                <h3 style={{ marginTop: 12 }}>No active users</h3>
                <p>Waiting for traffic...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                {sessions.map((s: any) => {
                  const isPaid = s.lastEvent === 'payment_success';
                  const isCheckout = s.lastEvent === 'checkout_view' || s.lastEvent === 'payment_initiated';
                  const stepColor = getFunnelColor(s.lastEvent);

                  return (
                    <div
                      key={s._id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isPaid ? 'rgba(16,185,129,0.4)' : isCheckout ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                        borderRadius: 8,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: stepColor, flexShrink: 0, boxShadow: isPaid ? '0 0 6px var(--emerald)' : 'none' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.82rem' }}>
                            {stepLabels[s.lastEvent] || s.lastEvent || 'Unknown step'}
                          </span>
                          {isPaid && <span className="badge badge-success" style={{ fontSize: '0.55rem' }}>CONVERTED</span>}
                          {isCheckout && !isPaid && <span className="badge badge-warning" style={{ fontSize: '0.55rem' }}>HIGH INTENT</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span>{s.device || 'Unknown device'}</span>
                          {s.category && <span>· {s.category}</span>}
                          <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', opacity: 0.6 }}>{String(s._id).slice(-8)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Last seen</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-1)', fontWeight: 600 }}>
                          {new Date(s.lastSeen).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Recent Events Feed ── */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className="chart-title">Recent Events Feed</h2>
                <div className="chart-subtitle" style={{ margin: 0 }}>Purchases, failures & notable actions</div>
              </div>
              <Radio size={18} style={{ opacity: 0.4 }} />
            </div>

            {events.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <Radio size={36} style={{ opacity: 0.2 }} />
                <h3 style={{ marginTop: 12 }}>Waiting for events...</h3>
                <p>Purchases and significant actions will appear here in real-time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                {events.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-surface)',
                      border: `1px solid ${e.type === 'purchase' ? 'rgba(16,185,129,0.3)' : e.type === 'failure' ? 'rgba(244,63,94,0.3)' : 'var(--border)'}`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {e.type === 'purchase' ? (
                        <ShoppingCart size={16} style={{ color: 'var(--emerald)' }} />
                      ) : e.type === 'failure' ? (
                        <XCircle size={16} style={{ color: 'var(--rose)' }} />
                      ) : (
                        <Activity size={16} style={{ color: 'var(--indigo)' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{e.message}</div>
                      {e.amount && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600 }}>
                          {formatINR(e.amount)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {e.time.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
