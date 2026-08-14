import { BottomNav as SharedBottomNav } from '@shared-ui/core';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { Loader } from '@shared-ui/core';
import { useTelegramUser } from './hooks/useTelegramUser';

const NAV_ITEMS = [
  { to: '/tests', label: 'Tests', icon: '📝' },
  { to: '/leaderboard', label: 'Rating', icon: '🏆' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

function BottomNav() {
  return <SharedBottomNav items={NAV_ITEMS as any} />;
}

import { TestsPage } from './pages/TestsPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { EnterCodePage } from './pages/EnterCodePage';
import { SubmissionResultPage } from './pages/SubmissionResultPage';

// Temporary placeholders for pages
const ProfilePage = () => <div className="page"><div className="card glass-form"><h1>Profile</h1></div></div>;

function AppShell() {
  const location = useLocation();
  // Скрываем нижнюю панель навигации на экране прохождения теста —
  // она перекрывает фиксированную кнопку "Finish Test" внизу экрана.
  const hideNav = /^\/tests\/[^/]+$/.test(location.pathname) || /^\/results\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/tests" replace />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:id" element={<TestTakingPage />} />
          <Route path="/enter-code" element={<EnterCodePage />} />
          <Route path="/results/:id" element={<SubmissionResultPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/tests" replace />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function App() {
  const { isLoading } = useTelegramUser();

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
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
