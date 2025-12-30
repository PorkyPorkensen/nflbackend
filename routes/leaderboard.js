const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/leaderboard/debug/:year - Debug endpoint to check stored data
router.get('/debug/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    // Get bracket predictions
    const predictions = await db.query(`
      SELECT 
        b.id as bracket_id,
        b.bracket_name,
        bp.round_name,
        bp.game_type,
        bp.predicted_winner_id,
        bp.points_value
      FROM brackets b
      JOIN bracket_predictions bp ON b.id = bp.bracket_id
      WHERE b.season_year = $1
      ORDER BY b.id, bp.round_name, bp.game_type
    `, [year]);

    // Get game results
    const results = await db.query(`
      SELECT 
        round_name,
        game_type,
        winner_id,
        is_final
      FROM game_results
      WHERE season_year = $1
      ORDER BY round_name, game_type
    `, [year]);

    res.json({
      success: true,
      season_year: parseInt(year),
      predictions: predictions.rows,
      game_results: results.rows,
      prediction_count: predictions.rowCount,
      result_count: results.rowCount
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/leaderboard/:year - Get leaderboard for a specific year
router.get('/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    console.log('🔍 Checking leaderboard for year', year);
    
    const query = `
      WITH bracket_scores AS (
        SELECT 
          b.id as bracket_id,
          b.bracket_name,
          b.season_year,
          u.display_name,
          u.email,
          COALESCE(SUM(
            CASE 
              WHEN bp.predicted_winner_id = gr.winner_id THEN bp.points_value
              ELSE 0 
            END
          ), 0) as total_score,
          COUNT(bp.id) as total_picks,
          COUNT(
            CASE 
              WHEN bp.predicted_winner_id = gr.winner_id THEN 1 
            END
          ) as correct_picks,
          CASE 
            WHEN COUNT(bp.id) > 0 THEN 
              ROUND((COUNT(
                CASE 
                  WHEN bp.predicted_winner_id = gr.winner_id THEN 1 
                END
              ) * 100.0) / COUNT(bp.id), 1)
            ELSE 0 
          END as accuracy
        FROM brackets b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN bracket_predictions bp ON b.id = bp.bracket_id
        LEFT JOIN game_results gr ON (
          bp.round_name = gr.round_name 
          AND bp.game_type = gr.game_type 
          AND gr.season_year = b.season_year
          AND gr.is_final = true
        )
        WHERE b.season_year = $1
        GROUP BY b.id, b.bracket_name, b.season_year, u.display_name, u.email
      )
      SELECT 
        bracket_id,
        bracket_name,
        season_year,
        display_name,
        email,
        total_score,
        total_picks,
        correct_picks,
        accuracy,
        ROW_NUMBER() OVER (ORDER BY total_score DESC, accuracy DESC, bracket_name ASC) as rank
      FROM bracket_scores
      ORDER BY rank
    `;
    
    const result = await db.query(query, [year]);
    
    res.json({
      success: true,
      leaderboard: result.rows,
      season_year: parseInt(year),
      count: result.rowCount,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;