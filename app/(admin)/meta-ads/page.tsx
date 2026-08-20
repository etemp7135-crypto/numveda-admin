'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import KPICard from '@/components/KPICard';
import DataTable from '@/components/DataTable';
import { formatINR, formatPercent } from '@/lib/finance';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { ChevronRight, ChevronDown, Zap } from 'lucide-react';

export default function MetaAdsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [adSets, setAdSets] = useState<Record<string, any[]>>({});
  const [loadingAdSets, setLoadingAdSets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meta?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  async function toggleCampaign(campaignId: string) {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
      return;
    }
    setExpandedCampaign(campaignId);
    if (!adSets[campaignId]) {
      setLoadingAdSets(prev => ({ ...prev, [campaignId]: true }));
      try {
        const res = await fetch(`/api/meta/adsets?campaignId=${campaignId}&period=${period}`);
        const d = await res.json();
        setAdSets(prev => ({ ...prev, [campaignId]: d.adsets || [] }));
      } catch (e) {
        setAdSets(prev => ({ ...prev, [campaignId]: [] }));
      }
      setLoadingAdSets(prev => ({ ...prev, [campaignId]: false }));
    }
  }

  const acc = data?.account || {};

  // Build daily spend trend from campaigns (approximate)
  const dailySpendData = data?.dailySpend || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meta Ads Dashboard</h1>
          <p className="page-subtitle">Marketing API integration, ad performance & campaign drill-down</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {data && !data.configured && (
          <div className="empty-state" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-md)', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-1)', margin: '12px 0 8px' }}>Meta Marketing API Not Configured</h3>
            <p style={{ maxWidth: 400, margin: '0 auto 20px', fontSize: '0.85rem' }}>
              Add your Meta System User Access Token to see live ad performance data.
            </p>
            <div style={{ textAlign: 'left', background: 'var(--bg-base)', padding: 16, borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace', width: '100%', maxWidth: 400, color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              META_ACCESS_TOKEN=EAAG...<br />
              META_AD_ACCOUNT_ID=act_123456789
            </div>
          </div>
        )}

        {data && data.configured && (
          <>
            {!data.connected && (
              <div className="alert-banner danger" style={{ marginBottom: 16 }}>
                <strong>Connection Error:</strong> {data.connectionError || 'Could not connect to Meta API. Token may be invalid or expired.'}
              </div>
            )}

            {/* ── Top KPIs ── */}
            <div style={{ marginBottom: 8 }}>
              <div className="section-label">Spend & Efficiency</div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              <KPICard label="Total Spend" value={formatINR(acc.spend || 0)} loading={loading} />
              <KPICard label="Purchases (Meta)" value={(acc.purchases || 0).toLocaleString()} loading={loading} />
              <KPICard label="CPA" value={formatINR(acc.cpa || 0)} loading={loading} />
              <KPICard label="Platform ROAS" value={`${(acc.roas || 0).toFixed(2)}x`} loading={loading} />
            </div>

            <div style={{ marginBottom: 8, marginTop: 16 }}>
              <div className="section-label">Reach & Engagement</div>
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              <KPICard label="Impressions" value={(acc.impressions || 0).toLocaleString()} loading={loading} />
              <KPICard label="Reach" value={(acc.reach || 0).toLocaleString()} loading={loading} />
              <KPICard label="Frequency" value={(acc.frequency || 0).toFixed(2)} loading={loading} />
              <KPICard label="Link Clicks" value={(acc.clicks || 0).toLocaleString()} loading={loading} />
              <KPICard label="CTR" value={`${(acc.ctr || 0).toFixed(2)}%`} loading={loading} />
              <KPICard label="CPM" value={formatINR(acc.cpm || 0)} loading={loading} />
              <KPICard label="CPC" value={formatINR(acc.cpc || 0)} loading={loading} />
              <KPICard label="Conv Rate (Click→Buy)" value={formatPercent(acc.conversionRate || 0)} loading={loading} />
            </div>

            {/* ── Daily Spend Trend ── */}
            {dailySpendData.length > 0 && (
              <div className="chart-card" style={{ marginTop: 16 }}>
                <h2 className="chart-title">Daily Ad Spend Trend</h2>
                <div className="chart-subtitle">Meta media spend over the selected period</div>
                <div className="chart-area" style={{ minHeight: 200 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailySpendData}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--violet)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--violet)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => v.substring(5)} />
                      <YAxis stroke="var(--text-3)" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: 8 }}
                        formatter={(value: any) => [formatINR(value), 'Spend']}
                      />
                      <Area type="monotone" dataKey="spend" stroke="var(--violet)" fill="url(#colorSpend)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Campaign Drill-Down ── */}
            <div className="table-card" style={{ marginTop: 16 }}>
              <div className="table-header">
                <div className="table-title">Campaign Performance</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Click a campaign to drill down into ad sets</div>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 200, margin: 20 }} />
              ) : (
                <div>
                  {(data.campaigns || []).length === 0 ? (
                    <div className="empty-state">No campaign data available</div>
                  ) : (
                    (data.campaigns || []).map((campaign: any) => {
                      const isExpanded = expandedCampaign === campaign.id;
                      return (
                        <div key={campaign.id}>
                          {/* Campaign Row */}
                          <div
                            onClick={() => toggleCampaign(campaign.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '14px 20px',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              background: isExpanded ? 'var(--indigo-glow)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <div style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            <div style={{ flex: 2, fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>{campaign.name}</div>
                            <div style={{ flex: 0.5 }}>
                              <span className={`badge ${campaign.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{campaign.status}</span>
                            </div>
                            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>{formatINR(campaign.spend || 0)}</div>
                            <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--text-2)' }}>{(campaign.purchases || 0)}</div>
                            <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--text-2)' }}>{formatINR(campaign.cpa || 0)}</div>
                            <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--indigo-2)' }}>{(campaign.roas || 0).toFixed(2)}x</div>
                          </div>

                          {/* Ad Sets Drill-Down */}
                          {isExpanded && (
                            <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                              {loadingAdSets[campaign.id] ? (
                                <div className="skeleton" style={{ height: 60, margin: '10px 40px' }} />
                              ) : (adSets[campaign.id] || []).length === 0 ? (
                                <div style={{ padding: '12px 40px', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                                  No ad sets found for this campaign.
                                </div>
                              ) : (
                                (adSets[campaign.id] || []).map((adset: any) => (
                                  <div
                                    key={adset.id}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 12,
                                      padding: '10px 20px 10px 48px',
                                      borderBottom: '1px solid var(--border)',
                                      fontSize: '0.82rem',
                                    }}
                                  >
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }} />
                                    <div style={{ flex: 2, color: 'var(--text-2)' }}>{adset.name}</div>
                                    <div style={{ flex: 0.5 }}>
                                      <span className={`badge ${adset.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.55rem' }}>{adset.status}</span>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-1)', fontWeight: 600 }}>{formatINR(adset.spend || 0)}</div>
                                    <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--text-2)' }}>{adset.purchases || 0}</div>
                                    <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--text-2)' }}>{formatINR(adset.cpa || 0)}</div>
                                    <div style={{ flex: 0.5, textAlign: 'right', color: 'var(--indigo-2)' }}>{(adset.roas || 0).toFixed(2)}x</div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Column Headers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <div style={{ width: 16 }} />
                    <div style={{ flex: 2 }}>Campaign</div>
                    <div style={{ flex: 0.5 }}>Status</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>Spend</div>
                    <div style={{ flex: 0.5, textAlign: 'right' }}>Purchases</div>
                    <div style={{ flex: 0.5, textAlign: 'right' }}>CPA</div>
                    <div style={{ flex: 0.5, textAlign: 'right' }}>ROAS</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
