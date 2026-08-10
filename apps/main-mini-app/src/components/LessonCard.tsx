import React from 'react';
import type { Lesson } from '../types';
import { Video, Radio, Clock, ExternalLink, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  /** Show full description (expanded view) */
  expanded?: boolean;
}

const STATUS_CONFIG: Record<
  Lesson['status'],
  { label: string; className: string; icon: React.ReactNode }
> = {
  SCHEDULED: {
    label: 'Upcoming',
    className: 'badge badge--blue',
    icon: <Calendar size={12} />,
  },
  LIVE: {
    label: '🔴 Live Now',
    className: 'badge badge--red',
    icon: <Radio size={12} />,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'badge badge--green',
    icon: <CheckCircle size={12} />,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'badge badge--gray',
    icon: <XCircle size={12} />,
  },
};

/**
 * Formats a UTC ISO date string into a human-readable locale string.
 */
function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { date, time };
}

/**
 * Displays a single lesson as a card with type icon, status badge,
 * date/time, duration, and an optional meeting link.
 */
export const LessonCard: React.FC<LessonCardProps> = ({ lesson, expanded = false }) => {
  const { date, time } = formatDate(lesson.startsAt);
  const status = STATUS_CONFIG[lesson.status];
  const isLive = lesson.status === 'LIVE';

  return (
    <div className={`lesson-card${isLive ? ' lesson-card--live' : ''}`}>
      {/* Header row */}
      <div className="lesson-card__header">
        <div className="lesson-card__type-icon">
          {lesson.type === 'ONLINE' ? (
            <Radio size={18} className="icon-live" />
          ) : (
            <Video size={18} className="icon-recorded" />
          )}
        </div>

        <div className="lesson-card__title-group">
          <h3 className="lesson-card__title">{lesson.title}</h3>
          <p className="lesson-card__subtitle">
            {lesson.type === 'ONLINE' ? 'Online Lesson' : 'Recorded Session'}
          </p>
        </div>

        <span className={status.className}>
          {status.icon}&nbsp;{status.label}
        </span>
      </div>

      {/* Time info */}
      <div className="lesson-card__meta">
        <span className="lesson-card__meta-item">
          <Calendar size={14} />
          {date}
        </span>
        <span className="lesson-card__meta-item">
          <Clock size={14} />
          {time} · {lesson.durationMin} min
        </span>
      </div>

      {/* Description (expanded only) */}
      {expanded && lesson.description && (
        <p className="lesson-card__description">{lesson.description}</p>
      )}

      {/* Meeting link — always show for LIVE or ONLINE+SCHEDULED */}
      {lesson.meetingUrl && lesson.status !== 'COMPLETED' && lesson.status !== 'CANCELLED' && (
        <a
          className={`lesson-card__join-btn${isLive ? ' lesson-card__join-btn--live' : ''}`}
          href={lesson.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} />
          {isLive ? 'Join Now' : 'Join Link'}
        </a>
      )}
    </div>
  );
};
