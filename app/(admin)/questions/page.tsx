'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DateRangePicker from '@/components/DateRangePicker';

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || '30d';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/questions?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const questions = data?.questions || {};
  const questionKeys = Object.keys(questions);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Q&A Analytics</h1>
          <p className="page-subtitle">User responses & behavior across the quiz flow</p>
        </div>
        <DateRangePicker />
      </div>

      <div className="page-body">
        {loading ? (
          <div className="grid-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="chart-card skeleton" style={{ height: 240, border: 'none' }}></div>
            ))}
          </div>
        ) : questionKeys.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 16 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3>No Q&A Data Available</h3>
            <p>Wait for users to complete the quiz in the selected time period, or ensure event tracking is configured.</p>
          </div>
        ) : (
          <div className="grid-2">
            {questionKeys.map((qId) => {
              const qData = questions[qId];
              return (
                <div key={qId} className="chart-card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <h2 className="chart-title">{qId}</h2>
                      <div className="chart-subtitle" style={{ margin: 0 }}>Category: {qData.category || 'Global'}</div>
                    </div>
                    <div className="badge badge-neutral">{qData.totalAnswers.toLocaleString()} answers</div>
                  </div>
                  
                  <div>
                    {qData.answers.map((ans: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{ans.value}</span>
                          <span style={{ color: 'var(--text-2)' }}>{ans.percentage.toFixed(1)}% ({ans.count})</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${ans.percentage}%`, height: '100%', background: 'var(--indigo)', borderRadius: 3 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
