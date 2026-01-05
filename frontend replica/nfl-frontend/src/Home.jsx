import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GameDetailsModal from "./components/GameDetailsModal";

export default function Home() {
  const [liveGames, setLiveGames] = useState([]);
  const [week, setWeek] = useState(() => {
    // Calculate current NFL week (season starts around week 36 of the year)
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weeksDiff + 1)); // NFL has 18 weeks
  });
  const [showAllGames, setShowAllGames] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showGameDetails, setShowGameDetails] = useState(false);

  useEffect(() => {
    // Fetch live games - try alternative endpoints
    const tryScoreboardAPI = async () => {
      const endpoints = [
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}&seasontype=2`,
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${new Date().toISOString().slice(0, 10).replace(/-/g, '')}&week=${week}`
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            const games = data.events?.map(event => {
              const competition = event.competitions[0];
              const homeTeam = competition.competitors.find(team => team.homeAway === 'home');
              const awayTeam = competition.competitors.find(team => team.homeAway === 'away');
              
              return {
                id: event.id,
                status: event.status.type.state,
                statusText: event.status.type.shortDetail,
                period: event.status.period,
                clock: event.status.displayClock,
                homeTeam: {
                  name: homeTeam.team.displayName,
                  abbreviation: homeTeam.team.abbreviation,
                  logo: homeTeam.team.logo,
                  score: homeTeam.score
                },
                awayTeam: {
                  name: awayTeam.team.displayName,
                  abbreviation: awayTeam.team.abbreviation,
                  logo: awayTeam.team.logo,
                  score: awayTeam.score
                }
              };
            }) || [];
            setLiveGames(games);
            return;
          }
        } catch (err) {
          console.log(`Endpoint failed: ${endpoint}`, err);
        }
      }
      
      // If all endpoints fail, create some mock data for testing
      console.log('All endpoints failed, using mock data');
      setLiveGames([
        {
          id: 'mock1',
          status: 'in',
          statusText: '2nd Qtr',
          period: 2,
          clock: '8:42',
          homeTeam: {
            name: 'Kansas City Chiefs',
            abbreviation: 'KC',
            logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
            score: '14'
          },
          awayTeam: {
            name: 'Denver Broncos',
            abbreviation: 'DEN',
            logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
            score: '7'
          }
        }
      ]);
    };
    
    tryScoreboardAPI();
  }, [week]);

  // Handle game click to show details
  const handleGameClick = (gameId) => {
    setSelectedGameId(gameId);
    setShowGameDetails(true);
  };



  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      <div className="text-center mb-4">
        <div className="flex items-center flex-col justify-center md:flex-row">
          <h1 className="text-4xl font-bold text-gray-800">Welcome to</h1>
        <img 
              src="/logo3.png" 
              alt="SportSync" 
              className=" h-16 w-auto mr-3 my-4 md:ml-2"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'inline';
              }}
            />
        </div>
        <p className="text-lg text-gray-600 mb-4 mt-8">Your one-stop shop for live NFL scores, standings, and playoff bracket creation.</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Live Standings</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Track real-time NFL standings with power rankings, conference breakdowns, and playoff seedings.
          </p>
          <Link to="/nfl/standings" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Standings
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Bracket Maker</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Create and share your own playoff brackets with predictions for the entire postseason.
          </p>
          <Link to="/nfl/bracket-maker" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create Bracket
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold text-gray-800 font-oswald">Week {week} Games</h3>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <label className="mr-3 font-semibold text-gray-700 font-roboto-condensed">Week:</label>
              <button 
                onClick={() => setWeek(Math.max(1, week - 1))}
                disabled={week <= 1}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                ←
              </button>
              <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold min-w-16 text-center font-roboto-mono">
                {week}
              </span>
              <button 
                onClick={() => setWeek(Math.min(18, week + 1))}
                disabled={week >= 18}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Show All Games Toggle */}
          {liveGames.length > 6 && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowAllGames(!showAllGames)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showAllGames ? 'Show Less' : `Show All Games (${liveGames.length})`}
              </button>
            </div>
          )}

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllGames ? liveGames : liveGames.slice(0, 6)).map(game => (
              <div 
                key={game.id} 
                className="bg-gray-50 border-2 border-gray-200 rounded-lg shadow-sm p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                onClick={() => handleGameClick(game.id)}
              >
                {/* Game Status */}
                <div className="text-center mb-4">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold font-roboto-condensed ${
                    game.status === 'in' 
                      ? 'bg-red-100 text-red-800' 
                      : game.status === 'pre'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {game.status === 'in' && game.clock ? `Q${game.period} ${game.clock}` : game.statusText}
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between mb-3 p-3 bg-white rounded-lg">
                  <div className="flex items-center">
                    <img 
                      src={game.awayTeam.logo} 
                      alt={`${game.awayTeam.name} logo`}
                      className="w-8 h-8 mr-3"
                    />
                    <div>
                      <span className="font-bold text-lg font-oswald">{game.awayTeam.abbreviation}</span>
                      <p className="text-xs text-gray-600 font-roboto-condensed">{game.awayTeam.name}</p>
                    </div>
                  </div>
                  <span className="font-bold text-2xl font-roboto-mono text-gray-800">{game.awayTeam.score}</span>
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-between mb-3 p-3 bg-white rounded-lg">
                  <div className="flex items-center">
                    <img 
                      src={game.homeTeam.logo} 
                      alt={`${game.homeTeam.name} logo`}
                      className="w-8 h-8 mr-3"
                    />
                    <div>
                      <span className="font-bold text-lg font-oswald">{game.homeTeam.abbreviation}</span>
                      <p className="text-xs text-gray-600 font-roboto-condensed">{game.homeTeam.name}</p>
                    </div>
                  </div>
                  <span className="font-bold text-2xl font-roboto-mono text-gray-800">{game.homeTeam.score}</span>
                </div>

                {/* Click for details hint */}
                <div className="text-center mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500 font-roboto-condensed">Click for details</span>
                </div>
              </div>
            ))}
          </div>

          {/* No games message */}
          {liveGames.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-roboto-condensed">No games scheduled for Week {week}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Details Modal */}
      <GameDetailsModal
        gameId={selectedGameId}
        isOpen={showGameDetails}
        onClose={() => {
          setShowGameDetails(false);
          setSelectedGameId(null);
        }}
      />
    </div>
  );
}