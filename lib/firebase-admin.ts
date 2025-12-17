// Firebase Admin SDK Configuration
// This file initializes Firebase Admin for server-side use (API routes, server components)

import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Service account configuration
// In production, use FIREBASE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
// Or use individual environment variables for each field
function getServiceAccount(): ServiceAccount | undefined {
  // Check for JSON service account key
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      return JSON.parse(serviceAccountKey) as ServiceAccount;
    } catch {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }

  // Fallback to individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lyonarvex';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return undefined;
}

// Initialize Firebase Admin App (singleton pattern)
let adminApp: App;
let adminStorage: Storage;
let adminFirestore: Firestore;
let adminAuth: Auth;

function initializeFirebaseAdmin(): App {
  if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
                          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
                          'lyonarvex.firebasestorage.app';

    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket,
      });
    } else {
      // Initialize without credentials (for local development or when using default credentials)
      // This will use Application Default Credentials if available
      console.warn('Firebase Admin: No service account credentials provided. Using default credentials.');
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lyonarvex',
        storageBucket,
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

// Get Firebase Admin App instance
export function getFirebaseAdminApp(): App {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return adminApp;
}

// Get Firebase Admin Storage instance
export function getAdminStorage(): Storage {
  if (!adminStorage) {
    adminStorage = getStorage(getFirebaseAdminApp());
  }
  return adminStorage;
}

// Get Firebase Admin Firestore instance
export function getAdminFirestore(): Firestore {
  if (!adminFirestore) {
    adminFirestore = getFirestore(getFirebaseAdminApp());
  }
  return adminFirestore;
}

// Get Firebase Admin Auth instance
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getFirebaseAdminApp());
  }
  return adminAuth;
}

// Utility to get storage bucket reference
export function getStorageBucket() {
  return getAdminStorage().bucket();
}

// Export for convenience
export default getFirebaseAdminApp;
