import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import BracketSubmission from "./BracketSubmission";
import UserBrackets from "./UserBrackets";
import { useAuth } from './firebase/AuthContext';
import { API_ENDPOINTS } from './config/api';

// Championship Modal Component
const ChampionshipModal = ({ isOpen, champion, bracketState, onClose, onSubmitBracket }) => {
  if (!isOpen) {
    return null;
  }

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!champion) {
    return null;
  }

  const BracketSummary = () => (
    <div className="bg-gray-50 rounded-lg p-4 mt-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center font-oswald">Your Bracket Predictions</h4>
      
      {/* Super Bowl */}
      <div className="text-center mb-4">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3">
          <div className="text-xs font-semibold text-yellow-800 mb-2 font-roboto-condensed">SUPER BOWL CHAMPION</div>
          <div className="flex items-center justify-center">
            <img src={champion.logo} alt={champion.name} className="w-8 h-8 mr-2" />
            <span className="font-bold text-yellow-800 font-oswald">{champion.location}</span>
          </div>
        </div>
      </div>

      {/* Conference Championships */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 mb-1">AFC CHAMPION</div>
          <div className="bg-white border rounded p-2">
            {bracketState.superBowl.afc ? (
              <div className="flex items-center justify-center">
                <img src={bracketState.superBowl.afc.logo} alt={bracketState.superBowl.afc.name} className="w-6 h-6 mr-2" />
                <span className="text-sm">{bracketState.superBowl.afc.abbreviation}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">TBD</span>
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 mb-1">NFC CHAMPION</div>
          <div className="bg-white border rounded p-2">
            {bracketState.superBowl.nfc ? (
              <div className="flex items-center justify-center">
                <img src={bracketState.superBowl.nfc.logo} alt={bracketState.superBowl.nfc.name} className="w-6 h-6 mr-2" />
                <span className="text-sm">{bracketState.superBowl.nfc.abbreviation}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">TBD</span>
            )}
          </div>
        </div>
      </div>

      {/* Wild Card Winners Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">AFC WILD CARD WINNERS</div>
          <div className="space-y-1">
            {bracketState.afc.wildCard.map((game, idx) => (
              <div key={idx} className="bg-white border rounded p-2 text-center">
                {game.winner ? (
                  <div className="flex items-center justify-center">
                    <img src={game.winner.logo} alt={game.winner.name} className="w-4 h-4 mr-1" />
                    <span className="text-xs">{game.winner.abbreviation}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">TBD</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">NFC WILD CARD WINNERS</div>
          <div className="space-y-1">
            {bracketState.nfc.wildCard.map((game, idx) => (
              <div key={idx} className="bg-white border rounded p-2 text-center">
                {game.winner ? (
                  <div className="flex items-center justify-center">
                    <img src={game.winner.logo} alt={game.winner.name} className="w-4 h-4 mr-1" />
                    <span className="text-xs">{game.winner.abbreviation}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">TBD</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      {/* Confetti Animation */}
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
      />
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none z-10 px-4 py-2 "
          aria-label="Close modal"
        >
          ×
        </button>
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 font-oswald">
            Congratulations!
          </h2>
          <p className="text-xl text-gray-600 mb-4 font-roboto-condensed">
            You have the <span className="font-bold text-blue-600 font-oswald">{champion.name}</span> going all the way!
          </p>
          
          {/* Champion Logo Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
            <img 
              src={champion.logo} 
              alt={`${champion.name} logo`}
              className="w-32 h-32 mx-auto mb-4"
            />
            <h3 className="text-2xl font-bold text-gray-800 font-oswald">{champion.name}</h3>
            <p className="text-gray-600 font-roboto-condensed">Super Bowl Champions</p>
          </div>
        </div>

        {/* Bracket Summary */}
        <BracketSummary />

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onSubmitBracket}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            🏆 Submit Bracket
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Full Bracket
          </button>
          <button
            onClick={() => {
              alert('Share functionality coming soon!');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

// Team Slot Component - now for winner selection
const TeamSlot = ({ team, isWinner, onClick, placeholder = "TBD", canSelect = false }) => (
  <div 
    onClick={canSelect ? onClick : undefined}
    className={`flex items-center p-3 border rounded-lg transition-all duration-200 min-h-12 ${
      team 
        ? isWinner 
          ? 'bg-green-100 border-green-400 ring-2 ring-green-200 shadow-sm' 
          : canSelect
          ? 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer hover:shadow-sm'
          : 'bg-gray-50 border-gray-300'
        : 'bg-gray-200 border-gray-400'
    }`}
  >
    {team ? (
      <>
        <img src={team.logo} alt={team.name} className="w-6 h-6 mr-3" />
        <span className="text-sm font-medium font-oswald">{team.abbreviation}</span>
        {isWinner && <span className="ml-auto text-green-600 font-bold text-lg">✓</span>}
      </>
    ) : (
      <span className="text-xs text-gray-500">{placeholder}</span>
    )}
  </div>
);

// Game Card Component - now for winner selection
const GameCard = ({ game, onWinnerSelect, gameIndex, round, conference }) => {
  const canSelectWinner = game.home && game.away;
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-3 shadow-md hover:shadow-lg transition-all duration-200 hover:border-blue-400">
      <div className="text-xs text-gray-600 mb-3 text-center font-roboto-condensed font-semibold">Game {gameIndex + 1}</div>
      <div className="space-y-2">
        <TeamSlot 
          team={game.home} 
          isWinner={game.winner?.id === game.home?.id}
          onClick={canSelectWinner ? () => onWinnerSelect(conference, round, gameIndex, game.home) : undefined}
          canSelect={canSelectWinner}
          placeholder="Home Team"
        />
        <TeamSlot 
          team={game.away} 
          isWinner={game.winner?.id === game.away?.id}
          onClick={canSelectWinner ? () => onWinnerSelect(conference, round, gameIndex, game.away) : undefined}
          canSelect={canSelectWinner}
          placeholder="Away Team"
        />
      </div>
      {canSelectWinner && !game.winner && (
        <div className="mt-3 text-xs text-center text-blue-600 font-roboto-condensed">
          Click a team to select winner
        </div>
      )}
      {canSelectWinner && game.winner && (
        <div className="mt-3 text-xs text-center text-green-600 font-roboto-condensed">
          Click to change prediction
        </div>
      )}
      {!canSelectWinner && (
        <div className="mt-3 text-xs text-center text-gray-400 font-roboto-condensed">
          Waiting for teams...
        </div>
      )}
    </div>
  );
};



export default function BracketMaker() {
  const [conferences, setConferences] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [season, setSeason] = useState(2025);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const { currentUser } = useAuth();
  const [bracketRefreshTrigger, setBracketRefreshTrigger] = useState(0);
  
  // Bracket state management
  const [bracketState, setBracketState] = useState({
    afc: {
      wildCard: [
        { home: null, away: null, winner: null }, // 2v7
        { home: null, away: null, winner: null }, // 3v6  
        { home: null, away: null, winner: null }  // 4v5
      ],
      divisional: [
        { home: null, away: null, winner: null }, // 1 vs lowest seed
        { home: null, away: null, winner: null }  // remaining matchup
      ],
      championship: { home: null, away: null, winner: null }
    },
    nfc: {
      wildCard: [
        { home: null, away: null, winner: null },
        { home: null, away: null, winner: null },
        { home: null, away: null, winner: null }
      ],
      divisional: [
        { home: null, away: null, winner: null },
        { home: null, away: null, winner: null }
      ],
      championship: { home: null, away: null, winner: null }
    },
    superBowl: { afc: null, nfc: null, winner: null }
  });



  useEffect(() => {
    // Fetch teams from our PostgreSQL backend instead of ESPN
    fetch(API_ENDPOINTS.playoffTeams(season))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Transform backend data to match the existing frontend format
          const mockConferences = [
            {
              name: 'American Football Conference',
              abbreviation: 'AFC',
              standings: {
                entries: data.afc_teams.map(team => ({
                  team: {
                    id: parseInt(team.id), // Keep as integer for backend compatibility
                    displayName: team.name,
                    location: team.location,
                    abbreviation: team.abbreviation,
                    logos: [{ href: team.logo }]
                  },
                  stats: [
                    { name: 'wins', value: team.wins },
                    { name: 'losses', value: team.losses },
                    { name: 'ties', value: team.ties },
                    { name: 'winPercent', value: team.winPercent },
                    { name: 'playoffSeed', value: team.playoffSeed },
                    { name: 'pointDifferential', value: parseInt(team.differential.replace('+', '')) }
                  ]
                }))
              }
            },
            {
              name: 'National Football Conference',
              abbreviation: 'NFC', 
              standings: {
                entries: data.nfc_teams.map(team => ({
                  team: {
                    id: parseInt(team.id), // Keep as integer for backend compatibility
                    displayName: team.name,
                    location: team.location,
                    abbreviation: team.abbreviation,
                    logos: [{ href: team.logo }]
                  },
                  stats: [
                    { name: 'wins', value: team.wins },
                    { name: 'losses', value: team.losses },
                    { name: 'ties', value: team.ties },
                    { name: 'winPercent', value: team.winPercent },
                    { name: 'playoffSeed', value: team.playoffSeed },
                    { name: 'pointDifferential', value: parseInt(team.differential.replace('+', '')) }
                  ]
                }))
              }
            }
          ];

          // Extract all teams with their full data (same format as before)
          const teams = mockConferences.flatMap(conf =>
            conf.standings.entries.map(entry => {
              const wins = entry.stats.find(stat => stat.name === 'wins')?.value || 0;
              const losses = entry.stats.find(stat => stat.name === 'losses')?.value || 0;
              const ties = entry.stats.find(stat => stat.name === 'ties')?.value || 0;
              const winPercent = entry.stats.find(stat => stat.name === 'winPercent')?.value || 0;
              const playoffSeed = entry.stats.find(stat => stat.name === 'playoffSeed')?.value || 0;
              const differential = entry.stats.find(stat => stat.name === 'pointDifferential')?.value || 0;
              
              return {
                id: entry.team.id,
                name: entry.team.displayName,
                location: entry.team.location,
                abbreviation: entry.team.abbreviation,
                logo: entry.team.logos[0]?.href,
                conference: conf.name,
                conferenceAbbr: conf.abbreviation,
                wins,
                losses,
                ties,
                record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
                winPercent,
                playoffSeed,
                differential: differential > 0 ? `+${differential}` : `${differential}`
              };
            })
          );

          setConferences(mockConferences);
          setAllTeams(teams);
        } else {
          console.error('Failed to fetch teams:', data.message);
        }
      })
      .catch(error => {
        console.error('Error fetching teams:', error);
        // Fallback to ESPN API if backend fails
        fetch(`https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`)
          .then(res => res.json())
          .then(data => {
            // Original ESPN logic as fallback
            const conferencesData = data.children;
            const teams = conferencesData.flatMap(conf =>
              conf.standings.entries.map(entry => {
                const wins = entry.stats.find(stat => stat.name === 'wins')?.value || 0;
                const losses = entry.stats.find(stat => stat.name === 'losses')?.value || 0;
                const ties = entry.stats.find(stat => stat.name === 'ties')?.value || 0;
                const winPercent = entry.stats.find(stat => stat.name === 'winPercent')?.value || 0;
                const playoffSeed = entry.stats.find(stat => stat.name === 'playoffSeed')?.value || 0;
                const differential = entry.stats.find(stat => stat.name === 'pointDifferential')?.value || 0;
                
                return {
                  id: entry.team.id,
                  name: entry.team.displayName,
                  location: entry.team.location,
                  abbreviation: entry.team.abbreviation,
                  logo: entry.team.logos[0]?.href,
                  conference: conf.name,
                  conferenceAbbr: conf.abbreviation,
                  wins,
                  losses,
                  ties,
                  record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
                  winPercent,
                  playoffSeed,
                  differential: differential > 0 ? `+${differential}` : `${differential}`
                };
              })
            );
            setConferences(conferencesData);
            setAllTeams(teams);
          })
          .catch(fallbackError => {
            console.error('Both backend and ESPN API failed:', fallbackError);
          });
      });
  }, [season]);

  // Get top 7 teams by playoff seed for each conference
  const getPlayoffTeams = (conference) => {
    return allTeams
      .filter(team => team.conference === conference)
      .sort((a, b) => a.playoffSeed - b.playoffSeed)
      .slice(0, 7);
  };

  const afcTeams = getPlayoffTeams('American Football Conference');
  const nfcTeams = getPlayoffTeams('National Football Conference');

  // Initialize bracket with seeded wild card matchups and #1 seeds in divisional
  const initializeBracket = () => {
    const newBracket = { ...bracketState };
    
    // AFC Wild Card matchups - fixed based on seeding
    if (afcTeams.length >= 7) {
      newBracket.afc.wildCard[0] = { home: afcTeams[1], away: afcTeams[6], winner: null }; // 2v7
      newBracket.afc.wildCard[1] = { home: afcTeams[2], away: afcTeams[5], winner: null }; // 3v6
      newBracket.afc.wildCard[2] = { home: afcTeams[3], away: afcTeams[4], winner: null }; // 4v5
      
      // AFC Divisional - #1 seed awaits lowest wild card winner
      newBracket.afc.divisional[0] = { home: afcTeams[0], away: null, winner: null }; // #1 seed waits
      newBracket.afc.divisional[1] = { home: null, away: null, winner: null }; // Other matchup TBD
    }
    
    // NFC Wild Card matchups - fixed based on seeding
    if (nfcTeams.length >= 7) {
      newBracket.nfc.wildCard[0] = { home: nfcTeams[1], away: nfcTeams[6], winner: null };
      newBracket.nfc.wildCard[1] = { home: nfcTeams[2], away: nfcTeams[5], winner: null };
      newBracket.nfc.wildCard[2] = { home: nfcTeams[3], away: nfcTeams[4], winner: null };
      
      // NFC Divisional - #1 seed awaits lowest wild card winner  
      newBracket.nfc.divisional[0] = { home: nfcTeams[0], away: null, winner: null }; // #1 seed waits
      newBracket.nfc.divisional[1] = { home: null, away: null, winner: null }; // Other matchup TBD
    }
    
    setBracketState(newBracket);
  };

  // Handle winner selection and bracket progression
  const handleWinnerSelect = (conference, round, gameIndex, winner) => {
    // Check if this is a Super Bowl winner selection
    const isSuperBowlWinner = (round === 'superBowl' || conference === 'superBowl' || round === 'final');
    
    console.log('Winner selected:', { conference, round, gameIndex, winner: winner?.name, isSuperBowlWinner });
    
    setBracketState(prev => {
      const newState = JSON.parse(JSON.stringify(prev)); // Deep clone to avoid mutations
      
      // Set the winner for this game
      if (isSuperBowlWinner) {
        if (!newState.superBowl) {
          newState.superBowl = { afc: null, nfc: null, winner: null };
        }
        newState.superBowl.winner = winner;
      } else if (Array.isArray(newState[conference][round])) {
        newState[conference][round][gameIndex].winner = winner;
      } else {
        newState[conference][round].winner = winner;
      }
      
      // Progress winner to next round
      if (round === 'wildCard') {
        progressToDivisional(newState, conference);
      } else if (round === 'divisional') {
        // Winner goes to conference championship
        if (!newState[conference].championship.home) {
          newState[conference].championship.home = winner;
        } else if (!newState[conference].championship.away) {
          newState[conference].championship.away = winner;
        }
      } else if (round === 'championship') {
        // Winner goes to Super Bowl
        if (conference === 'afc') {
          newState.superBowl.afc = winner;
        } else if (conference === 'nfc') {
          newState.superBowl.nfc = winner;
        }
      }
      
      return newState;
    });
    
    // Show championship modal after state update for Super Bowl winner
    if (isSuperBowlWinner) {
      setTimeout(() => {
        setShowChampionModal(true);
      }, 100);
    }
  };

  // Progress wild card winners to divisional round
  const progressToDivisional = (bracketState, conference) => {
    const confTeams = conference === 'afc' ? afcTeams : nfcTeams;
    
    // Get all wild card winners for this conference
    const wildCardWinners = bracketState[conference].wildCard
      .filter(game => game.winner)
      .map(game => game.winner)
      .sort((a, b) => a.playoffSeed - b.playoffSeed); // Sort by seed (lowest first)
    
    if (wildCardWinners.length === 3) {
      // All wild card games complete, set up divisional round
      const lowestSeed = wildCardWinners[2]; // Highest seed number = lowest seed
      const otherWinners = wildCardWinners.slice(0, 2);
      
      // #1 seed plays lowest remaining seed
      bracketState[conference].divisional[0].away = lowestSeed;
      
      // Other two winners play each other (higher seed hosts)
      bracketState[conference].divisional[1] = {
        home: otherWinners[0], // Lower seed number = higher seed
        away: otherWinners[1],
        winner: null
      };
    }
  };

  const clearBracket = () => {
    setBracketState(prev => ({
      afc: {
        wildCard: prev.afc.wildCard.map(game => ({ 
          ...game, 
          winner: null 
        })),
        divisional: prev.afc.divisional.map(game => ({ 
          ...game, 
          winner: null 
        })),
        championship: { 
          ...prev.afc.championship, 
          winner: null 
        }
      },
      nfc: {
        wildCard: prev.nfc.wildCard.map(game => ({ 
          ...game, 
          winner: null 
        })),
        divisional: prev.nfc.divisional.map(game => ({ 
          ...game, 
          winner: null 
        })),
        championship: { 
          ...prev.nfc.championship, 
          winner: null 
        }
      },
      superBowl: { afc: null, nfc: null, winner: null }
    }));
    setShowChampionModal(false);
    setShowSubmissionModal(false);
  };



  // Auto-initialize bracket when teams are loaded (only once)
  useEffect(() => {
    if (allTeams.length >= 14 && !bracketState.afc.wildCard[0].home) {
      initializeBracket();
    }
  }, [allTeams.length]);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-800 font-oswald">NFL Bracket Maker</h1>
        </div>
        <p className="text-lg text-gray-600 font-roboto-condensed">Current Playoff Contenders - {season} Season</p>
        <p className="text-xs text-gray-600 font-roboto-condensed">*based on current standings*</p>
        {/* Championship Celebration Toggle Button */}
        {bracketState.superBowl.winner && !showChampionModal && (
          <div className="mt-4">
            <button
              onClick={() => setShowChampionModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-colors flex items-center mx-auto"
            >
              🏆 View Championship Celebration
            </button>
          </div>
        )}
      </div>

      {/* User's Previous Brackets */}
      {console.log('BracketMaker: user state:', currentUser ? 'logged in' : 'not logged in')}
      {currentUser && <UserBrackets refreshTrigger={bracketRefreshTrigger} />}
      {!currentUser && console.log('BracketMaker: UserBrackets NOT rendered - user not logged in')}

      {/* Interactive Bracket Builder */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          
          {/* Header with Clear Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0 font-oswald text-center">Build Your Bracket</h2>
            <button
              onClick={clearBracket}
              className="px-4 py-2 bg-red-600 md:mx-0 mx-auto w-42 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Clear All</span>
            </button>
          </div>
          
          {/* Wild Card Round */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 my-6 text-center underline font-oswald">Wild Card Round</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AFC Wild Card */}
              <div>
                <h4 className="font-medium text-gray-600 mb-2 font-roboto-condensed">AFC Wild Card</h4>
                <div className="space-y-2">
                  {bracketState.afc.wildCard.map((game, index) => (
                    <GameCard
                      key={`afc-wc-${index}`}
                      game={game}
                      onWinnerSelect={handleWinnerSelect}
                      gameIndex={index}
                      round="wildCard"
                      conference="afc"
                    />
                  ))}
                </div>
              </div>

              {/* NFC Wild Card */}
              <div>
                <h4 className="font-medium text-gray-600 mb-2 font-roboto-condensed">NFC Wild Card</h4>
                <div className="space-y-2">
                  {bracketState.nfc.wildCard.map((game, index) => (
                    <GameCard
                      key={`nfc-wc-${index}`}
                      game={game}
                      onWinnerSelect={handleWinnerSelect}
                      gameIndex={index}
                      round="wildCard"
                      conference="nfc"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divisional Round */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 my-6 text-center underline font-oswald">Divisional Round</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AFC Divisional */}
              <div>
                <h4 className="font-medium text-gray-600 mb-2 font-roboto-condensed">AFC Divisional</h4>
                <div className="space-y-2">
                  {bracketState.afc.divisional.map((game, index) => (
                    <GameCard
                      key={`afc-div-${index}`}
                      game={game}
                      onWinnerSelect={handleWinnerSelect}
                      gameIndex={index}
                      round="divisional"
                      conference="afc"
                    />
                  ))}
                </div>
              </div>

              {/* NFC Divisional */}
              <div>
                <h4 className="font-medium text-gray-600 mb-2 font-roboto-condensed">NFC Divisional</h4>
                <div className="space-y-2">
                  {bracketState.nfc.divisional.map((game, index) => (
                    <GameCard
                      key={`nfc-div-${index}`}
                      game={game}
                      onWinnerSelect={handleWinnerSelect}
                      gameIndex={index}
                      round="divisional"
                      conference="nfc"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Conference Championships & Super Bowl */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AFC Championship */}
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-600 mb-2 flex items-center font-oswald">

                AFC Championship
              </h4>
              <GameCard
                game={bracketState.afc.championship}
                onWinnerSelect={handleWinnerSelect}
                gameIndex={0}
                round="championship"
                conference="afc"
              />
            </div>

            {/* Super Bowl */}
            <div className="border-l-4 border-yellow-500 pl-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-r-lg p-3">
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center font-oswald">

                🏆 Super Bowl
              </h4>
              <GameCard
                game={{ home: bracketState.superBowl.afc, away: bracketState.superBowl.nfc, winner: bracketState.superBowl.winner }}
                onWinnerSelect={handleWinnerSelect}
                gameIndex={0}
                round="superBowl"
                conference="superBowl"
              />
            </div>

            {/* NFC Championship */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-600 mb-2 flex items-center font-oswald">

                NFC Championship
              </h4>
              <GameCard
                game={bracketState.nfc.championship}
                onWinnerSelect={handleWinnerSelect}
                gameIndex={0}
                round="championship"
                conference="nfc"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playoff Contenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AFC Conference */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center font-oswald">AFC Playoff Picture</h2>
          <div className="space-y-3">
            {afcTeams.map((team, index) => (
              <div 
                key={team.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                  index === 0 ? 'bg-green-50 border-green-200' : 
                  index === 6 ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    index === 0 ? 'bg-green-500 text-white' : 
                    index === 6 ? 'bg-yellow-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}>
                    {team.playoffSeed}
                  </span>
                  <img 
                    src={team.logo} 
                    alt={`${team.name} logo`}
                    className="w-8 h-8 mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{team.location}</p>
                    <p className="text-sm text-gray-600">{team.record}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{team.differential}</p>
                  <p className="text-xs text-gray-500">
                    {index === 0 ? 'Bye Week' : index === 6 ? 'Wild Card' : 'Playoff Spot'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFC Conference */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center font-oswald">NFC Playoff Picture</h2>
          <div className="space-y-3">
            {nfcTeams.map((team, index) => (
              <div 
                key={team.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                  index === 0 ? 'bg-green-50 border-green-200' : 
                  index === 6 ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    index === 0 ? 'bg-green-500 text-white' : 
                    index === 6 ? 'bg-yellow-500 text-white' : 
                    'bg-blue-500 text-white'
                  }`}>
                    {team.playoffSeed}
                  </span>
                  <img 
                    src={team.logo} 
                    alt={`${team.name} logo`}
                    className="w-8 h-8 mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{team.location}</p>
                    <p className="text-sm text-gray-600">{team.record}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{team.differential}</p>
                  <p className="text-xs text-gray-500">
                    {index === 0 ? 'Bye Week' : index === 6 ? 'Wild Card' : 'Playoff Spot'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 font-oswald">Playoff Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-roboto-condensed">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Seed 1: First Round Bye</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Seeds 2-6: Wild Card Guarantees</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Seed 7: Wild Card Visitor</span>
          </div>
        </div>
      </div>

      {/* Championship Modal */}
      <ChampionshipModal
        isOpen={showChampionModal}
        champion={bracketState.superBowl.winner}
        bracketState={bracketState}
        onClose={() => setShowChampionModal(false)}
        onSubmitBracket={() => setShowSubmissionModal(true)}
      />

      {/* Bracket Submission Modal */}
      {showSubmissionModal && (
        <BracketSubmission
          bracketData={bracketState}
          onClose={() => setShowSubmissionModal(false)}
          onSuccess={() => {
            setShowSubmissionModal(false);
            setBracketRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

    </div>
  );
}