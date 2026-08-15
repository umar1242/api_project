import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { BottomNav } from './components/BottomNav';
import { SchedulePage } from './pages/SchedulePage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AssignmentDetailsPage } from './pages/AssignmentDetailsPage';
import { CoinShopPage } from './pages/CoinShopPage';
import { Loader } from '@shared-ui/core';
import { useTelegramUser } from './hooks/useTelegramUser';
import { getUserEnrollments } from './api';
import type { Enrollment } from './types';

/**
 * Root App component.
 *
 * Responsibilities:
 * 1. Initialize Telegram Web App
 * 2. Resolve the current user via useTelegramUser
 * 3. Fetch the user's active enrollment to get the groupId for schedule/progress
 * 4. Render the routing shell with BottomNav
 */
function App() {
  const { user, isLoading: userLoading, error: userError } = useTelegramUser();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Initialize Telegram Web App
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('bg_color');
  }, []);

  // Fetch active enrollment once user is resolved
  useEffect(() => {
    if (!user) return;

    const fetchEnrollment = async () => {
      try {
        setEnrollmentLoading(true);
        const enrollments = await getUserEnrollments(user.id);
        const active = enrollments.find((e) => e.status === 'ACTIVE') ?? enrollments[0] ?? null;
        setEnrollment(active);
      } catch {
        // Non-fatal — schedule/progress pages handle null groupId gracefully
      } finally {
        setEnrollmentLoading(false);
      }
    };

    void fetchEnrollment();
  }, [user]);

  const isLoading = userLoading || enrollmentLoading;
  const groupId = enrollment?.groupId ?? null;

  if (isLoading) {
    return (
      <div className="app-shell">
        <Loader message="Starting up..." size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Main content area */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/schedule" replace />} />
            <Route
              path="/schedule"
              element={<SchedulePage groupId={groupId} />}
            />
            <Route
              path="/progress"
              element={
                <ProgressPage
                  groupId={groupId}
                  courseId={enrollment?.group?.courseId}
                  userId={user?.id ? String(user.id) : undefined}
                />
              }
            />
            <Route
              path="/shop"
              element={
                <CoinShopPage
                  courseId={enrollment?.group?.courseId}
                  userId={user?.id ? String(user.id) : undefined}
                />
              }
            />
            <Route
              path="/assignments"
              element={<AssignmentsPage groupId={groupId} />}
            />
            <Route
              path="/assignments/:id"
              element={<AssignmentDetailsPage userId={user?.id ? String(user.id) : undefined} />}
            />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  user={user}
                  enrollment={enrollment}
                  isLoading={false}
                  error={userError}
                />
              }
            />
            <Route path="*" element={<Navigate to="/schedule" replace />} />
          </Routes>
        </main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
