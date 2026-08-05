'use client';
import { useEffect, useState } from 'react';
import { HeartPulse, Database, CreditCard, Zap, CheckCircle, XCircle } from 'lucide-react';

export default function HealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'connected' || status === 'healthy') return <CheckCircle size={20} color="var(--emerald)" />;
    if (status === 'error_or_not_configured') return <XCircle size={20} color="var(--amber)" />;
    return <XCircle size={20} color="var(--rose)" />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Integration Health</h1>
          <p className="page-subtitle">Real-time status of all external connections</p>
        </div>
        {data && (
          <div className={`badge ${data.status === 'healthy' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '6px 12px' }}>
            System Status: {data.status}
          </div>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <div className="grid-3">
            <div className="skeleton" style={{ height: 160 }}></div>
            <div className="skeleton" style={{ height: 160 }}></div>
            <div className="skeleton" style={{ height: 160 }}></div>
          </div>
        ) : (
          <div className="grid-3">
            {/* MongoDB */}
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={24} style={{ color: 'var(--indigo)' }} />
                  <div>
                    <h2 className="chart-title">MongoDB</h2>
                    <div className="chart-subtitle" style={{ margin: 0 }}>Primary Database</div>
                  </div>
                </div>
                <StatusIcon status={data?.integrations?.mongodb?.status} />
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Orders Sync</span> <span style={{ color: 'var(--text-1)' }}>{data?.integrations?.mongodb?.stats?.orderCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Events Stored</span> <span style={{ color: 'var(--text-1)' }}>{data?.integrations?.mongodb?.stats?.eventCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Razorpay */}
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={24} style={{ color: 'var(--sky)' }} />
                  <div>
                    <h2 className="chart-title">Razorpay API</h2>
                    <div className="chart-subtitle" style={{ margin: 0 }}>Payment Gateway</div>
                  </div>
                </div>
                <StatusIcon status={data?.integrations?.razorpay?.status} />
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Environment</span> <span className="badge badge-danger">LIVE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Webhook Status</span> <span style={{ color: 'var(--emerald)' }}>Active</span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={24} style={{ color: 'var(--indigo-2)' }} />
                  <div>
                    <h2 className="chart-title">Meta Marketing</h2>
                    <div className="chart-subtitle" style={{ margin: 0 }}>Ads API</div>
                  </div>
                </div>
                <StatusIcon status={data?.integrations?.meta?.status} />
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-2)' }}>
                {data?.integrations?.meta?.status === 'connected' ? (
                  <div style={{ color: 'var(--emerald)' }}>Token valid. Connection active.</div>
                ) : (
                  <div style={{ color: 'var(--amber)' }}>Token not configured or invalid. See Meta Ads page for instructions.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
