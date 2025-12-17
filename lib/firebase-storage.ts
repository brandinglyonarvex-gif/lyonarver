// Firebase Storage Upload Utilities
// Server-side upload functions using Firebase Admin SDK

import { getStorageBucket } from './firebase-admin';

// Storage folder structure
export const STORAGE_FOLDERS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  COVER_PHOTOS: 'cover-photos',
  USERS: 'users',
  UPLOADS: 'uploads',
} as const;

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS];

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

interface UploadOptions {
  folder?: StorageFolder | string;
  fileName?: string;
  contentType?: string;
  makePublic?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Generate a unique filename with timestamp
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${baseName}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Get content type from file extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'json': 'application/json',
    'txt': 'text/plain',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
  };
  return contentTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Upload a single file to Firebase Storage
 */
export async function uploadToFirebaseStorage(
  file: File | Buffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const bucket = getStorageBucket();
    const folder = options.folder || STORAGE_FOLDERS.UPLOADS;
    const fileName = options.fileName || generateFileName(originalName);
    const filePath = `${folder}/${fileName}`;
    const contentType = options.contentType || getContentType(originalName);

    // Convert File to Buffer if necessary
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      // File type from Web API
      const arrayBuffer = await (file as File).arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Create file reference
    const fileRef = bucket.file(filePath);

    // Upload the file
    await fileRef.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      },
    });

    // Make file public if requested (default: true for images)
    const makePublic = options.makePublic !== undefined
      ? options.makePublic
      : contentType.startsWith('image/');

    if (makePublic) {
      await fileRef.makePublic();
    }

    // Get the public URL
    const url = makePublic
      ? `https://storage.googleapis.com/${bucket.name}/${filePath}`
      : await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }).then(([signedUrl]) => signedUrl);

    return {
      success: true,
      url,
      path: filePath,
    };
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files to Firebase Storage
 */
export async function uploadMultipleToFirebaseStorage(
  files: Array<{ file: File | Buffer; name: string }>,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(({ file, name }) =>
    uploadToFirebaseStorage(file, name, options)
  );
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFromFirebaseStorage(filePath: string): Promise<boolean> {
  try {
    const bucket = getStorageBucket();
    const fileRef = bucket.file(filePath);
    await fileRef.delete();
    return true;
  } catch (error) {
    console.error('Firebase Storage delete error:', error);
    return false;
  }
}

/**
 * Delete multiple files from Firebase Storage
 */
export async function deleteMultipleFromFirebaseStorage(filePaths: string[]): Promise<boolean[]> {
  const deletePromises = filePaths.map(deleteFromFirebaseStorage);
  return Promise.all(deletePromises);
}

/**
 * Check if a file exists in Firebase Storage
 */
export async function fileExistsInFirebaseStorage(filePath: string): Promise<boolean> {
  try {
    const bucket = getStorageBucket();
    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();
    return exists;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from Firebase Storage
 */
export async function getFileMetadata(filePath: string) {
  try {
    const bucket = getStorageBucket();
    const fileRef = bucket.file(filePath);
    const [metadata] = await fileRef.getMetadata();
    return metadata;
  } catch (error) {
    console.error('Firebase Storage metadata error:', error);
    return null;
  }
}

/**
 * Generate a signed URL for temporary access
 */
export async function generateSignedUrl(
  filePath: string,
  expiresInMs: number = 60 * 60 * 1000 // 1 hour default
): Promise<string | null> {
  try {
    const bucket = getStorageBucket();
    const fileRef = bucket.file(filePath);
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return signedUrl;
  } catch (error) {
    console.error('Firebase Storage signed URL error:', error);
    return null;
  }
}

/**
 * List files in a folder
 */
export async function listFiles(folder: string, maxResults: number = 100) {
  try {
    const bucket = getStorageBucket();
    const [files] = await bucket.getFiles({
      prefix: folder,
      maxResults,
    });
    return files.map(file => ({
      name: file.name,
      metadata: file.metadata,
    }));
  } catch (error) {
    console.error('Firebase Storage list error:', error);
    return [];
  }
}

/**
 * Copy a file within Firebase Storage
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    const bucket = getStorageBucket();
    const sourceFile = bucket.file(sourcePath);
    const destFile = bucket.file(destPath);
    await sourceFile.copy(destFile);
    return true;
  } catch (error) {
    console.error('Firebase Storage copy error:', error);
    return false;
  }
}

/**
 * Move a file within Firebase Storage
 */
export async function moveFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    const bucket = getStorageBucket();
    const sourceFile = bucket.file(sourcePath);
    const destFile = bucket.file(destPath);
    await sourceFile.copy(destFile);
    await sourceFile.delete();
    return true;
  } catch (error) {
    console.error('Firebase Storage move error:', error);
    return false;
  }
}

// Export folder constants for convenience
export default {
  uploadToFirebaseStorage,
  uploadMultipleToFirebaseStorage,
  deleteFromFirebaseStorage,
  deleteMultipleFromFirebaseStorage,
  fileExistsInFirebaseStorage,
  getFileMetadata,
  generateSignedUrl,
  listFiles,
  copyFile,
  moveFile,
  STORAGE_FOLDERS,
};
