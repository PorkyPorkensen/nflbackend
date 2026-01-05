import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './Home';
import Standings from './Standings';
import BracketMaker from './BracketMaker';
import Leaderboard from './Leaderboard';
import { AuthProvider } from './firebase/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Home route */}
            <Route index element={<Home />} />
            
            {/* NFL routes */}
            <Route path="nfl">
              <Route path="standings" element={<Standings />} />
              <Route path="bracket-maker" element={<BracketMaker />} />
              <Route path="leaderboard" element={<Leaderboard />} />
            </Route>
            

            
            {/* Legacy redirects for existing bookmarks */}
            <Route path="standings" element={<Navigate to="/nfl/standings" replace />} />
            <Route path="bracket-maker" element={<Navigate to="/nfl/bracket-maker" replace />} />
            <Route path="leaderboard" element={<Navigate to="/nfl/leaderboard" replace />} />
            <Route path="home" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}