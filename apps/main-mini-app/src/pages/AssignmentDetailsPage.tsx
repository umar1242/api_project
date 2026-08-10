import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignmentDetails } from '../hooks/useAssignmentDetails';
import { Loader } from '../components/Loader';
import { ChevronLeft, AlertCircle, RefreshCw, Send, CheckCircle } from 'lucide-react';

interface AssignmentDetailsPageProps {
  userId: string | undefined;
}

export const AssignmentDetailsPage: React.FC<AssignmentDetailsPageProps> = ({ userId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    assignment, 
    submission, 
    isLoading, 
    error, 
    isSubmitting, 
    submitError, 
    refetch, 
    submit 
  } = useAssignmentDetails(id, userId);

  const [answerText, setAnswerText] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  if (isLoading) {
    return <Loader message="Loading assignment details..." />;
  }

  if (error || !assignment) {
    return (
      <div className="error-state">
        <AlertCircle size={40} className="error-state__icon" />
        <p className="error-state__message">{error || 'Assignment not found'}</p>
        <button className="btn btn--secondary" onClick={refetch}>
          <RefreshCw size={16} /> Try Again
        </button>
        <button className="btn btn--secondary" onClick={() => navigate('/assignments')} style={{ marginTop: 'var(--space-2)' }}>
          <ChevronLeft size={16} /> Back to Assignments
        </button>
      </div>
    );
  }

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() && !fileUrl.trim()) return;
    
    try {
      await submit({ answerText, fileUrl });
    } catch {
      // handled in hook
    }
  };

  const isCompleted = submission && (submission.status === 'SUBMITTED' || submission.status === 'GRADED');

  return (
    <div className="page" style={{ paddingBottom: 'calc(var(--nav-height) + var(--space-8))' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-2)' }}>
        <button
          className="btn btn--icon"
          onClick={() => navigate('/assignments')}
          aria-label="Back"
          style={{ marginRight: 'var(--space-2)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-header__title" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {assignment.title}
        </h1>
      </div>

      <div className="card section">
        <h2 className="section__title">Description</h2>
        <p className="lesson-card__description" style={{ color: 'var(--tg-text)', fontSize: '15px' }}>
          {assignment.description || 'No description provided.'}
        </p>
        
        {assignment.deadlineAt && (
          <div className="lesson-card__meta-item" style={{ marginTop: 'var(--space-2)' }}>
            <CalendarIcon /> Deadline: {new Date(assignment.deadlineAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="card section" style={{ marginTop: 'var(--space-2)' }}>
        <h2 className="section__title">Your Submission</h2>
        
        {isCompleted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontWeight: 600 }}>
              <CheckCircle size={20} />
              <span>{submission.status === 'GRADED' ? 'Graded' : 'Submitted successfully'}</span>
            </div>
            
            <div style={{ background: 'var(--tg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '12px', color: 'var(--tg-hint)', marginBottom: '4px' }}>Your Answer:</h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{submission.answerText || 'File submitted'}</p>
            </div>
            
            {submission.status === 'GRADED' && (
              <div style={{ background: 'rgba(36,129,204,.1)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(36,129,204,.2)' }}>
                <h3 style={{ fontSize: '12px', color: 'var(--tg-hint)', marginBottom: '4px' }}>Grade: {submission.grade}/100</h3>
                {submission.feedback && (
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', marginTop: 'var(--space-1)' }}>
                    <strong>Feedback:</strong> {submission.feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmission} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p className="lesson-card__description">
              Please enter your answer below.
            </p>
            
            <textarea 
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,0,0,.1)',
                background: 'var(--tg-bg)',
                color: 'var(--tg-text)',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            
            <input 
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Or attach a file URL..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,0,0,.1)',
                background: 'var(--tg-bg)',
                color: 'var(--tg-text)',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
            
            {submitError && (
              <p style={{ color: 'var(--color-error)', fontSize: '13px' }}>{submitError}</p>
            )}
            
            <button 
              type="submit" 
              className="btn btn--primary" 
              disabled={isSubmitting || (!answerText.trim() && !fileUrl.trim())}
              style={{ alignSelf: 'flex-start' }}
            >
              {isSubmitting ? <Loader message="" /> : <><Send size={16} /> Submit Answer</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
