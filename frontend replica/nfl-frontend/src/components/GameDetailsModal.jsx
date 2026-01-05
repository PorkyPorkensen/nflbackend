import { useEffect, useState } from "react";

export default function GameDetailsModal({ gameId, onClose, isOpen }) {
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && gameId) {
      fetchGameDetails();
    }
  }, [isOpen, gameId]);

  const fetchGameDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }
      
      const data = await response.json();
      setGameDetails(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching game details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 text-2xl md:text-3xl font-bold leading-none z-10 px-3 py-2 md:px-2 md:py-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>

        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-roboto-condensed">Loading game details...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4 font-roboto-condensed">Failed to load game details</p>
            <p className="text-gray-600 font-roboto-condensed">{error}</p>
            <button
              onClick={fetchGameDetails}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}

        {gameDetails && !loading && !error && (
          <GameDetailsContent gameDetails={gameDetails} />
        )}
        
        {/* Fallback content if detailed API fails but we still want to show something */}
        {!gameDetails && !loading && error && (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4 font-oswald">Game Details</h2>
            <p className="text-gray-600 mb-4 font-roboto-condensed">Unable to load detailed statistics at this time.</p>
            <p className="text-sm text-gray-500 font-roboto-condensed">Game ID: {gameId}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GameDetailsContent({ gameDetails }) {
  // Log the full structure to understand the data better
  console.log('Full gameDetails structure:', gameDetails);
  
  const { header, boxscore, gameInfo, drives, leaders, winprobability, pickcenter, broadcasts, news } = gameDetails;
  
  const competition = header?.competitions?.[0];
  const homeTeam = competition?.competitors?.find(team => team.homeAway === 'home');
  const awayTeam = competition?.competitors?.find(team => team.homeAway === 'away');
  
  console.log('Parsed teams:', { homeTeam, awayTeam });
  console.log('Home team logo paths:', {
    logo: homeTeam?.team?.logo,
    logos: homeTeam?.team?.logos,
    logoHref: homeTeam?.team?.logos?.[0]?.href
  });
  console.log('Away team logo paths:', {
    logo: awayTeam?.team?.logo, 
    logos: awayTeam?.team?.logos,
    logoHref: awayTeam?.team?.logos?.[0]?.href
  });
  console.log('Game status:', header?.competitions?.[0]?.status?.type?.state);
  console.log('Officials structure:', gameInfo?.officials?.[0]);
  console.log('Weather structure:', gameInfo?.weather);
  console.log('Header structure for date/time:', {
    date: header?.competitions?.[0]?.date,
    season: header?.season,
    week: header?.week
  });
  
  return (
    <div className="pt-12 px-4 pb-6 md:p-6 mt-4">
      {/* Game Header */}
      <div className="mb-6 pr-2 md:pr-8">
        <div className="flex flex-col md:flex-row items-center justify-center mb-4 space-y-4 md:space-y-0">
          {/* Away Team */}
          <div className="flex items-center mr-0 md:mr-8 w-full md:w-auto">
            {(awayTeam?.team?.logo || awayTeam?.team?.logos?.[0]?.href) && (
              <img 
                src={awayTeam.team.logo || awayTeam.team.logos[0].href} 
                alt={awayTeam.team?.displayName || 'Away Team'}
                className="w-10 h-10 md:w-12 md:h-12 mr-3"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 md:flex-none">
              <h2 className="text-lg md:text-xl font-bold font-oswald">{awayTeam?.team?.location || awayTeam?.team?.displayName || 'Away Team'}</h2>
              <p className="text-gray-600 font-roboto-condensed text-sm">{awayTeam?.team?.name || awayTeam?.team?.shortDisplayName || ''}</p>
            </div>
            <div className="ml-auto md:ml-4 text-2xl md:text-3xl font-bold font-roboto-mono">
              {awayTeam?.score || '0'}
            </div>
          </div>

          {/* VS */}
          <div className="mx-2 md:mx-4 text-gray-400 font-bold text-sm md:text-base">VS</div>

          {/* Home Team */}
          <div className="flex items-center ml-0 md:ml-8 w-full md:w-auto">
            {(homeTeam?.team?.logo || homeTeam?.team?.logos?.[0]?.href) && (
              <img 
                src={homeTeam.team.logo || homeTeam.team.logos[0].href} 
                alt={homeTeam.team?.displayName || 'Home Team'}
                className="w-10 h-10 md:w-12 md:h-12 mr-3"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 md:flex-none">
              <h2 className="text-lg md:text-xl font-bold font-oswald">{homeTeam?.team?.location || homeTeam?.team?.displayName || 'Home Team'}</h2>
              <p className="text-gray-600 font-roboto-condensed text-sm">{homeTeam?.team?.name || homeTeam?.team?.shortDisplayName || ''}</p>
            </div>
            <div className="ml-auto md:ml-4 text-2xl md:text-3xl font-bold font-roboto-mono">
              {homeTeam?.score || '0'}
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center">
          <p className="text-base md:text-lg font-medium font-roboto-condensed">{String(header?.competitions?.[0]?.status?.type?.detail || 'Game Status')}</p>
          {gameInfo?.venue && (
            <p className="text-gray-600 font-roboto-condensed text-sm md:text-base">
              {String(gameInfo.venue.fullName || 'Stadium')}
              {gameInfo.venue.address?.city ? ` • ${String(gameInfo.venue.address.city)}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        


        {/* Team Stats */}
        {boxscore?.teams && Array.isArray(boxscore.teams) && boxscore.teams.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 font-oswald">Team Stats</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Team</th>
                    {Array.isArray(boxscore.teams[0]?.statistics) && boxscore.teams[0].statistics.map((stat, idx) => (
                      <th key={idx} className="text-center px-2 py-2">{stat?.abbreviation || stat?.name || `Stat ${idx + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {boxscore.teams.map((team, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">
                        <div className="flex items-center">
                          {team?.team?.logo && (
                            <img 
                              src={team.team.logo} 
                              alt={team.team?.name || 'Team'} 
                              className="w-6 h-6 mr-2"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          {team?.team?.abbreviation || 'Team'}
                        </div>
                      </td>
                      {Array.isArray(team?.statistics) && team.statistics.map((stat, statIdx) => (
                        <td key={statIdx} className="text-center px-2 py-2">{stat?.displayValue || stat?.value || 'N/A'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Game Information */}
        {gameInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Game Information</h3>
            <div className="space-y-2 text-sm">
              {gameInfo.attendance && (
                <p><span className="font-medium">Attendance:</span> {String(gameInfo.attendance).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
              )}
              {/* Show game date and time */}
              {header?.competitions?.[0]?.date && (
                <p><span className="font-medium">Game Time:</span> {new Date(header.competitions[0].date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}</p>
              )}
              {/* Show season info */}
              {header?.season && (
                <p><span className="font-medium">Season:</span> {header.season.year} {header.season.type === 2 ? 'Regular Season' : header.season.type === 3 ? 'Playoffs' : 'Preseason'}</p>
              )}
              {/* Show week if available */}
              {header?.week && (
                <p><span className="font-medium">Week:</span> {header.week}</p>
              )}
              {/* Only show weather if it has meaningful data */}
              {gameInfo.weather && gameInfo.weather.displayValue && gameInfo.weather.displayValue !== '[object Object]' && (
                <p><span className="font-medium">Weather:</span> {gameInfo.weather.displayValue}</p>
              )}
              {/* Show temperature if available */}
              {gameInfo.weather && gameInfo.weather.temperature && (
                <p><span className="font-medium">Temperature:</span> {gameInfo.weather.temperature}°F</p>
              )}
              {gameInfo.officials && Array.isArray(gameInfo.officials) && gameInfo.officials.length > 0 && (
                <div>
                  <p className="font-medium">Officials:</p>
                  <ul className="ml-4">
                    {gameInfo.officials.map((official, idx) => (
                      <li key={idx}>
                        {String(official?.position?.name || official?.position || 'Official')}: {String(official?.displayName || official?.name || 'N/A')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Win Probability - Only show for live games */}
        {winprobability && Array.isArray(winprobability) && winprobability.length > 0 && 
         header?.competitions?.[0]?.status?.type?.state === 'in' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Win Probability</h3>
            <div className="space-y-2">
              {/* Show only the last (current) win probability entries, typically the last 2 entries */}
              {winprobability.slice(-2).map((prob, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {prob?.team?.logo && (
                      <img 
                        src={prob.team.logo} 
                        alt={prob.team?.name || 'Team'} 
                        className="w-6 h-6 mr-2"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>{prob?.team?.abbreviation || 'Team'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{prob?.winPercentage || prob?.value || 'N/A'}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drives Summary */}
        {drives && drives.current && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Current Drive</h3>
            <div className="text-sm space-y-1">
              {drives.current.team && (
                <div className="flex items-center mb-2">
                  {drives.current.team.logo && (
                    <img 
                      src={drives.current.team.logo} 
                      alt={drives.current.team.name || 'Team'} 
                      className="w-6 h-6 mr-2"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span className="font-medium">{String(drives.current.team.abbreviation || 'Team')} Drive</span>
                </div>
              )}
              <p><span className="font-medium">Plays:</span> {String(drives.current.plays || 0)}</p>
              <p><span className="font-medium">Yards:</span> {String(drives.current.yards || 0)}</p>
              <p><span className="font-medium">Time:</span> {String(drives.current.timeElapsed?.displayValue || drives.current.timeElapsed || 'N/A')}</p>
            </div>
          </div>
        )}

        {/* Broadcasts */}
        {broadcasts && Array.isArray(broadcasts) && broadcasts.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Broadcast Information</h3>
            <div className="flex flex-wrap gap-4">
              {broadcasts.map((broadcast, idx) => (
                <div key={idx} className="flex items-center">
                  {broadcast?.media?.logo && (
                    <img 
                      src={broadcast.media.logo} 
                      alt={broadcast.media?.name || 'Network'} 
                      className="w-8 h-8 mr-2"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span className="text-sm font-medium">{broadcast?.media?.name || broadcast?.type || 'Unknown Network'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent News */}
      {news?.articles && Array.isArray(news.articles) && news.articles.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Recent News</h3>
          <div className="space-y-3">
            {news.articles.slice(0, 3).map((article, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-3 last:border-b-0">
                <h4 className="font-medium text-sm mb-1">
                  {article?.links?.web?.href ? (
                    <a 
                      href={article.links.web.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {article?.headline || 'No Title'}
                    </a>
                  ) : (
                    <span>{article?.headline || 'No Title'}</span>
                  )}
                </h4>
                <p className="text-xs text-gray-600">{article?.description || 'No description available.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}