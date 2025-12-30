# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "nfl-bracket-app")
4. Continue through setup steps

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication" in sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Optionally enable Google, Facebook, etc.

## 3. Get Web App Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</>) icon
4. Enter app nickname (e.g., "NFL Bracket Web")
5. Copy the config object

## 4. Update Frontend Configuration

Replace the config in `frontend/src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id", 
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

## 5. Setup Backend Service Account

1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add these environment variables to `backend/.env`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

## 6. Database Migration

Run this SQL to add Firebase UID column:

```sql
-- Add Firebase UID column to users table
ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;

-- Optional: Add index for performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

## 7. Test Authentication

1. Start the frontend: `cd frontend && npm run dev`
2. Start the backend: `cd backend && node server.js`
3. Try signing up/in through the app
4. Check Firebase Console → Authentication → Users

## Current Status

- ✅ Firebase SDK installed
- ✅ Auth components created
- ✅ Backend middleware ready
- ⏳ **Need Firebase project configuration**
- ⏳ **Need environment variables**

## Fallback Mode

The app currently runs without Firebase but with limited functionality:
- No user authentication
- Manual user input required
- Less secure

Once Firebase is configured, authentication will be seamless and secure.