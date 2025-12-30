const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// GET /api/user/brackets - Get current user's brackets
router.get('/brackets', authenticateUser, async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.bracket_name,
        b.season_year,
        b.created_at,
        COUNT(bp.id) as prediction_count
      FROM brackets b
      LEFT JOIN bracket_predictions bp ON b.id = bp.bracket_id
      WHERE b.user_id = $1
      GROUP BY b.id, b.bracket_name, b.season_year, b.created_at
      ORDER BY b.created_at DESC
    `;
    
    const result = await db.query(query, [req.user.dbId]);
    
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
    console.error('Error fetching user brackets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user brackets',
      error: error.message
    });
  }
});

// PUT /api/user/display-name - Update user's display name
router.put('/display-name', authenticateUser, async (req, res) => {
  const { displayName } = req.body;
  
  try {
    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Display name is required'
      });
    }

    if (displayName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be 100 characters or less'
      });
    }

    await db.query(
      'UPDATE users SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [displayName.trim(), req.user.dbId]
    );

    res.json({
      success: true,
      message: 'Display name updated successfully',
      displayName: displayName.trim()
    });

  } catch (error) {
    console.error('Error updating display name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update display name',
      error: error.message
    });
  }
});

// DELETE /api/my-brackets/:bracketId - Delete a user's bracket
router.delete('/my-brackets/:bracketId', authenticateUser, async (req, res) => {
  const { bracketId } = req.params;
  
  try {
    // Verify bracket belongs to user
    const bracketCheck = await db.query(
      'SELECT id FROM brackets WHERE id = $1 AND user_id = $2',
      [bracketId, req.user.dbId]
    );

    if (bracketCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bracket not found or you do not have permission to delete it'
      });
    }

    // Delete bracket (cascade will delete predictions)
    await db.query('DELETE FROM brackets WHERE id = $1', [bracketId]);

    res.json({
      success: true,
      message: 'Bracket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bracket',
      error: error.message
    });
  }
});

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