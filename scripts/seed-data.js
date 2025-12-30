const dotenv = require('dotenv');
const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// NFL Teams data with espn_team_id for correct mapping
const nflTeamsData = [
  // AFC Teams
  { espn_team_id: 2, name: 'Buffalo Bills', abbreviation: 'BUF', location: 'Buffalo', conference: 'American Football Conference', division: 'AFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png', primary_color: '#00338D', secondary_color: '#C60C30' },
  { espn_team_id: 15, name: 'Miami Dolphins', abbreviation: 'MIA', location: 'Miami', conference: 'American Football Conference', division: 'AFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png', primary_color: '#008E97', secondary_color: '#FC4C02' },
  { espn_team_id: 20, name: 'New York Jets', abbreviation: 'NYJ', location: 'New York', conference: 'American Football Conference', division: 'AFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png', primary_color: '#125740', secondary_color: '#000000' },
  { espn_team_id: 17, name: 'New England Patriots', abbreviation: 'NE', location: 'New England', conference: 'American Football Conference', division: 'AFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png', primary_color: '#002244', secondary_color: '#C60C30' },

  { espn_team_id: 12, name: 'Kansas City Chiefs', abbreviation: 'KC', location: 'Kansas City', conference: 'American Football Conference', division: 'AFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png', primary_color: '#E31837', secondary_color: '#FFB81C' },
  { espn_team_id: 24, name: 'Los Angeles Chargers', abbreviation: 'LAC', location: 'Los Angeles', conference: 'American Football Conference', division: 'AFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png', primary_color: '#0080C6', secondary_color: '#FFC20E' },
  { espn_team_id: 7, name: 'Denver Broncos', abbreviation: 'DEN', location: 'Denver', conference: 'American Football Conference', division: 'AFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png', primary_color: '#FB4F14', secondary_color: '#002244' },
  { espn_team_id: 13, name: 'Las Vegas Raiders', abbreviation: 'LV', location: 'Las Vegas', conference: 'American Football Conference', division: 'AFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png', primary_color: '#000000', secondary_color: '#A5ACAF' },

  { espn_team_id: 23, name: 'Pittsburgh Steelers', abbreviation: 'PIT', location: 'Pittsburgh', conference: 'American Football Conference', division: 'AFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png', primary_color: '#FFB612', secondary_color: '#101820' },
  { espn_team_id: 33, name: 'Baltimore Ravens', abbreviation: 'BAL', location: 'Baltimore', conference: 'American Football Conference', division: 'AFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png', primary_color: '#241773', secondary_color: '#000000' },
  { espn_team_id: 5, name: 'Cleveland Browns', abbreviation: 'CLE', location: 'Cleveland', conference: 'American Football Conference', division: 'AFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png', primary_color: '#311D00', secondary_color: '#FF3C00' },
  { espn_team_id: 4, name: 'Cincinnati Bengals', abbreviation: 'CIN', location: 'Cincinnati', conference: 'American Football Conference', division: 'AFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png', primary_color: '#FB4F14', secondary_color: '#000000' },

  { espn_team_id: 34, name: 'Houston Texans', abbreviation: 'HOU', location: 'Houston', conference: 'American Football Conference', division: 'AFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png', primary_color: '#03202F', secondary_color: '#A71930' },
  { espn_team_id: 11, name: 'Indianapolis Colts', abbreviation: 'IND', location: 'Indianapolis', conference: 'American Football Conference', division: 'AFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png', primary_color: '#002C5F', secondary_color: '#A2AAAD' },
  { espn_team_id: 10, name: 'Tennessee Titans', abbreviation: 'TEN', location: 'Tennessee', conference: 'American Football Conference', division: 'AFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png', primary_color: '#0C2340', secondary_color: '#4B92DB' },
  { espn_team_id: 30, name: 'Jacksonville Jaguars', abbreviation: 'JAX', location: 'Jacksonville', conference: 'American Football Conference', division: 'AFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png', primary_color: '#101820', secondary_color: '#D7A22A' },

  // NFC Teams
  { espn_team_id: 8, name: 'Detroit Lions', abbreviation: 'DET', location: 'Detroit', conference: 'National Football Conference', division: 'NFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png', primary_color: '#0076B6', secondary_color: '#B0B7BC' },
  { espn_team_id: 9, name: 'Green Bay Packers', abbreviation: 'GB', location: 'Green Bay', conference: 'National Football Conference', division: 'NFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png', primary_color: '#203731', secondary_color: '#FFB612' },
  { espn_team_id: 16, name: 'Minnesota Vikings', abbreviation: 'MIN', location: 'Minnesota', conference: 'National Football Conference', division: 'NFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png', primary_color: '#4F2683', secondary_color: '#FFC62F' },
  { espn_team_id: 3, name: 'Chicago Bears', abbreviation: 'CHI', location: 'Chicago', conference: 'National Football Conference', division: 'NFC North', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png', primary_color: '#0B162A', secondary_color: '#C83803' },

  { espn_team_id: 21, name: 'Philadelphia Eagles', abbreviation: 'PHI', location: 'Philadelphia', conference: 'National Football Conference', division: 'NFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png', primary_color: '#004C54', secondary_color: '#A5ACAF' },
  { espn_team_id: 28, name: 'Washington Commanders', abbreviation: 'WSH', location: 'Washington', conference: 'National Football Conference', division: 'NFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png', primary_color: '#5A1414', secondary_color: '#FFB612' },
  { espn_team_id: 6, name: 'Dallas Cowboys', abbreviation: 'DAL', location: 'Dallas', conference: 'National Football Conference', division: 'NFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png', primary_color: '#003594', secondary_color: '#041E42' },
  { espn_team_id: 19, name: 'New York Giants', abbreviation: 'NYG', location: 'New York', conference: 'National Football Conference', division: 'NFC East', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png', primary_color: '#0B2265', secondary_color: '#A71930' },

  { espn_team_id: 27, name: 'Tampa Bay Buccaneers', abbreviation: 'TB', location: 'Tampa Bay', conference: 'National Football Conference', division: 'NFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png', primary_color: '#D50A0A', secondary_color: '#FF7900' },
  { espn_team_id: 1, name: 'Atlanta Falcons', abbreviation: 'ATL', location: 'Atlanta', conference: 'National Football Conference', division: 'NFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png', primary_color: '#A71930', secondary_color: '#000000' },
  { espn_team_id: 18, name: 'New Orleans Saints', abbreviation: 'NO', location: 'New Orleans', conference: 'National Football Conference', division: 'NFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png', primary_color: '#D3BC8D', secondary_color: '#101820' },
  { espn_team_id: 29, name: 'Carolina Panthers', abbreviation: 'CAR', location: 'Carolina', conference: 'National Football Conference', division: 'NFC South', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png', primary_color: '#0085CA', secondary_color: '#101820' },

  { espn_team_id: 14, name: 'Los Angeles Rams', abbreviation: 'LAR', location: 'Los Angeles', conference: 'National Football Conference', division: 'NFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png', primary_color: '#003594', secondary_color: '#FFA300' },
  { espn_team_id: 26, name: 'Seattle Seahawks', abbreviation: 'SEA', location: 'Seattle', conference: 'National Football Conference', division: 'NFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png', primary_color: '#002244', secondary_color: '#69BE28' },
  { espn_team_id: 22, name: 'Arizona Cardinals', abbreviation: 'ARI', location: 'Arizona', conference: 'National Football Conference', division: 'NFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png', primary_color: '#97233F', secondary_color: '#000000' },
  { espn_team_id: 25, name: 'San Francisco 49ers', abbreviation: 'SF', location: 'San Francisco', conference: 'National Football Conference', division: 'NFC West', playoff_seed: null, logo_url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png', primary_color: '#AA0000', secondary_color: '#B3995D' }
];

async function seedNFLTeams() {
  let pool;
  
  try {
    console.log('🏈 Seeding NFL teams data...');
    
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

    // Clear existing teams
    console.log('🗑️ Clearing existing teams...');
    await pool.query('DELETE FROM nfl_teams');

    // Insert teams
    console.log('📊 Inserting NFL teams...');
    const insertPromises = nflTeamsData.map(team => {
      return pool.query(
        `INSERT INTO nfl_teams 
         (espn_team_id, name, abbreviation, location, conference, division, playoff_seed, logo_url, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (espn_team_id) DO UPDATE SET
           name = EXCLUDED.name,
           abbreviation = EXCLUDED.abbreviation,
           location = EXCLUDED.location,
           conference = EXCLUDED.conference,
           division = EXCLUDED.division,
           playoff_seed = EXCLUDED.playoff_seed,
           logo_url = EXCLUDED.logo_url,
           primary_color = EXCLUDED.primary_color,
           secondary_color = EXCLUDED.secondary_color;`,
        [
          team.espn_team_id,
          team.name,
          team.abbreviation, 
          team.location,
          team.conference,
          team.division,
          team.playoff_seed,
          team.logo_url,
          team.primary_color,
          team.secondary_color
        ]
      );
    });

    await Promise.all(insertPromises);

    // Verify insertion
    const countResult = await pool.query('SELECT COUNT(*) FROM nfl_teams');
    const playoffTeamsResult = await pool.query('SELECT COUNT(*) FROM nfl_teams WHERE playoff_seed IS NOT NULL');
    
    console.log(`✅ Successfully seeded ${countResult.rows[0].count} NFL teams`);
    console.log(`🏆 ${playoffTeamsResult.rows[0].count} teams have playoff seeds`);

    // Show AFC playoff teams
    const afcPlayoffTeams = await pool.query(`
      SELECT abbreviation, name, playoff_seed 
      FROM nfl_teams 
      WHERE conference = 'American Football Conference' AND playoff_seed IS NOT NULL
      ORDER BY playoff_seed
    `);
    console.log('🔵 AFC Playoff Teams:', afcPlayoffTeams.rows.map(t => `${t.playoff_seed}. ${t.abbreviation}`).join(', '));

    // Show NFC playoff teams  
    const nfcPlayoffTeams = await pool.query(`
      SELECT abbreviation, name, playoff_seed 
      FROM nfl_teams 
      WHERE conference = 'National Football Conference' AND playoff_seed IS NOT NULL
      ORDER BY playoff_seed
    `);
    console.log('🔴 NFC Playoff Teams:', nfcPlayoffTeams.rows.map(t => `${t.playoff_seed}. ${t.abbreviation}`).join(', '));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔚 Database connection closed');
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedNFLTeams();
}

module.exports = { seedNFLTeams };