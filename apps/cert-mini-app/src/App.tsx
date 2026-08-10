import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { Loader } from './components/Loader';
import { useTelegramUser } from './hooks/useTelegramUser';
import { Layout } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/tests', label: 'Tests', icon: '📝' },
    { path: '/leaderboard', label: 'Rating', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${
            location.pathname.startsWith(item.path)
              ? 'bottom-nav__item--active'
              : ''
          }`}
        >
          <div className="bottom-nav__icon">
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
          </div>
          <span className="bottom-nav__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

import { TestsPage } from './pages/TestsPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';

// Temporary placeholders for pages
const ProfilePage = () => <div className="page"><div className="card glass-form"><h1>Profile</h1></div></div>;

function App() {
  const { user, isLoading } = useTelegramUser();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('bg_color');
  }, []);

  if (isLoading) {
    return <div className="app-shell"><Loader message="Starting up..." size="lg" /></div>;
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/tests" replace />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/tests/:id" element={<TestTakingPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/tests" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
