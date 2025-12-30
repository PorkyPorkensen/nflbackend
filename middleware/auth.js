const admin = require('firebase-admin');
const db = require('../config/database');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);
  console.log('FIREBASE_PRIVATE_KEY start:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 100));
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
    })
  });
}

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
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