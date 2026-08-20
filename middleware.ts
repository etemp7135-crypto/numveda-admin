import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret_change_me';

function validateToken(token: string): boolean {
  try {
    const obj = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return obj.authenticated === true && obj.sig === SESSION_SECRET.slice(0, 8);
  } catch { return false; }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check session
  const token = req.cookies.get('nv_admin_session')?.value;
  if (!token || !validateToken(token)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
  runtime: 'nodejs',
};
