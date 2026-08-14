import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '@shared-ui/core';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const { data } = await apiClient.get('/variants/submissions/mine');
        setSubmissions(data || []);
      } catch (err) {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMine();
  }, []);

  return (
    <div className="page" style={{ paddingBottom: '96px' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1 className="page-header__title gradient-text">My Results</h1>
        <User className="page-header__icon" style={{ color: 'var(--tg-btn)' }} />
      </div>

      {loading ? (
        <Loader message="Loading your results..." />
      ) : submissions.length === 0 ? (
        <div className="empty-state glass-form mt-10">
          <p className="empty-state__desc">You haven't taken any tests yet.</p>
          <button className="btn btn--primary btn--full glass-btn" style={{ marginTop: '16px' }} onClick={() => navigate('/tests')}>
            Browse Tests
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map((sub: any) => {
            const isPending = sub.status === 'PENDING';
            return (
              <button
                key={sub.id}
                className="card glass-form"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => navigate(`/results/${sub.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{sub.variantTitle}</div>
                  <div style={{ fontSize: '12px', color: 'var(--tg-hint)', marginTop: '4px' }}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isPending ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#b45309', background: 'rgba(255,165,0,0.12)', padding: '4px 8px', borderRadius: '999px' }}>
                      <Clock size={12} /> Pending
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--tg-btn)', background: 'rgba(36,129,204,0.1)', padding: '4px 8px', borderRadius: '999px' }}>
                      <CheckCircle size={12} /> {sub.totalScore ?? 0} pts
                    </span>
                  )}
                  <ChevronRight size={18} style={{ color: 'var(--tg-hint)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
