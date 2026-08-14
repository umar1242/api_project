import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '@shared-ui/core';

export const SubmissionResultPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const { data } = await apiClient.get(`/variants/submissions/${id}`);
        setSubmission(data);
      } catch (err) {
        // ignore, show fallback below
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  if (loading) return <div className="app-shell"><Loader message="Loading result..." /></div>;

  if (!submission) {
    return (
      <div className="page">
        <div className="empty-state glass-form mt-10">
          <p className="empty-state__desc">Could not load this result.</p>
          <button className="btn btn--primary btn--full glass-btn" style={{ marginTop: '16px' }} onClick={() => navigate('/tests')}>
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const isPending = submission.status === 'PENDING';

  return (
    <div className="page" style={{ paddingBottom: '96px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => navigate('/tests')} style={{ color: 'var(--tg-hint)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-header__title gradient-text" style={{ margin: 0 }}>Result</h1>
      </div>

      <div className="card glass-form" style={{ textAlign: 'center', padding: '32px 16px' }}>
        {isPending ? (
          <>
            <Clock size={48} className="text-yellow-500 mb-3" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Awaiting Review</h2>
            <p style={{ color: 'var(--tg-hint)', fontSize: '14px' }}>
              Some of your answers need to be checked by a teacher. Your score will appear here once grading is complete.
            </p>
          </>
        ) : (
          <>
            <CheckCircle size={48} className="text-green-500 mb-3" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Graded</h2>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--tg-btn)' }}>
              {submission.totalScore ?? 0}
            </div>
            <p style={{ color: 'var(--tg-hint)', fontSize: '14px', marginTop: '4px' }}>points</p>
          </>
        )}
      </div>

      {submission.answers?.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submission.answers.map((ans: any, idx: number) => (
            <div key={ans.id} className="card glass-form" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Task {idx + 1}</span>
                <span style={{ color: ans.score !== null ? 'var(--tg-btn)' : 'var(--tg-hint)', fontSize: '14px', fontWeight: 600 }}>
                  {ans.score !== null ? `${ans.score} pt` : 'Pending'}
                </span>
              </div>
              {ans.feedback && (
                <div style={{ marginTop: '8px', fontSize: '13px', background: 'rgba(255,165,0,0.1)', padding: '8px', borderRadius: '6px', color: '#b45309' }}>
                  <strong>Feedback:</strong> {ans.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
