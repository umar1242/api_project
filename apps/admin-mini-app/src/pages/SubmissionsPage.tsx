import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '../api/client';


export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data } = await apiClient.get('/variants/submissions/pending');
        setSubmissions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  if (loading) return <div className="app-shell"><div className="loader-container"><div className="loader-spinner"/></div></div>;

  return (
    <div className="page pb-20">
      <div className="page-header mb-4">
        <h1 className="page-header__title gradient-text">Pending Reviews</h1>
        <FileText className="page-header__icon text-blue-500" />
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state glass-form mt-4">
          <FileText size={48} className="empty-state__icon opacity-50 text-blue-500 mb-2" />
          <h2 className="empty-state__title">All Caught Up!</h2>
          <p className="empty-state__desc text-center text-sm text-gray-500">No pending submissions to grade.</p>
        </div>
      ) : (
        <div className="section">
          {submissions.map(sub => (
            <div key={sub.id} className="card glass-form interactive-card" onClick={() => navigate(`/submissions/${sub.id}`)}>
              <div className="progress-section__header">
                <h3 className="font-bold text-lg">{sub.variant.title}</h3>
                <span className="badge badge--red">Action Needed</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--tg-hint)", marginBottom: "var(--space-4)" }}>
                Student: <span className="font-semibold">{sub.user.fullName}</span>
              </p>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100/20">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Clock size={14} className="text-blue-500" />
                  {new Date(sub.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center text-blue-500 text-sm font-semibold">
                  Review <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
