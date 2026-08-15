import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export default function HomeworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string[]>>({});
  const [uploadingTasks, setUploadingTasks] = useState<Record<string, boolean>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await apiClient.get(`/variants/${id}`);
        if (data.tasks) {
          data.tasks.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        }
        setTest(data);
      } catch (err) {
        WebApp.showAlert('Homework not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, navigate]);

  const handleAnswerChange = (taskId: string, answer: string) => {
    WebApp.HapticFeedback?.selectionChanged();
    setAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleFileUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check limit
    const currentFiles = fileUrls[taskId] || [];
    if (currentFiles.length >= 4) {
      WebApp.showAlert('Maximum 4 attachments allowed per task.');
      return;
    }

    setUploadingTasks(prev => ({ ...prev, [taskId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = data?.url || data?.path || data?.key;
      if (uploadedUrl) {
        setFileUrls(prev => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), uploadedUrl],
        }));
        WebApp.HapticFeedback?.notificationOccurred('success');
      }
    } catch (error) {
      console.error('File upload failed', error);
      WebApp.HapticFeedback?.notificationOccurred('error');
      WebApp.showAlert('Failed to upload file. Please try again.');
    } finally {
      setUploadingTasks(prev => ({ ...prev, [taskId]: false }));
      if (fileInputRefs.current[taskId]) {
        fileInputRefs.current[taskId]!.value = '';
      }
    }
  };

  const handleRemoveFile = (taskId: string, fileIndex: number) => {
    setFileUrls(prev => ({
      ...prev,
      [taskId]: prev[taskId].filter((_, idx) => idx !== fileIndex),
    }));
    WebApp.HapticFeedback?.selectionChanged();
  };

  const handleSubmit = async () => {
    WebApp.HapticFeedback?.notificationOccurred('success');
    WebApp.showConfirm('Are you sure you want to finish and submit the homework?', async (confirm: boolean) => {
      if (confirm) {
        setSubmitting(true);
        try {
          const userId = WebApp.initDataUnsafe?.user?.id?.toString();
          if (!userId) {
            WebApp.showAlert('Unable to get Telegram user ID. Please open the app from Telegram.');
            setSubmitting(false);
            return;
          }
          await apiClient.post(`/variants/${id}/submissions`, {
            userId,
            answers,
            fileUrls,
          });
          WebApp.showAlert('Homework submitted successfully! Waiting for teacher review.');
          navigate('/');
        } catch (error) {
          WebApp.HapticFeedback?.notificationOccurred('error');
          WebApp.showAlert('Failed to submit homework. Try again.');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="page pb-24">
      <div className="sticky top-0 z-50 py-3 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-md -mx-4 px-4 mb-4">
        <button
          onClick={() => navigate('/')}
          className="btn--icon"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg text-center flex-1 mx-2 truncate">
          {test.title}
        </div>
        <div style={{ width: 42 }} />
      </div>

      <div className="card mb-4">
        <p className="text-sm text-gray-500">
          Solve the homework tasks below. Make sure to provide full answers and attach photos of handwritten solutions where requested.
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

            {task.description && (
              <p className="text-sm text-gray-700 mb-4">{task.description}</p>
            )}

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
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '2px' }}
                  placeholder="Enter answer..."
                  value={answers[task.id] || ''}
                  onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                />
              </div>
            )}

            {task.type === 'WRITTEN_WORK' && (
              <div className="flex flex-col gap-3">
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Type your detailed solution here..."
                  value={answers[task.id] || ''}
                  onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                />

                {/* Photo Attachments */}
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => { fileInputRefs.current[task.id] = el; }}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(task.id, e)}
                  />

                  {/* Thumbnail Previews */}
                  {fileUrls[task.id] && fileUrls[task.id].length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {fileUrls[task.id].map((url, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 w-16 h-16 shadow-sm">
                          <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                            onClick={() => handleRemoveFile(task.id, idx)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!fileUrls[task.id] || fileUrls[task.id].length < 4) && (
                    <button
                      type="button"
                      className="upload-box"
                      disabled={uploadingTasks[task.id]}
                      onClick={() => fileInputRefs.current[task.id]?.click()}
                    >
                      {uploadingTasks[task.id] ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin text-blue-500" />
                          <span className="text-sm font-semibold">Uploading photo...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ImageIcon size={18} className="text-blue-500" />
                          <span className="text-sm font-semibold">Attach Photo of Solution</span>
                        </div>
                      )}
                    </button>
                  )}
                </div>
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
          Submit Homework
        </button>
      </div>
    </div>
  );
}
