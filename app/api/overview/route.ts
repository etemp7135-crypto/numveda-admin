import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderMetrics, getDailyRevenue, getDateRange, getPreviousPeriod } from '@/lib/analytics';
import { calculatePL } from '@/lib/finance';
import { fetchAdAccountInsights, metaConfigured } from '@/lib/meta';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);
  const prevRange = getPreviousPeriod(range);

  try {
    const [current, previous, dailyRevenue] = await Promise.all([
      getOrderMetrics(range),
      getOrderMetrics(prevRange),
      getDailyRevenue(range),
    ]);

    let metaMediaSpend = 0;
    if (metaConfigured) {
      try {
        const istOffset = 5.5 * 60 * 60 * 1000;
        const fromISTStr = new Date(range.from.getTime() + istOffset).toISOString().split('T')[0];
        const toISTStr = new Date(range.to.getTime() + istOffset).toISOString().split('T')[0];
        const insightsRes = await fetchAdAccountInsights(fromISTStr, toISTStr);
        if (insightsRes?.data?.[0]) metaMediaSpend = parseFloat(insightsRes.data[0].spend) || 0;
      } catch (e) {
        console.error("Overview Meta fetch failed", e);
      }
    }

    const pl = calculatePL({
      grossRevenue: current.grossRevenue,
      refunds: current.refundAmount,
      razorpayFees: current.estimatedRazorpayFees,
      metaMediaSpend,
      otherExpenses: 0,
      applyGSTOnRazorpay: true,
      applyGSTOnMeta: true,
    });

    function pctChange(curr: number, prev: number) {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    }

    const conversionRate = current.totalOrders > 0
      ? (current.successfulPayments / current.totalOrders) * 100 : 0;
    const prevConversionRate = previous.totalOrders > 0
      ? (previous.successfulPayments / previous.totalOrders) * 100 : 0;

    return NextResponse.json({
      period,
      metrics: {
        totalOrders: { value: current.totalOrders, change: pctChange(current.totalOrders, previous.totalOrders) },
        successfulPayments: { value: current.successfulPayments, change: pctChange(current.successfulPayments, previous.successfulPayments) },
        failedPayments: { value: current.failedPayments, change: pctChange(current.failedPayments, previous.failedPayments) },
        pendingPayments: { value: current.pendingPayments, change: 0 },
        grossRevenue: { value: current.grossRevenue, change: pctChange(current.grossRevenue, previous.grossRevenue) },
        refunds: { value: current.refundAmount, change: pctChange(current.refundAmount, previous.refundAmount) },
        netRazorpayRevenue: { value: pl.netRazorpayRevenue, change: pctChange(current.netRevenue, previous.netRevenue) },
        avgOrderValue: { value: current.avgOrderValue, change: pctChange(current.avgOrderValue, previous.avgOrderValue) },
        conversionRate: { value: conversionRate, change: pctChange(conversionRate, prevConversionRate) },
        masterOrders: { value: current.masterOrders, change: pctChange(current.masterOrders, previous.masterOrders) },
        ultimateOrders: { value: current.ultimateOrders, change: pctChange(current.ultimateOrders, previous.ultimateOrders) },
        // P&L
        razorpayFees: { value: pl.razorpayFees },
        razorpayGST: { value: pl.razorpayGST },
        metaMediaSpend: { value: pl.metaMediaSpend },
        totalMetaCashCost: { value: pl.totalMetaCashCost },
        actualProfit: { value: pl.actualProfit },
        profitMargin: { value: pl.profitMargin },
        cashRoas: { value: pl.cashRoas },
        mer: { value: pl.mer },
      },
      pl,
      dailyRevenue,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
