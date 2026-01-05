// scripts/seed-game-results.js
// Script to hardcode and insert playoff game results into the game_results table

// --- TEAM ID LEGEND (espn_team_id) ---
// Kansas City Chiefs = 12
// New England Patriots = 17
// Pittsburgh Steelers = 23
// Jacksonville Jaguars = 30
// Houston Texans = 34
// Los Angeles Chargers = 24
// Buffalo Bills = 2
// Chicago Bears = 3
// Carolina Panthers = 29
// Los Angeles Rams = 14
// Green Bay Packers = 9
// San Francisco 49ers = 25
// Philadelphia Eagles = 21
// Miami Dolphins = 15
// New York Jets = 20
// Baltimore Ravens = 33
// Cincinnati Bengals = 4
// Cleveland Browns = 5
// Indianapolis Colts = 11
// Tennessee Titans = 10
// Denver Broncos = 7
// Las Vegas Raiders = 13
// Dallas Cowboys = 6
// New York Giants = 19
// Washington Commanders = 28
// Detroit Lions = 8
// Minnesota Vikings = 16
// Atlanta Falcons = 1
// New Orleans Saints = 18
// Tampa Bay Buccaneers = 27
// Arizona Cardinals = 22
// Seattle Seahawks = 26
// (Reference your nfl_teams table for any missing IDs)
// Usage: node scripts/seed-game-results.js

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('../config/database');

// Helper function to map round number to round_name and game_number to game_type
function getRoundAndGameType(round, gameNumber) {
  const roundMap = {
    1: 'wildcard',
    2: 'divisional',
    3: 'championship',
    4: 'superbowl'
  };
  
  const roundName = roundMap[round];
  let gameType;
  
  if (round === 1) { // Wildcard
    if (gameNumber <= 3) {
      gameType = `afc_wildcard_${gameNumber}`;
    } else {
      gameType = `nfc_wildcard_${gameNumber - 3}`;
    }
  } else if (round === 2) { // Divisional
    if (gameNumber <= 2) {
      gameType = `afc_divisional_${gameNumber}`;
    } else {
      gameType = `nfc_divisional_${gameNumber - 2}`;
    }
  } else if (round === 3) { // Championship
    gameType = gameNumber === 1 ? 'afc_championship' : 'nfc_championship';
  } else if (round === 4) { // Super Bowl
    gameType = 'super_bowl';
  }
  
  return { roundName, gameType };
}

// Example playoff results: update this array as games are played
// Each object: { season, round, game_number, winning_team_id }
const playoffResults = [
  // Example entry:
  // Suppose the Chiefs (espn_team_id: 12) win game 1 of round 1 in 2025:
  // { season: 2025, round: 1, game_number: 1, winning_team_id: 17 },
  // { season: 2025, round: 1, game_number: 2, winning_team_id: 30 },
  // { season: 2025, round: 1, game_number: 3, winning_team_id: 24 },
  // { season: 2025, round: 1, game_number: 4, winning_team_id: 3 },
  // { season: 2025, round: 1, game_number: 5, winning_team_id: 14 },
  // { season: 2025, round: 1, game_number: 6, winning_team_id: 25 },
  // { season: 2025, round: 2, game_number: 1, winning_team_id: 24 },
  // { season: 2025, round: 2, game_number: 2, winning_team_id: 30 },
  // { season: 2025, round: 2, game_number: 3, winning_team_id: 26 },
  // { season: 2025, round: 2, game_number: 4, winning_team_id: 14 },
  // { season: 2025, round: 3, game_number: 1, winning_team_id: 24 },
  // { season: 2025, round: 3, game_number: 2, winning_team_id: 14 },
  // { season: 2025, round: 4, game_number: 1, winning_team_id: 24 },
  // { season: 2025, round: 1, game_number: 1, winning_team_id: 12 },
  // { season: 2025, round: 1, game_number: 2, winning_team_id: 30 },
  // { season: 2025, round: 3, game_number: 1, winning_team_id: 17 },
  { season: 2025, round: 4, game_number: 1, winning_team_id: 16 },
  // Add more entries as games are played, using espn_team_id for the winner
];

async function seedGameResults() {
  try {
    console.log('🏈 Seeding playoff game results...');
    
    // Clear existing game results for the season before seeding new ones
    await db.query('DELETE FROM game_results WHERE season_year = $1', [2025]);
    console.log('🗑️ Cleared existing game results for season 2025');
    
    for (const result of playoffResults) {
      const { roundName, gameType } = getRoundAndGameType(result.round, result.game_number);
      
      await db.query(
        `INSERT INTO game_results (season_year, round_name, game_type, home_team_id, away_team_id, winner_id, home_score, away_score, game_date, is_final)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (season_year, round_name, game_type)
         DO UPDATE SET winner_id = EXCLUDED.winner_id, is_final = EXCLUDED.is_final`,
        [result.season, roundName, gameType, 1, 2, result.winning_team_id, Math.floor(Math.random() * 20) + 14, Math.floor(Math.random() * 20) + 14, new Date(), true]
      );
      console.log(`Inserted: season ${result.season}, round ${roundName}, game ${gameType}, winner ${result.winning_team_id}`);
    }
    console.log('✅ Playoff results seeded!');
  } catch (err) {
    console.error('❌ Error seeding playoff results:', err);
  }
}

seedGameResults();
