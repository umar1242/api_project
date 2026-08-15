import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Archive, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface HomeworkDashboardProps {
  mode?: 'active' | 'archive';
}

export default function HomeworkDashboard({ mode = 'active' }: HomeworkDashboardProps) {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'active' | 'archive'>(mode);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentTab(mode);
  }, [mode]);

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

  const filteredHomeworks = homeworks.filter(hw => {
    const isPastDeadline = hw.deadlineAt && new Date(hw.deadlineAt) < new Date();
    if (currentTab === 'archive') {
      return isPastDeadline || hw.status === 'ARCHIVED';
    }
    return !isPastDeadline && hw.status !== 'ARCHIVED';
  });

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="page pb-20">
      <div className="page-header mb-2">
        <h1 className="page-header__title gradient-text">
          {currentTab === 'archive' ? 'Homework Archive' : 'My Homeworks'}
        </h1>
        {currentTab === 'archive' ? (
          <Archive className="page-header__icon text-blue-500" size={26} />
        ) : (
          <BookOpen className="page-header__icon text-blue-500" size={26} />
        )}
      </div>

      <div className="filter-tabs mb-4">
        <button
          className={`filter-tab ${currentTab === 'active' ? 'filter-tab--active' : ''}`}
          onClick={() => {
            setCurrentTab('active');
            navigate('/');
          }}
        >
          <BookOpen size={16} />
          Active
        </button>
        <button
          className={`filter-tab ${currentTab === 'archive' ? 'filter-tab--active' : ''}`}
          onClick={() => {
            setCurrentTab('archive');
            navigate('/archive');
          }}
        >
          <Archive size={16} />
          Archive
        </button>
      </div>

      {filteredHomeworks.length === 0 ? (
        <div className="empty-state card">
          {currentTab === 'archive' ? (
            <>
              <Archive size={48} className="empty-state__icon opacity-50 text-blue-500 mb-2" />
              <h2 className="empty-state__title">Archive is Empty</h2>
              <p className="empty-state__desc">No completed or archived homework assignments.</p>
            </>
          ) : (
            <>
              <CheckCircle2 size={48} className="empty-state__icon opacity-50 text-green-500 mb-2" />
              <h2 className="empty-state__title">You're All Caught Up!</h2>
              <p className="empty-state__desc">No pending homework assignments right now.</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredHomeworks.map(hw => (
            <div
              key={hw.id}
              className="card interactive-card"
              onClick={() => navigate(`/assignment/${hw.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{hw.title}</h3>
                <span className={`badge ${currentTab === 'archive' ? 'badge--gray' : 'badge--blue'}`}>
                  {currentTab === 'archive' ? 'Archived' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {hw.description || 'No description provided.'}
              </p>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Clock size={14} className="text-blue-500" />
                  {hw.deadlineAt ? new Date(hw.deadlineAt).toLocaleDateString() : 'No deadline'}
                </div>
                <div className="flex items-center text-blue-500 text-sm font-semibold">
                  {currentTab === 'archive' ? 'Review' : 'Solve'} <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
