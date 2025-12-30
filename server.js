const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Firebase Admin is initialized in middleware/auth.js
// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  try {
    dotenv.config();
    console.log('✅ Environment variables loaded from .env file');
  } catch (error) {
    console.log('ℹ️  No .env file found, using environment variables from system');
  }
} else {
  console.log('ℹ️  Production environment detected, using EB environment variables');
}

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please set these environment variables in your Elastic Beanstalk configuration or .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const db = require('./config/database');

// Initialize Firebase Admin (ensure middleware runs and logs at startup)
try {
  require('./middleware/auth');
  console.log('🔐 Firebase auth middleware module required (initialization attempted)');
} catch (e) {
  console.warn('⚠️  Could not require Firebase auth middleware at startup:', e && e.message);
}
// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://nflfrontend.vercel.app',
  // CloudFront distribution used as API front (add yours if different)
  'https://dt391zudkqfrk.cloudfront.net'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like server-to-server or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));

// Ensure preflight OPTIONS requests are handled
app.options('*', cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/brackets', require('./routes/brackets'));
app.use('/api/my-brackets', require('./routes/my-brackets'));
app.use('/api/user', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/mock-results', require('./routes/mock-results'));
app.use('/api/simulated-results', require('./routes/simulated-results'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/teams',
      'GET /api/teams/playoffs/:year',
      'GET /api/brackets',
      'POST /api/brackets',
      'GET /api/user/brackets',
      'DELETE /api/my-brackets/:bracketId',
      'GET /api/leaderboard/:year',
      'POST /api/mock-results',
      'GET /api/simulated-results/:year'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🏈 NFL Bracket Backend running on port ${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ All required environment variables are present`);
});

module.exports = app;