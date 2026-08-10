import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssignments } from '../hooks/useAssignments';
import { Loader } from '@shared-ui/core';
import { FileText, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';


interface AssignmentsPageProps {
  groupId: string | null | undefined;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ groupId }) => {
  const { assignments, isLoading, error, refetch } = useAssignments(groupId);
  const navigate = useNavigate();

  if (!groupId) {
    return (
      <div className="empty-state">
        <FileText size={48} className="empty-state__icon" />
        <h2 className="empty-state__title">No Active Enrollment</h2>
        <p className="empty-state__desc">
          You are not currently enrolled in any course to see assignments.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <Loader message="Loading assignments..." />;
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
      <div className="page-header">
        <h1 className="page-header__title">Assignments</h1>
        <button
          className="btn btn--icon"
          onClick={refetch}
          aria-label="Refresh assignments"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="empty-state__icon" />
          <h2 className="empty-state__title">No Assignments</h2>
          <p className="empty-state__desc">
            You don't have any assignments yet. Enjoy your free time!
          </p>
        </div>
      ) : (
        <div className="lesson-list">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="lesson-card"
              onClick={() => navigate(`/assignments/${assignment.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="lesson-card__header" style={{ alignItems: 'center' }}>
                <div className="lesson-card__type-icon">
                  <FileText size={20} className="icon-recorded" />
                </div>
                <div className="lesson-card__title-group">
                  <h3 className="lesson-card__title">{assignment.title}</h3>
                  <div className="lesson-card__subtitle">
                    {assignment.status === 'DRAFT' && <span className="badge badge--gray">Draft</span>}
                    {assignment.status === 'PUBLISHED' && <span className="badge badge--blue">Published</span>}
                    {assignment.status === 'ARCHIVED' && <span className="badge badge--gray">Archived</span>}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--tg-hint)' }} />
              </div>
              
              <div className="lesson-card__meta">
                {assignment.deadlineAt && (
                  <div className="lesson-card__meta-item">
                    Deadline: {new Date(assignment.deadlineAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
