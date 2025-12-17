// Firebase Client SDK Configuration
// This file initializes Firebase for client-side use (browser)

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCMvV4p48_VIynYHH76PzazINeRFeES878",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lyonarvex.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lyonarvex",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lyonarvex.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "408734829224",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:408734829224:web:92d558cfc90dfd8fcf909d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BJ0FPDZLDM"
};

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let analytics: Analytics | null = null;
let storage: FirebaseStorage;
let firestore: Firestore;
let auth: Auth;

function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

// Get Firebase App instance
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeFirebase();
  }
  return app;
}

// Get Firebase Analytics (only works in browser)
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!analytics) {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(getFirebaseApp());
    }
  }
  return analytics;
}

// Get Firebase Storage instance
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

// Get Firestore instance
export function getFirestoreDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}

// Get Firebase Auth instance
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// Export configuration for reference
export { firebaseConfig };

// Default export for convenience
export default getFirebaseApp;
