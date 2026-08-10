import React, { useState } from 'react';
import { Settings, FileText, CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { apiClient } from '../api/client';

export const VariantsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Tasks configuration
  const [type1Count, setType1Count] = useState(0);
  const [type1OptionCount, setType1OptionCount] = useState(4);
  const [type2Count, setType2Count] = useState(0);
  const [type3Count, setType3Count] = useState(0);

  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState<any[]>([]);
  const [shareLink, setShareLink] = useState('');

  const handleGenerateTasks = () => {
    if (!title || !startsAt || !deadline) {
      WebApp.showAlert('Please fill in title and dates.');
      return;
    }
    const newTasks = [];
    let order = 1;
    for(let i=0; i<type1Count; i++) {
      newTasks.push({ type: 'MULTIPLE_CHOICE', orderIndex: order++, optionsCount: type1OptionCount, correctAnswer: '', requiresAttachment: false, requiresAdmin: false });
    }
    for(let i=0; i<type2Count; i++) {
      newTasks.push({ type: 'SPECIFIC_ANSWER', orderIndex: order++, correctAnswer: '', requiresAttachment: false, requiresAdmin: false });
    }
    for(let i=0; i<type3Count; i++) {
      newTasks.push({ type: 'WRITTEN_WORK', orderIndex: order++, correctAnswer: '', requiresAttachment: true, requiresAdmin: true });
    }
    setTasks(newTasks);
    setStep(2);
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    const updated = [...tasks];
    updated[index][field] = value;
    
    // Auto sync logic for WRITTEN_WORK
    if (updated[index].type === 'WRITTEN_WORK' && field === 'requiresAdmin') {
      updated[index].requiresAttachment = value; 
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
        startsAt: startsAt || undefined,
        deadlineAt: deadline || undefined,
        type: 'CERTIFICATION',
        tasks: tasks.map(t => ({
          type: t.type,
          orderIndex: t.orderIndex,
          optionsCount: t.optionsCount,
          correctAnswer: t.correctAnswer,
          requiresAdmin: t.requiresAdmin,
          requiresAttachment: t.requiresAttachment
        }))
      });
      WebApp.HapticFeedback.notificationOccurred('success');
      setShareLink(`https://t.me/cert_bot?start=variant_${data.id}`);
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
      <div className="page pb-40">
        <div className="empty-state glass-form mt-10">
          <CheckCircle size={64} className="text-green-500 mb-4" />
          <h2 className="empty-state__title text-2xl font-bold mb-2">Variant Created!</h2>
          <p className="text-center text-gray-600 mb-6">Your variant is ready. Share this link with students.</p>
          <div className="bg-gray-100 p-3 rounded-xl mb-6 break-all text-sm font-mono text-gray-800 border border-gray-200 w-full text-center">
            {shareLink}
          </div>
          <button className="btn btn--primary btn--full glass-btn shadow-lg shadow-blue-500/30" onClick={handleShare}>
            Share via Telegram
          </button>
          <button className="btn btn--full bg-gray-200 text-gray-800 mt-3" onClick={() => { setStep(1); setTitle(''); setTasks([]); setType1Count(0); setType2Count(0); setType3Count(0); }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="page pb-40">
        <div className="page-header mb-4">
          <h1 className="page-header__title gradient-text">Check Data</h1>
          <FileText className="text-blue-500" />
        </div>
        <div className="card glass-form mb-4">
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">Starts: {new Date(startsAt).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mb-2">Deadline: {new Date(deadline).toLocaleString()}</p>
          <div className="mt-4 border-t border-gray-200 pt-3 flex gap-4">
             <div className="flex flex-col"><span className="text-xs text-gray-500">Tasks</span><span className="font-bold">{tasks.length}</span></div>
             <div className="flex flex-col"><span className="text-xs text-gray-500">Auto-graded</span><span className="font-bold">{tasks.filter(t => !t.requiresAdmin).length}</span></div>
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
      <div className="page pb-40">
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
                  <div className="mb-4">
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
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Correct Answer (Math/Text)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={task.correctAnswer} 
                      onChange={(e) => handleTaskChange(i, 'correctAnswer', e.target.value)} 
                      placeholder="e.g. 42 or x=5"
                    />
                  </div>
                )}

                {task.type === 'WRITTEN_WORK' && (
                  <div className="mb-3">
                    <label className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg cursor-pointer border border-blue-100 transition-colors hover:bg-blue-100">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-500 focus:ring-blue-500"
                        checked={task.requiresAdmin}
                        onChange={(e) => handleTaskChange(i, 'requiresAdmin', e.target.checked)}
                      />
                      <span className="text-sm font-semibold text-blue-900">Admin Grading + Photo Upload Mode</span>
                    </label>
                    
                    {!task.requiresAdmin && (
                      <div className="input-group mt-3">
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Specific Answer</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={task.correctAnswer} 
                          onChange={(e) => handleTaskChange(i, 'correctAnswer', e.target.value)} 
                          placeholder="Answer for auto-check..."
                        />
                      </div>
                    )}
                  </div>
                )}

                {(task.type === 'MULTIPLE_CHOICE' || task.type === 'SPECIFIC_ANSWER') && (
                  <label className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-500 focus:ring-blue-500"
                      checked={task.requiresAttachment}
                      onChange={(e) => handleTaskChange(i, 'requiresAttachment', e.target.checked)}
                    />
                    <span className="text-xs text-gray-600 font-medium">Require student to attach photo of solution</span>
                  </label>
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
    <div className="page pb-40">
      <div className="page-header mb-4">
        <h1 className="page-header__title gradient-text">Create Variant</h1>
        <Settings className="text-blue-500" />
      </div>

      <div className="card glass-form mb-5">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Title</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Final Test 2026" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (Optional)</label>
            <textarea className="form-textarea min-h-[60px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any special instructions..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Starts At</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="datetime-local" className="form-input pl-8 text-sm" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Deadline</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="datetime-local" className="form-input pl-8 text-sm" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
          </div>
          
          <div className="upload-box mt-2 py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
            <FileText size={24} className="text-blue-500 mb-2" />
            <span className="text-sm font-semibold text-blue-700">Upload Task File (PDF/Word/Images)</span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">Task Configuration</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card glass-form !p-4">
          <span className="text-sm font-bold text-gray-800 block mb-3">Type 1 (A-D/F)</span>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count(Math.max(0, type1Count - 1))}>-</button>
            <span className="font-bold text-lg">{type1Count}</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType1Count(type1Count + 1)}>+</button>
          </div>
          {type1Count > 0 && (
             <select className="form-select mt-3 w-full text-xs" value={type1OptionCount} onChange={e => setType1OptionCount(Number(e.target.value))}>
                <option value={4}>4 Options (A-D)</option>
                <option value={6}>6 Options (A-F)</option>
             </select>
          )}
        </div>

        <div className="card glass-form !p-4">
          <span className="text-sm font-bold text-gray-800 block mb-3">Type 2 (Math/Text)</span>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType2Count(Math.max(0, type2Count - 1))}>-</button>
            <span className="font-bold text-lg">{type2Count}</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-200 active:scale-95" onClick={() => setType2Count(type2Count + 1)}>+</button>
          </div>
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
