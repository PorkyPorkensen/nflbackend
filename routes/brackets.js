const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// GET /api/brackets - Get all brackets (for admin/debugging)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.bracket_name,
        b.season_year,
        b.created_at,
        u.display_name,
        u.email,
        COUNT(bp.id) as prediction_count
      FROM brackets b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN bracket_predictions bp ON b.id = bp.bracket_id
      GROUP BY b.id, b.bracket_name, b.season_year, b.created_at, u.display_name, u.email
      ORDER BY b.created_at DESC
    `;
    
    const result = await db.query(query);
    
    // Fetch predictions for each bracket
    const bracketsWithPredictions = await Promise.all(
      result.rows.map(async (bracket) => {
        const predictions = await getBracketPredictions(bracket.id);
        return {
          ...bracket,
          predictions
        };
      })
    );
    
    res.json({
      success: true,
      brackets: bracketsWithPredictions,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching brackets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brackets',
      error: error.message
    });
  }
});

// POST /api/brackets - Create a new bracket
router.post('/', authenticateUser, async (req, res) => {
  const { bracket_name, predictions, season_year = 2025 } = req.body;
  
  try {
    if (!bracket_name || !predictions) {
      return res.status(400).json({
        success: false,
        message: 'Bracket name and predictions are required'
      });
    }

    if (bracket_name.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Bracket name must be 20 characters or less'
      });
    }

    // Check if user already has a bracket for this season (unless admin)
    const isAdmin = req.user.email === 'gatorgoldrs@gmail.com';
    
    if (!isAdmin) {
      const existingBracket = await db.query(
        'SELECT id FROM brackets WHERE user_id = $1 AND season_year = $2',
        [req.user.dbId, season_year]
      );
      
      if (existingBracket.rowCount > 0) {
        return res.status(409).json({
          success: false,
          message: 'You can only submit one bracket per season. Delete your existing bracket first.'
        });
      }
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create bracket
      const bracketResult = await db.query(
        'INSERT INTO brackets (user_id, bracket_name, season_year) VALUES ($1, $2, $3) RETURNING id',
        [req.user.dbId, bracket_name.trim(), season_year]
      );
      
      const bracketId = bracketResult.rows[0].id;

      // Parse and save predictions
      await saveBracketPredictions(bracketId, predictions);

      // Commit transaction
      await db.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Bracket submitted successfully',
        bracket: {
          id: bracketId,
          bracket_name: bracket_name.trim(),
          season_year
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bracket',
      error: error.message
    });
  }
});

// Helper function to save bracket predictions
async function saveBracketPredictions(bracketId, predictions) {
  console.log('💾 Saving bracket predictions using ESPN team IDs directly');

  const predictionInserts = [];

  // Helper to extract ESPN IDs from game object
  function getEspnIds(game) {
    return {
      winner: game.winner ? game.winner.id : null,
      home: game.home ? game.home.id : null,
      away: game.away ? game.away.id : null
    };
  }

  // Process AFC Wild Card
  if (predictions.afc && predictions.afc.wildCard) {
    for (let index = 0; index < predictions.afc.wildCard.length; index++) {
      const game = predictions.afc.wildCard[index];
      if (game.winner) {
        console.log(`AFC WC ${index + 1}: ${game.winner.abbreviation} (${game.winner.id}) wins`);
        const ids = getEspnIds(game);
        predictionInserts.push([
          bracketId,
          'wildcard',
          `afc_wildcard_${index + 1}`,
          ids.winner,
          ids.home,
          ids.away,
          1
        ]);
      }
    }
  }

  // Process NFC Wild Card
  if (predictions.nfc && predictions.nfc.wildCard) {
    for (let index = 0; index < predictions.nfc.wildCard.length; index++) {
      const game = predictions.nfc.wildCard[index];
      if (game.winner) {
        console.log(`NFC WC ${index + 1}: ${game.winner.abbreviation} (${game.winner.id}) wins`);
        const ids = getEspnIds(game);
        predictionInserts.push([
          bracketId,
          'wildcard',
          `nfc_wildcard_${index + 1}`,
          ids.winner,
          ids.home,
          ids.away,
          1
        ]);
      }
    }
  }

  // Process AFC Divisional
  if (predictions.afc && predictions.afc.divisional) {
    for (let index = 0; index < predictions.afc.divisional.length; index++) {
      const game = predictions.afc.divisional[index];
      if (game.winner) {
        console.log(`AFC Div ${index + 1}: ${game.winner.abbreviation} (${game.winner.id}) wins`);
        const ids = getEspnIds(game);
        predictionInserts.push([
          bracketId,
          'divisional',
          `afc_divisional_${index + 1}`,
          ids.winner,
          ids.home,
          ids.away,
          2
        ]);
      }
    }
  }

  // Process NFC Divisional
  if (predictions.nfc && predictions.nfc.divisional) {
    for (let index = 0; index < predictions.nfc.divisional.length; index++) {
      const game = predictions.nfc.divisional[index];
      if (game.winner) {
        console.log(`NFC Div ${index + 1}: ${game.winner.abbreviation} (${game.winner.id}) wins`);
        const ids = getEspnIds(game);
        predictionInserts.push([
          bracketId,
          'divisional',
          `nfc_divisional_${index + 1}`,
          ids.winner,
          ids.home,
          ids.away,
          2
        ]);
      }
    }
  }

  // Process AFC Championship
  if (predictions.afc && predictions.afc.championship && predictions.afc.championship.winner) {
    console.log(`AFC Championship: ${predictions.afc.championship.winner.abbreviation} (${predictions.afc.championship.winner.id}) wins`);
    const ids = getEspnIds(predictions.afc.championship);
    predictionInserts.push([
      bracketId,
      'championship',
      'afc_championship',
      ids.winner,
      ids.home,
      ids.away,
      4
    ]);
  }

  // Process NFC Championship
  if (predictions.nfc && predictions.nfc.championship && predictions.nfc.championship.winner) {
    console.log(`NFC Championship: ${predictions.nfc.championship.winner.abbreviation} (${predictions.nfc.championship.winner.id}) wins`);
    const ids = getEspnIds(predictions.nfc.championship);
    predictionInserts.push([
      bracketId,
      'championship',
      'nfc_championship',
      ids.winner,
      ids.home,
      ids.away,
      4
    ]);
  }

  // Process Super Bowl
  if (predictions.superBowl && predictions.superBowl.winner) {
    console.log(`Super Bowl: ${predictions.superBowl.winner.abbreviation} (${predictions.superBowl.winner.id}) wins`);
    const ids = getEspnIds({
      winner: predictions.superBowl.winner,
      home: predictions.superBowl.afc,
      away: predictions.superBowl.nfc
    });
    predictionInserts.push([
      bracketId,
      'superbowl',
      'super_bowl',
      ids.winner,
      ids.home,
      ids.away,
      8
    ]);
  }

  // Insert all predictions
  if (predictionInserts.length > 0) {
    const insertQuery = `
      INSERT INTO bracket_predictions 
      (bracket_id, round_name, game_type, predicted_winner_id, home_team_id, away_team_id, points_value)
      VALUES ${predictionInserts.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ')}
    `;
    const flatValues = predictionInserts.flat();
    await db.query(insertQuery, flatValues);
  }
}

module.exports = router;

// Helper function to get bracket predictions and reconstruct the predictions object
async function getBracketPredictions(bracketId) {
  try {
    const query = `
      SELECT 
        bp.round_name,
        bp.game_type,
        bp.predicted_winner_id,
        bp.home_team_id,
        bp.away_team_id,
        t_winner.name as winner_name,
        t_winner.abbreviation as winner_abbreviation,
        t_winner.logo_url as winner_logo,
        t_home.name as home_name,
        t_home.abbreviation as home_abbreviation,
        t_home.logo_url as home_logo,
        t_away.name as away_name,
        t_away.abbreviation as away_abbreviation,
        t_away.logo_url as away_logo
      FROM bracket_predictions bp
      LEFT JOIN nfl_teams t_winner ON bp.predicted_winner_id = t_winner.espn_team_id
      LEFT JOIN nfl_teams t_home ON bp.home_team_id = t_home.espn_team_id
      LEFT JOIN nfl_teams t_away ON bp.away_team_id = t_away.espn_team_id
      WHERE bp.bracket_id = $1
      ORDER BY bp.round_name, bp.game_type
    `;

    const result = await db.query(query, [bracketId]);
    console.log(`Bracket ${bracketId}: Found ${result.rows.length} predictions`);

    // Reconstruct predictions object
    const predictions = {
      afc: {
        wildCard: [],
        divisional: [],
        championship: null
      },
      nfc: {
        wildCard: [],
        divisional: [],
        championship: null
      },
      superBowl: {
        afc: null,
        nfc: null,
        winner: null
      }
    };

    // Initialize arrays
    for (let i = 0; i < 3; i++) {
      predictions.afc.wildCard.push(null);
      predictions.nfc.wildCard.push(null);
    }
    for (let i = 0; i < 2; i++) {
      predictions.afc.divisional.push(null);
      predictions.nfc.divisional.push(null);
    }

    result.rows.forEach(row => {
      console.log(`Processing prediction: ${row.round_name} - ${row.game_type} - winner: ${row.winner_name || 'none'}`);
      const game = {
        winner: row.predicted_winner_id ? {
          id: row.predicted_winner_id,
          name: row.winner_name,
          abbreviation: row.winner_abbreviation,
          logo: row.winner_logo
        } : null,
        home: row.home_team_id ? {
          id: row.home_team_id,
          name: row.home_name,
          abbreviation: row.home_abbreviation,
          logo: row.home_logo
        } : null,
        away: row.away_team_id ? {
          id: row.away_team_id,
          name: row.away_name,
          abbreviation: row.away_abbreviation,
          logo: row.away_logo
        } : null
      };

      if (row.round_name === 'wildcard') {
        if (row.game_type.startsWith('afc_wildcard_')) {
          const index = parseInt(row.game_type.split('_')[2]) - 1;
          predictions.afc.wildCard[index] = game;
        } else if (row.game_type.startsWith('nfc_wildcard_')) {
          const index = parseInt(row.game_type.split('_')[2]) - 1;
          predictions.nfc.wildCard[index] = game;
        }
      } else if (row.round_name === 'divisional') {
        if (row.game_type.startsWith('afc_divisional_')) {
          const index = parseInt(row.game_type.split('_')[2]) - 1;
          predictions.afc.divisional[index] = game;
        } else if (row.game_type.startsWith('nfc_divisional_')) {
          const index = parseInt(row.game_type.split('_')[2]) - 1;
          predictions.nfc.divisional[index] = game;
        }
      } else if (row.round_name === 'championship') {
        if (row.game_type === 'afc_championship') {
          predictions.afc.championship = game;
        } else if (row.game_type === 'nfc_championship') {
          predictions.nfc.championship = game;
        }
      } else if (row.round_name === 'superbowl') {
        if (row.game_type === 'super_bowl') {
          predictions.superBowl.winner = game.winner;
          predictions.superBowl.afc = game.home; // Assuming home is AFC
          predictions.superBowl.nfc = game.away; // Assuming away is NFC
        }
      }
    });

    console.log(`Bracket ${bracketId}: Reconstructed predictions:`, JSON.stringify(predictions, null, 2));
    return predictions;
  } catch (error) {
    console.error('Error fetching bracket predictions:', error);
    return null;
  }
}