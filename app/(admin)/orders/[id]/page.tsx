'use client';
import { useEffect, useState, use } from 'react';
import { ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatINR } from '@/lib/finance';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-body"><div className="skeleton" style={{ height: 400 }}></div></div>;
  if (!data?.order) return <div className="page-body"><div className="empty-state">Order not found</div></div>;

  const { order, events } = data;
  const c = order.customer_details || {};

  return (
    <div>
      <div className="page-header" style={{ justifyContent: 'flex-start' }}>
        <Link href="/orders" className="btn btn-ghost" style={{ padding: '6px 10px', marginRight: 16 }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title">Order Details</h1>
          <p className="page-subtitle mono">{order.order_id}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className={`badge ${order.status === 'paid' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kpi-label">Customer Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} className="icon" style={{ opacity: 0.5 }} /> <span style={{ fontWeight: 600 }}>{c.name || 'Unknown'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} className="icon" style={{ opacity: 0.5 }} /> <span>{c.phone || '—'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} className="icon" style={{ opacity: 0.5 }} /> <span>{c.gender || '—'}</span></div>
          </div>
          
          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kpi-label">Birth Details</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={14} className="icon" style={{ opacity: 0.5 }} /> <span>{c.dob_day}/{c.dob_month}/{c.dob_year}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={14} className="icon" style={{ opacity: 0.5 }} /> <span>Time: {c.tob_hour ? `${c.tob_hour}:${c.tob_min}` : 'Not provided'}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} className="icon" style={{ opacity: 0.5 }} /> <span>{c.pob || 'Not provided'}</span></div>
          </div>

          <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kpi-label">Transaction</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={14} className="icon" style={{ opacity: 0.5 }} /> <span className="val-strong">{formatINR(order.amount)}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={14} className="icon" style={{ opacity: 0.5 }} /> <span className={`badge ${c.type === 'ultimate' ? 'badge-violet' : 'badge-neutral'}`} style={{ textTransform: 'uppercase' }}>{c.type}</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Razorpay ID: <span className="mono">{order.payment_id || '—'}</span></div>
          </div>
        </div>

        <div className="chart-card">
          <h2 className="chart-title" style={{ marginBottom: 20 }}>Session Timeline</h2>
          {events && events.length > 0 ? (
            <div style={{ borderLeft: '2px solid var(--border)', marginLeft: 16, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {events.map((e: any, i: number) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -31, top: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--indigo)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>{e.event_name}</div>
                      {e.question_id && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>Answered: <span style={{ color: 'var(--indigo-2)' }}>{e.answer_value}</span></div>}
                      {e.amount && <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>Amount: {formatINR(e.amount)}</div>}
                      {e.utm_source && <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 4 }}>Source: {e.utm_source}</div>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p>No detailed event tracking found for this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
