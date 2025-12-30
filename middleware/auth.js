const admin = require('firebase-admin');
const db = require('../config/database');

// Function to format private key properly
function formatPrivateKey(key) {
  if (!key) return key;
  
  // If already has newlines, return as is
  if (key.includes('\n')) {
    return key;
  }
  
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (!key.startsWith(header) || !key.endsWith(footer)) {
    throw new Error('Invalid private key format: missing BEGIN or END markers');
  }
  
  // Extract base64 part
  const base64Start = header.length;
  const base64End = key.length - footer.length;
  const base64 = key.substring(base64Start, base64End).replace(/\s/g, '');
  
  // Wrap base64 at 64 characters per line
  const wrappedBase64 = base64.match(/.{1,64}/g).join('\n');
  
  // Reconstruct with proper newlines
  return `${header}\n${wrappedBase64}\n${footer}\n`;
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    console.log('All env vars with FIREBASE:', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    console.log('Raw private key length:', privateKeyRaw?.length);
    console.log('Raw private key start:', privateKeyRaw?.substring(0, 50));
    console.log('Raw private key end:', privateKeyRaw?.substring(privateKeyRaw.length - 50));

    // Format the private key properly
    let privateKey;
    try {
      privateKey = formatPrivateKey(privateKeyRaw);
      console.log('Formatted private key successfully');
    } catch (formatError) {
      console.error('Failed to format private key:', formatError.message);
      throw formatError;
    }

    console.log('Final private key length:', privateKey?.length);
    console.log('Final private key start:', privateKey?.substring(0, 50));
    console.log('Final private key end:', privateKey?.substring(privateKey.length - 50));

    // Ensure it starts and ends with the correct markers
    if (!privateKey?.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('Private key does not contain BEGIN marker');
      throw new Error('Invalid private key format');
    }
    if (!privateKey?.includes('-----END PRIVATE KEY-----')) {
      console.error('Private key does not contain END marker');
      throw new Error('Invalid private key format');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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