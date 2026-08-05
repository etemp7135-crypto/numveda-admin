import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getQuestionAnalytics, getDateRange } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);

  try {
    const data = await getQuestionAnalytics(range);
    
    // Calculate total answers per question to get percentages
    const formattedData: Record<string, any> = {};
    
    for (const [qId, answers] of Object.entries(data)) {
      const totalAnswers = answers.reduce((sum, a) => sum + a.count, 0);
      formattedData[qId] = {
        totalAnswers,
        category: answers[0]?.category,
        answers: answers.map((a: any) => ({
          value: a.answer_value,
          count: a.count,
          percentage: totalAnswers > 0 ? (a.count / totalAnswers) * 100 : 0,
          uniqueUsers: a.sessionCount
        }))
      };
    }
    
    return NextResponse.json({
      period,
      questions: formattedData
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
