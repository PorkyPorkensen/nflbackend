import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './config';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name in Firebase profile
    if (displayName) {
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      // Reload the user to get the updated token
      await result.user.reload();
      
      // Also update the display name in our database directly
      try {
        const token = await result.user.getIdToken();
        const response = await fetch('https://cqxiv74ld1.execute-api.us-east-1.amazonaws.com/Prod/api/user/display-name', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ display_name: displayName })
        });
        
        if (!response.ok) {
          console.warn('Failed to update display name in backend, but signup successful');
        }
      } catch (error) {
        console.warn('Error updating display name in backend:', error);
      }
    }
    
    return result;
  }

  // Log in function
  function login(email, password) {
    console.log('🔐 AuthContext: Attempting login for:', email);
    return signInWithEmailAndPassword(auth, email, password)
      .then((result) => {
        console.log('🔐 AuthContext: Login successful:', result.user.uid);
        return result;
      })
      .catch((error) => {
        console.error('🔐 AuthContext: Login failed:', error);
        
        // If invalid credentials, suggest trying Google sign-in for existing accounts
        if (error.code === 'auth/invalid-credential') {
          console.log('🔐 AuthContext: Account may have been converted to Google OAuth');
        }
        
        throw error;
      });
  }

  // Google sign-in function
  async function signInWithGoogle() {
    console.log('🔐 AuthContext: Attempting Google sign-in');
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('🔐 AuthContext: Google sign-in successful:', result.user.uid);
      return result;
    } catch (error) {
      console.error('🔐 AuthContext: Google sign-in failed:', error);
      throw error;
    }
  }

  // Logout function
  function logout() {
    console.log('🔐 AuthContext: Logging out');
    return signOut(auth);
  }

  // Get Firebase ID token for API calls
  async function getIdToken() {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  useEffect(() => {
    console.log('🔐 AuthContext: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 AuthContext: Auth state changed:', user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}