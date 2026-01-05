import React, { useState, useEffect } from 'react';
import { useAuth } from './firebase/AuthContext';
import { API_ENDPOINTS, makeAuthenticatedRequest } from './config/api';

const BracketSubmission = ({ bracketData, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [bracketName, setBracketName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [existingBrackets, setExistingBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, getIdToken } = useAuth();

  // Check for existing brackets when component mounts or modal opens
  useEffect(() => {
    const checkExistingBrackets = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getIdToken();
        const response = await makeAuthenticatedRequest(
          API_ENDPOINTS.userBrackets,
          { method: 'GET' },
          token
        );

        if (response.ok) {
          const data = await response.json();
          setExistingBrackets(data.brackets || []);
        }
      } catch (error) {
        console.error('Error checking existing brackets:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingBrackets();
  }, [currentUser, getIdToken, bracketData]);

  // Generate random bracket name
  const generateRandomName = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setBracketName(result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bracketName.trim()) {
      alert('Please enter a name for your bracket');
      return;
    }

    if (bracketName.length > 20) {
      alert('Bracket name must be 20 characters or less');
      return;
    }

    if (!currentUser) {
      alert('Please sign in to submit your bracket');
      return;
    }

    setSubmitting(true);
    
    try {
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      const submissionData = {
        bracket_name: bracketName.trim(),
        predictions: bracketData,
        season_year: 2025
      };

      console.log('Submitting bracket with data:', submissionData);
      console.log('bracketData (predictions):', bracketData);
      console.log('bracketData type:', typeof bracketData);

      const response = await makeAuthenticatedRequest(API_ENDPOINTS.brackets, {
        method: 'POST',
        body: JSON.stringify(submissionData)
      }, token);

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
          }
        }, 2000);
      } else if (response.status === 409) {
        const errorData = await response.json();
        alert(errorData.message || 'You can only submit one bracket per season. Delete your existing bracket first.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit bracket');
      }
    } catch (error) {
      console.error('Error submitting bracket:', error);
      alert('Error submitting bracket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 relative">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold mb-2">Checking your brackets...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Check if user can submit (admin can always submit, others limited to 1)
  const isAdmin = currentUser?.email === 'gatorgoldrs@gmail.com';
  const hasExistingBracket = existingBrackets.length > 0;
  const canSubmit = isAdmin || !hasExistingBracket;

  if (submitted) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
          
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Bracket Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your bracket "{bracketName}" has been saved successfully.
            </p>
            <p className="text-sm text-gray-500">
              Check the leaderboard to see how you rank!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 relative">
        
        <h2 className="text-xl font-bold mb-4 pr-8">Submit Your Bracket</h2>
        
        {currentUser && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Submitting as: <strong>{currentUser.displayName || currentUser.email}</strong>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bracket Name * ({bracketName.length}/20)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bracketName}
                onChange={(e) => setBracketName(e.target.value)}
                placeholder="My Championship Bracket"
                maxLength="20"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  bracketName.length > 15 ? 'border-orange-300' : 'border-gray-300'
                } ${
                  bracketName.length === 20 ? 'border-red-300' : ''
                }`}
                required
              />
              <button
                type="button"
                onClick={generateRandomName}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm whitespace-nowrap"
                title="Generate random name"
              >
                🎲 Random
              </button>
            </div>
            {bracketName.length > 15 && (
              <p className={`text-sm mt-1 ${
                bracketName.length === 20 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {bracketName.length === 20 ? 'Maximum length reached' : `${20 - bracketName.length} characters remaining`}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Can't think of a name? Use the random generator! 🎲
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Bracket Summary</h3>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="mb-1">
                <strong>Super Bowl Winner:</strong> {bracketData?.superBowl?.winner?.name || 'Not selected'}
              </p>
              <p className="mb-1">
                <strong>AFC Champion:</strong> {bracketData?.afc?.championship?.winner?.name || 'Not selected'}
              </p>
              <p>
                <strong>NFC Champion:</strong> {bracketData?.nfc?.championship?.winner?.name || 'Not selected'}
              </p>
            </div>
          </div>

          {/* Bracket limit warning */}
          {!canSubmit && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-roboto-condensed">
                ⚠️ <strong>Bracket Limit:</strong> You already have {existingBrackets.length} bracket{existingBrackets.length !== 1 ? 's' : ''} submitted. 
                You can only submit one bracket per season. Visit your brackets page to delete your existing bracket first.
              </p>
            </div>
          )}

          {/* Admin testing mode */}
          {isAdmin && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-roboto-condensed">
                👑 <strong>Admin Mode:</strong> You can submit unlimited brackets for testing purposes.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className={`flex-1 px-4 py-2 rounded ${
                canSubmit 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {submitting 
                ? 'Submitting...' 
                : canSubmit 
                  ? (isAdmin ? 'Submit Bracket (Admin)' : 'Submit Bracket') 
                  : 'Cannot Submit More Brackets'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BracketSubmission;