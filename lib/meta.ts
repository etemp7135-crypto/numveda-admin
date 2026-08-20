// Meta Marketing API wrapper — server-side only
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || '';
const BASE = 'https://graph.facebook.com/v21.0';

export const metaConfigured = !!(ACCESS_TOKEN && AD_ACCOUNT_ID);

async function metaFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  if (!metaConfigured) throw new Error('META_NOT_CONFIGURED');
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Meta API error: ${res.status} ${await res.text()}`);
  return res.json();
}

const CAMPAIGN_FIELDS = 'name,status,objective,spend_cap,budget_remaining';
const INSIGHTS_FIELDS = 'spend,impressions,reach,frequency,clicks,ctr,cpm,cpc,actions,action_values,purchase_roas,cost_per_action_type,date_start,date_stop';
export async function fetchAdAccountInsights(dateFrom: string, dateTo: string) {
  return metaFetch(`/act_${AD_ACCOUNT_ID}/insights`, {
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    level: 'account',
  });
}

export async function fetchDailySpend(dateFrom: string, dateTo: string) {
  return metaFetch(`/act_${AD_ACCOUNT_ID}/insights`, {
    fields: 'spend',
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    level: 'account',
    time_increment: '1',
  });
}

export async function fetchCampaigns(dateFrom: string, dateTo: string) {
  return metaFetch(`/act_${AD_ACCOUNT_ID}/campaigns`, {
    fields: `${CAMPAIGN_FIELDS},insights.time_range({"since":"${dateFrom}","until":"${dateTo}"}){${INSIGHTS_FIELDS}}`,
    limit: '50',
  });
}

export async function fetchAdSets(campaignId: string, dateFrom: string, dateTo: string) {
  return metaFetch(`/${campaignId}/adsets`, {
    fields: `name,status,insights.time_range({"since":"${dateFrom}","until":"${dateTo}"}){${INSIGHTS_FIELDS}}`,
  });
}

export async function fetchAds(adSetId: string, dateFrom: string, dateTo: string) {
  return metaFetch(`/${adSetId}/ads`, {
    fields: `name,status,insights.time_range({"since":"${dateFrom}","until":"${dateTo}"}){${INSIGHTS_FIELDS}}`,
  });
}

export async function testMetaConnection(): Promise<{ success: boolean; error?: string }> {
  if (!metaConfigured) return { success: false, error: 'META_NOT_CONFIGURED' };
  try {
    await metaFetch(`/act_${AD_ACCOUNT_ID}`, { fields: 'id,name' });
    return { success: true };
  } catch (err: any) {
    console.error('Meta Connection Failed:', err);
    return { success: false, error: err.message || 'Unknown connection error' }; 
  }
}
