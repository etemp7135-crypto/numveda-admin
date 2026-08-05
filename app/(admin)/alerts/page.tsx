'use client';
import { useEffect, useState } from 'react';
import { Bell, Download } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => { setAlerts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Alerts</h1>
          <p className="page-subtitle">Automated anomaly detection and system alerts</p>
        </div>
        <button className="btn btn-primary"><Download size={14} /> Export All Data (CSV)</button>
      </div>

      <div className="page-body">
        <div className="chart-card" style={{ maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="chart-title">System Alerts</h2>
            <Bell size={18} style={{ opacity: 0.5 }} />
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 200 }}></div>
          ) : alerts.length === 0 ? (
            <div className="empty-state">No active alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.map(a => (
                <div key={a.id} className={`alert-banner ${a.type}`} style={{ margin: 0, padding: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {a.type === 'danger' ? 'Critical Alert' : a.type === 'warning' ? 'Warning' : 'Information'}
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>{a.message}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, whiteSpace: 'nowrap' }}>
                    {new Date(a.time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
