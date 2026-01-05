import { useState, useEffect } from 'react';
import { useAuth } from './firebase/AuthContext';
import { API_ENDPOINTS, makeAuthenticatedRequest } from './config/api';

const UserBrackets = ({ refreshTrigger = 0 }) => {
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBracket, setExpandedBracket] = useState(null);
  const [deletingBracket, setDeletingBracket] = useState(null);
  const { currentUser } = useAuth();

  console.log('UserBrackets rendered, user:', currentUser);
  console.log('User details:', {
    uid: currentUser?.uid,
    email: currentUser?.email,
    displayName: currentUser?.displayName
  });

  useEffect(() => {
    console.log('UserBrackets useEffect triggered, user:', currentUser);
    if (currentUser) {
      fetchUserBrackets();
    }
  }, [currentUser, refreshTrigger]);

  const fetchUserBrackets = async () => {
    try {
      console.log('fetchUserBrackets called');
      setLoading(true);
      const token = await currentUser.getIdToken();
      console.log('Got token:', token ? 'Yes' : 'No');
      
      // Debug: decode the token to see what's in it
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload contains:', {
            uid: payload.user_id || payload.sub,
            email: payload.email,
            name: payload.name
          });
        } catch (e) {
          console.log('Could not decode token');
        }
      }
      
      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.userBrackets,
        { method: 'GET' },
        token
      );

      console.log('API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setBrackets(data.brackets || []);
      } else {
        const errorData = await response.text();
        console.error('API error response:', errorData);
        throw new Error('Failed to fetch brackets');
      }
    } catch (err) {
      console.error('Error fetching user brackets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBracket = async (bracketId, bracketName) => {
    if (!confirm(`Are you sure you want to delete "${bracketName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingBracket(bracketId);
      const token = await currentUser.getIdToken();
      
      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.deleteUserBracket(bracketId),
        { method: 'DELETE' },
        token
      );

      if (response.ok) {
        // Remove the bracket from the local state
        setBrackets(prev => prev.filter(bracket => bracket.id !== bracketId));
        alert('Bracket deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete bracket');
      }
    } catch (err) {
      console.error('Error deleting bracket:', err);
      alert('Error deleting bracket: ' + err.message);
    } finally {
      setDeletingBracket(null);
    }
  };

  const getSuperBowlWinner = (predictions) => {
    try {
      if (typeof predictions === 'string') {
        const parsed = JSON.parse(predictions);
        return parsed?.superBowl?.winner;
      }
      return predictions?.superBowl?.winner;
    } catch (err) {
      console.error('Error parsing predictions:', err);
      return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderExpandedBracket = (bracket) => {
    let predictions;
    try {
      predictions = typeof bracket.predictions === 'string' 
        ? JSON.parse(bracket.predictions) 
        : bracket.predictions;
    } catch (err) {
      console.error('Error parsing bracket predictions:', err);
      return <div className="text-red-500">Error displaying bracket details</div>;
    }

    // Handle case where predictions is null or undefined
    if (!predictions) {
      return <div className="text-gray-500 p-4">No predictions available for this bracket.</div>;
    }

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">Complete Bracket Predictions</h4>
        
        {/* Super Bowl */}
        {predictions.superBowl?.winner && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-yellow-600 mb-3">🏆 Super Bowl Champion</h5>
            <div className="flex flex-col items-center bg-yellow-100 p-4 rounded-lg">
              <img 
                src={predictions.superBowl.winner.logo} 
                alt={predictions.superBowl.winner.name}
                className="w-12 h-12 mb-2" 
              />
              <span className="text-sm font-bold text-yellow-800">{predictions.superBowl.winner.name}</span>
            </div>
          </div>
        )}

        {/* Conference Championships */}
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-700 mb-3">Conference Championship Winners</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h6 className="text-sm font-semibold text-blue-600 mb-2">AFC Champion</h6>
              {predictions.superBowl?.afc ? (
                <div className="flex justify-center bg-blue-100 p-4 rounded-lg">
                  <img 
                    src={predictions.superBowl.afc.logo} 
                    alt={predictions.superBowl.afc.name}
                    className="w-10 h-10" 
                  />
                </div>
              ) : (
                <div className="bg-gray-200 p-4 rounded-lg text-gray-500 text-center text-sm">Not selected</div>
              )}
            </div>
            
            <div>
              <h6 className="text-sm font-semibold text-red-600 mb-2">NFC Champion</h6>
              {predictions.superBowl?.nfc ? (
                <div className="flex justify-center bg-red-100 p-4 rounded-lg">
                  <img 
                    src={predictions.superBowl.nfc.logo} 
                    alt={predictions.superBowl.nfc.name}
                    className="w-10 h-10" 
                  />
                </div>
              ) : (
                <div className="bg-gray-200 p-4 rounded-lg text-gray-500 text-center text-sm">Not selected</div>
              )}
            </div>
          </div>
        </div>

        {/* Divisional Round (Conference Semi-finals) */}
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-700 mb-3">Divisional Round Winners</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h6 className="text-sm font-semibold text-blue-600 mb-2">AFC</h6>
              <div className="grid grid-cols-2 gap-2">
                {predictions.afc?.divisional?.map((game, idx) => (
                  game?.winner && (
                    <div key={idx} className="flex justify-center bg-blue-50 p-3 rounded-lg">
                      <img src={game.winner.logo} alt={game.winner.name} className="w-8 h-8" />
                    </div>
                  )
                )) || <div className="col-span-2 bg-gray-200 p-3 rounded-lg text-gray-500 text-sm text-center">No picks made</div>}
              </div>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-red-600 mb-2">NFC</h6>
              <div className="grid grid-cols-2 gap-2">
                {predictions.nfc?.divisional?.map((game, idx) => (
                  game?.winner && (
                    <div key={idx} className="flex justify-center bg-red-50 p-3 rounded-lg">
                      <img src={game.winner.logo} alt={game.winner.name} className="w-8 h-8" />
                    </div>
                  )
                )) || <div className="col-span-2 bg-gray-200 p-3 rounded-lg text-gray-500 text-sm text-center">No picks made</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Wild Card Round */}
        <div>
          <h5 className="text-md font-semibold text-gray-700 mb-3">Wild Card Winners</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h6 className="text-sm font-semibold text-blue-600 mb-2">AFC</h6>
              <div className="grid grid-cols-2 gap-2">
                {predictions.afc?.wildCard?.map((game, idx) => (
                  game?.winner && (
                    <div key={idx} className="flex justify-center bg-blue-50 p-3 rounded-lg">
                      <img src={game.winner.logo} alt={game.winner.name} className="w-10 h-10" />
                    </div>
                  )
                )) || <div className="col-span-2 bg-gray-200 p-3 rounded-lg text-gray-500 text-sm text-center">No picks made</div>}
              </div>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-red-600 mb-2">NFC</h6>
              <div className="grid grid-cols-2 gap-2">
                {predictions.nfc?.wildCard?.map((game, idx) => (
                  game?.winner && (
                    <div key={idx} className="flex justify-center bg-red-50 p-3 rounded-lg">
                      <img src={game.winner.logo} alt={game.winner.name} className="w-10 h-10" />
                    </div>
                  )
                )) || <div className="col-span-2 bg-gray-200 p-3 rounded-lg text-gray-500 text-sm text-center">No picks made</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return null; // Don't show anything if not logged in
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading brackets: {error}
        </div>
      </div>
    );
  }

  if (brackets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Brackets</h2>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Brackets Yet</h3>
          <p className="text-gray-500">You haven't submitted any playoff brackets yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Brackets</h2>
      
      <div className="space-y-4">
        {brackets.map((bracket) => {
          const superBowlWinner = getSuperBowlWinner(bracket.predictions);
          const isExpanded = expandedBracket === bracket.id;
          
          return (
            <div 
              key={bracket.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {bracket.bracket_name || 'Unnamed Bracket'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted: {formatDate(bracket.submitted_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteBracket(bracket.id, bracket.bracket_name || 'Unnamed Bracket')}
                      disabled={deletingBracket === bracket.id}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      title="Delete this bracket"
                    >
                      {deletingBracket === bracket.id ? '⏳' : '🗑️'}
                    </button>
                    
                    {/* Score Badge */}
                    {bracket.total_score !== null && (
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 sm:px-3 rounded-full font-semibold text-xs sm:text-sm">
                        <span className="hidden sm:inline">Score: </span>{bracket.total_score}<span className="hidden sm:inline"> pts</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Super Bowl Winner Display */}
                {superBowlWinner && (
                  <div className="flex items-center justify-center bg-yellow-50 p-4 rounded-lg mb-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-yellow-600 mb-2">Super Bowl Champion</div>
                      <img 
                        src={superBowlWinner.logo} 
                        alt={superBowlWinner.name}
                        className="w-12 h-12 mx-auto mb-2" 
                      />
                      <div className="text-sm font-bold text-yellow-800">{superBowlWinner.name}</div>
                    </div>
                  </div>
                )}

                {/* Show All Picks Button */}
                <button
                  onClick={() => setExpandedBracket(isExpanded ? null : bracket.id)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>{isExpanded ? 'Show Less' : 'Show All Picks'}</span>
                  <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>

                {/* Expanded Bracket Details */}
                {isExpanded && renderExpandedBracket(bracket)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserBrackets;