'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function LivePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Establish Server-Sent Events connection
    const eventSource = new EventSource('/api/live');
    
    eventSource.onopen = () => setConnected(true);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSessions(data);
      } catch (e) {
        console.error("Failed to parse SSE data", e);
      }
    };
    
    eventSource.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects natively
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Live Activity
            {connected ? (
              <span className="live-indicator" style={{ marginLeft: 12 }}>
                <span className="live-dot"></span> Live
              </span>
            ) : (
              <span className="badge badge-warning" style={{ marginLeft: 12 }}>Connecting...</span>
            )}
          </h1>
          <p className="page-subtitle">Real-time view of users currently in the funnel (last 5 mins)</p>
        </div>
      </div>

      <div className="page-body">
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 className="chart-title">Active Sessions</h2>
              <div className="chart-subtitle" style={{ margin: 0 }}>{sessions.length} users active</div>
            </div>
            <Clock size={20} style={{ opacity: 0.3 }} />
          </div>
          
          {sessions.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} />
              <h3 style={{ marginTop: 12 }}>No active users</h3>
              <p>Waiting for traffic...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map((s: any) => {
                const isPaid = s.lastEvent === 'payment_success';
                const isCheckout = s.lastEvent === 'checkout_view' || s.lastEvent === 'payment_initiated';
                return (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-surface)', border: `1px solid ${isPaid ? 'var(--emerald)' : isCheckout ? 'var(--amber)' : 'var(--border)'}`, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'monospace', marginBottom: 4 }}>{s._id}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                        {s.lastEvent}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>
                        {s.device || 'Unknown Device'} • Category: {s.category || 'Not selected'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Last seen</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>{new Date(s.lastSeen).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
