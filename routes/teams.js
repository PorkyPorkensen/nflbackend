const express = require('express');
const router = express.Router();
const db = require('../config/database');
const axios = require('axios');

// GET /api/teams/playoffs/:year - Get playoff teams from database (hardcoded seeds)
router.get('/playoffs/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    console.log(`Fetching playoff teams for ${year} season from database...`);
    
    // Get hardcoded playoff teams from database (ordered by seed)
    const query = `
      SELECT 
        id, name, abbreviation, location, conference, division, playoff_seed, logo_url as logo, primary_color, secondary_color, espn_team_id
      FROM nfl_teams
      WHERE playoff_seed IS NOT NULL
      ORDER BY CASE WHEN conference = 'American Football Conference' THEN 0 ELSE 1 END, playoff_seed ASC
    `;
    
    const result = await db.query(query);
    const dbTeams = result.rows.map(team => ({
      id: team.espn_team_id,
      name: team.name,
      location: team.location,
      abbreviation: team.abbreviation,
      logo: team.logo,
      conference: team.conference,
      playoffSeed: team.playoff_seed,
      primaryColor: team.primary_color,
      secondaryColor: team.secondary_color
    }));

    const afcTeams = dbTeams.filter(team => team.conference === 'American Football Conference');
    const nfcTeams = dbTeams.filter(team => team.conference === 'National Football Conference');

    console.log(`✅ Found ${afcTeams.length} AFC and ${nfcTeams.length} NFC playoff teams`);
    console.log('AFC:', afcTeams.map(t => `${t.playoffSeed}. ${t.abbreviation}`).join(', '));
    console.log('NFC:', nfcTeams.map(t => `${t.playoffSeed}. ${t.abbreviation}`).join(', '));

    res.json({
      success: true,
      year: parseInt(year),
      playoff_teams: dbTeams,
      afc_teams: afcTeams,
      nfc_teams: nfcTeams,
      total_playoff_teams: dbTeams.length,
      data_source: 'Database (Hardcoded Seeds)'
    });
    
  } catch (error) {
    console.error('❌ Error fetching playoff teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch playoff teams',
      error: error.message
    });
  }
});
        conferenceAbbr: team.conference === 'American Football Conference' ? 'AFC' : 'NFC',
        playoffSeed: team.playoff_seed,
        wins: 10 + (7 - team.playoff_seed),
        losses: 7 - (7 - team.playoff_seed),
        ties: 0,
        record: `${10 + (7 - team.playoff_seed)}-${7 - (7 - team.playoff_seed)}`,
        winPercent: 0.6 + (team.playoff_seed * 0.02),
        differential: `+${50 + (team.playoff_seed * 10)}`
      }));

      const afcFallback = dbTeams.filter(t => t.conference === 'American Football Conference');
      const nfcFallback = dbTeams.filter(t => t.conference === 'National Football Conference');

      res.json({
        success: true,
        year: parseInt(year),
        playoff_teams: dbTeams,
        afc_teams: afcFallback,
        nfc_teams: nfcFallback,
        total_playoff_teams: dbTeams.length,
        data_source: 'Database Fallback (2024 Playoff Teams)'
      });
    } catch (dbError) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch playoff teams from both ESPN and database',
        error: error.message
      });
    }
  }
});

// GET /api/teams - Get all NFL teams from database  
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, name, abbreviation, location, conference, division, playoff_seed, logo_url, primary_color, secondary_color
      FROM nfl_teams
      ORDER BY conference DESC, CASE WHEN playoff_seed IS NULL THEN 999 ELSE playoff_seed END ASC
    `;
    
    const result = await db.query(query);
    const teams = result.rows.map(team => ({
      id: team.id,
      name: team.name,
      location: team.location,
      abbreviation: team.abbreviation,
      logo: team.logo_url,
      conference: team.conference,
      conferenceAbbr: team.conference === 'American Football Conference' ? 'AFC' : 'NFC',
      division: team.division,
      playoffSeed: team.playoff_seed || 0,
      primaryColor: team.primary_color,
      secondaryColor: team.secondary_color
    }));

    res.json({
      success: true,
      teams: teams,
      total_teams: teams.length,
      data_source: 'PostgreSQL Database'
    });
    
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
});

module.exports = router;