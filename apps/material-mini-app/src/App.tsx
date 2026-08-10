import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { UserProfile, Enrollment } from './types';
import { getUserByTelegramId, getUserEnrollments } from './api';
import MaterialDashboard from './pages/MaterialDashboard';
import './index.css';

export const AppContext = React.createContext<{
  user: UserProfile | null;
  enrollments: Enrollment[];
  loading: boolean;
}>({
  user: null,
  enrollments: [],
  loading: true,
});

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const telegramId = WebApp.initDataUnsafe?.user?.id || 123456789;

    async function init() {
      try {
        const u = await getUserByTelegramId(telegramId);
        setUser(u);
        if (u) {
          const enrs = await getUserEnrollments(u.id);
          setEnrollments(enrs.filter((e: Enrollment) => e.status === 'ACTIVE'));
        }
      } catch (err) {
        console.error('Failed to init app', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
        <p>Loading materials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-state">
        <h2>User Not Found</h2>
        <p>You are not registered in the system.</p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="error-state">
        <h2>No Enrollments</h2>
        <p>You are not actively enrolled in any group.</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, enrollments, loading }}>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<MaterialDashboard />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
