const admin = require('firebase-admin');
const db = require('../config/database');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    console.log('Firebase env vars:', Object.keys(process.env).filter(k => k.startsWith('FIREBASE')));
    console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);
    console.log('FIREBASE_PRIVATE_KEY start:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    console.log('Raw private key length:', privateKeyRaw?.length);
    console.log('Raw private key start:', privateKeyRaw?.substring(0, 50));

    // Try different ways to process the private key
    let privateKey = privateKeyRaw;
    if (privateKeyRaw?.includes('\\n')) {
      privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      console.log('Replaced \\n with newlines');
    } else if (privateKeyRaw?.includes('\n')) {
      console.log('Private key already contains newlines');
    } else {
      console.log('Private key does not contain newlines or \\n');
    }

    console.log('Final private key length:', privateKey?.length);
    console.log('Final private key start:', privateKey?.substring(0, 50));

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Optional fields - comment out if causing issues
        // privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        // clientId: process.env.FIREBASE_CLIENT_ID,
      })
    });
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