import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLiveSessions } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Return Server-Sent Events (SSE) if requested
    if (req.headers.get('accept') === 'text/event-stream') {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          // Send initial data
          const sendUpdate = async () => {
            try {
              const live = await getLiveSessions(5); // last 5 mins
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(live)}\n\n`));
            } catch (e) {
              console.error('SSE Error:', e);
            }
          };

          await sendUpdate();
          
          // Then poll every 10 seconds
          const interval = setInterval(sendUpdate, 10000);
          
          // Cleanup on disconnect (not fully reliable in all JS environments, but standard for SSE)
          req.signal.addEventListener('abort', () => {
            clearInterval(interval);
          });
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Otherwise return standard JSON response
    const live = await getLiveSessions(5);
    return NextResponse.json(live);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
