import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '@shared-ui/core';
import { Timer } from '../components/Timer';
import { MathKeyboard } from '../components/MathKeyboard';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

const loadTestDraft = (testId: string | undefined): any => {
  if (!testId) return {};
  try {
    const raw = localStorage.getItem(`test_draft_${testId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const TestTakingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const initialDraft = loadTestDraft(id);
  const [answers, setAnswers] = useState<Record<string, string>>(initialDraft.answers || {});
  const [subAnswers, setSubAnswers] = useState<Record<string, Record<string, string>>>(initialDraft.subAnswers || {});
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>(initialDraft.fileUrls || {});
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => {
    if (!id) return;
    try {
      localStorage.setItem(`test_draft_${id}`, JSON.stringify({ answers, subAnswers, fileUrls }));
    } catch {
      // Ignore localStorage issues
    }
  }, [id, answers, subAnswers, fileUrls]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await apiClient.get(`/variants/${id}`);
        if (data.tasks) {
          data.tasks.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        }
        setTest(data);
        if (data.durationMinutes) {
          setTimeLeft(data.durationMinutes * 60);
        } else if (data.duration) {
          setTimeLeft(data.duration);
        }
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
    WebApp.HapticFeedback?.selectionChanged();
    setAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleSubAnswerChange = (taskId: string, subQuestionId: string, answer: string) => {
    WebApp.HapticFeedback?.selectionChanged();
    setSubAnswers(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [subQuestionId]: answer },
    }));
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
        const url = data?.fileUrl || data?.url || data?.path || data?.key;
        if (url) uploaded.push(url);
      }
      setFileUrls(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), ...uploaded] }));
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      WebApp.showAlert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleRemoveFile = (taskId: string, url: string) => {
    setFileUrls(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(u => u !== url) }));
  };

  const handleSubmit = async () => {
    WebApp.HapticFeedback?.notificationOccurred('success');
    WebApp.showConfirm('Are you sure you want to finish the test?', async (confirm: boolean) => {
      if (confirm) {
        setSubmitting(true);
        try {
          const { data: submission } = await apiClient.post(`/variants/${id}/submissions`, {
            answers,
            fileUrls,
            subAnswers,
          });
          if (id) localStorage.removeItem(`test_draft_${id}`);
          navigate(`/results/${submission.id}`);
        } catch (error) {
          WebApp.HapticFeedback?.notificationOccurred('error');
          WebApp.showAlert('Failed to submit test. Try again.');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  if (loading) return <div className="app-shell"><Loader message="Preparing test..." /></div>;
  if (!test) return null;

  return (
    <div className="page pb-24">
      <div className="sticky top-0 z-50 py-3 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-md -mx-4 px-4 mb-4">
        <button onClick={() => navigate('/tests')} className="btn--icon" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg text-center flex-1 mx-2 truncate">
          {test.title}
        </div>
        <Timer initialSeconds={timeLeft} onExpire={handleTimerExpire} />
      </div>

      <div className="card mb-4">
        <p className="text-sm text-gray-500">
          Please read the test instructions carefully. Select or enter the answers for each task below.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {test.tasks?.map((task: any) => (
          <div key={task.id} className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-lg">Task {task.orderIndex}</span>
              <span className="badge badge--blue">
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

            {task.type === 'WRITTEN_WORK' && (task.subQuestions?.length || 0) > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                {task.subQuestions.map((sq: any, sqIndex: number) => (
                  <div key={sq.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs font-semibold mb-2 text-gray-500">
                      Question {sqIndex + 1}
                    </div>
                    <MathKeyboard
                      initialLatex={subAnswers[task.id]?.[sq.id] || ''}
                      onLatexChange={(val) => handleSubAnswerChange(task.id, sq.id, val)}
                    />
                  </div>
                ))}
              </div>
            )}

            {task.type === 'WRITTEN_WORK' && (task.subQuestions?.length || 0) === 0 && (
              <textarea
                className="form-textarea mt-1"
                placeholder="Type your detailed solution here..."
                value={answers[task.id] || ''}
                onChange={(e) => handleAnswerChange(task.id, e.target.value)}
              />
            )}

            {task.requiresAttachment && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-xs text-gray-500">
                  Attach photo of solution ({(fileUrls[task.id] || []).length}/{task.maxAttachments || 4})
                </div>
                {(fileUrls[task.id] || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(fileUrls[task.id] || []).map((url: string) => (
                      <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200 w-16 h-16 shadow-sm">
                        <img src={url} alt="attachment" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(task.id, url)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                {(fileUrls[task.id] || []).length < (task.maxAttachments || 4) && (
                  <label className="upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      disabled={uploadingTaskId === task.id}
                      onChange={(e) => handleFileUpload(task.id, e.target.files, task.maxAttachments || 4)}
                    />
                    <div className="flex items-center gap-2">
                      {uploadingTaskId === task.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-blue-500" />
                          <span className="text-sm font-semibold">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={18} className="text-blue-500" />
                          <span className="text-sm font-semibold">Attach Photo of Solution</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-[568px] mx-auto">
        <button
          className="btn btn--primary btn--full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 size={20} className="animate-spin mr-2" />
          ) : (
            <CheckCircle size={20} className="mr-2" />
          )}
          Finish Test
        </button>
      </div>
    </div>
  );
};
