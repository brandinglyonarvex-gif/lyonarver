import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionCookie,
  setSessionCookie,
  verifyIdToken,
} from '@/lib/firebase-auth-server';
import { prisma } from '@/lib/db';

// POST /api/auth/session - Create a session from Firebase ID token
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Create or update user in database
    const { uid, email, phone_number: phone, name, picture } = decodedToken;

    await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {
        email: email || undefined,
        phone: phone || undefined,
        name: name || undefined,
        image: picture || undefined,
        updatedAt: new Date(),
      },
      create: {
        firebaseUid: uid,
        email: email || null,
        phone: phone || null,
        name: name || null,
        image: picture || null,
      },
    });

    // Set the session cookie
    await setSessionCookie(sessionCookie);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
