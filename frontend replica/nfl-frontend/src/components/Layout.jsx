import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Header';
import LiveGamesHeader from '../LiveGamesHeader';

export default function Layout() {
  const location = useLocation();
  
  // Don't show LiveGamesHeader on home page or root
  const showLiveGames = location.pathname !== '/' && !location.pathname.includes('/home');

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <Header />
      
      {/* Live Games Header - Shows on every page except home */}
      {showLiveGames && <LiveGamesHeader />}
      
      {/* Page Content */}
      <Outlet />
    </div>
  );
}