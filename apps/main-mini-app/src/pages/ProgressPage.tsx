import React from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { Loader } from '@shared-ui/core';
import {
  BarChart2,
  CheckCircle,
  Clock,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Flame,
  Coins,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamificationStats } from '../hooks/useGamification';
import type { Lesson } from '../types';

interface ProgressPageProps {
  groupId: string | null | undefined;
  courseId?: string | null | undefined;
  userId?: string;
}

function computeStats(lessons: Lesson[]) {
  const total = lessons.length;
  const completed = lessons.filter((l) => l.status === 'COMPLETED').length;
  const upcoming = lessons.filter((l) => l.status === 'SCHEDULED').length;
  const totalMinutes = lessons
    .filter((l) => l.status === 'COMPLETED')
    .reduce((acc, l) => acc + l.durationMin, 0);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, upcoming, totalMinutes, pct };
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent }) => (
  <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
    <div className="stat-card__icon">{icon}</div>
    <div className="stat-card__body">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  </div>
);



/**
 * Progress page — shows aggregate stats, a completion progress bar,
 * and gamification stats (coins, streaks, fines).
 */
export const ProgressPage: React.FC<ProgressPageProps> = ({ groupId, courseId, userId }) => {
  const { lessons, isLoading, error } = useSchedule(groupId, 100);
  const { stats, isLoading: statsLoading } = useGamificationStats(courseId, userId);
  const navigate = useNavigate();

  if (!groupId) {
    return (
      <div className="empty-state">
        <BarChart2 size={48} className="empty-state__icon" />
        <h2 className="empty-state__title">No Enrollment Found</h2>
        <p className="empty-state__desc">Enroll in a course to start tracking your progress.</p>
      </div>
    );
  }

  if (isLoading) return <Loader message="Calculating your progress..." />;

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={40} className="error-state__icon" />
        <p className="error-state__message">{error}</p>
      </div>
    );
  }

  const { total, completed, upcoming, totalMinutes, pct } = computeStats(lessons);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">My Progress</h1>
        <TrendingUp size={24} className="page-header__icon" />
      </div>

      {/* Progress bar */}
      <div className="progress-section card">
        <div className="progress-section__header">
          <span className="progress-section__label">Course Completion</span>
          <span className="progress-section__pct">{pct}%</span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% complete`}
        >
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="progress-section__sub">
          {completed} of {total} lessons completed
        </p>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Completed"
          value={completed}
          accent
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Hours Studied"
          value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
        />
        <StatCard
          icon={<BookOpen size={22} />}
          label="Total Lessons"
          value={total}
        />
        <StatCard
          icon={<BarChart2 size={22} />}
          label="Upcoming"
          value={upcoming}
        />
      </div>

      {/* Gamification Stats */}
      {courseId && !statsLoading && stats && (
        <div className="gamification-section" style={{ marginTop: '1.5rem' }}>
          <div className="page-header">
            <h2 className="page-header__title" style={{ fontSize: '1.2rem' }}>Gamification Stats</h2>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
            <StatCard
              icon={<Coins size={22} color="#f59e0b" />}
              label="Coins"
              value={stats.coins}
              accent
            />
            <StatCard
              icon={<Flame size={22} color="#ef4444" />}
              label="Streak"
              value={`${stats.currentStreak} days`}
            />
            <StatCard
              icon={<Wallet size={22} color="#8b5cf6" />}
              label="Fines"
              value={stats.finesBalance}
            />
          </div>
          
          <button 
            className="btn btn--primary" 
            style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag size={20} />
            <span>Visit Coin Shop</span>
          </button>
        </div>
      )}
    </div>
  );
};
