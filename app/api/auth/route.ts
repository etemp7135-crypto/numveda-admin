import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

// Rate limiting (in-memory, resets on redeploy — adequate for admin endpoint)
const attempts = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });
  }

  const { password } = await req.json();
  const ok = await createSession(password);
  if (ok) return NextResponse.json({ success: true });
  return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
