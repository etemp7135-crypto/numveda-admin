import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchAdAccountInsights, fetchCampaigns, testMetaConnection, metaConfigured } from '@/lib/meta';
import { getDateRange } from '@/lib/analytics';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);
  const dateFrom = format(range.from, 'yyyy-MM-dd');
  const dateTo = format(range.to, 'yyyy-MM-dd');

  if (!metaConfigured) {
    return NextResponse.json({
      configured: false,
      message: 'Meta Marketing API not configured. Please add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to environment variables.',
    });
  }

  try {
    const [insightsRes, campaignsRes, connected] = await Promise.allSettled([
      fetchAdAccountInsights(dateFrom, dateTo),
      fetchCampaigns(dateFrom, dateTo),
      testMetaConnection(),
    ]);

    const isConnected = connected.status === 'fulfilled' ? connected.value : false;
    
    // Parse Account Insights
    const accountInsights = insightsRes.status === 'fulfilled' && insightsRes.value?.data?.[0]
      ? insightsRes.value.data[0]
      : {
          spend: 0, impressions: 0, reach: 0, clicks: 0,
          cpc: 0, cpm: 0, ctr: 0, actions: [], action_values: [],
        };

    const parseActions = (actions: any[] = [], type: string) => {
      const match = actions.find((a: any) => a.action_type === type);
      return match ? parseFloat(match.value) : 0;
    };

    const purchases = parseActions(accountInsights.actions, 'purchase');
    const purchaseValue = parseActions(accountInsights.action_values, 'purchase');
    const lpv = parseActions(accountInsights.actions, 'landing_page_view');

    const spend = parseFloat(accountInsights.spend) || 0;
    const cpa = purchases > 0 ? spend / purchases : 0;
    const roas = spend > 0 ? purchaseValue / spend : 0;
    const convRate = lpv > 0 ? (purchases / lpv) * 100 : 0;

    // Parse Campaigns
    const rawCampaigns = campaignsRes.status === 'fulfilled' ? campaignsRes.value?.data || [] : [];
    const campaigns = rawCampaigns.map((c: any) => {
      const ins = c.insights?.data?.[0] || {};
      const cSpend = parseFloat(ins.spend) || 0;
      const cPurchases = parseActions(ins.actions, 'purchase');
      const cPurchaseVal = parseActions(ins.action_values, 'purchase');
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        spend: cSpend,
        impressions: parseInt(ins.impressions) || 0,
        clicks: parseInt(ins.clicks) || 0,
        purchases: cPurchases,
        cpa: cPurchases > 0 ? cSpend / cPurchases : 0,
        roas: cSpend > 0 ? cPurchaseVal / cSpend : 0,
      };
    }).sort((a: any, b: any) => b.spend - a.spend);

    return NextResponse.json({
      configured: true,
      connected: isConnected,
      account: {
        spend,
        impressions: parseInt(accountInsights.impressions) || 0,
        reach: parseInt(accountInsights.reach) || 0,
        clicks: parseInt(accountInsights.clicks) || 0,
        cpc: parseFloat(accountInsights.cpc) || 0,
        cpm: parseFloat(accountInsights.cpm) || 0,
        ctr: parseFloat(accountInsights.ctr) || 0,
        landingPageViews: lpv,
        purchases,
        purchaseValue,
        cpa,
        roas,
        conversionRate: convRate,
      },
      campaigns,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, configured: true, connected: false }, { status: 500 });
  }
}
