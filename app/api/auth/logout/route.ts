import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/firebase-auth-server';

// POST /api/auth/logout - Clear session cookie
export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
