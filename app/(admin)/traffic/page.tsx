'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import { formatINR, formatPercent } from '@/lib/finance';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const SOURCE_COLORS: Record<string, string> = {
  direct: '#6366f1',
  facebook: '#3b5998',
  instagram: '#e1306c',
  google: '#34a853',
  organic: '#10b981',
  meta: '#0ea5e9',
  referral: '#f59e0b',
  email: '#8b5cf6',
  other: '#4b5563',
};

function getSourceColor(source: string): string {
  const key = source?.toLowerCase() || 'other';
  for (const k of Object.keys(SOURCE_COLORS)) {
    if (key.includes(k)) return SOURCE_COLORS[k];
  }
  return SOURCE_COLORS.other;
}

const DEVICE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'];

export default function TrafficPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traffic?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const traffic = data?.traffic || [];
  const devices = data?.devices || [];
  const totalSessions = traffic.reduce((s: number, t: any) => s + (t.sessionCount || 0), 0);

  // Prepare pie data
  const pieData = traffic.slice(0, 6).map((t: any) => ({
    name: t.source || 'direct',
    value: t.sessionCount || 0,
    fill: getSourceColor(t.source),
  }));

  // Device bar data
  const deviceData = devices.map((d: any) => ({
    device: d.device || 'unknown',
    sessions: d.sessionCount || 0,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Traffic & Attribution</h1>
          <p className="page-subtitle">Acquisition sources, UTM tracking, devices & conversion by channel</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {/* ── Summary KPIs ── */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-accent" style={{ background: 'linear-gradient(90deg, var(--bg-hover), var(--indigo))' }} />
            <div className="kpi-label">Total Sessions</div>
            <div className="kpi-value">{loading ? '—' : totalSessions.toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-accent" style={{ background: 'linear-gradient(90deg, var(--bg-hover), var(--emerald))' }} />
            <div className="kpi-label">Top Source</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem', textTransform: 'capitalize' }}>
              {loading ? '—' : (traffic[0]?.source || 'direct')}
            </div>
            <div className="kpi-sub">{!loading && traffic[0] ? `${traffic[0].sessionCount} sessions` : ''}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-accent" style={{ background: 'linear-gradient(90deg, var(--bg-hover), var(--sky))' }} />
            <div className="kpi-label">Traffic Sources</div>
            <div className="kpi-value">{loading ? '—' : traffic.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-accent" style={{ background: 'linear-gradient(90deg, var(--bg-hover), var(--violet))' }} />
            <div className="kpi-label">Top Device</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem', textTransform: 'capitalize' }}>
              {loading ? '—' : (devices[0]?.device || 'mobile')}
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="grid-2" style={{ marginTop: 16 }}>
          {/* Source Pie */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">Traffic by Source</h2>
            <div className="chart-subtitle">Session distribution across acquisition channels</div>
            <div className="chart-area" style={{ minHeight: 220 }}>
              {loading ? (
                <div className="skeleton" style={{ width: 180, height: 180, borderRadius: '50%' }} />
              ) : pieData.length === 0 ? (
                <div className="empty-state">
                  <p>No traffic data available for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                      formatter={(value: any, name: any) => [`${value} sessions`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="chart-card" style={{ marginBottom: 0 }}>
            <h2 className="chart-title">Sessions by Device</h2>
            <div className="chart-subtitle">Mobile, desktop and tablet breakdown</div>
            <div className="chart-area" style={{ minHeight: 220 }}>
              {loading ? (
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              ) : deviceData.length === 0 ? (
                <div className="empty-state">
                  <p>No device data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deviceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--text-3)" fontSize={11} />
                    <YAxis dataKey="device" type="category" stroke="var(--text-3)" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                    />
                    <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                      {deviceData.map((_: any, i: number) => (
                        <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Detailed Table ── */}
        <div className="table-card" style={{ marginTop: 16 }}>
          <div className="table-header">
            <div className="table-title">Traffic Sources Detail</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Medium</th>
                  <th>Sessions</th>
                  <th>Share</th>
                  <th>Traffic Bar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : traffic.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                      No traffic data available
                    </td>
                  </tr>
                ) : (
                  traffic.map((t: any, i: number) => {
                    const share = totalSessions > 0 ? (t.sessionCount / totalSessions) * 100 : 0;
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getSourceColor(t.source), flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                              {t.source || 'direct'}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-2)', textTransform: 'capitalize' }}>{t.medium || 'none'}</td>
                        <td><span className="val-strong">{t.sessionCount?.toLocaleString()}</span></td>
                        <td style={{ color: 'var(--text-2)' }}>{share.toFixed(1)}%</td>
                        <td style={{ width: 160 }}>
                          <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${share}%`, height: '100%', background: getSourceColor(t.source), borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
