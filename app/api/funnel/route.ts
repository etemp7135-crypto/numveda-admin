import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getFunnelSteps, getDateRange } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const category = req.nextUrl.searchParams.get('category') || undefined;
  const range = getDateRange(period);

  try {
    const funnel = await getFunnelSteps(range, category);
    
    // Overall metrics
    const landing = funnel.find(s => s.step === 'page_view')?.users || 0;
    const quizStart = funnel.find(s => s.step === 'quiz_start')?.users || 0;
    const checkout = funnel.find(s => s.step === 'checkout_view')?.users || 0;
    const purchases = funnel.find(s => s.step === 'payment_success')?.users || 0;
    
    return NextResponse.json({
      period,
      category: category || 'all',
      funnel,
      summary: {
        landingToQuiz: landing > 0 ? (quizStart / landing) * 100 : 0,
        quizToCheckout: quizStart > 0 ? (checkout / quizStart) * 100 : 0,
        checkoutToPurchase: checkout > 0 ? (purchases / checkout) * 100 : 0,
        overallConversion: landing > 0 ? (purchases / landing) * 100 : 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
