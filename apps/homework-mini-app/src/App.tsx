import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import HomeworkDashboard from './pages/HomeworkDashboard';
import HomeworkDetail from './pages/HomeworkDetail';

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Homeworks', icon: '📚' },
    { path: '/archive', label: 'Archive', icon: '🗄' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${
            location.pathname === item.path
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

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('bg_color');
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="app-shell"><div className="loader-container"><div className="loader-spinner" /></div></div>;
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeworkDashboard />} />
            <Route path="/assignment/:id" element={<HomeworkDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
