import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, CheckCircle, ArrowRight, FileText, ArrowLeft } from 'lucide-react';
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
      const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.data || []);
      const allGroups = Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data?.data || []);
      setCourses(coursesData);
      setUnassignedGroups(allGroups.filter((g: any) => !g.courseId));
    } catch (err: any) {
      console.error(err);
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

      WebApp.HapticFeedback?.notificationOccurred('success');
      setCreatedRefLink(`https://t.me/student1242bot?start=${courseData.refLink}`);
      setStep(3);
      fetchData(); // Refresh list in background
    } catch (err) {
      WebApp.HapticFeedback?.notificationOccurred('error');
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
    return (
      <div className="app-shell">
        <div className="loader-container">
          <div className="loader-spinner"/>
        </div>
      </div>
    );
  }

  if (isCreating) {
    if (step === 3) {
      return (
        <div className="page pb-20">
          <div className="empty-state card mt-6">
            <CheckCircle size={64} className="text-green-500 mb-2" />
            <h2 className="empty-state__title">Course Created!</h2>
            <p className="empty-state__desc">Share this referral link with your students to let them enroll.</p>
            <div className="p-3 bg-gray-100 rounded-xl break-all font-mono text-center my-4 w-full text-xs">
              {createdRefLink}
            </div>
            <button className="btn btn--primary btn--full mb-2" onClick={handleShare}>
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
        <div className="page pb-24">
          <div className="page-header mb-3">
            <button onClick={() => setStep(1)} className="btn--icon" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <h1 className="page-header__title gradient-text flex-1 ml-2">Course Details</h1>
          </div>
          
          <div className="card flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea 
                className="form-textarea"
                style={{ minHeight: '80px' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this course about?"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Course Plan (Optional)</label>
              <textarea 
                className="form-textarea"
                style={{ minHeight: '80px' }}
                value={plan}
                onChange={e => setPlan(e.target.value)}
                placeholder="List topics or schedule..."
              />
            </div>
            
            <div className="upload-box">
              <FileText size={24} className="text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">Upload Plan File</span>
            </div>
          </div>

          <div className="fixed bottom-4 left-4 right-4 z-50 flex gap-3 max-w-[568px] mx-auto">
            <button className="btn btn--secondary flex-1" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn--primary flex-1" onClick={handleCreate}>
              Finish
              <CheckCircle size={18} className="ml-2" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page pb-24">
        <div className="page-header mb-3">
          <button onClick={resetForm} className="btn--icon" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-header__title gradient-text flex-1 ml-2">Create Course</h1>
        </div>
        
        <div className="card flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input 
              required
              type="text" 
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Advanced Biology"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority / Type</label>
            <div className="flex gap-2">
              <button 
                type="button"
                className={`filter-tab flex-1 ${type === 'FREE' ? 'filter-tab--active' : ''}`}
                onClick={() => setType('FREE')}
              >
                FREE
              </button>
              <button 
                type="button"
                className={`filter-tab flex-1 ${type === 'PAID' ? 'filter-tab--active' : ''}`}
                onClick={() => setType('PAID')}
              >
                PAID
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link to Telegram Group</label>
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
          </div>
        </div>

        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-[568px] mx-auto">
          <button 
            className="btn btn--primary btn--full" 
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
    <div className="page pb-24">
      <div className="page-header mb-4">
        <h1 className="page-header__title gradient-text">Courses</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn--icon"
          aria-label="Create Course"
        >
          <Plus size={20} className="text-blue-500" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {courses.length === 0 ? (
          <div className="empty-state card">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <h2 className="empty-state__title">No courses yet</h2>
            <p className="empty-state__desc">Create your first course to get started.</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="card interactive-card">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{course.title}</h2>
                <span className={`badge ${course.type === 'FREE' ? 'badge--green' : 'badge--purple'}`}>
                  {course.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description || 'No description provided'}</p>
              
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Referral Code</span>
                <span className="text-xs text-blue-500 font-mono font-bold">...{course.refLink}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
