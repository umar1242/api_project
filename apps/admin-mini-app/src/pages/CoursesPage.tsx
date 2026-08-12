import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

interface Course {
  id: string;
  title: string;
  type: 'FREE' | 'PAID';
  description: string;
  refLink: string;
}

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [unassignedGroups, setUnassignedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [createdRefLink, setCreatedRefLink] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'FREE' | 'PAID'>('FREE');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, groupsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/groups')
      ]);
      // API returns array directly (not wrapped in {data: [...]})
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.data || []);
      const allGroups = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.data || []);
      setCourses(coursesData);
      setUnassignedGroups(allGroups.filter((g: any) => !g.courseId));
      
      // Temporary debug alert
      if (allGroups.filter((g: any) => !g.courseId).length === 0) {
          setDebugInfo('Debug groups: ' + JSON.stringify(groupsRes.data));
      }
    } catch (err: any) {
      console.error(err);
      setDebugInfo('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!title || !selectedGroupId) {
        WebApp.showAlert('Please fill in title and select a group.');
        return;
      }
      setStep(2);
    }
  };

  const handleCreate = async () => {
    try {
      // 1. Create course
      const { data: courseData } = await apiClient.post('/courses', {
        title,
        type,
        description,
        plan
      });
      
      // 2. Link group to course
      if (selectedGroupId) {
        await apiClient.patch(`/groups/${selectedGroupId}/link`, {
          courseId: courseData.id
        });
      }

      WebApp.HapticFeedback.notificationOccurred('success');
      setCreatedRefLink(`https://t.me/student1242bot?start=${courseData.refLink}`);
      setStep(3);
      fetchData(); // Refresh list in background
    } catch (err) {
      WebApp.HapticFeedback.notificationOccurred('error');
      WebApp.showAlert('Failed to create course.');
    }
  };

  const handleShare = () => {
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(createdRefLink)}&text=${encodeURIComponent('Join my new course!')}`);
  };

  const resetForm = () => {
    setIsCreating(false);
    setStep(1);
    setTitle('');
    setType('FREE');
    setSelectedGroupId('');
    setDescription('');
    setPlan('');
    setCreatedRefLink('');
  };

  if (loading) {
    return <div className="app-shell"><div className="loader-container"><div className="loader-spinner"/></div></div>;
  }

  if (isCreating) {
    if (step === 3) {
      return (
        <div className="page">
          <div className="empty-state glass-form mt-10">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <h2 className="empty-state__title">Course Created!</h2>
            <p className="empty-state__desc">Share this referral link with your students to let them enroll.</p>
            <div style={{ background: "var(--tg-secondary)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", wordBreak: "break-all", fontFamily: "monospace", border: "1px solid var(--tg-hint)", textAlign: "center", marginBottom: "var(--space-6)" }}>
              {createdRefLink}
            </div>
            <button className="btn btn--primary btn--full glass-btn" onClick={handleShare}>
              Share via Telegram
            </button>
            <button className="btn btn--secondary btn--full" onClick={resetForm}>
              Back to Courses
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="page">
          <div className="page-header mb-4">
            <h1 className="page-header__title gradient-text">Course Details</h1>
          </div>
          
          <div className="card glass-form section">
            <div>
              <label className="input-label">Short Description</label>
              <textarea 
                className="form-textarea min-h-[80px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this course about?"
              />
            </div>
            
            <div>
              <label className="input-label">Course Plan (Optional)</label>
              <textarea 
                className="form-textarea min-h-[80px]"
                value={plan}
                onChange={e => setPlan(e.target.value)}
                placeholder="List topics or schedule..."
              />
            </div>
            
            <div className="upload-box">
              <FileText size={24} className="text-blue-500 mb-2" />
              <span className="text-sm font-semibold text-blue-700">Upload Plan File</span>
            </div>
          </div>

          <div className="fixed bottom-20 left-4 right-4 z-50 flex gap-2">
            <button className="btn btn--secondary btn--full" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn--primary btn--full glass-btn" onClick={handleCreate}>
              Finish
              <CheckCircle size={18} className="ml-2" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page">
        <div className="page-header mb-4">
          <button onClick={resetForm} className="text-gray-500 mr-2"><ArrowRight size={20} className="rotate-180" /></button>
          <h1 className="page-header__title gradient-text">Create Course</h1>
        </div>
        
        <div className="card glass-form section">
          <div>
            <label className="input-label">Course Title</label>
            <input 
              required
              type="text" 
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Advanced Biology"
            />
          </div>

          <div>
            <label className="input-label">Priority / Type</label>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button 
                type="button"
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${type === 'FREE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                onClick={() => setType('FREE')}
              >
                FREE
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${type === 'PAID' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                onClick={() => setType('PAID')}
              >
                PAID
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Link to Telegram Group</label>
            {unassignedGroups.length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-start gap-2">
                <Users size={16} className="shrink-0 mt-0.5" />
                No unassigned groups found. Please create a private Telegram group and add the bot as admin first.
              </div>
            ) : (
              <select 
                className="form-select"
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select a group...</option>
                {unassignedGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            )}
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono break-all text-red-600">
                {debugInfo}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-20 left-4 right-4 z-50">
          <button 
            className="btn btn--primary btn--full glass-btn" 
            onClick={handleNext}
            disabled={!title || !selectedGroupId}
          >
            Next Step
            <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header mb-6">
        <h1 className="page-header__title gradient-text">Courses</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn btn--icon shadow-md shadow-blue-500/20 bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="section">
        {courses.length === 0 ? (
          <div className="empty-state glass-form">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <h2 className="empty-state__title">No courses yet</h2>
            <p className="empty-state__desc text-sm">Create your first course to get started.</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="card glass-form interactive-card">
              <div className="progress-section__header">
                <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "var(--tg-text)" }}>{course.title}</h2>
                <span className={`badge ${course.type === 'FREE' ? 'badge--green' : 'badge--purple'}`}>
                  {course.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description || 'No description provided'}</p>
              
              <div className="bg-white/50 p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                <span className="section__title">Referral Link</span>
                <span className="text-xs text-blue-500 font-mono font-medium">...{course.refLink}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
