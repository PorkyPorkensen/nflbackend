const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Database setup SQL
const setupSQL = `
-- Drop existing tables if they exist (careful!)
DROP TABLE IF EXISTS bracket_predictions CASCADE;
DROP TABLE IF EXISTS brackets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS nfl_teams CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;

-- Create NFL Teams table (espn_team_id as PK)
CREATE TABLE nfl_teams (
  espn_team_id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL UNIQUE,
  location VARCHAR(100) NOT NULL,
  conference VARCHAR(50) NOT NULL,
  division VARCHAR(50) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  playoff_seed INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Brackets table
CREATE TABLE brackets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bracket_name VARCHAR(255) NOT NULL,
  season_year INTEGER NOT NULL,
  score INTEGER DEFAULT 0, -- Cached total score for leaderboard
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, season_year) -- One bracket per user per season
);

-- Create Bracket Predictions table (uses espn_team_id as FK)
CREATE TABLE bracket_predictions (
  id SERIAL PRIMARY KEY,
  bracket_id INTEGER REFERENCES brackets(id) ON DELETE CASCADE,
  round_name VARCHAR(50) NOT NULL, -- 'wildcard', 'divisional', 'championship', 'superbowl'
  game_type VARCHAR(50) NOT NULL, -- 'afc_wildcard_1', 'nfc_wildcard_1', etc.
  predicted_winner_id INTEGER REFERENCES nfl_teams(espn_team_id),
  home_team_id INTEGER REFERENCES nfl_teams(espn_team_id),
  away_team_id INTEGER REFERENCES nfl_teams(espn_team_id),
  points_value INTEGER NOT NULL DEFAULT 1, -- Points this prediction is worth
  scored_at TIMESTAMP, -- When this prediction was scored (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Game Results table (uses espn_team_id as FK)
CREATE TABLE game_results (
  id SERIAL PRIMARY KEY,
  season_year INTEGER NOT NULL,
  round_name VARCHAR(50) NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  home_team_id INTEGER REFERENCES nfl_teams(espn_team_id),
  away_team_id INTEGER REFERENCES nfl_teams(espn_team_id),
  winner_id INTEGER REFERENCES nfl_teams(espn_team_id),
  home_score INTEGER,
  away_score INTEGER,
  game_date TIMESTAMP,
  is_final BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'final', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(season_year, round_name, game_type)
);

-- Create indexes for better performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_brackets_user_season ON brackets(user_id, season_year);
CREATE INDEX idx_predictions_bracket ON bracket_predictions(bracket_id);
CREATE INDEX idx_predictions_round ON bracket_predictions(round_name, game_type);
CREATE INDEX idx_game_results_season_round ON game_results(season_year, round_name);
CREATE INDEX idx_nfl_teams_conference ON nfl_teams(conference, playoff_seed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brackets_updated_at BEFORE UPDATE ON brackets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfl_teams_updated_at BEFORE UPDATE ON nfl_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
  let pool;
  
  try {
    console.log('🔧 Setting up PostgreSQL database...');
    
    // Connect to database
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false } // AWS RDS requires SSL
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Execute setup SQL
    console.log('📊 Creating tables and indexes...');
    await pool.query(setupSQL);
    console.log('✅ Database setup complete!');

    // Verify tables were created
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📋 Created tables:', tables.rows.map(row => row.tablename).join(', '));

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔚 Database connection closed');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };