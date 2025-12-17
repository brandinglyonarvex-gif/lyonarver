// Firestore Database Utilities
// Server-side Firestore operations using Firebase Admin SDK

import { getAdminFirestore } from './firebase-admin';
import {
  Timestamp,
  FieldValue,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  WriteResult,
} from 'firebase-admin/firestore';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  SESSIONS: 'sessions',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Generic types
export interface FirestoreDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Analytics document types
export interface PageViewDocument extends FirestoreDocument {
  path: string;
  userId?: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  timestamp: Timestamp;
}

export interface EventDocument extends FirestoreDocument {
  name: string;
  category: string;
  data?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: Timestamp;
}

// Settings document type
export interface SettingsDocument extends FirestoreDocument {
  key: string;
  value: unknown;
  description?: string;
}

// Notification document type
export interface NotificationDocument extends FirestoreDocument {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'info';
  read: boolean;
  link?: string;
}

// Session document type
export interface SessionDocument extends FirestoreDocument {
  userId?: string;
  startedAt: Timestamp;
  lastActiveAt: Timestamp;
  userAgent?: string;
  pages: string[];
  events: string[];
}

/**
 * Get a reference to a collection
 */
export function getCollection(collectionName: CollectionName): CollectionReference {
  const db = getAdminFirestore();
  return db.collection(collectionName);
}

/**
 * Get a reference to a document
 */
export function getDocRef(collectionName: CollectionName, docId: string): DocumentReference {
  return getCollection(collectionName).doc(docId);
}

/**
 * Create a new document with auto-generated ID
 */
export async function createDocument<T extends FirestoreDocument>(
  collectionName: CollectionName,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DocumentReference> {
  const collection = getCollection(collectionName);
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  return collection.add(docData);
}

/**
 * Create or update a document with a specific ID
 */
export async function setDocument<T extends FirestoreDocument>(
  collectionName: CollectionName,
  docId: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  merge: boolean = false
): Promise<WriteResult> {
  const docRef = getDocRef(collectionName, docId);
  const docData = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
    ...(merge ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };
  return docRef.set(docData, { merge });
}

/**
 * Update specific fields of a document
 */
export async function updateDocument(
  collectionName: CollectionName,
  docId: string,
  data: Record<string, unknown>
): Promise<WriteResult> {
  const docRef = getDocRef(collectionName, docId);
  return docRef.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: CollectionName,
  docId: string
): Promise<WriteResult> {
  const docRef = getDocRef(collectionName, docId);
  return docRef.delete();
}

/**
 * Get a single document by ID
 */
export async function getDocument<T extends FirestoreDocument>(
  collectionName: CollectionName,
  docId: string
): Promise<T | null> {
  const docRef = getDocRef(collectionName, docId);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T extends FirestoreDocument>(
  collectionName: CollectionName,
  limit?: number
): Promise<T[]> {
  let query: Query = getCollection(collectionName);
  if (limit) {
    query = query.limit(limit);
  }
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T extends FirestoreDocument>(
  collectionName: CollectionName,
  filters: Array<{
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: unknown;
  }>,
  orderBy?: { field: string; direction?: 'asc' | 'desc' },
  limit?: number
): Promise<T[]> {
  let query: Query = getCollection(collectionName);

  for (const filter of filters) {
    query = query.where(filter.field, filter.operator, filter.value);
  }

  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
  }

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'set' | 'update' | 'delete';
    collection: CollectionName;
    docId?: string;
    data?: Record<string, unknown>;
  }>
): Promise<WriteResult[]> {
  const db = getAdminFirestore();
  const batch = db.batch();

  for (const op of operations) {
    const collection = getCollection(op.collection);

    switch (op.type) {
      case 'create': {
        const docRef = op.docId ? collection.doc(op.docId) : collection.doc();
        batch.set(docRef, {
          ...op.data,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        break;
      }
      case 'set': {
        if (!op.docId) throw new Error('docId required for set operation');
        const docRef = collection.doc(op.docId);
        batch.set(docRef, {
          ...op.data,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        break;
      }
      case 'update': {
        if (!op.docId) throw new Error('docId required for update operation');
        const docRef = collection.doc(op.docId);
        batch.update(docRef, {
          ...op.data,
          updatedAt: FieldValue.serverTimestamp(),
        });
        break;
      }
      case 'delete': {
        if (!op.docId) throw new Error('docId required for delete operation');
        const docRef = collection.doc(op.docId);
        batch.delete(docRef);
        break;
      }
    }
  }

  return batch.commit();
}

// ============================================
// Analytics-specific functions
// ============================================

/**
 * Track a page view
 */
export async function trackPageView(data: Omit<PageViewDocument, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) {
  return createDocument<PageViewDocument>(COLLECTIONS.ANALYTICS, {
    ...data,
    timestamp: Timestamp.now(),
  } as Omit<PageViewDocument, 'id' | 'createdAt' | 'updatedAt'>);
}

/**
 * Track an event
 */
export async function trackEvent(data: Omit<EventDocument, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) {
  return createDocument<EventDocument>(COLLECTIONS.ANALYTICS, {
    ...data,
    timestamp: Timestamp.now(),
  } as Omit<EventDocument, 'id' | 'createdAt' | 'updatedAt'>);
}

/**
 * Get analytics data for a date range
 */
export async function getAnalyticsData(
  startDate: Date,
  endDate: Date,
  type?: 'pageView' | 'event'
) {
  const filters: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }> = [
    { field: 'timestamp', operator: '>=', value: Timestamp.fromDate(startDate) },
    { field: 'timestamp', operator: '<=', value: Timestamp.fromDate(endDate) },
  ];

  if (type === 'pageView') {
    filters.push({ field: 'path', operator: '!=', value: null });
  } else if (type === 'event') {
    filters.push({ field: 'name', operator: '!=', value: null });
  }

  return queryDocuments(COLLECTIONS.ANALYTICS, filters, { field: 'timestamp', direction: 'desc' });
}

// ============================================
// Settings functions
// ============================================

/**
 * Get a setting by key
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const doc = await getDocument<SettingsDocument>(COLLECTIONS.SETTINGS, key);
  return doc?.value as T | null;
}

/**
 * Set a setting
 */
export async function setSetting(key: string, value: unknown, description?: string) {
  return setDocument<SettingsDocument>(COLLECTIONS.SETTINGS, key, {
    key,
    value,
    description,
  });
}

// ============================================
// Notification functions
// ============================================

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  notification: Omit<NotificationDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'read'>
) {
  return createDocument<NotificationDocument>(COLLECTIONS.NOTIFICATIONS, {
    ...notification,
    userId,
    read: false,
  });
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  return queryDocuments<NotificationDocument>(
    COLLECTIONS.NOTIFICATIONS,
    [
      { field: 'userId', operator: '==', value: userId },
      { field: 'read', operator: '==', value: false },
    ],
    { field: 'createdAt', direction: 'desc' }
  );
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, { read: true });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  const notifications = await getUnreadNotifications(userId);
  const operations = notifications.map(n => ({
    type: 'update' as const,
    collection: COLLECTIONS.NOTIFICATIONS,
    docId: n.id!,
    data: { read: true },
  }));
  return batchWrite(operations);
}

// Export utility functions
export {
  Timestamp,
  FieldValue,
};

export default {
  COLLECTIONS,
  getCollection,
  getDocRef,
  createDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  getAllDocuments,
  queryDocuments,
  batchWrite,
  trackPageView,
  trackEvent,
  getAnalyticsData,
  getSetting,
  setSetting,
  createNotification,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
