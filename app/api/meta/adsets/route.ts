import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchAdSets, metaConfigured } from '@/lib/meta';
import { getDateRange } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!metaConfigured) {
    return NextResponse.json({ adsets: [] });
  }

  const campaignId = req.nextUrl.searchParams.get('campaignId');
  if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const dateFrom = new Date(range.from.getTime() + istOffset).toISOString().split('T')[0];
  const dateTo = new Date(range.to.getTime() + istOffset).toISOString().split('T')[0];

  try {
    const res = await fetchAdSets(campaignId, dateFrom, dateTo);
    const rawAdsets = res.data || [];

    const parseActions = (actions: any[] = [], type: string) => {
      const match = actions.find((a: any) => a.action_type === type);
      return match ? parseFloat(match.value) : 0;
    };

    const adsets = rawAdsets.map((adset: any) => {
      const ins = adset.insights?.data?.[0] || {};
      const spend = parseFloat(ins.spend) || 0;
      const purchases = parseActions(ins.actions, 'purchase');
      const purchaseValue = parseActions(ins.action_values, 'purchase');
      return {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        spend,
        purchases,
        cpa: purchases > 0 ? spend / purchases : 0,
        roas: spend > 0 ? purchaseValue / spend : 0,
      };
    });

    return NextResponse.json({ adsets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
