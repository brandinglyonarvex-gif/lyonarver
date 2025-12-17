// Server-side auth helper functions
// Use these in API routes to get the authenticated user

import { getCurrentUser, AuthUser } from './firebase-auth-server';
import { prisma } from './db';

export interface DbUser {
  id: string;
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get the current authenticated user from the database
 * Creates the user if they don't exist
 */
export async function getAuthenticatedUser(): Promise<DbUser | null> {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return null;
  }

  // Get or create user in database
  let user = await prisma.user.findUnique({
    where: { firebaseUid: authUser.uid },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: authUser.uid,
        email: authUser.email,
        phone: authUser.phone,
        name: authUser.name,
        image: authUser.picture,
      },
    });
  }

  return user;
}

/**
 * Get the current authenticated user or throw an error
 * Use this in protected API routes
 */
export async function requireAuthenticatedUser(): Promise<DbUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get just the Firebase auth user (without database lookup)
 */
export async function getFirebaseUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export type { AuthUser };
