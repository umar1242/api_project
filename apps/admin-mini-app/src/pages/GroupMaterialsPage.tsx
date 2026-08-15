import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Upload, Trash2, Edit, ExternalLink, X, Check, Send, Paperclip } from 'lucide-react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { apiClient } from '../api/client';
import type { Material, Lesson } from '../types';

interface GroupInfo {
  id: string;
  title: string;
  telegramChatId: string;
  course?: {
    id: string;
    title: string;
  };
}

export const GroupMaterialsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lessonId, setLessonId] = useState<string>('');
  const [fileUrl, setFileUrl] = useState('');
  const [telegramFileId, setTelegramFileId] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'PUBLISHED'>('PUBLISHED');
  const [publishAt, setPublishAt] = useState('');

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

      const [groupsRes, materialsRes, lessonsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get(`/materials/group/${groupId}`),
        apiClient.get(`/lessons/group/${groupId}`),
      ]);

      const allGroups: GroupInfo[] = Array.isArray(groupsRes.data)
        ? groupsRes.data
        : (groupsRes.data?.data || []);
      const currentGroup = allGroups.find(g => g.id === groupId) || null;
      setGroup(currentGroup);

      const materialsData: Material[] = Array.isArray(materialsRes.data)
        ? materialsRes.data
        : (materialsRes.data?.data || []);
      setMaterials(materialsData);

      const lessonsData: Lesson[] = Array.isArray(lessonsRes.data)
        ? lessonsRes.data
        : (lessonsRes.data?.data || []);
      setLessons(lessonsData);
    } catch (err: any) {
      console.error('Failed to fetch materials:', err);
      setError(err.response?.data?.message || 'Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const openCreateModal = () => {
    setEditingMaterialId(null);
    setTitle('');
    setDescription('');
    setLessonId('');
    setFileUrl('');
    setTelegramFileId('');
    setStatus('PUBLISHED');
    setPublishAt('');
    setIsModalOpen(true);
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterialId(mat.id);
    setTitle(mat.title);
    setDescription(mat.description || '');
    setLessonId(mat.lessonId || '');
    setFileUrl(mat.fileUrl || '');
    setTelegramFileId(mat.telegramFileId || '');
    setStatus(mat.status);

    if (mat.publishAt) {
      const pDate = new Date(mat.publishAt);
      const tzOffset = pDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(pDate.getTime() - tzOffset).toISOString().slice(0, 16);
      setPublishAt(localISOTime);
    } else {
      setPublishAt('');
    }

    setIsModalOpen(true);
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMaterialId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      WebApp.HapticFeedback?.impactOccurred('light');

      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.fileUrl) {
        setFileUrl(res.data.fileUrl);
        if (!title) {
          // Default title from file name without extension
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        WebApp.HapticFeedback?.notificationOccurred('success');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    if (!title.trim()) return alert('Please enter material title');

    if (!WebApp.initData) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert('Сессия Telegram истекла или приложение открыто вне Telegram. Пожалуйста, откройте мини-апп через кнопку бота в Telegram.');
      return;
    }

    try {
      setSaving(true);
      WebApp.HapticFeedback?.impactOccurred('medium');

      const payload = {
        groupId: Number(groupId),
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId: lessonId ? Number(lessonId) : undefined,
        fileUrl: fileUrl.trim() || undefined,
        telegramFileId: telegramFileId.trim() || undefined,
        status,
        publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      };

      if (editingMaterialId) {
        const res = await apiClient.put(`/materials/${editingMaterialId}`, payload);
        setMaterials(prev => prev.map(m => (m.id === editingMaterialId ? res.data : m)));
      } else {
        const res = await apiClient.post('/materials', payload);
        setMaterials(prev => [res.data, ...prev]);
      }

      WebApp.HapticFeedback?.notificationOccurred('success');
      closeModal();
    } catch (err: any) {
      console.error('Failed to save material:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      if (err.response?.status === 401) {
        alert('Сессия Telegram истекла (прошло более 1 часа). Пожалуйста, закройте и снова откройте мини-апп через бота.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to save material';
        alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async (materialId: string) => {
    try {
      setPublishingId(materialId);
      WebApp.HapticFeedback?.impactOccurred('light');

      const res = await apiClient.put(`/materials/${materialId}/publish`);
      setMaterials(prev => prev.map(m => (m.id === materialId ? res.data : m)));
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error('Failed to publish material:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'Failed to publish material');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      setDeletingId(materialId);
      WebApp.HapticFeedback?.impactOccurred('medium');

      await apiClient.delete(`/materials/${materialId}`);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error('Failed to delete material:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'Failed to delete material');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (mat: Material) => {
    if (mat.status === 'PUBLISHED') {
      return <span className="badge badge--green">Published</span>;
    }
    if (mat.publishAt && new Date(mat.publishAt) > new Date()) {
      return (
        <span className="badge badge--blue">
          Scheduled ({new Date(mat.publishAt).toLocaleDateString()})
        </span>
      );
    }
    return <span className="badge badge--yellow">Pending</span>;
  };

  if (loading) {
    return <div className="p-4 text-center">Loading materials...</div>;
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
              Materials
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
          <span>New Material</span>
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
          <FileText size={18} className="text-blue-500" />
          <span className="text-sm font-semibold">
            Total Materials: <strong>{materials.length}</strong>
          </span>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-10 card empty-state">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">No materials added for this group yet</p>
            <button
              onClick={openCreateModal}
              className="btn btn--primary py-1.5 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add First Material</span>
            </button>
          </div>
        ) : (
          materials.map(mat => {
            const isDeleting = deletingId === mat.id;
            const isPublishing = publishingId === mat.id;

            return (
              <div key={mat.id} className="card flex flex-col space-y-3">
                {/* Title & Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 leading-snug">
                      {mat.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(mat)}
                      {mat.lesson && (
                        <span className="badge badge--purple">
                          Lesson: {mat.lesson.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {mat.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {mat.description}
                  </p>
                )}

                {/* File & Details */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-1.5 text-xs text-gray-700">
                  {mat.fileUrl && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Paperclip size={14} className="text-blue-500" />
                        <span>Attachment</span>
                      </div>
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold flex items-center gap-1 hover:underline truncate max-w-[220px]"
                      >
                        <span className="truncate">{mat.fileUrl}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </div>
                  )}

                  {mat.telegramFileId && (
                    <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-200">
                      <span>Telegram File ID:</span>
                      <span className="font-mono text-[11px] truncate max-w-[200px]">
                        {mat.telegramFileId}
                      </span>
                    </div>
                  )}

                  {mat.publishAt && (
                    <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-200">
                      <span>Publish At:</span>
                      <span>{new Date(mat.publishAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                  <div>
                    {mat.status === 'PENDING' && (
                      <button
                        onClick={() => handlePublishNow(mat.id)}
                        disabled={isPublishing}
                        className="btn btn--primary py-1 px-2.5 text-xs flex items-center gap-1 rounded-lg"
                      >
                        <Send size={12} />
                        <span>{isPublishing ? '...' : 'Publish Now'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(mat)}
                      className="btn btn--secondary py-1 px-3 text-xs flex items-center gap-1 rounded-lg"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete material"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
                {editingMaterialId ? 'Edit Material' : 'Create New Material'}
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
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  className="form-input text-xs"
                  placeholder="e.g. Physics Formula Sheet #1"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  className="form-input text-xs"
                  placeholder="Optional details or instructions for students..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Attach to Lesson */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attached to Lesson (Optional)
                </label>
                <select
                  className="form-select text-xs"
                  value={lessonId}
                  onChange={e => setLessonId(e.target.value)}
                >
                  <option value="">-- No specific lesson (Group Material) --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({new Date(l.startsAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  File / Attachment
                </label>
                <div className="upload-box p-4 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl text-center cursor-pointer transition-colors bg-gray-50/50">
                  <label className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-500 mb-1.5" />
                    <span className="text-xs font-semibold text-gray-700">
                      {uploading ? 'Uploading to MinIO...' : 'Click to choose file or drop here'}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      PDF, Images, Documents, Zip
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* File URL (direct link or auto-filled) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  File URL
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="https://... or auto-filled from upload"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                />
              </div>

              {/* Status & Publish At */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="form-select text-xs"
                    value={status}
                    onChange={e => setStatus(e.target.value as 'PENDING' | 'PUBLISHED')}
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Scheduled Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input text-xs"
                    value={publishAt}
                    onChange={e => setPublishAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Telegram File ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Telegram File ID (Optional)
                </label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="Telegram document file_id for bot auto-forwarding"
                  value={telegramFileId}
                  onChange={e => setTelegramFileId(e.target.value)}
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
                  disabled={saving || uploading}
                  className="flex-1 btn btn--primary py-2 text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving...' : editingMaterialId ? 'Save Changes' : 'Create Material'}</span>
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
