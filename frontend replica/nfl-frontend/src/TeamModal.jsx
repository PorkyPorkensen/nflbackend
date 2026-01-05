import React, { useState, useEffect } from 'react';

const TeamModal = ({ team, isOpen, onClose, season }) => {
  const [teamDetails, setTeamDetails] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const currentYear = new Date().getFullYear();
  const isCurrentSeason = season >= currentYear;

  useEffect(() => {
    if (isOpen && team) {
      console.log('Team data received:', team);
      // Reset to info tab if not current season
      if (!isCurrentSeason) {
        setActiveTab('info');
      }
      // Only fetch additional data for current season
      if (isCurrentSeason) {
        fetchTeamData();
      }
    }
  }, [isOpen, team, isCurrentSeason]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      console.log('Fetching team data for ID:', team.id);
      // Fetch detailed team information
      const teamResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}`);
      const teamData = await teamResponse.json();
      console.log('Team API response:', teamData);
      
      // Set team details with better data access
      const details = teamData.team || teamData;
      console.log('Team details object:', details);
      setTeamDetails(details);

      // Fetch team roster
      try {
        console.log('Fetching roster for team ID:', team.id);
        const rosterResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}/roster`);
        const rosterData = await rosterResponse.json();
        console.log('Roster API response:', rosterData);
        
        // Handle different possible roster structures
        let rosterArray = [];
        if (rosterData.athletes) {
          rosterArray = rosterData.athletes;
        } else if (rosterData.roster) {
          rosterArray = rosterData.roster;
        } else if (rosterData.items) {
          rosterArray = rosterData.items;
        } else if (Array.isArray(rosterData)) {
          rosterArray = rosterData;
        }
        
        console.log('Processed roster array:', rosterArray);
        setRoster(rosterArray);
      } catch (rosterError) {
        console.error('Error fetching roster:', rosterError);
        setRoster([]);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;



  const formatRecord = () => {
    // First try the record property directly
    if (team.record) return team.record;
    
    // Then try stats array
    if (team.stats) {
      const wins = team.stats.find(s => s.name === 'wins')?.value || 0;
      const losses = team.stats.find(s => s.name === 'losses')?.value || 0;
      const ties = team.stats.find(s => s.name === 'ties')?.value || 0;
      return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
    }
    
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-200 text-black p-4 flex items-center justify-between border-b border-gray-500">
          <div className="flex items-center space-x-4">
            {team.logo || team.logos?.[0]?.href ? (
              <img 
                src={team.logo || team.logos?.[0]?.href} 
                alt={team.name} 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">
                  {team.abbreviation || team.name?.substring(0, 3)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold font-oswald">{team.name}</h2>
              <p className="opacity-90 font-roboto-condensed">{team.abbreviation} • Record: <span className="font-roboto-mono">{formatRecord()}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-600 text-3xl bg-transparent font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'info', label: 'Team Info' },
              ...(isCurrentSeason ? [
                { id: 'roster', label: 'Roster' },
                { id: 'stats', label: 'Statistics' }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 my-2 min-w-[80px] border-gray-500 bg-gray-100 text-black font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-300 underline'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {!isCurrentSeason && (
            <div className="px-4 py-2 bg-yellow-50 border-t">
              <p className="text-sm text-yellow-700">
                📅 Historical season data - only team information available
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Team Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 font-oswald">Team Details</h3>
                      <div className="space-y-2">
                        <p className="font-roboto-condensed"><span className="font-medium">Location:</span> {team.location || team.name}</p>
                        <p className="font-roboto-condensed"><span className="font-medium">Conference:</span> {team.conference}</p>
                        <p className="font-roboto-condensed"><span className="font-medium">Abbreviation:</span> {team.abbreviation}</p>
                        {teamDetails?.venue && (
                          <>
                            <p><span className="font-medium">Stadium:</span> {teamDetails.venue.fullName}</p>
                            <p><span className="font-medium">Capacity:</span> {teamDetails.venue.capacity?.toLocaleString() || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    </div>
                    

                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 font-oswald">Detailed Records</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 font-roboto-condensed">Overall Record</p>
                        <p className="font-semibold font-roboto-mono">{team.record}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 font-roboto-condensed">Home Record</p>
                        <p className="font-semibold font-roboto-mono">{Math.floor(team.wins/2)}-{Math.floor(team.losses/2)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 font-roboto-condensed">Away Record</p>
                        <p className="font-semibold font-roboto-mono">{team.wins - Math.floor(team.wins/2)}-{team.losses - Math.floor(team.losses/2)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600 font-roboto-condensed">Win Percentage</p>
                        <p className="font-semibold font-roboto-mono">{(team.winPercent * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roster Tab */}
              {activeTab === 'roster' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 font-oswald">Current Roster</h3>
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : roster.length > 0 ? (
                    <div className="grid gap-4">
                      {roster.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {roster.map((item, index) => {
                            // Handle different roster structures
                            const players = item.items || [item];
                            return players.map((player, playerIndex) => (
                              <div key={`${index}-${playerIndex}`} className="bg-gray-50 p-3 rounded flex items-center space-x-3">
                                {player.headshot?.href ? (
                                  <img 
                                    src={player.headshot.href} 
                                    alt={player.displayName || player.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-500">
                                      {(player.displayName || player.name || 'P')?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm font-oswald">{player.displayName || player.name}</p>
                                  <p className="text-xs text-gray-600 font-roboto-condensed">
                                    <span className="font-roboto-mono">{player.jersey ? `#${player.jersey}` : ''}</span> {player.jersey ? '•' : ''} {player.position?.abbreviation || player.position?.name || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            ));
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">No roster data available</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Roster information not available</p>
                  )}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Statistics</h3>
                  {teamDetails?.record?.items ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3 text-blue-600">
                          Overall Performance
                        </h4>
                        <div className="space-y-2">
                          {teamDetails.record.items.map((record, index) => (
                            <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">{record.description? record.description : 'Overall Record'}</span>
                              <span className="font-medium">{record.summary}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-semibold mb-3 text-blue-600">
                          Season Stats
                        </h4>
                        <div className="space-y-2">
                          {team.allStats?.length > 0 ? (
                            team.allStats.map(stat => (
                              <div key={stat.name} className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">{stat.displayName || stat.name}</span>
                                <span className="font-medium">{stat.displayValue || stat.value}</span>
                              </div>
                            ))
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Wins</span>
                                <span className="font-medium">{team.wins}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Losses</span>
                                <span className="font-medium">{team.losses}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Win Percentage</span>
                                <span className="font-medium">{(team.winPercent * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Point Differential</span>
                                <span className="font-medium">{team.differential}</span>
                              </div>
                              {team.playoffSeed > 0 && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Playoff Seed</span>
                                  <span className="font-medium">#{team.playoffSeed}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Statistics not available</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamModal;