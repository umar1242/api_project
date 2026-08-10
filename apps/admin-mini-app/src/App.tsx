import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { Loader } from '@shared-ui/core';
import { useTelegramUser } from './hooks/useTelegramUser';
import { Home, Book, Users, Layout, Settings } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: <Home size={20} /> },
    { path: '/courses', label: 'Courses', icon: <Book size={20} /> },
    { path: '/groups', label: 'Groups', icon: <Users size={20} /> },
    { path: '/variants', label: 'Builder', icon: <Layout size={20} /> },
    { path: '/submissions', label: 'Grades', icon: <Settings size={20} /> },
  ];

  return (
    <nav className="bottom-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          >
            <div className="bottom-nav__icon">{item.icon}</div>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import { VariantsPage } from './pages/VariantsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { GradeSubmissionPage } from './pages/GradeSubmissionPage';
import { EditVariantAnswersPage } from './pages/EditVariantAnswersPage';

import { CoursesPage } from './pages/CoursesPage';
import { GroupsPage } from './pages/GroupsPage';

// Temporary placeholders for pages
const DashboardPage = () => (
  <div className="page">
    <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
      <h1 className="page-header__title gradient-text">Admin Dashboard</h1>
    </div>
    <div className="card glass-form">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--tg-text)', marginBottom: 'var(--space-2)' }}>Welcome!</h2>
      <p style={{ fontSize: '14px', color: 'var(--tg-hint)' }}>Select an option from the bottom menu to manage your platform.</p>
    </div>
  </div>
);

function App() {
  const { isLoading } = useTelegramUser();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('bg_color');
  }, []);

  if (isLoading) {
    return <Loader message="Starting up..." size="lg" />;
  }

  // Basic admin validation based on config/role would go here

  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/variants" element={<VariantsPage />} />
            <Route path="/variants/:id/edit" element={<EditVariantAnswersPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/submissions/:id" element={<GradeSubmissionPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
