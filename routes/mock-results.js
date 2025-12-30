const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const axios = require('axios');

// POST /api/mock-results - Process mock game results (admin only for testing)
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'gatorgoldrs@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('📥 Received mock results request:', req.body);

    // Clear existing mock results for 2025
    await db.query('DELETE FROM game_results WHERE season_year = $1', [2025]);

    // Check if frontend sent direct mockResults array with game data
    if (req.body.mockResults && Array.isArray(req.body.mockResults)) {
      console.log('🎯 Processing direct mockResults from frontend');
      const { mockResults: frontendResults } = req.body;
      
      // Map round names from frontend format to database format
      const roundNameMap = {
        'wild_card': 'wildcard',
        'wildcard': 'wildcard',
        'divisional': 'divisional',
        'conference_championship': 'championship',
        'championship': 'championship',
        'super_bowl': 'superbowl',
        'superbowl': 'superbowl'
      };

      let gameCounter = { afc_wildcard: 0, nfc_wildcard: 0, afc_divisional: 0, nfc_divisional: 0 };
      
      const dbResults = frontendResults.map((game) => {
        const dbRoundName = roundNameMap[game.round] || game.round;
        let gameType;
        
        if (dbRoundName === 'wildcard') {
          const confPrefix = game.conference || 'afc';
          gameCounter[`${confPrefix}_wildcard`]++;
          gameType = `${confPrefix}_wildcard_${gameCounter[`${confPrefix}_wildcard`]}`;
        } else if (dbRoundName === 'divisional') {
          const confPrefix = game.conference || 'afc';
          gameCounter[`${confPrefix}_divisional`]++;
          gameType = `${confPrefix}_divisional_${gameCounter[`${confPrefix}_divisional`]}`;
        } else if (dbRoundName === 'championship') {
          gameType = `${game.conference || 'afc'}_championship`;
        } else if (dbRoundName === 'superbowl') {
          gameType = 'super_bowl';
        } else {
          gameType = game.round;
        }

        console.log(`Processing game: ${dbRoundName} - ${gameType}, Winner ID: ${game.winner_team_id}`);
        
        return [
          2025, // season_year
          dbRoundName, // round_name
          gameType, // game_type
          game.home_team_id, // home_team_id
          game.away_team_id, // away_team_id
          game.winner_team_id, // winner_id
          Math.floor(Math.random() * 20) + 14, // home_score
          Math.floor(Math.random() * 20) + 14, // away_score
          new Date(game.game_date || Date.now()), // game_date
          true // is_final
        ];
      });

      // Insert mock results
      if (dbResults.length > 0) {
        const insertQuery = `
          INSERT INTO game_results 
          (season_year, round_name, game_type, home_team_id, away_team_id, winner_id, home_score, away_score, game_date, is_final)
          VALUES ${dbResults.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(', ')}
        `;
        
        const flatValues = dbResults.flat();
        await db.query(insertQuery, flatValues);
        
        console.log(`✅ Inserted ${dbResults.length} game results from frontend`);
      }

      return res.json({
        success: true,
        message: `Mock results processed successfully! ${dbResults.length} games simulated.`,
        results_count: dbResults.length,
        season_year: 2025
      });
    }

    // Get the SAME playoff teams that the frontend uses
    // This makes an internal request to our own playoff teams endpoint
    let playoffTeamsResponse;
    
    try {
      // Make internal request to get playoff teams (same as frontend)
      playoffTeamsResponse = await axios.get(`http://localhost:3001/api/teams/playoffs/2025`);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch playoff teams: ' + error.message
      });
    }

    const allPlayoffTeams = playoffTeamsResponse.data.playoff_teams || [];
    
    console.log('🏈 Backend using SAME playoff teams as frontend:');
    console.log('AFC:', allPlayoffTeams.filter(t => t.conference === 'American Football Conference').map(t => `${t.playoffSeed}.${t.abbreviation}(${t.id})`));
    console.log('NFC:', allPlayoffTeams.filter(t => t.conference === 'National Football Conference').map(t => `${t.playoffSeed}.${t.abbreviation}(${t.id})`));

    if (allPlayoffTeams.length < 14) {
      return res.status(400).json({
        success: false,
        message: 'Not enough playoff teams. Expected 14 playoff teams (7 AFC + 7 NFC).'
      });
    }

    // Initialize mockResults array
    let mockResults = [];

    // Check if simple_winners format is provided
    if (req.body.simple_winners && req.body.test_mode) {
      console.log('🎯 Processing simple_winners test data');
      const { simple_winners } = req.body;
      
      if (simple_winners.length !== 13) {
        return res.status(400).json({
          success: false,
          message: `Expected 13 winners, got ${simple_winners.length}`
        });
      }

      // Create structured playoff games from the simple winners array
      let winnerIndex = 0;

      // Wild Card Round (6 games: 3 AFC + 3 NFC) - winners 0-5
      const wildCardRounds = [
        { round: 'wildcard', conference: 'afc', games: 3 },
        { round: 'wildcard', conference: 'nfc', games: 3 }
      ];

      for (const roundInfo of wildCardRounds) {
        for (let i = 0; i < roundInfo.games; i++) {
          const winnerId = parseInt(simple_winners[winnerIndex]);
          // Convert team IDs to integers for comparison since ESPN returns strings
          const winner = allPlayoffTeams.find(t => parseInt(t.id) === winnerId);
          
          if (!winner) {
            console.log('❌ Team ID lookup failed:', { winnerId, allPlayoffTeams: allPlayoffTeams.map(t => `${t.abbreviation}(${t.id})`) });
            return res.status(400).json({
              success: false,
              message: `Invalid team ID: ${winnerId}. Available teams: ${allPlayoffTeams.map(t => `${t.abbreviation}(${t.id})`).join(', ')}`
            });
          }

          // Create dummy home/away teams (for testing, we'll use random ones)
          const dummyHome = allPlayoffTeams[i % allPlayoffTeams.length];
          const dummyAway = allPlayoffTeams[(i + 1) % allPlayoffTeams.length];

          mockResults.push([
            2025, // season_year
            roundInfo.round, // round_name
            `${roundInfo.conference}_${roundInfo.round}_${i + 1}`, // game_type
            dummyHome.id, // home_team_id
            dummyAway.id, // away_team_id
            winnerId, // winner_id
            Math.floor(Math.random() * 20) + 14, // home_score
            Math.floor(Math.random() * 20) + 14, // away_score
            new Date(), // game_date
            true // is_final
          ]);

          console.log(`Added ${roundInfo.conference} ${roundInfo.round} game ${i+1}: Winner ${winner.abbreviation} (${winnerId})`);
          winnerIndex++;
        }
      }

      // Divisional Round (4 games: 2 AFC + 2 NFC) - winners 6-9
      const divisionalRounds = [
        { round: 'divisional', conference: 'afc', games: 2 },
        { round: 'divisional', conference: 'nfc', games: 2 }
      ];

      for (const roundInfo of divisionalRounds) {
        for (let i = 0; i < roundInfo.games; i++) {
          const winnerId = parseInt(simple_winners[winnerIndex]);
          // Convert team IDs to integers for comparison since ESPN returns strings
          const winner = allPlayoffTeams.find(t => parseInt(t.id) === winnerId);

          const dummyHome = allPlayoffTeams[i % allPlayoffTeams.length];
          const dummyAway = allPlayoffTeams[(i + 1) % allPlayoffTeams.length];

          mockResults.push([
            2025,
            roundInfo.round,
            `${roundInfo.conference}_${roundInfo.round}_${i + 1}`,
            dummyHome.id,
            dummyAway.id,
            winnerId,
            Math.floor(Math.random() * 20) + 14,
            Math.floor(Math.random() * 20) + 14,
            new Date(),
            true
          ]);

          console.log(`Added ${roundInfo.conference} ${roundInfo.round} game ${i+1}: Winner ${winner.abbreviation} (${winnerId})`);
          winnerIndex++;
        }
      }

      // Championship Round (2 games: AFC + NFC) - winners 10-11
      const championshipConferences = ['afc', 'nfc'];
      for (let i = 0; i < championshipConferences.length; i++) {
        const conference = championshipConferences[i];
        const winnerId = parseInt(simple_winners[winnerIndex]);
        // Convert team IDs to integers for comparison since ESPN returns strings
        const winner = allPlayoffTeams.find(t => parseInt(t.id) === winnerId);

        const dummyHome = allPlayoffTeams[i % allPlayoffTeams.length];
        const dummyAway = allPlayoffTeams[(i + 1) % allPlayoffTeams.length];

        mockResults.push([
          2025,
          'championship',
          `${conference}_championship`,
          dummyHome.id,
          dummyAway.id,
          winnerId,
          Math.floor(Math.random() * 20) + 14,
          Math.floor(Math.random() * 20) + 14,
          new Date(),
          true
        ]);

        console.log(`Added ${conference} championship: Winner ${winner.abbreviation} (${winnerId})`);
        winnerIndex++;
      }

      // Super Bowl (1 game) - winner 12
      const superBowlWinnerId = parseInt(simple_winners[winnerIndex]);
      // Convert team IDs to integers for comparison since ESPN returns strings
      const superBowlWinner = allPlayoffTeams.find(t => parseInt(t.id) === superBowlWinnerId);
      
      if (!superBowlWinner) {
        console.log('❌ Super Bowl team ID lookup failed:', { superBowlWinnerId, allPlayoffTeams: allPlayoffTeams.map(t => `${t.abbreviation}(${t.id})`) });
        return res.status(400).json({
          success: false,
          message: `Invalid Super Bowl team ID: ${superBowlWinnerId}. Available teams: ${allPlayoffTeams.map(t => `${t.abbreviation}(${t.id})`).join(', ')}`
        });
      }

      mockResults.push([
        2025,
        'superbowl',
        'super_bowl',
        allPlayoffTeams[0].id, // dummy home
        allPlayoffTeams[1].id, // dummy away
        superBowlWinnerId,
        Math.floor(Math.random() * 20) + 14,
        Math.floor(Math.random() * 20) + 14,
        new Date(),
        true
      ]);
      winnerIndex++; // Move to next winner

      console.log(`Added Super Bowl: Winner ${superBowlWinner.abbreviation} (${superBowlWinnerId})`);
      console.log(`✅ Generated ${mockResults.length} games from simple_winners array`);
    } else {
      // Original random game generation logic
      console.log('🎲 Using random game generation (no simple_winners provided)');
      let gameCounter = 0;

      // AFC Wild Card (3 games)
      for (let i = 0; i < 3; i++) {
        const homeTeam = allTeams[gameCounter % allTeams.length];
        const awayTeam = allTeams[(gameCounter + 1) % allTeams.length];
        const winner = Math.random() > 0.5 ? homeTeam : awayTeam;
        
        mockResults.push([
          2025, // season_year
          'wildcard', // round_name
          `afc_wildcard_${i + 1}`, // game_type
          homeTeam.id, // home_team_id
          awayTeam.id, // away_team_id
          winner.id, // winner_id
          Math.floor(Math.random() * 20) + 14, // home_score
          Math.floor(Math.random() * 20) + 14, // away_score
          new Date(), // game_date
          true // is_final
        ]);
        gameCounter += 2;
      }

      // NFC Wild Card (3 games)
      for (let i = 0; i < 3; i++) {
        const homeTeam = allTeams[gameCounter % allTeams.length];
        const awayTeam = allTeams[(gameCounter + 1) % allTeams.length];
        const winner = Math.random() > 0.5 ? homeTeam : awayTeam;
        
        mockResults.push([
          2025, // season_year
          'wildcard', // round_name
          `nfc_wildcard_${i + 1}`, // game_type
          homeTeam.id, // home_team_id
          awayTeam.id, // away_team_id
          winner.id, // winner_id
          Math.floor(Math.random() * 20) + 14, // home_score
          Math.floor(Math.random() * 20) + 14, // away_score
          new Date(), // game_date
          true // is_final
        ]);
        gameCounter += 2;
      }
    }

    // Insert mock results
    if (mockResults.length > 0) {
      const insertQuery = `
        INSERT INTO game_results 
        (season_year, round_name, game_type, home_team_id, away_team_id, winner_id, home_score, away_score, game_date, is_final)
        VALUES ${mockResults.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(', ')}
      `;
      
      const flatValues = mockResults.flat();
      await db.query(insertQuery, flatValues);
    }

    res.json({
      success: true,
      message: `Mock results processed successfully! ${mockResults.length} games simulated.`,
      results_count: mockResults.length,
      season_year: 2025
    });

  } catch (error) {
    console.error('Error processing mock results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process mock results',
      error: error.message
    });
  }
});

// POST /api/mock-results/seeded - Process scores based on seeded game results (no mock data insertion)
router.post('/seeded', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'gatorgoldrs@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { season = 2025 } = req.body;

    console.log(`🎯 Processing scores for seeded results in season ${season}...`);

    // Check how many game results exist
    const resultCount = await db.query('SELECT COUNT(*) as count FROM game_results WHERE season_year = $1 AND is_final = true', [season]);
    const count = parseInt(resultCount.rows[0].count);

    if (count === 0) {
      return res.status(400).json({
        success: false,
        message: 'No seeded game results found. Please run the seed script first.'
      });
    }

    console.log(`Found ${count} seeded game results for season ${season}`);

    // Scores are calculated on-the-fly in the leaderboard query, so no need to update brackets table
    // Just return success - frontend will fetch updated leaderboard

    res.json({
      success: true,
      message: `Seeded results processed successfully! ${count} games found. Scores will be calculated when leaderboard is fetched.`,
      results_count: count,
      season_year: season
    });

  } catch (error) {
    console.error('Error processing seeded results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process seeded results',
      error: error.message
    });
  }
});

module.exports = router;