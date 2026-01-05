import React, { useState, useEffect } from 'react';
import { useAuth } from './firebase/AuthContext';
import { API_ENDPOINTS, makeAuthenticatedRequest } from './config/api';


const Leaderboard = () => {
  const { getIdToken } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingResults, setProcessingResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allTeams, setAllTeams] = useState([]);
  const [season] = useState(2025);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboard();
    fetchPlayoffTeams();
  }, []);

  const fetchPlayoffTeams = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.playoffTeams(season));
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Combine AFC and NFC teams
          const allPlayoffTeams = [...data.afc_teams, ...data.nfc_teams];
          setAllTeams(allPlayoffTeams);
        }
      }
    } catch (error) {
      console.error('Error fetching playoff teams:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.leaderboard(2025));
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        console.error('Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSeededResults = async () => {
    setProcessingResults(true);
    try {
      const token = await getIdToken();
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.seededResults, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season })
      }, token);

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 Seeded results processed successfully!');
        console.log('📊 Result:', result);
        
        alert(`✅ Seeded scoring processed!\n\n${result.message}\n\n${result.results_count} games found.\n\nLeaderboard will show updated scores.`);
        
        // Refresh leaderboard to show updated scores
        fetchLeaderboard();
      } else {
        throw new Error('Failed to process seeded results');
      }
    } catch (error) {
      console.error('Error processing seeded results:', error);
      alert('❌ Error processing seeded results. Check the console for details.');
    } finally {
      setProcessingResults(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = leaderboard.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Visual component for simulated results
  const SimulatedResultsDisplay = ({ results }) => {
    if (!results) return null;

    const GameResult = ({ game, round }) => (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-2 shadow-sm">
        <div className="text-xs text-gray-600 mb-2 text-center font-semibold">{game.game}</div>
        <div className="space-y-2">
          <div className={`flex items-center p-2 rounded ${game.winner?.id === game.home?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
            <img src={game.home?.logo} alt={game.home?.name} className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">{game.home?.abbreviation}</span>
            {game.winner?.id === game.home?.id && <span className="ml-auto text-green-600 font-bold">W</span>}
          </div>
          <div className={`flex items-center p-2 rounded ${game.winner?.id === game.away?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
            <img src={game.away?.logo} alt={game.away?.name} className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">{game.away?.abbreviation}</span>
            {game.winner?.id === game.away?.id && <span className="ml-auto text-green-600 font-bold">W</span>}
          </div>
        </div>
        <div className="text-xs text-center mt-2 text-blue-600 font-semibold">
          {game.points} point{game.points !== 1 ? 's' : ''} each
        </div>
      </div>
    );

    const ChampionshipGame = ({ game, title, points }) => (
      <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 shadow-md">
        <div className="text-sm font-semibold text-yellow-700 mb-3 text-center">{title}</div>
        <div className="space-y-2">
          <div className={`flex items-center p-2 rounded ${game.winner?.id === game.home?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
            <img src={game.home?.logo} alt={game.home?.name} className="w-6 h-6 mr-2" />
            <span className="font-medium">{game.home?.abbreviation}</span>
            {game.winner?.id === game.home?.id && <span className="ml-auto text-green-600 font-bold text-lg">W</span>}
          </div>
          <div className={`flex items-center p-2 rounded ${game.winner?.id === game.away?.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
            <img src={game.away?.logo} alt={game.away?.name} className="w-6 h-6 mr-2" />
            <span className="font-medium">{game.away?.abbreviation}</span>
            {game.winner?.id === game.away?.id && <span className="ml-auto text-green-600 font-bold text-lg">W</span>}
          </div>
        </div>
        <div className="text-sm text-center mt-3 text-yellow-700 font-bold">
          {points} points for correct pick
        </div>
      </div>
    );

    return (
      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900">🎯 Simulated Results for Scoring Test</h3>
          <button
            onClick={() => setSimulatedResults(null)}
            className="text-blue-700 hover:text-blue-900 font-medium text-sm"
          >
            ✕ Close
          </button>
        </div>
        
        {/* Wild Card Round */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Wild Card Round (1 point each)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">AFC Wild Card</h5>
              {results.wildCard.afc.map((game, index) => (
                <GameResult key={index} game={game} round="wildcard" />
              ))}
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">NFC Wild Card</h5>
              {results.wildCard.nfc.map((game, index) => (
                <GameResult key={index} game={game} round="wildcard" />
              ))}
            </div>
          </div>
        </div>

        {/* Divisional Round */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Divisional Round (2 points each)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">AFC Divisional</h5>
              {results.divisional.afc.map((game, index) => (
                <GameResult key={index} game={game} round="divisional" />
              ))}
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">NFC Divisional</h5>
              {results.divisional.nfc.map((game, index) => (
                <GameResult key={index} game={game} round="divisional" />
              ))}
            </div>
          </div>
        </div>

        {/* Championship Games */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Conference Championships (4 points each)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChampionshipGame 
              game={results.championships.afc} 
              title="AFC Championship" 
              points={4}
            />
            <ChampionshipGame 
              game={results.championships.nfc} 
              title="NFC Championship" 
              points={4}
            />
          </div>
        </div>

        {/* Super Bowl */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Super Bowl (8 points)</h4>
          <div className="max-w-md mx-auto">
            <div className="bg-white border-4 border-purple-400 rounded-lg p-6 shadow-lg">
              <div className="text-center mb-4">
                <h5 className="text-lg font-bold text-purple-700">🏆 SUPER BOWL</h5>
              </div>
              <div className="space-y-3">
                <div className={`flex items-center p-3 rounded-lg ${results.superBowl.winner?.id === results.superBowl.home?.id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'}`}>
                  <img src={results.superBowl.home?.logo} alt={results.superBowl.home?.name} className="w-8 h-8 mr-3" />
                  <span className="text-lg font-bold">{results.superBowl.home?.abbreviation}</span>
                  {results.superBowl.winner?.id === results.superBowl.home?.id && (
                    <span className="ml-auto text-yellow-600 font-bold text-xl">🏆 CHAMPION</span>
                  )}
                </div>
                <div className={`flex items-center p-3 rounded-lg ${results.superBowl.winner?.id === results.superBowl.away?.id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'}`}>
                  <img src={results.superBowl.away?.logo} alt={results.superBowl.away?.name} className="w-8 h-8 mr-3" />
                  <span className="text-lg font-bold">{results.superBowl.away?.abbreviation}</span>
                  {results.superBowl.winner?.id === results.superBowl.away?.id && (
                    <span className="ml-auto text-yellow-600 font-bold text-xl">🏆 CHAMPION</span>
                  )}
                </div>
              </div>
              <div className="text-center mt-4 text-purple-700 font-bold text-lg">
                8 points for correct pick
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-blue-700 bg-blue-100 rounded p-3">
          <strong>Compare these results with submitted brackets to verify scoring:</strong><br/>
          Wild Card (1pt) + Divisional (2pts) + Championships (4pts) + Super Bowl (8pts)
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
              src="/logo3.png" 
              alt="SportSync" 
              className="h-16 md:h-24 w-auto mx-auto my-4"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'inline';
              }}
            />
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Bracket Leaderboard</h1>
        <p className="text-gray-600">See how your bracket predictions rank against others</p>
      </div>



      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : leaderboard.length > 0 ? (
          <>
            <div className="bg-gray-50 px-3 md:px-6 py-4 border-b">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 font-semibold text-gray-700 text-xs md:text-sm">
                <div>Rank</div>
                <div className="hidden md:block">Player</div>
                <div>Player/Bracket</div>
                <div>Score</div>
                <div className="hidden md:block">Accuracy</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {currentEntries.map((entry, index) => {
                const actualRank = startIndex + index + 1;
                return (
                  <div key={startIndex + index} className={`px-3 md:px-6 py-4 hover:bg-gray-50 ${actualRank <= 3 ? 'bg-yellow-50' : ''}`}>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 items-center">
                      <div className="font-semibold text-lg md:text-lg">
                        {getRankIcon(actualRank)}
                      </div>
                    <div className="hidden md:block">
                      <p className="font-medium text-gray-900">{entry.display_name}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate md:hidden">{entry.display_name}</p>
                      <p className="font-medium text-gray-700 text-xs md:text-sm truncate">
                        {entry.bracket_name || 'Untitled Bracket'}
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center">
                        <div>
                          <span className="text-sm md:text-lg font-bold text-blue-600">{entry.total_score}</span>
                          <span className="text-xs md:text-sm text-gray-500 ml-1">pts</span>
                        </div>
                        <div className="md:hidden mt-1">
                          <span className="text-xs text-gray-500">{Number(entry.accuracy || 0).toFixed(1)}% ({entry.correct_picks}/{entry.total_picks})</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center">
                        <span className="font-medium">{Number(entry.accuracy || 0).toFixed(1)}%</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({entry.correct_picks}/{entry.total_picks})
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brackets submitted yet</h3>
            <p className="text-gray-500">Be the first to submit your bracket predictions!</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {leaderboard.length > itemsPerPage && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, leaderboard.length)} of {leaderboard.length} brackets
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Scoring Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-400 shadow-md">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 text-center md:text-left">How Scoring Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-center md:text-left">
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Wild Card Round</h4>
            <p className="text-blue-700">1 point per correct pick</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Divisional Round</h4>
            <p className="text-blue-700">2 points per correct pick</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Championship Games</h4>
            <p className="text-blue-700">4 points per correct pick</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Super Bowl</h4>
            <p className="text-blue-700">8 points for correct pick</p>
          </div>
        </div>
        
        {/* Process Seeded Results Button */}
        <div className="mt-6 text-center">
          <button
            onClick={processSeededResults}
            disabled={processingResults}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {processingResults ? 'Processing...' : 'Process Seeded Results'}
          </button>
          <p className="text-xs text-blue-600 mt-2">
            Run the seed script first, then click here to calculate scores based on seeded game results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;