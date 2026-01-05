import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const SimulatedResults = ({ year = 2025 }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const fetchSimulatedResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.simulatedResults(year));
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      } else {
        console.error('Failed to fetch simulated results');
        setResults(null);
      }
    } catch (error) {
      console.error('Error fetching simulated results:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResults) {
      fetchSimulatedResults();
    }
  }, [showResults, year]);

  const GameResult = ({ home, away, winner, roundPoints }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
      <div className="flex items-center space-x-4 flex-1">
        {/* Home Team */}
        <div className={`flex items-center space-x-2 ${winner?.id === home?.id ? 'font-bold text-green-600' : 'text-gray-600'}`}>
          {home?.logo && <img src={home.logo} alt={home.name} className="w-6 h-6" />}
          <span className="text-sm">{home?.abbreviation || 'TBD'}</span>
        </div>
        
        <span className="text-gray-400">vs</span>
        
        {/* Away Team */}
        <div className={`flex items-center space-x-2 ${winner?.id === away?.id ? 'font-bold text-green-600' : 'text-gray-600'}`}>
          {away?.logo && <img src={away.logo} alt={away.name} className="w-6 h-6" />}
          <span className="text-sm">{away?.abbreviation || 'TBD'}</span>
        </div>
      </div>
      
      {/* Winner and Points */}
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="text-xs text-gray-500">{roundPoints} pt{roundPoints !== 1 ? 's' : ''}</div>
          <div className="text-sm font-medium text-green-600">
            {winner ? `${winner.abbreviation} wins` : 'No winner'}
          </div>
        </div>
        {winner?.logo && <img src={winner.logo} alt={winner.name} className="w-5 h-5" />}
      </div>
    </div>
  );

  const RoundSection = ({ title, games, pointValue }) => (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
        {title} <span className="text-sm text-gray-500">({pointValue} point{pointValue !== 1 ? 's' : ''} each)</span>
      </h4>
      {games && games.length > 0 ? (
        games.map((game, index) => (
          <GameResult 
            key={index}
            home={game.home}
            away={game.away}
            winner={game.winner}
            roundPoints={pointValue}
          />
        ))
      ) : (
        <div className="text-gray-500 text-sm italic">No games in this round</div>
      )}
    </div>
  );

  if (!showResults) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setShowResults(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          📊 View Simulated Game Results
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Simulated Game Results ({year})</h3>
        <button
          onClick={() => setShowResults(false)}
          className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ✕ Hide
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading simulated results...</div>
        </div>
      ) : results ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid md:grid-cols-2 gap-6">
            {/* AFC Column */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4 text-center">AFC</h3>
              
              <RoundSection 
                title="Wild Card Round"
                games={results.wildCard?.afc || []}
                pointValue={1}
              />
              
              <RoundSection 
                title="Divisional Round"
                games={results.divisional?.afc || []}
                pointValue={2}
              />
              
              {results.championship?.afc && (
                <RoundSection 
                  title="Championship Game"
                  games={[results.championship.afc]}
                  pointValue={4}
                />
              )}
            </div>

            {/* NFC Column */}
            <div>
              <h3 className="text-lg font-bold text-red-600 mb-4 text-center">NFC</h3>
              
              <RoundSection 
                title="Wild Card Round"
                games={results.wildCard?.nfc || []}
                pointValue={1}
              />
              
              <RoundSection 
                title="Divisional Round"
                games={results.divisional?.nfc || []}
                pointValue={2}
              />
              
              {results.championship?.nfc && (
                <RoundSection 
                  title="Championship Game"
                  games={[results.championship.nfc]}
                  pointValue={4}
                />
              )}
            </div>
          </div>

          {/* Super Bowl */}
          {results.superBowl && (
            <div className="mt-6 pt-6 border-t">
              <RoundSection 
                title="🏆 Super Bowl"
                games={[results.superBowl]}
                pointValue={8}
              />
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <button
              onClick={fetchSimulatedResults}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh Results
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-600 mb-4">No simulated results found.</div>
          <div className="text-sm text-gray-500">
            Click "Simulate Game Results" to generate playoff outcomes first.
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulatedResults;