import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Calendar, Clock, Video, Film, Edit, Trash2, ExternalLink, X, Check } from 'lucide-react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { apiClient } from '../api/client';
import type { Lesson, LessonType, LessonStatus } from '../types';

interface GroupInfo {
  id: string;
  title: string;
  telegramChatId: string;
  course?: {
    id: string;
    title: string;
  };
}

export const GroupLessonsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LessonType>('ONLINE');
  const [status, setStatus] = useState<LessonStatus>('SCHEDULED');
  const [startsAt, setStartsAt] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const fetchData = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);

      const [groupsRes, lessonsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get(`/lessons/group/${groupId}`),
      ]);

      const allGroups: GroupInfo[] = Array.isArray(groupsRes.data)
        ? groupsRes.data
        : (groupsRes.data?.data || []);
      const currentGroup = allGroups.find(g => g.id === groupId) || null;
      setGroup(currentGroup);

      const lessonsData: Lesson[] = Array.isArray(lessonsRes.data)
        ? lessonsRes.data
        : (lessonsRes.data?.data || []);
      setLessons(lessonsData);
    } catch (err: any) {
      console.error('Failed to fetch lessons:', err);
      setError(err.response?.data?.message || 'Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const openCreateModal = () => {
    setEditingLessonId(null);
    setTitle('');
    setDescription('');
    setType('ONLINE');
    setStatus('SCHEDULED');
    // Default startsAt to tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    // Format to YYYY-MM-DDTHH:mm in local time
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setStartsAt(localISOTime);
    setDurationMin(60);
    setMeetingUrl('');
    setIsModalOpen(true);
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.description || '');
    setType(lesson.type);
    setStatus(lesson.status);

    const lessonDate = new Date(lesson.startsAt);
    const tzOffset = lessonDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(lessonDate.getTime() - tzOffset).toISOString().slice(0, 16);
    setStartsAt(localISOTime);

    setDurationMin(lesson.durationMin || 60);
    setMeetingUrl(lesson.meetingUrl || '');
    setIsModalOpen(true);
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLessonId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    if (!title.trim()) return alert('Please enter lesson title');
    if (!startsAt) return alert('Please select date and time');

    if (!WebApp.initData) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert('Сессия Telegram истекла или приложение открыто вне Telegram. Пожалуйста, откройте мини-апп через кнопку бота в Telegram.');
      return;
    }

    try {
      setSaving(true);
      WebApp.HapticFeedback?.impactOccurred('medium');

      const payload = {
        groupId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startsAt: new Date(startsAt).toISOString(),
        durationMin: Number(durationMin),
        meetingUrl: meetingUrl.trim() || undefined,
      };

      if (editingLessonId) {
        const updatePayload = {
          ...payload,
          status,
        };
        const res = await apiClient.put(`/lessons/${editingLessonId}`, updatePayload);
        setLessons(prev => prev.map(l => (l.id === editingLessonId ? res.data : l)));
      } else {
        const res = await apiClient.post('/lessons', payload);
        setLessons(prev => [...prev, res.data]);
      }

      WebApp.HapticFeedback?.notificationOccurred('success');
      closeModal();
    } catch (err: any) {
      console.error('Failed to save lesson:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      if (err.response?.status === 401) {
        alert('Сессия Telegram истекла (прошло более 1 часа). Пожалуйста, закройте и снова откройте мини-апп через бота.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to save lesson';
        alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      setDeletingId(lessonId);
      WebApp.HapticFeedback?.impactOccurred('medium');

      await apiClient.delete(`/lessons/${lessonId}`);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error('Failed to delete lesson:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (st: LessonStatus) => {
    switch (st) {
      case 'SCHEDULED':
        return <span className="badge badge--blue">Scheduled</span>;
      case 'LIVE':
        return <span className="badge badge--green">Live Now</span>;
      case 'COMPLETED':
        return <span className="badge badge--purple">Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge--red">Cancelled</span>;
      default:
        return <span className="badge badge--gray">{st}</span>;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading lessons...</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Back to groups"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="stat-card__value" style={{ fontSize: '20px' }}>
              Lessons
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {group?.title || `Group #${groupId}`}
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn--primary flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-xl shadow-sm"
        >
          <Plus size={16} />
          <span>New Lesson</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold mb-4">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="card mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-blue-500" />
          <span className="text-sm font-semibold">
            Total Lessons: <strong>{lessons.length}</strong>
          </span>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.length === 0 ? (
          <div className="text-center py-10 card empty-state">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">No lessons created for this group yet</p>
            <button
              onClick={openCreateModal}
              className="btn btn--primary py-1.5 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create First Lesson</span>
            </button>
          </div>
        ) : (
          lessons.map(lesson => {
            const startDate = new Date(lesson.startsAt);
            const isDeleting = deletingId === lesson.id;

            return (
              <div key={lesson.id} className="card flex flex-col space-y-3">
                {/* Title & Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 leading-snug">
                      {lesson.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(lesson.status)}
                      <span className="badge badge--gray flex items-center gap-1">
                        {lesson.type === 'ONLINE' ? <Video size={12} /> : <Film size={12} />}
                        <span>{lesson.type}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {lesson.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {lesson.description}
                  </p>
                )}

                {/* Date, Time & Meeting Details */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-1.5 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="font-medium">
                        {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock size={14} />
                      <span>
                        {startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({lesson.durationMin} min)
                      </span>
                    </div>
                  </div>

                  {lesson.meetingUrl && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-500">Link:</span>
                      <a
                        href={lesson.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold flex items-center gap-1 hover:underline truncate max-w-[200px]"
                      >
                        <span className="truncate">{lesson.meetingUrl}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="btn btn--secondary py-1 px-3 text-xs flex items-center gap-1 rounded-lg"
                  >
                    <Edit size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete lesson"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal via Portal */}
      {isModalOpen && createPortal(
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal-dialog">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">
                {editingLessonId ? 'Edit Lesson' : 'Create New Lesson'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="modal-body">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  className="form-input text-xs"
                  placeholder="e.g. Introduction to Physics"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Topic outline
                </label>
                <textarea
                  rows={2}
                  className="form-input text-xs"
                  placeholder="Short lesson summary..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lesson Type
                  </label>
                  <select
                    className="form-select text-xs"
                    value={type}
                    onChange={e => setType(e.target.value as LessonType)}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="RECORDED">RECORDED</option>
                  </select>
                </div>

                {editingLessonId ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="form-select text-xs"
                      value={status}
                      onChange={e => setStatus(e.target.value as LessonStatus)}
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="LIVE">LIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      className="form-input text-xs"
                      value={durationMin}
                      onChange={e => setDurationMin(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input text-xs"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                  />
                </div>
              </div>

              {editingLessonId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    className="form-input text-xs"
                    value={durationMin}
                    onChange={e => setDurationMin(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Meeting URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Meeting / Video URL
                </label>
                <input
                  type="url"
                  className="form-input text-xs"
                  placeholder="https://zoom.us/... or https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>

              {/* Form Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn btn--secondary py-2 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn btn--primary py-2 text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving...' : editingLessonId ? 'Save Changes' : 'Create Lesson'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
