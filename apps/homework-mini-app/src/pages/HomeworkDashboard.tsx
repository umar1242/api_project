import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export default function HomeworkDashboard() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const { data } = await apiClient.get('/variants');
        // Filter for homework variants
        setHomeworks(data?.filter((v: any) => v.type === 'HOMEWORK') || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeworks();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="page pb-20">
      <div className="page-header mb-4">
        <h1 className="page-header__title gradient-text">My Homeworks</h1>
        <BookOpen className="page-header__icon text-blue-500" />
      </div>

      {homeworks.length === 0 ? (
        <div className="empty-state glass-form mt-4">
          <BookOpen size={48} className="empty-state__icon opacity-50 text-blue-500 mb-2" />
          <h2 className="empty-state__title">No Homeworks Yet</h2>
          <p className="empty-state__desc text-center text-sm text-gray-500">You are all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {homeworks.map(hw => (
            <div key={hw.id} className="card glass-form interactive-card" onClick={() => navigate(`/assignment/${hw.id}`)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{hw.title}</h3>
                <span className="badge badge--blue">Active</span>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{hw.description || 'No description provided.'}</p>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100/20">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Clock size={14} className="text-blue-500" />
                  {hw.deadlineAt ? new Date(hw.deadlineAt).toLocaleDateString() : 'No deadline'}
                </div>
                <div className="flex items-center text-blue-500 text-sm font-semibold">
                  Solve <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
