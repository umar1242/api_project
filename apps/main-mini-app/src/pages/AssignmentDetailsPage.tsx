import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssignmentDetails } from '../hooks/useAssignmentDetails';
import { Loader } from '@shared-ui/core';
import { ChevronLeft, AlertCircle, RefreshCw, Send, CheckCircle, Calendar } from 'lucide-react';

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
        <button className="btn btn--secondary mt-2" onClick={() => navigate('/assignments')}>
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
    <div className="page pb-24">
      <div className="page-header mb-2">
        <button
          className="btn--icon mr-2"
          onClick={() => navigate('/assignments')}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="page-header__title flex-1 truncate">
          {assignment.title}
        </h1>
      </div>

      <div className="card section">
        <h2 className="section__title">Description</h2>
        <p className="text-sm text-gray-700">
          {assignment.description || 'No description provided.'}
        </p>
        
        {assignment.deadlineAt && (
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-2">
            <Calendar size={14} className="text-blue-500" />
            <span>Deadline: {new Date(assignment.deadlineAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="card section mt-2">
        <h2 className="section__title">Your Submission</h2>
        
        {isCompleted ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-500 font-semibold text-sm">
              <CheckCircle size={20} />
              <span>{submission.status === 'GRADED' ? 'Graded' : 'Submitted successfully'}</span>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-xl">
              <h3 className="text-xs font-semibold text-gray-500 mb-1">Your Answer:</h3>
              <p className="text-sm whitespace-pre-wrap">{submission.answerText || 'File submitted'}</p>
            </div>
            
            {submission.status === 'GRADED' && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-500 mb-1">Grade: {submission.grade}/100</h3>
                {submission.feedback && (
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    <strong>Feedback:</strong> {submission.feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmission} className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Please enter your answer below.
            </p>
            
            <textarea 
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              className="form-textarea"
              style={{ minHeight: '120px' }}
            />
            
            <input 
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Or attach a file URL..."
              className="form-input"
            />
            
            {submitError && (
              <p className="text-xs text-red-500">{submitError}</p>
            )}
            
            <button 
              type="submit" 
              className="btn btn--primary self-start" 
              disabled={isSubmitting || (!answerText.trim() && !fileUrl.trim())}
            >
              {isSubmitting ? (
                <Loader message="" />
              ) : (
                <>
                  <Send size={16} />
                  Submit Answer
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
