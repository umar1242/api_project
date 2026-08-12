import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '@shared-ui/core';
import { Timer } from '../components/Timer';
import { MathKeyboard } from '../components/MathKeyboard';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export const TestTakingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({});
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [timeLeft] = useState(3600); // 1 hour demo timer

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await apiClient.get(`/variants/${id}`);
        if (data.tasks) {
          data.tasks.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        }
        setTest(data);
      } catch (err) {
        WebApp.showAlert('Test not found');
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, navigate]);

  const handleTimerExpire = () => {
    WebApp.showAlert("Time's up! Submitting your current answers.");
    handleSubmit();
  };

  const handleAnswerChange = (taskId: string, answer: string) => {
    WebApp.HapticFeedback.selectionChanged();
    setAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleFileUpload = async (taskId: string, files: FileList | null, limit: number) => {
    if (!files || files.length === 0) return;
    const current = fileUrls[taskId] || [];
    const remainingSlots = limit - current.length;
    if (remainingSlots <= 0) {
      WebApp.showAlert(`You can attach up to ${limit} photo(s) for this task.`);
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploadingTaskId(taskId);
    try {
      const uploaded: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(data.fileUrl);
      }
      setFileUrls(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), ...uploaded] }));
      WebApp.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      WebApp.HapticFeedback.notificationOccurred('error');
      WebApp.showAlert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleRemoveFile = (taskId: string, url: string) => {
    setFileUrls(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(u => u !== url) }));
  };

  const handleSubmit = async () => {
    WebApp.HapticFeedback.notificationOccurred('success');
    WebApp.showConfirm('Are you sure you want to finish the test?', async (confirm: boolean) => {
      if(confirm) {
        try {
          const userId = WebApp.initDataUnsafe?.user?.id?.toString() || '12345'; // mock user for demo
          await apiClient.post(`/variants/${id}/submissions`, {
            userId,
            answers,
            fileUrls,
          });
          WebApp.showAlert('Test submitted successfully! Waiting for results...');
          navigate('/tests');
        } catch (error) {
          WebApp.HapticFeedback.notificationOccurred('error');
          WebApp.showAlert('Failed to submit test. Try again.');
        }
      }
    });
  };

  if (loading) return <div className="app-shell"><Loader message="Preparing test..." /></div>;
  if (!test) return null;

  return (
    <div className="page" style={{ paddingBottom: '96px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '16px' }}>
        <button onClick={() => navigate('/tests')} style={{ color: 'var(--tg-hint)' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center', flex: 1, margin: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {test.title}
        </div>
        <Timer initialSeconds={timeLeft} onExpire={handleTimerExpire} />
      </div>

      <div className="glass-form" style={{ padding: '12px', borderRadius: 'var(--radius-lg)', fontSize: '14px', color: 'var(--tg-hint)', marginBottom: '24px' }}>
        Please read the PDF instructions attached by the teacher. 
        Select or enter the answers for each task below.
      </div>

      <div className="section" style={{ gap: '20px' }}>
        {test.tasks?.map((task: any) => (
          <div key={task.id} className="card glass-form">
            <div className="task-card__header">
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--tg-text)' }}>Task {task.orderIndex}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', color: 'var(--tg-hint)' }}>
                {task.type.replace('_', ' ')}
              </span>
            </div>

            {task.type === 'MULTIPLE_CHOICE' && (
              <div className="options-grid">
                {Array.from({ length: task.optionsCount || 4 }).map((_, optIndex) => {
                  const letter = String.fromCharCode(65 + optIndex);
                  const isSelected = answers[task.id] === letter;
                  return (
                    <button
                      key={letter}
                      className={`option-btn ${isSelected ? 'option-btn--selected' : ''}`}
                      onClick={() => handleAnswerChange(task.id, letter)}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}

            {task.type === 'SPECIFIC_ANSWER' && (
              <MathKeyboard 
                initialLatex={answers[task.id] || ''} 
                onLatexChange={(val) => handleAnswerChange(task.id, val)}
              />
            )}

            {task.type === 'WRITTEN_WORK' && (
              <textarea
                className="form-textarea"
                style={{ marginTop: '4px', fontSize: '14px' }}
                placeholder="Type your detailed solution here..."
                value={answers[task.id] || ''}
                onChange={(e) => handleAnswerChange(task.id, e.target.value)}
              />
            )}

            {task.requiresAttachment && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--tg-hint)' }}>
                  Attach photo of solution ({(fileUrls[task.id] || []).length}/{task.maxAttachments || 4})
                </div>
                {(fileUrls[task.id] || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(fileUrls[task.id] || []).map((url: string) => (
                      <div key={url} style={{ position: 'relative' }}>
                        <img src={url} alt="attachment" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }} />
                        <button
                          onClick={() => handleRemoveFile(task.id, url)}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '12px', lineHeight: '20px', border: 'none', padding: 0 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                {(fileUrls[task.id] || []).length < (task.maxAttachments || 4) && (
                  <label className="upload-box" style={{ padding: '12px', flexDirection: 'row', justifyContent: 'center', cursor: uploadingTaskId === task.id ? 'default' : 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      disabled={uploadingTaskId === task.id}
                      onChange={(e) => handleFileUpload(task.id, e.target.files, task.maxAttachments || 4)}
                    />
                    <ImageIcon size={18} />
                    <span style={{ fontSize: '14px' }}>{uploadingTaskId === task.id ? 'Uploading...' : 'Attach Photo of Solution'}</span>
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: '16px', left: '16px', right: '16px', zIndex: 50 }}>
        <button className="btn btn--full glass-btn" style={{ boxShadow: '0 8px 24px rgba(36, 129, 204, 0.4)' }} onClick={handleSubmit}>
          <CheckCircle size={20} style={{ marginRight: '8px' }} />
          Finish Test
        </button>
      </div>
    </div>
  );
};
