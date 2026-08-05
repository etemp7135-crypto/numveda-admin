'use client';

interface FunnelStep {
  step: string;
  label: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export default function FunnelChart({ data }: { data: FunnelStep[] }) {
  if (!data || data.length === 0) return <div className="empty-state">No funnel data available</div>;

  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div style={{ maxWidth: 800 }}>
      {data.map((step, idx) => {
        const width = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
        return (
          <div key={step.step} className="funnel-step">
            <div className="funnel-label">{step.label}</div>
            <div className="funnel-bar-wrap">
              <div 
                className="funnel-bar-fill" 
                style={{ width: `${Math.max(width, 2)}%` }}
              >
                {step.users > 0 && width > 15 ? step.users.toLocaleString() : ''}
              </div>
            </div>
            <div className="funnel-count">{step.users.toLocaleString()}</div>
            <div className="funnel-pct">
              {idx === 0 ? '100%' : `${step.conversionRate.toFixed(1)}%`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
