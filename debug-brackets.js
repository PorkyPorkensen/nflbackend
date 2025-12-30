const db = require('./backend/config/database');

async function debugBrackets() {
  try {
    console.log('🔍 DEBUG: Checking bracket data vs game results...\n');
    
    // Get sample bracket predictions
    console.log('📊 Sample bracket predictions:');
    const predictions = await db.query(`
      SELECT bp.bracket_id, bp.predicted_winner_id, bp.game_type, bp.round_name, bp.points_value
      FROM bracket_predictions bp 
      JOIN brackets b ON bp.bracket_id = b.id 
      WHERE b.season_year = 2025
      ORDER BY bp.bracket_id, bp.round_name, bp.game_type 
      LIMIT 10
    `);
    
    predictions.rows.forEach(row => {
      console.log(`  Bracket ${row.bracket_id}: ${row.round_name}/${row.game_type} -> Team ID ${row.predicted_winner_id} (${typeof row.predicted_winner_id}) for ${row.points_value}pts`);
    });
    
    // Get sample game results  
    console.log('\n🎯 Sample game results:');
    const results = await db.query(`
      SELECT winner_id, game_type, round_name
      FROM game_results 
      WHERE season_year = 2025 AND is_final = true
      ORDER BY round_name, game_type
      LIMIT 10
    `);
    
    results.rows.forEach(row => {
      console.log(`  Game: ${row.round_name}/${row.game_type} -> Winner ID ${row.winner_id} (${typeof row.winner_id})`);
    });
    
    // Check for matches
    console.log('\n🔍 Looking for matches:');
    const matches = await db.query(`
      SELECT 
        bp.predicted_winner_id, 
        gr.winner_id,
        bp.game_type,
        bp.round_name,
        (bp.predicted_winner_id = gr.winner_id) as is_match,
        bp.points_value
      FROM bracket_predictions bp
      JOIN brackets b ON bp.bracket_id = b.id
      JOIN game_results gr ON (
        bp.round_name = gr.round_name 
        AND bp.game_type = gr.game_type 
        AND gr.season_year = b.season_year
        AND gr.is_final = true
      )
      WHERE b.season_year = 2025
      LIMIT 10
    `);
    
    matches.rows.forEach(row => {
      const matchSymbol = row.is_match ? '✅' : '❌';
      console.log(`  ${matchSymbol} ${row.round_name}/${row.game_type}: Predicted ${row.predicted_winner_id} vs Actual ${row.winner_id} (${row.points_value}pts)`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugBrackets();