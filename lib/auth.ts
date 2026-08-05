import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret_change_me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'numveda2026';

// Simple AES-like obfuscation using btoa (server-only)
function encode(data: object): string {
  return Buffer.from(JSON.stringify({ ...data, sig: SESSION_SECRET.slice(0, 8) })).toString('base64');
}

function decode(token: string): any {
  try {
    const obj = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (obj.sig !== SESSION_SECRET.slice(0, 8)) return null;
    return obj;
  } catch { return null; }
}

export async function createSession(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;
  const cookieStore = await cookies();
  const token = encode({ authenticated: true, createdAt: Date.now() });
  cookieStore.set('nv_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return true;
}

export async function getSession(): Promise<{ authenticated: boolean } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nv_admin_session')?.value;
  if (!token) return null;
  return decode(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('nv_admin_session');
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.authenticated) {
    redirect('/login');
  }
}
