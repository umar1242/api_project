import React, { useState, useEffect } from 'react';
import { Settings, FileText, CheckCircle, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { apiClient } from '../api/client';
import { MathKeyboard } from '../components/MathKeyboard';

const DRAFT_KEY = 'variant_builder_draft';

const loadDraft = (): any => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const VariantsPage: React.FC = () => {
  const initialDraft = loadDraft();

  const [title, setTitle] = useState(initialDraft.title || '');
  const [description, setDescription] = useState(initialDraft.description || '');
  const [fileUrl, setFileUrl] = useState(initialDraft.fileUrl || '');
  const [fileName, setFileName] = useState(initialDraft.fileName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [startsAt, setStartsAt] = useState(initialDraft.startsAt || '');
  const [deadline, setDeadline] = useState(initialDraft.deadline || '');
  
  // Tasks configuration
  const [type1Count4, setType1Count4] = useState(initialDraft.type1Count4 || 0);
  const [type1Count6, setType1Count6] = useState(initialDraft.type1Count6 || 0);
  const [type2Count, setType2Count] = useState(initialDraft.type2Count || 0);
  const [type3Count, setType3Count] = useState(initialDraft.type3Count || 0);

  const [step, setStep] = useState(initialDraft.step && initialDraft.step < 4 ? initialDraft.step : 1);
  const [tasks, setTasks] = useState<any[]>(initialDraft.tasks || []);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title, description, fileUrl, fileName, startsAt, deadline,
        type1Count4, type1Count6, type2Count, type3Count, step, tasks,
      }));
    } catch {
      // localStorage может быть недоступен или переполнен — пропускаем молча
    }
  }, [title, description, fileUrl, fileName, startsAt, deadline, type1Count4, type1Count6, type2Count, type3Count, step, tasks]);

  const handleGenerateTasks = () => {
    if (!title || !startsAt || !deadline) {
      WebApp.showAlert('Please fill in title and dates.');
      return;
    }
    const newTasks = [];
    let order = 1;
    for(let i=0; i<type1Count4; i++) {
      newTasks.push({ type: 'MULTIPLE_CHOICE', orderIndex: order++, optionsCount: 4, correctAnswer: '', requiresAttachment: false, requiresAdmin: false });
    }
    for(let i=0; i<type1Count6; i++) {
      newTasks.push({ type: 'MULTIPLE_CHOICE', orderIndex: order++, optionsCount: 6, correctAnswer: '', requiresAttachment: false, requiresAdmin: false, maxAttachments: 4 });
    }
    for(let i=0; i<type2Count; i++) {
      newTasks.push({ type: 'SPECIFIC_ANSWER', orderIndex: order++, correctAnswer: '', requiresAttachment: false, requiresAdmin: false, maxAttachments: 4 });
    }
    for(let i=0; i<type3Count; i++) {
      newTasks.push({ type: 'WRITTEN_WORK', orderIndex: order++, correctAnswer: '', requiresAttachment: true, requiresAdmin: true, maxAttachments: 4 });
    }
    setTasks(newTasks);
    setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFileUrl(data.fileUrl);
      setFileName(file.name);
      WebApp.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      WebApp.HapticFeedback.notificationOccurred('error');
      WebApp.showAlert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    const updated = [...tasks];
    updated[index][field] = value;
    
    // Auto sync logic for WRITTEN_WORK
    if (updated[index].type === 'WRITTEN_WORK' && field === 'requiresAdmin') {
      updated[index].requiresAttachment = value;
      if (value && !updated[index].maxAttachments) {
        updated[index].maxAttachments = 4;
      }
    }
    // When attachment requirement is turned on for other task types, default the limit
    if (field === 'requiresAttachment' && value && !updated[index].maxAttachments) {
      updated[index].maxAttachments = 4;
    }
    setTasks(updated);
  };

  const handleCheckData = () => {
    // Validate if answers are filled
    const missing = tasks.some(t => {
      if (t.type === 'WRITTEN_WORK' && t.requiresAdmin) return false;
      return !t.correctAnswer;
    });
    if (missing) {
      WebApp.showAlert('Please provide correct answers for auto-graded tasks.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    try {
      const { data } = await apiClient.post('/variants', {
        title,
        description,
        fileUrl: fileUrl || undefined,
        startsAt: startsAt || undefined,
        deadlineAt: deadline || undefined,
        type: 'CERTIFICATION',
        tasks: tasks.map(t => ({
          type: t.type,
          orderIndex: t.orderIndex,
          optionsCount: t.optionsCount,
          correctAnswer: t.correctAnswer,
          requiresAdmin: t.requiresAdmin,
          requiresAttachment: t.requiresAttachment,
          maxAttachments: t.requiresAttachment ? (t.maxAttachments || 4) : undefined
        }))
      });
      WebApp.HapticFeedback.notificationOccurred('success');
      localStorage.removeItem(DRAFT_KEY);
      const botUsername = import.meta.env.VITE_CERT_BOT_USERNAME || 'quiz1242bot';
      setShareLink(`https://t.me/${botUsername}?start=variant_${data.id}`);
      setStep(4);
    } catch (error) {
      WebApp.HapticFeedback.notificationOccurred('error');
      WebApp.showAlert('Failed to publish variant');
    }
  };

  const handleShare = () => {
    WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Join my new variant!')}`);
  };

  if (step === 4) {
    return (
      <div className="page">
        <div className="empty-state glass-form mt-10">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h2 className="empty-state__title">Variant Created!</h2>
          <p className="empty-state__desc">Your variant is ready. Share this link with students.</p>
          <div style={{ background: "var(--tg-secondary)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", wordBreak: "break-all", fontFamily: "monospace", border: "1px solid var(--tg-hint)", textAlign: "center", marginBottom: "var(--space-6)" }}>
            {shareLink}
          </div>
          <button className="btn btn--primary btn--full glass-btn" onClick={handleShare}>
            Share via Telegram
          </button>
          <button className="btn btn--secondary btn--full" onClick={() => { localStorage.removeItem(DRAFT_KEY); setStep(1); setTitle(''); setDescription(''); setFileUrl(''); setFileName(''); setStartsAt(''); setDeadline(''); setTasks([]); setType1Count4(0); setType1Count6(0); setType2Count(0); setType3Count(0); }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="page">
        <div className="page-header mb-4">
          <h1 className="page-header__title gradient-text">Check Data</h1>
          <FileText className="text-blue-500" />
        </div>
        <div className="card glass-form mb-4">
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">Starts: {new Date(startsAt).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mb-2">Deadline: {new Date(deadline).toLocaleString()}</p>
          <div className="mt-4 border-t border-gray-200 pt-3 flex gap-4">
             <div className="flex flex-col"><span className="info-row__label">Tasks</span><span className="font-bold">{tasks.length}</span></div>
             <div className="flex flex-col"><span className="info-row__label">Auto-graded</span><span className="font-bold">{tasks.filter(t => !t.requiresAdmin).length}</span></div>
          </div>
        </div>
        <button className="btn btn--primary btn--full glass-btn shadow-lg shadow-green-500/30 dynamic-glow" onClick={handleSubmit}>
          <CheckCircle size={20} className="mr-2" />
          Ready!
        </button>
        <button className="btn btn--full bg-white text-gray-800 border border-gray-200 shadow-sm mt-3" onClick={() => setStep(2)}>
          Back to Editing
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="page">
        <div className="page-header mb-4">
          <h1 className="page-header__title gradient-text">Enter Answers</h1>
        </div>

        <div className="tasks-container flex flex-col gap-4">
          {tasks.map((task, i) => (
            <div key={i} className="task-card card glass-form">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg text-gray-800">Task {task.orderIndex}</span>
                <span className="badge badge--blue text-xs uppercase tracking-wider font-semibold">
                  {task.type.replace('_', ' ')}
                </span>
              </div>
              
              <div className="task-card__body">
                {task.type === 'MULTIPLE_CHOICE' && (
                  <div style={{ marginBottom: "var(--space-4)" }}>
                    <div className="options-grid mb-3">
                      {Array.from({ length: task.optionsCount }).map((_, optIndex) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        return (
                          <button
                            key={letter}
                            className={`option-btn ${task.correctAnswer === letter ? 'option-btn--selected bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => handleTaskChange(i, 'correctAnswer', letter)}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {task.type === 'SPECIFIC_ANSWER' && (
                  <div className="input-group mb-3">
                    <label className="input-label">Correct Answer (Math/Text)</label>
                    <MathKeyboard
                      initialLatex={task.correctAnswer || ''}
                      onLatexChange={(val) => handleTaskChange(i, 'correctAnswer', val)}
                    />
                  </div>
                )}

                {task.type === 'WRITTEN_WORK' && (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg cursor-pointer border border-blue-100 transition-colors hover:bg-blue-100">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500 focus:ring-blue-500"
                        checked={task.requiresAdmin}
                        onChange={(e) => handleTaskChange(i, 'requiresAdmin', e.target.checked)}
                      />
                      <span className="text-sm font-semibold text-blue-900">Admin Grading + Photo Upload Mode</span>
                    </label>

                    {task.requiresAttachment && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mt-3 border border-gray-100">
                        <span className="text-xs text-gray-600 font-medium">Photo limit (1-4)</span>
                        <div className="flex items-center gap-2">
                          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => handleTaskChange(i, 'maxAttachments', Math.max(1, (task.maxAttachments || 4) - 1))}>-</button>
                          <span className="font-bold text-sm w-4 text-center">{task.maxAttachments || 4}</span>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => handleTaskChange(i, 'maxAttachments', Math.min(4, (task.maxAttachments || 4) + 1))}>+</button>
                        </div>
                      </div>
                    )}
                    
                    {!task.requiresAdmin && (
                      <div className="input-group mt-3">
                        <label className="input-label">Specific Answer</label>
                        <MathKeyboard
                          initialLatex={task.correctAnswer || ''}
                          onLatexChange={(val) => handleTaskChange(i, 'correctAnswer', val)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(task.type === 'SPECIFIC_ANSWER' || (task.type === 'MULTIPLE_CHOICE' && task.optionsCount === 6)) && (
                  <div className="mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500 focus:ring-blue-500"
                        checked={task.requiresAttachment}
                        onChange={(e) => handleTaskChange(i, 'requiresAttachment', e.target.checked)}
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        {task.type === 'MULTIPLE_CHOICE'
                          ? 'Require student to attach handwritten solution photo'
                          : 'Require student to attach photo of solution'}
                      </span>
                    </label>

                    {task.requiresAttachment && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mt-2 border border-gray-100">
                        <span className="text-xs text-gray-600 font-medium">Photo limit (1-4)</span>
                        <div className="flex items-center gap-2">
                          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => handleTaskChange(i, 'maxAttachments', Math.max(1, (task.maxAttachments || 4) - 1))}>-</button>
                          <span className="font-bold text-sm w-4 text-center">{task.maxAttachments || 4}</span>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => handleTaskChange(i, 'maxAttachments', Math.min(4, (task.maxAttachments || 4) + 1))}>+</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-20 left-4 right-4 z-50">
           <button className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30 dynamic-glow" onClick={handleCheckData}>
             Check Data
             <ArrowRight size={18} className="ml-2" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header mb-4">
        <h1 className="page-header__title gradient-text">Create Variant</h1>
        <Settings className="text-blue-500" />
      </div>

      <div className="card glass-form mb-5">
        <div className="section">
          <div>
            <label className="input-label">Title</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Final Test 2026" />
          </div>

          <div>
            <label className="input-label">Description (Optional)</label>
            <textarea className="form-textarea min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any special instructions..." />
          </div>

          <div className="stats-grid">
            <div>
              <label className="input-label">Starts At</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="datetime-local" className="form-input pl-8 text-sm" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="input-label">Deadline</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="datetime-local" className="form-input pl-8 text-sm" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
          </div>
          
          <label className="upload-box" style={{ cursor: isUploading ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <Loader2 size={24} className="text-blue-500 mb-2 animate-spin" />
                <span className="text-sm font-semibold text-blue-700">Uploading...</span>
              </>
            ) : fileUrl ? (
              <>
                <CheckCircle size={24} className="text-green-500 mb-2" />
                <span className="text-sm font-semibold text-green-700">{fileName}</span>
                <span className="text-xs text-gray-500 mt-1">Tap to replace</span>
              </>
            ) : (
              <>
                <FileText size={24} className="text-blue-500 mb-2" />
                <span className="text-sm font-semibold text-blue-700">Upload Task File (PDF/Word/Images)</span>
              </>
            )}
          </label>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Task Configuration</h2>
      
      <div className="card glass-form !p-4 mb-3">
        <span className="text-sm font-bold text-gray-800 block mb-3">Type 1 (Multiple Choice)</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-gray-500 block mb-2">4 Options (A-D)</span>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count4(Math.max(0, type1Count4 - 1))}>-</button>
              <span className="font-bold text-lg">{type1Count4}</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count4(type1Count4 + 1)}>+</button>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-2">6 Options (A-F)</span>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count6(Math.max(0, type1Count6 - 1))}>-</button>
              <span className="font-bold text-lg">{type1Count6}</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count6(type1Count6 + 1)}>+</button>
            </div>
          </div>
        </div>
        {type1Count6 > 0 && (
          <p className="text-xs text-gray-400 mt-3">6-option questions are always placed after 4-option questions within Type 1.</p>
        )}
      </div>

      <div className="card glass-form !p-4 mb-3">
        <span className="text-sm font-bold text-gray-800 block mb-3">Type 2 (Math/Text)</span>
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100 max-w-[50%] mx-auto">
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType2Count(Math.max(0, type2Count - 1))}>-</button>
          <span className="font-bold text-lg">{type2Count}</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType2Count(type2Count + 1)}>+</button>
        </div>
      </div>

      <div className="card glass-form !p-4 mb-4">
        <span className="text-sm font-bold text-gray-800 block mb-3">Type 3 (Written/Photo)</span>
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100 max-w-[50%] mx-auto">
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType3Count(Math.max(0, type3Count - 1))}>-</button>
          <span className="font-bold text-lg">{type3Count}</span>
          <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType3Count(type3Count + 1)}>+</button>
        </div>
      </div>

      <div className="fixed bottom-20 left-4 right-4 z-50">
         <button className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30 dynamic-glow" onClick={handleGenerateTasks}>
           Enter Answers
           <ArrowRight size={18} className="ml-2" />
         </button>
      </div>
    </div>
  );
};
