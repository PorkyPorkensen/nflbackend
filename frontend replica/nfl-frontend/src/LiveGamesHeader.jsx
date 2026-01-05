import { useEffect, useState } from "react";
import GameDetailsModal from "./components/GameDetailsModal";

export default function LiveGamesHeader() {
  const [liveGames, setLiveGames] = useState([]);
  const [week, setWeek] = useState(() => {
    // Calculate current NFL week (season starts around week 36 of the year)
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(18, weeksDiff + 1)); // NFL has 18 weeks
  });
  const [showAllGames, setShowAllGames] = useState(false);
  const [screenSize, setScreenSize] = useState('mobile');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showGameDetails, setShowGameDetails] = useState(false);

  // Track screen size for responsive game display
  useEffect(() => {
    const updateScreenSize = () => {
      if (window.innerWidth >= 1280) {
        setScreenSize('xl'); // 4 games
      } else if (window.innerWidth >= 1024) {
        setScreenSize('lg'); // 3 games
      } else if (window.innerWidth >= 768) {
        setScreenSize('md'); // 2 games
      } else {
        setScreenSize('mobile'); // 1 game
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

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
            console.log('Successful endpoint:', endpoint);
            console.log('Data structure:', data);
            
            const games = data.events?.map(event => {
              const competition = event.competitions[0];
              const homeTeam = competition.competitors.find(team => team.homeAway === 'home');
              const awayTeam = competition.competitors.find(team => team.homeAway === 'away');
              
              // Log the complete event structure for the first game to see what's available
              if (data.events.indexOf(event) === 0) {
                console.log('Sample game event structure:', event);
                console.log('Competition details:', competition);
              }
              
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

  // Get default number of games to show based on screen size
  const getDefaultGameCount = () => {
    switch (screenSize) {
      case 'xl': return 4; // Desktop large (1280px+)
      case 'lg': return 3; // Desktop (1024px+)
      case 'md': return 2; // Tablet (768px+)
      default: return 1;   // Mobile (< 768px)
    }
  };

  // Handle game click to show details
  const handleGameClick = (gameId) => {
    setSelectedGameId(gameId);
    setShowGameDetails(true);
  };

  // Don't render if no games
  if (liveGames.length === 0) {
    return null;
  }

  return (
    <div className="p-6 w-full max-w-6xl mx-auto mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 font-oswald">Week {week} Games</h2>
        
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
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
          
          {liveGames.length > getDefaultGameCount() && (
            <button
              onClick={() => setShowAllGames(!showAllGames)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showAllGames ? 'Show Less' : `Show All (${liveGames.length})`}
            </button>
          )}
        </div>
      </div>
      <div className={`flex flex-wrap gap-4 ${screenSize === 'mobile' || (showAllGames ? liveGames : liveGames.slice(0, getDefaultGameCount())).length === 1 ? 'justify-center' : ''}`}>
        {(showAllGames ? liveGames : liveGames.slice(0, getDefaultGameCount())).map(game => (
          <div 
            key={game.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 w-64 flex-shrink-0 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
            onClick={() => handleGameClick(game.id)}
          >
            {/* Game Status */}
            <div className="text-center mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img 
                  src={game.awayTeam.logo} 
                  alt={`${game.awayTeam.name} logo`}
                  className="w-6 h-6 mr-2"
                />
                <span className="font-medium text-sm font-oswald">{game.awayTeam.abbreviation}</span>
              </div>
              <span className="font-bold text-lg font-roboto-mono">{game.awayTeam.score}</span>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img 
                  src={game.homeTeam.logo} 
                  alt={`${game.homeTeam.name} logo`}
                  className="w-6 h-6 mr-2"
                />
                <span className="font-medium text-sm font-oswald">{game.homeTeam.abbreviation}</span>
              </div>
              <span className="font-bold text-lg font-roboto-mono">{game.homeTeam.score}</span>
            </div>

            {/* Click for details hint */}
            <div className="text-center mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-roboto-condensed">Click for details</span>
            </div>
          </div>
        ))}
      </div>

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