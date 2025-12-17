# Firebase Setup Guide for Lyon Arvex E-Commerce

This guide covers the complete Firebase integration for the Lyon Arvex e-commerce application.

## Prerequisites

- Node.js 18+ installed
- Firebase account (https://console.firebase.google.com)
- Firebase CLI installed (`pnpm add -D firebase-tools` - already included)

## Firebase Project Configuration

Your Firebase project details:
- **Project ID:** lyonarvex
- **Project Number:** 408734829224
- **App ID:** 1:408734829224:web:92d558cfc90dfd8fcf909d

## Step 1: Firebase Console Setup

### Enable Services in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/lyonarvex)

2. **Enable Firestore Database:**
   - Navigate to Build > Firestore Database
   - Click "Create database"
   - Choose production mode (rules will be deployed from `firestore.rules`)
   - Select region closest to your users

3. **Enable Storage:**
   - Navigate to Build > Storage
   - Click "Get started"
   - Choose production mode (rules will be deployed from `storage.rules`)
   - Select the same region as Firestore

4. **Generate Service Account Key:**
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the JSON file securely
   - Never commit this file to git!

## Step 2: Environment Variables

Add these to your `.env` file:

```env
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCMvV4p48_VIynYHH76PzazINeRFeES878
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lyonarvex.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lyonarvex
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lyonarvex.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=408734829224
NEXT_PUBLIC_FIREBASE_APP_ID=1:408734829224:web:92d558cfc90dfd8fcf909d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-BJ0FPDZLDM

# Firebase Admin SDK (Server-side)
# Option 1: Full JSON service account key (recommended)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Option 2: Individual environment variables
FIREBASE_PROJECT_ID=lyonarvex
FIREBASE_STORAGE_BUCKET=lyonarvex.firebasestorage.app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lyonarvex.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Step 3: Firebase CLI Login

```bash
# Login to Firebase CLI
pnpm firebase:login

# This will open a browser for authentication
```

## Step 4: Deploy Firebase Rules and Indexes

```bash
# Deploy everything
pnpm firebase:deploy

# Or deploy individually:
pnpm firebase:deploy:firestore    # Firestore rules and indexes
pnpm firebase:deploy:storage      # Storage rules
pnpm firebase:deploy:rules        # Just rules (both Firestore and Storage)
```

## Step 5: Local Development with Emulators

Firebase Emulators let you test Firebase services locally:

```bash
# Start all emulators
pnpm firebase:emulators

# This starts:
# - Hosting: http://localhost:5000
# - Firestore: http://localhost:8080
# - Storage: http://localhost:9199
# - Emulator UI: http://localhost:4000
```

## File Structure

```
lib/
├── firebase.ts           # Client-side Firebase initialization
├── firebase-admin.ts     # Server-side Firebase Admin SDK
├── firebase-storage.ts   # Storage upload utilities
└── firestore.ts          # Firestore database utilities

firebase.json            # Firebase configuration
.firebaserc              # Firebase project aliases
firestore.rules          # Firestore security rules
firestore.indexes.json   # Firestore indexes
storage.rules            # Storage security rules
```

## Usage Examples

### Upload Files to Firebase Storage

```typescript
import { uploadToFirebaseStorage, STORAGE_FOLDERS } from '@/lib/firebase-storage';

// Upload a product image
const result = await uploadToFirebaseStorage(file, file.name, {
  folder: STORAGE_FOLDERS.PRODUCTS,
  makePublic: true,
});

if (result.success) {
  console.log('Image URL:', result.url);
}
```

### Use Firestore for Analytics/Settings

```typescript
import { trackPageView, getSetting, setSetting } from '@/lib/firestore';

// Track a page view
await trackPageView({
  path: '/products',
  sessionId: 'session-123',
  userId: 'user-456',
});

// Store/retrieve settings
await setSetting('taxRate', 0.18, 'Tax rate percentage');
const taxRate = await getSetting<number>('taxRate');
```

### Client-side Firebase

```typescript
import { getFirebaseStorage, getFirestoreDb } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Client-side upload (useful for direct user uploads)
const storage = getFirebaseStorage();
const storageRef = ref(storage, 'uploads/' + file.name);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

## Security Rules

### Firestore Rules (`firestore.rules`)

- Public read for products, categories, settings
- Authenticated read/write for orders, reviews
- Admin-only for analytics, user management

### Storage Rules (`storage.rules`)

- Public read for product/category/cover images
- Authenticated upload with size limits (10MB max)
- File type validation (images, PDFs, videos)

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Your Next.js app should continue to deploy on Vercel. Firebase services (Storage, Firestore) work seamlessly with Vercel-hosted apps.

1. Add Firebase environment variables to Vercel project settings
2. The app uses Firebase services via API routes and client SDK

### Option 2: Firebase Hosting (Static Export)

For static export deployment:

1. Update `next.config.mjs` to enable static export:
```javascript
const nextConfig = {
  output: 'export',
};
```

2. Build and deploy:
```bash
pnpm build
pnpm firebase:deploy:hosting
```

Note: This requires converting dynamic routes to static or using client-side data fetching.

## Troubleshooting

### "Permission denied" errors

1. Check that Firestore/Storage rules are deployed
2. Verify user is authenticated
3. Check admin permissions in Firestore `/admins` collection

### "Service account not found" errors

1. Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
2. Check JSON format (no line breaks in env var)
3. Verify service account has necessary permissions

### Upload failures

1. Check file size (max 10MB)
2. Verify content type is allowed
3. Check storage rules allow the upload

## Migration from S3

The app previously used AWS S3 for file storage. To migrate existing images:

1. Download all images from S3 bucket
2. Upload to Firebase Storage maintaining folder structure
3. Update database references from S3 URLs to Firebase URLs
4. Keep S3 credentials until migration is verified

The upload route (`/api/admin/upload`) now uses Firebase Storage automatically.
