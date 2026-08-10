import React, { useState } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { LessonCard } from '../components/LessonCard';
import { Loader } from '@shared-ui/core';
import { RefreshCw, AlertCircle, CalendarDays, Filter } from 'lucide-react';

interface SchedulePageProps {
  /** The student's group ID (passed down from the parent layout) */
  groupId: string | null | undefined;
}

type FilterTab = 'upcoming' | 'all';

/**
 * Schedule page — shows upcoming lessons for the student's enrolled group.
 *
 * Filters: "Upcoming" (default) shows future + live lessons.
 *          "All" will show the full list (pagination in future stage).
 */
export const SchedulePage: React.FC<SchedulePageProps> = ({ groupId }) => {
  const [filter, setFilter] = useState<FilterTab>('upcoming');
  const { lessons, isLoading, error, refetch } = useSchedule(groupId, 30);

  const upcomingLessons = lessons.filter(
    (l) => l.status === 'SCHEDULED' || l.status === 'LIVE',
  );
  const displayedLessons = filter === 'upcoming' ? upcomingLessons : lessons;

  if (!groupId) {
    return (
      <div className="empty-state">
        <CalendarDays size={48} className="empty-state__icon" />
        <h2 className="empty-state__title">No Active Enrollment</h2>
        <p className="empty-state__desc">
          You are not currently enrolled in any course. Please use the registration
          link provided by your teacher.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Loader message="Loading your schedule..." />;
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={40} className="error-state__icon" />
        <p className="error-state__message">{error}</p>
        <button className="btn btn--secondary" onClick={refetch}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-header__title">My Schedule</h1>
        <button
          className="btn btn--icon"
          onClick={refetch}
          aria-label="Refresh schedule"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs" role="tablist" aria-label="Schedule filter">
        <button
          role="tab"
          aria-selected={filter === 'upcoming'}
          className={`filter-tab${filter === 'upcoming' ? ' filter-tab--active' : ''}`}
          onClick={() => setFilter('upcoming')}
          id="tab-upcoming"
        >
          <Filter size={14} />
          Upcoming ({upcomingLessons.length})
        </button>
        <button
          role="tab"
          aria-selected={filter === 'all'}
          className={`filter-tab${filter === 'all' ? ' filter-tab--active' : ''}`}
          onClick={() => setFilter('all')}
          id="tab-all"
        >
          All Lessons ({lessons.length})
        </button>
      </div>

      {/* Lesson list */}
      {displayedLessons.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={48} className="empty-state__icon" />
          <h2 className="empty-state__title">
            {filter === 'upcoming' ? 'No Upcoming Lessons' : 'No Lessons Yet'}
          </h2>
          <p className="empty-state__desc">
            {filter === 'upcoming'
              ? 'All upcoming lessons will appear here. Check back later!'
              : 'Your teacher has not added any lessons to this group yet.'}
          </p>
        </div>
      ) : (
        <div className="lesson-list">
          {displayedLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
};
