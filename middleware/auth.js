const admin = require('firebase-admin');
const db = require('../config/database');

// Simplified private key formatting helper
function getFormattedPrivateKey(rawKey) {
  if (!rawKey) return rawKey;

  // Trim and replace escaped newlines
  let key = rawKey.trim().replace(/\\n/g, '\n');

  // If key already contains PEM markers, ensure newlines are present
  if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
    // If markers are present but the key is one long line, try to normalize spaces
    // Ensure there is a final newline
    if (!key.endsWith('\n')) key += '\n';
    return key;
  }

  // If the env var contains only base64 content, wrap it in PEM markers
  const header = '-----BEGIN PRIVATE KEY-----\n';
  const footer = '\n-----END PRIVATE KEY-----\n';
  // Remove any accidental whitespace/newlines from base64 blob
  const base64 = key.replace(/\s+/g, '');
  // Insert newlines every 64 chars to form a valid PEM body
  const wrapped = base64.match(/.{1,64}/g)?.join('\n') || base64;

  return header + wrapped + footer;
}

// Exported flag for other modules to check Firebase init status
let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    console.log('All env vars with FIREBASE:', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

    // Determine private key source. Prefer base64 env var for platforms that strip newlines.
    let privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKeyRaw && process.env.FIREBASE_PRIVATE_KEY_B64) {
      try {
        privateKeyRaw = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');
        console.log('Decoded FIREBASE_PRIVATE_KEY_B64 to raw key');
      } catch (e) {
        console.error('Failed to decode FIREBASE_PRIVATE_KEY_B64:', e.message);
      }
    }

    console.log('Raw private key length:', privateKeyRaw?.length);

    // Use simplified, more robust formatting
    const privateKey = getFormattedPrivateKey(privateKeyRaw);
    console.log('Formatted private key length:', privateKey?.length);

    // Build service account object expected by firebase-admin
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Initialize Firebase app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.error('Full error:', error);
    // Don't exit, just log the error - the app can still run without Firebase
  }
}

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      console.error('Firebase not initialized - cannot authenticate users');
      return res.status(500).json({
        success: false,
        message: 'Authentication service unavailable',
        error: 'The default Firebase app does not exist. Make sure you call initializeApp() before using any of the Firebase services.'
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get or create user in our database
    const user = await getOrCreateUser(decodedToken);

    // Add user info to request
    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      displayName: user.display_name || decodedToken.name,
      dbId: user.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// Helper function to get or create user in database
async function getOrCreateUser(decodedToken) {
  try {
    // First, try to find existing user
    let result = await db.query(
      'SELECT id, display_name FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (result.rowCount > 0) {
      return result.rows[0];
    }

    // User doesn't exist, create new one
    result = await db.query(
      `INSERT INTO users (firebase_uid, email, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, display_name`,
      [decodedToken.uid, decodedToken.email, decodedToken.name || decodedToken.email?.split('@')[0]]
    );

    console.log('✅ Created new user:', {
      id: result.rows[0].id,
      email: decodedToken.email,
      uid: decodedToken.uid
    });

    return result.rows[0];
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
}

module.exports = {
  authenticateUser
};

// Also export init flag for health checks / other modules
module.exports.isFirebaseInitialized = isFirebaseInitialized;