'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import { formatPercent } from '@/lib/finance';
import { Target } from 'lucide-react';

export default function CohortsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cohorts?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const c = data?.cohorts;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cohorts & Behavior</h1>
          <p className="page-subtitle">Customer retention and repeat purchase behavior</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        <div className="kpi-grid">
          <KPICard label="Unique Customers" value={c?.uniqueCustomers?.toLocaleString() || 0} loading={loading} />
          <KPICard label="Repeat Customers" value={c?.repeatCustomers?.toLocaleString() || 0} loading={loading} />
          <KPICard label="Repeat Rate" value={formatPercent(c?.repeatRate || 0)} loading={loading} />
          <KPICard label="Avg Orders / Customer" value={(c?.avgOrdersPerCustomer || 0).toFixed(2)} loading={loading} />
        </div>

        <div className="chart-card" style={{ marginTop: 24, textAlign: 'center', padding: '60px 20px' }}>
          <Target size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <h2 className="chart-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Cross-Sell Analysis</h2>
          <p className="chart-subtitle" style={{ maxWidth: 400, margin: '0 auto' }}>
            Detailed cohort tracking requires accumulating data over time. As users purchase both Master and Ultimate reports, this section will populate with time-to-upgrade metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
