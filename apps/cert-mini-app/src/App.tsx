import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { BottomNav as SharedBottomNav, Loader } from '@shared-ui/core';
import { FileText, Trophy, User } from 'lucide-react';
import { useTelegramUser } from './hooks/useTelegramUser';

import { TestsPage } from './pages/TestsPage';
import { TestTakingPage } from './pages/TestTakingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { EnterCodePage } from './pages/EnterCodePage';
import { SubmissionResultPage } from './pages/SubmissionResultPage';
import { ProfilePage } from './pages/ProfilePage';

const NAV_ITEMS = [
  { to: '/tests', label: 'Tests', icon: <FileText size={22} /> },
  { to: '/leaderboard', label: 'Rating', icon: <Trophy size={22} /> },
  { to: '/profile', label: 'Profile', icon: <User size={22} /> },
];

function BottomNav() {
  return <SharedBottomNav items={NAV_ITEMS} />;
}

function AppShell() {
  const location = useLocation();
  // Hide navigation on test taking and result screens to maximize screen space
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
    return (
      <div className="app-shell">
        <Loader message="Starting up..." size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
