import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '@shared-ui/core';

export const TestsPage: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await apiClient.get('/variants');
        setTests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  if (loading) return <div className="app-shell"><Loader message="Loading tests..." /></div>;

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1 className="page-header__title gradient-text">Available Tests</h1>
        <BookOpen className="page-header__icon" style={{ color: 'var(--tg-btn)' }} />
      </div>

      {tests.length === 0 ? (
        <div className="empty-state glass-form" style={{ marginTop: '16px' }}>
          <BookOpen size={48} className="empty-state__icon" style={{ color: 'var(--tg-btn)', opacity: 0.5, marginBottom: '8px' }} />
          <h2 className="empty-state__title">No Tests Yet</h2>
          <p className="empty-state__desc">Check back later for new certification tests.</p>
        </div>
      ) : (
        <div className="section" style={{ gap: '16px' }}>
          {tests.map(test => (
            <div key={test.id} className="card glass-form lesson-card" onClick={() => navigate(`/tests/${test.id}`)} style={{ cursor: 'pointer' }}>
              <div className="lesson-card__header" style={{ justifyContent: 'space-between' }}>
                <h3 className="lesson-card__title" style={{ fontSize: '18px' }}>{test.title}</h3>
                <span className="badge badge--blue">New</span>
              </div>
              <p className="lesson-card__description" style={{ marginBottom: '16px' }}>
                {test.description || 'No description provided.'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--tg-hint)', fontWeight: 500 }}>
                  <Clock size={14} style={{ color: 'var(--tg-btn)' }} />
                  {test.deadlineAt ? new Date(test.deadlineAt).toLocaleDateString() : 'No deadline'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--tg-btn)', fontSize: '14px', fontWeight: 600 }}>
                  Start <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
