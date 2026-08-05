'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import FunnelChart from '@/components/FunnelChart';
import KPICard from '@/components/KPICard';

export default function FunnelPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/funnel?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Funnel Analytics</h1>
          <p className="page-subtitle">Track conversion drop-off across the user journey</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        <div className="kpi-grid">
          <KPICard label="Quiz Start Rate" value={(data?.summary?.landingToQuiz || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Checkout Reach Rate" value={(data?.summary?.quizToCheckout || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Payment Conv Rate" value={(data?.summary?.checkoutToPurchase || 0).toFixed(1)} suffix="%" loading={loading} />
          <KPICard label="Overall Conv Rate" value={(data?.summary?.overallConversion || 0).toFixed(2)} suffix="%" loading={loading} />
        </div>

        <div className="chart-card" style={{ marginTop: 24 }}>
          <h2 className="chart-title">Primary Funnel</h2>
          <div className="chart-subtitle">User flow from landing to purchase completion</div>
          
          <div style={{ marginTop: 32 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[90, 70, 50, 40, 30, 20, 10, 5].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 36, width: `${w}%`, borderRadius: 6 }} />
                ))}
              </div>
            ) : (
              <FunnelChart data={data?.funnel || []} />
            )}
          </div>
        </div>
        
        <div className="alert-banner info" style={{ maxWidth: 800 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div>
            <strong>Note on tracking:</strong> Funnel tracking only measures events that occur within the same browser session. Some users may clear cookies or switch devices before purchasing, which affects checkout-to-purchase ratios.
          </div>
        </div>
      </div>
    </div>
  );
}
