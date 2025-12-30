const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/simulated-results/:year - Get simulated game results for display
router.get('/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    const query = `
      SELECT 
        gr.id,
        gr.round_name,
        gr.game_type,
        gr.home_score,
        gr.away_score,
        gr.game_date,
        gr.is_final,
        ht.name as home_team_name,
        ht.abbreviation as home_team_abbrev,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.abbreviation as away_team_abbrev,
        at.logo_url as away_team_logo,
        wt.name as winner_name,
        wt.abbreviation as winner_abbrev,
        wt.logo_url as winner_logo,
        CASE 
          WHEN gr.round_name = 'wildcard' THEN 1
          WHEN gr.round_name = 'divisional' THEN 2
          WHEN gr.round_name = 'championship' THEN 4
          WHEN gr.round_name = 'superbowl' THEN 8
          ELSE 1
        END as points_value
      FROM game_results gr
      JOIN nfl_teams ht ON gr.home_team_id = ht.id
      JOIN nfl_teams at ON gr.away_team_id = at.id
      LEFT JOIN nfl_teams wt ON gr.winner_id = wt.id
      WHERE gr.season_year = $1 AND gr.is_final = true
      ORDER BY 
        CASE gr.round_name
          WHEN 'wildcard' THEN 1
          WHEN 'divisional' THEN 2
          WHEN 'championship' THEN 3
          WHEN 'superbowl' THEN 4
        END,
        gr.game_type
    `;
    
    const result = await db.query(query, [year]);
    
    // Group results by round
    const groupedResults = {
      wildcard: [],
      divisional: [],
      championship: [],
      superbowl: []
    };

    result.rows.forEach(row => {
      const gameResult = {
        id: row.id,
        gameType: row.game_type,
        home: {
          name: row.home_team_name,
          abbreviation: row.home_team_abbrev,
          logo: row.home_team_logo,
          score: row.home_score
        },
        away: {
          name: row.away_team_name,
          abbreviation: row.away_team_abbrev,
          logo: row.away_team_logo,
          score: row.away_score
        },
        winner: row.winner_name ? {
          name: row.winner_name,
          abbreviation: row.winner_abbrev,
          logo: row.winner_logo
        } : null,
        gameDate: row.game_date,
        isFinal: row.is_final,
        pointsValue: row.points_value
      };

      if (groupedResults[row.round_name]) {
        groupedResults[row.round_name].push(gameResult);
      }
    });
    
    res.json({
      success: true,
      results: groupedResults,
      season_year: parseInt(year),
      total_games: result.rowCount,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching simulated results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simulated results',
      error: error.message
    });
  }
});

module.exports = router;