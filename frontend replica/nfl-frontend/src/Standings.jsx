import { useEffect, useState } from "react";
import TeamModal from './TeamModal';

export default function Standings() {
  const [conferences, setConferences] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [sortBy, setSortBy] = useState('conference'); // 'wins', 'conference', 'division'
  const [season, setSeason] = useState(2025);
  const [showAllTeams, setShowAllTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  useEffect(() => {
    fetch(`https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`)
      .then(res => res.json())
      .then(data => {
        const conferencesData = data.children;
        
        // Debug: log the structure to understand division data
        console.log('Conferences data:', conferencesData[0]);
        
        // Extract all teams with their full data
        const teams = conferencesData.flatMap(conf =>
          conf.standings.entries.map(entry => {
            // Find wins, losses, and ties from stats
            const wins = entry.stats.find(stat => stat.name === 'wins')?.value || 0;
            const losses = entry.stats.find(stat => stat.name === 'losses')?.value || 0;
            const ties = entry.stats.find(stat => stat.name === 'ties')?.value || 0;
            const winPercent = entry.stats.find(stat => stat.name === 'winPercent')?.value || 0;
            const playoffSeed = entry.stats.find(stat => stat.name === 'playoffSeed')?.value || 0;
            const differential = entry.stats.find(stat => stat.name === 'pointDifferential')?.value || 0;
            
            // Get division from entry note or conference structure
            let division = 'N/A';
            if (entry.note) {
              // Division is often in the note field like "NFC West"
              const divisionMatch = entry.note.match(/(AFC|NFC)\s+(North|South|East|West)/i);
              if (divisionMatch) {
                division = divisionMatch[0];
              }
            } else if (conf.children) {
              // Find which division this team belongs to
              const teamDivision = conf.children.find(div => 
                div.standings.entries.some(e => e.team.id === entry.team.id)
              );
              if (teamDivision) {
                division = teamDivision.name;
              }
            }
            
            return {
              id: entry.team.id,
              name: entry.team.displayName,
              location: entry.team.location,
              abbreviation: entry.team.abbreviation,
              logo: entry.team.logos[0]?.href,
              conference: conf.name,
              conferenceAbbr: conf.abbreviation,
              division: division,
              wins,
              losses,
              ties,
              record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
              winPercent,
              playoffSeed,
              differential: differential > 0 ? `+${differential}` : `${differential}`,
              // Include all available stats for the modal
              allStats: entry.stats,
              teamData: entry.team // Include full team data
            };
          })
        );

        setConferences(conferencesData);
        setAllTeams(teams);
      });
  }, [season]);

  const getSortedTeams = () => {
    const sorted = [...allTeams];
    
    switch (sortBy) {
      case 'wins':
        return sorted.sort((a, b) => {
          // First sort by wins (descending)
          if (b.wins !== a.wins) return b.wins - a.wins;
          // Then by win percentage (descending)
          if (b.winPercent !== a.winPercent) return b.winPercent - a.winPercent;
          // Then by point differential (descending)
          return parseInt(b.differential) - parseInt(a.differential);
        });
      case 'conference':
        return sorted.sort((a, b) => {
          // First sort by conference
          if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
          // Then by playoff seed (ascending - lower is better)
          return a.playoffSeed - b.playoffSeed;
        });
      case 'division':
        return sorted.sort((a, b) => {
          // Sort by playoff seed (division rankings)
          return a.playoffSeed - b.playoffSeed;
        });
      default:
        return sorted;
    }
  };

  const sortedTeams = getSortedTeams();

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-oswald">NFL Standings - {season} Season</h1>
        
        {/* Global Controls */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-6">
          {/* Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center">
            <label className="mb-2 sm:mb-0 sm:mr-3 font-semibold text-gray-700 font-roboto-condensed">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-green-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="conference">Conference</option>
              <option value="wins">Power Rankings</option>
              <option value="division">Playoff Seeding</option>
            </select>
          </div>
          
          {/* Year Selection */}
          <div className="flex flex-col sm:flex-row items-center">
            <label className="mb-2 sm:mb-0 sm:mr-3 font-semibold text-gray-700 font-roboto-condensed">Year:</label>
            <select 
              value={season} 
              onChange={(e) => setSeason(Number(e.target.value))}
              className="w-full sm:w-auto px-4 py-2 border border-green-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
              <option value={2021}>2021</option>
              <option value={2020}>2020</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overall Standings - Takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 font-oswald">
              {sortBy === 'wins' ? 'Power Rankings' : 
               sortBy === 'conference' ? 'Conference Standings' : 
               'Playoff Seeds'}
            </h2>
          </div>
          
          {/* Column Headers */}
          <div className="flex items-center px-4 py-2 text-sm font-semibold text-gray-500 border-b border-gray-200">
            <div className="min-w-8">#</div>
            <div className="w-10 mr-4"></div> {/* Logo space */}
            <div className="flex-1">Team</div>
            <div className="text-center min-w-16">Record</div>
            <div className="text-center min-w-16 ml-4">Point Diff</div>
          </div>
          
          <div className="space-y-3 mt-3">
            {(showAllTeams ? sortedTeams : sortedTeams.slice(0, 2)).map((team, index) => (
              <div 
                key={team.id} 
                onClick={() => handleTeamClick(team)}
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
            {/* Ranking */}
            <div className={(() => {
              let rankForColor;
              if (sortBy === 'conference') {
                // For conference sorting, use conference-specific ranking for color
                const conferenceTeams = sortedTeams.filter(t => t.conference === team.conference);
                rankForColor = conferenceTeams.findIndex(t => t.id === team.id);
              } else {
                // For other sorting modes, use overall position
                rankForColor = showAllTeams ? index : sortedTeams.indexOf(team);
              }
              
              return `min-w-8 font-bold text-lg font-roboto-mono ${
                rankForColor < 7 ? 'text-green-600' : 
                rankForColor < 14 ? 'text-yellow-600' : 
                'text-red-600'
              }`;
            })()}>
              {(() => {
                if (sortBy === 'conference') {
                  // For conference sorting, show conference-specific rankings
                  const conferenceTeams = sortedTeams.filter(t => t.conference === team.conference);
                  const conferenceRank = conferenceTeams.findIndex(t => t.id === team.id) + 1;
                  return conferenceRank;
                } else {
                  // For other sorting modes, show overall ranking
                  return showAllTeams ? index + 1 : sortedTeams.indexOf(team) + 1;
                }
              })()}
            </div>
            
            {/* Team Logo */}
            {team.logo && (
              <img 
                src={team.logo} 
                alt={`${team.name} logo`}
                className="w-10 h-10 mr-4 rounded-full"
              />
            )}
            
            {/* Team Info */}
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center flex-wrap">
                <div className="font-bold text-sm md:text-lg text-gray-800 truncate font-oswald">
                  {team.name}
                </div>
                
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                <div className="text-xs md:text-sm text-gray-500 font-roboto-condensed">
                  {sortBy !== 'conference' && `${team.conferenceAbbr} • `}Seed #{team.playoffSeed}
                </div>
                {sortBy === 'conference' && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full mt-1 md:mt-0 self-start ${
                    team.conferenceAbbr === 'AFC' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {team.conferenceAbbr}
                  </span>
                )}
              </div>
            </div>
            
            {/* Record */}
            <div className="text-center min-w-12 md:min-w-16 flex-shrink-0">
              <div className="font-bold text-sm md:text-lg text-gray-800 font-roboto-mono">
                {team.record}
              </div>
              <div className="text-xs md:text-sm text-gray-500 font-roboto-mono">
                {(team.winPercent * 100).toFixed(1)}%
              </div>
            </div>
            
            {/* Point Differential */}
            <div className={`text-center min-w-12 md:min-w-16 ml-2 md:ml-4 font-bold text-sm md:text-base flex-shrink-0 font-roboto-mono ${
              parseInt(team.differential) > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {team.differential}
            </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conference Standings - Takes 1 column on desktop */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center font-oswald">Conference Standings</h2>
          <div className="space-y-6">
            {conferences.map(conf => {
              const confTeams = allTeams
                .filter(team => team.conference === conf.name)
                .sort((a, b) => a.playoffSeed - b.playoffSeed);
                
              return (
                <div key={conf.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <h3 className={`text-lg font-bold text-white p-4 font-oswald ${
                    conf.abbreviation === 'AFC' ? 'bg-blue-800' : 'bg-red-600'
                  }`}>
                    {conf.name} ({conf.abbreviation})
                  </h3>
                  
                  <div className="p-3 space-y-1">
                    {confTeams.map((team, index) => (
                      <div 
                        key={team.id}
                        className={`flex items-center p-2 rounded border-l-4 hover:bg-gray-50 transition-colors duration-150 ${
                          index < 7 
                            ? 'bg-green-50 border-l-green-500' 
                            : 'bg-gray-100 border-l-gray-400'
                        }`}
                      >
                        <span className="min-w-6 font-bold text-sm text-gray-700 mr-3 font-roboto-mono">
                          {team.playoffSeed}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate font-oswald">
                            {team.name}
                          </div>
                        </div>
                        <span className="font-bold text-sm text-gray-800 ml-2 font-roboto-mono">
                          {team.record}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Team Modal */}
      <TeamModal 
        team={selectedTeam} 
        isOpen={showTeamModal} 
        onClose={() => setShowTeamModal(false)}
        season={season}
      />
    </div>
  );
}