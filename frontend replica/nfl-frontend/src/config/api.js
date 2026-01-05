// API Configuration for SportSync Frontend
// This file centralizes all backend API endpoints

// Development vs Production API Base URL
const isDevelopment = import.meta.env.MODE === 'development';
const isLocalhost = window.location.hostname === 'localhost';

// API Base URLs
const API_BASE_URLS = {
  // Local Express.js backend (using the /backend folder)
  local: 'http://prod.eba-gs6tvmnq.us-east-1.elasticbeanstalk.com',
  // Production AWS Elastic Beanstalk backend (via CloudFront for HTTPS)
  production: 'https://dt391zudkqfrk.cloudfront.net',
};

// Choose which backend to use
// Using production backend for deployed app
export const API_BASE_URL = isDevelopment && isLocalhost ? API_BASE_URLS.local : API_BASE_URLS.production;

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  health: `${API_BASE_URL}/api/health`,
  
  // Teams endpoints  
  teams: `${API_BASE_URL}/api/teams`,
  playoffTeams: (year = 2025) => `${API_BASE_URL}/api/teams/playoffs/${year}`,
  
  // Brackets endpoints
  brackets: `${API_BASE_URL}/api/brackets`,
  userBrackets: `${API_BASE_URL}/api/user/brackets`,
  deleteUserBracket: (bracketId) => `${API_BASE_URL}/api/my-brackets/${bracketId}`,
  
  // User endpoints
  updateDisplayName: `${API_BASE_URL}/api/user/display-name`,

  // Leaderboard endpoints
  leaderboard: (year = 2025) => `${API_BASE_URL}/api/leaderboard/${year}`,
  
  // Mock results (for development/testing)
  mockResults: `${API_BASE_URL}/api/mock-results`,
  seededResults: `${API_BASE_URL}/api/mock-results/seeded`,
  
  // Simulated game results
  simulatedResults: (year = 2025) => `${API_BASE_URL}/api/simulated-results/${year}`,
};

// Helper function to make authenticated API calls
// Note: This requires the auth token to be passed from the component
export const makeAuthenticatedRequest = async (url, options = {}, authToken = null) => {
  try {
    let headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Export for debugging
export const config = {
  isDevelopment,
  isLocalhost,
  currentBackend: 'local',
  apiBaseUrl: API_BASE_URL,
};

console.log('🚀 API Configuration (Local Backend):', config);