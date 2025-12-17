// Firebase Authentication Client Utilities
// Client-side auth functions for sign-in, sign-up, and session management

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

// Auth providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

appleProvider.addScope('email');
appleProvider.addScope('name');

// ============================================
// Email/Password Authentication
// ============================================

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  return sendPasswordResetEmail(auth, email);
}

// ============================================
// OAuth Authentication (Google, Apple)
// ============================================

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithApple(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return signInWithPopup(auth, appleProvider);
}

// ============================================
// Phone Authentication
// ============================================

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;
let recaptchaRendered = false;

export async function initRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
  const auth = getFirebaseAuth();

  // Clean up existing verifier if present
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore clear errors
    }
    recaptchaVerifier = null;
    recaptchaRendered = false;
  }

  // Check if container exists
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - allow OTP to be sent
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      // Reset reCAPTCHA on expiry
      console.log('reCAPTCHA expired, resetting...');
      recaptchaRendered = false;
    },
  });

  // Render the reCAPTCHA widget
  try {
    await recaptchaVerifier.render();
    recaptchaRendered = true;
    console.log('reCAPTCHA rendered successfully');
  } catch (error) {
    console.error('Failed to render reCAPTCHA:', error);
    recaptchaVerifier = null;
    throw new Error('Failed to initialize phone authentication');
  }

  return recaptchaVerifier;
}

export function isRecaptchaReady(): boolean {
  return recaptchaVerifier !== null && recaptchaRendered;
}

export async function sendPhoneOTP(phoneNumber: string): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();

  if (!recaptchaVerifier || !recaptchaRendered) {
    throw new Error('Phone authentication not ready. Please wait and try again.');
  }

  // Format phone number with country code if not present
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

  try {
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return confirmationResult;
  } catch (error: unknown) {
    // Reset reCAPTCHA on error so user can retry
    recaptchaRendered = false;
    if (recaptchaVerifier) {
      try {
        await recaptchaVerifier.render();
        recaptchaRendered = true;
      } catch {
        // Ignore re-render errors
      }
    }

    // Provide user-friendly error messages
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'auth/invalid-app-credential') {
      throw new Error('Phone authentication is not configured. Please contact support or try another sign-in method.');
    }
    if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    if (firebaseError.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number. Please check and try again.');
    }
    if (firebaseError.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please try again later or use another sign-in method.');
    }

    throw error;
  }
}

export async function verifyPhoneOTP(otp: string): Promise<UserCredential> {
  if (!confirmationResult) {
    throw new Error('No confirmation result. Send OTP first.');
  }

  const userCredential = await confirmationResult.confirm(otp);
  confirmationResult = null; // Clear after successful verification
  return userCredential;
}

export function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}

// ============================================
// Session Management
// ============================================

export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth();

  // Clear recaptcha on logout
  clearRecaptcha();

  // Sign out from Firebase
  await signOut(auth);

  // Clear the session cookie by calling our API
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors - user is still logged out from Firebase
  }
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

// ============================================
// Session Token Management
// ============================================

export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return user.getIdToken(forceRefresh);
}

export async function createSessionCookie(): Promise<boolean> {
  try {
    const idToken = await getIdToken(true);
    if (!idToken) return false;

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Profile Management
// ============================================

export async function updateUserProfile(data: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No user logged in');
  }

  await updateProfile(user, data);
}

// ============================================
// Utility Functions
// ============================================

export function isAuthenticated(): boolean {
  const auth = getFirebaseAuth();
  return auth.currentUser !== null;
}

export function getUserDisplayName(): string | null {
  const user = getCurrentUser();
  return user?.displayName || user?.email || user?.phoneNumber || null;
}

export function getUserEmail(): string | null {
  return getCurrentUser()?.email || null;
}

export function getUserPhone(): string | null {
  return getCurrentUser()?.phoneNumber || null;
}

export function getUserPhotoURL(): string | null {
  return getCurrentUser()?.photoURL || null;
}

export function getUserId(): string | null {
  return getCurrentUser()?.uid || null;
}

// Export types for convenience
export type { User, UserCredential, ConfirmationResult };
