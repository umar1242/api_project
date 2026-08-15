import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { BookOpen, Archive } from 'lucide-react';
import HomeworkDashboard from './pages/HomeworkDashboard';
import HomeworkDetail from './pages/HomeworkDetail';

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Homeworks', Icon: BookOpen },
    { path: '/archive', label: 'Archive', Icon: Archive },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const IconComponent = item.Icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          >
            <div className="bottom-nav__icon">
              <IconComponent size={22} />
            </div>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
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
    return (
      <div className="app-shell">
        <div className="loader-container">
          <div className="loader-spinner" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeworkDashboard mode="active" />} />
            <Route path="/archive" element={<HomeworkDashboard mode="archive" />} />
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
