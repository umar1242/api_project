import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { apiClient } from '../api/client';

interface Group {
  id: string;
  title: string;
  description: string;
  telegramChatId: string;
  courseId: string | null;
  course?: {
    id: string;
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null); // groupId being linked
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, coursesRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get('/courses')
      ]);
      // API returns array directly (not wrapped in {data: [...]})
      const groupsData = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.data || []);
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.data || []);
      setGroups(groupsData);
      setCourses(coursesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLinkGroup = async (groupId: string) => {
    if (!selectedCourseId) return alert('Select a course');
    try {
      await apiClient.patch(`/groups/${groupId}/link`, {
        courseId: selectedCourseId
      });
      setIsLinking(null);
      fetchData();
    } catch (err) {
      console.error('Failed to link group:', err);
      alert('Failed to link group.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading groups...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="stat-card__value">Groups</h1>
        <p className="text-sm text-gray-500 mt-1">To add a group, add the Registrar Bot to a Telegram group.</p>
      </div>

      <div className="section">
        {groups.length === 0 ? (
          <div className="text-center py-10 card empty-state">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>No groups found</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="card flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "var(--tg-text)" }}>{group.title}</h2>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${group.courseId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {group.courseId ? 'Linked' : 'Unlinked'}
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--tg-hint)" }}>Chat ID: <span className="font-mono text-xs">{group.telegramChatId}</span></p>
              
              {group.course ? (
                <div className="bg-blue-50 text-blue-800 p-2 rounded text-sm mt-2">
                  Linked to Course: <strong>{group.course.title}</strong>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {isLinking === group.id ? (
                    <div className="flex flex-col space-y-2">
                      <select 
                        className="form-select"
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                      >
                        <option value="">-- Select Course --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleLinkGroup(group.id)}
                          className="flex-1 btn btn--primary py-1.5 rounded"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setIsLinking(null)}
                          className="flex-1 btn btn--secondary py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsLinking(group.id); setSelectedCourseId(''); }}
                      className="btn btn--secondary btn--full py-1.5"
                    >
                      Link to a Course
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
