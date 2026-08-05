'use client';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  subtext?: string;
  loading?: boolean;
}

export default function KPICard({ label, value, change, prefix = '', suffix = '', subtext, loading }: KPICardProps) {
  if (loading) {
    return (
      <div className="kpi-card">
        <div className="kpi-label">{label}</div>
        <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 6 }}></div>
        <div className="skeleton" style={{ height: 14, width: '40%' }}></div>
      </div>
    );
  }

  let changeColor = 'neutral';
  let ChangeIcon = Minus;
  
  if (change !== undefined) {
    if (change > 0) { changeColor = 'up'; ChangeIcon = ArrowUpRight; }
    else if (change < 0) { changeColor = 'down'; ChangeIcon = ArrowDownRight; }
  }

  return (
    <div className="kpi-card">
      <div className="kpi-card-accent" style={{ background: `linear-gradient(90deg, var(--bg-hover), var(--${changeColor === 'up' ? 'emerald' : changeColor === 'down' ? 'rose' : 'indigo'}))` }} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{prefix}{value}{suffix}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {change !== undefined && (
          <div className={`kpi-change ${changeColor}`}>
            <ChangeIcon size={12} />
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
        {subtext && <div className="kpi-sub">{subtext}</div>}
      </div>
    </div>
  );
}
