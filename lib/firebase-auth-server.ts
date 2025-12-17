// Firebase Authentication Server Utilities
// Server-side auth functions for verifying tokens and managing sessions

import { getAdminAuth } from './firebase-admin';
import { cookies } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = 'firebase-session';
const SESSION_EXPIRY_DAYS = 14;

// ============================================
// Token Verification
// ============================================

/**
 * Verify a Firebase ID token
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

/**
 * Verify a session cookie
 */
export async function verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken | null> {
  try {
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

// ============================================
// Session Management
// ============================================

/**
 * Create a session cookie from an ID token
 */
export async function createSessionCookie(idToken: string): Promise<string | null> {
  try {
    const auth = getAdminAuth();
    const expiresIn = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // in milliseconds
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return null;
  }
}

/**
 * Set the session cookie in the response
 */
export async function setSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // in seconds
    path: '/',
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the session cookie value
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value || null;
}

// ============================================
// Current User Retrieval
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
}

/**
 * Get the current authenticated user from session cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionCookie = await getSessionCookie();

  if (!sessionCookie) {
    return null;
  }

  const decodedClaims = await verifySessionCookie(sessionCookie);

  if (!decodedClaims) {
    return null;
  }

  return {
    uid: decodedClaims.uid,
    email: decodedClaims.email || null,
    phone: decodedClaims.phone_number || null,
    name: decodedClaims.name || null,
    picture: decodedClaims.picture || null,
    emailVerified: decodedClaims.email_verified || false,
  };
}

/**
 * Get the current user or throw an error (for protected routes)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Check if a user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// ============================================
// User Management
// ============================================

/**
 * Get Firebase user by UID
 */
export async function getFirebaseUser(uid: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return null;
  }
}

/**
 * Get Firebase user by email
 */
export async function getFirebaseUserByEmail(email: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUserByEmail(email);
  } catch (error) {
    console.error('Error getting Firebase user by email:', error);
    return null;
  }
}

/**
 * Get Firebase user by phone number
 */
export async function getFirebaseUserByPhone(phoneNumber: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUserByPhoneNumber(phoneNumber);
  } catch (error) {
    console.error('Error getting Firebase user by phone:', error);
    return null;
  }
}

/**
 * Update Firebase user
 */
export async function updateFirebaseUser(
  uid: string,
  data: {
    displayName?: string;
    photoURL?: string;
    email?: string;
    phoneNumber?: string;
    disabled?: boolean;
  }
) {
  try {
    const auth = getAdminAuth();
    return await auth.updateUser(uid, data);
  } catch (error) {
    console.error('Error updating Firebase user:', error);
    throw error;
  }
}

/**
 * Delete Firebase user
 */
export async function deleteFirebaseUser(uid: string): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    await auth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Error deleting Firebase user:', error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeUserTokens(uid: string): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    await auth.revokeRefreshTokens(uid);
    return true;
  } catch (error) {
    console.error('Error revoking user tokens:', error);
    return false;
  }
}

// ============================================
// Custom Claims (for admin roles, etc.)
// ============================================

/**
 * Set custom claims for a user (e.g., admin role)
 */
export async function setCustomClaims(
  uid: string,
  claims: Record<string, unknown>
): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

/**
 * Check if user has admin claim
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const user = await getFirebaseUser(uid);
  return user?.customClaims?.admin === true;
}

// Export cookie name for use in middleware
export { SESSION_COOKIE_NAME };
