import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export const GradeSubmissionPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // scores map: taskId -> number
  const [scores, setScores] = useState<Record<string, number>>({});
  // feedback map: taskId -> string
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const { data } = await apiClient.get(`/variants/submissions/${id}`);
        // pre-fill scores if they exist
        const initialScores: Record<string, number> = {};
        const initialFeedback: Record<string, string> = {};
        data.answers.forEach((ans: any) => {
          if (ans.score !== null) initialScores[ans.taskId] = ans.score;
          if (ans.feedback) initialFeedback[ans.taskId] = ans.feedback;
        });
        setScores(initialScores);
        setFeedback(initialFeedback);
        setSubmission(data);
      } catch (err) {
        WebApp.showAlert('Submission not found');
        navigate('/submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, [id, navigate]);

  const handleSubmit = async () => {
    WebApp.HapticFeedback.notificationOccurred('success');
    WebApp.showConfirm('Grade this submission?', async (confirm: boolean) => {
      if(confirm) {
        try {
          await apiClient.post(`/variants/submissions/${id}/grade`, {
            scores,
            feedback,
          });
          WebApp.showAlert('Submission graded successfully!');
          navigate('/submissions');
        } catch (error) {
          WebApp.HapticFeedback.notificationOccurred('error');
          WebApp.showAlert('Failed to grade submission');
        }
      }
    });
  };

  if (loading) return <div className="app-shell"><div className="loader-container"><div className="loader-spinner"/></div></div>;
  if (!submission) return null;

  const { variant, user, answers } = submission;

  return (
    <div className="page">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md pb-3 pt-2 -mx-4 px-4 border-b border-gray-100 shadow-sm flex items-center mb-4">
        <button onClick={() => navigate('/submissions')} className="text-gray-500 hover:text-gray-800 mr-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">{user.fullName}</span>
          <span className="text-xs text-blue-500 font-semibold">{variant.title}</span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {variant.tasks?.map((task: any) => {
          const ans = answers.find((a: any) => a.taskId === task.id);
          const needsGrading = task.requiresAdmin || task.type === 'WRITTEN_WORK';

          return (
            <div key={task.id} className={`card glass-form shadow-sm ${needsGrading ? 'border-blue-300' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800 text-lg">Task {task.orderIndex}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-500 uppercase tracking-wider">
                  {task.type.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm font-medium text-gray-700">
                <div className="mb-1 text-xs text-gray-500 uppercase">Student's Answer:</div>
                {ans?.answer ? (
                  <div>{ans.answer}</div>
                ) : (
                  <div className="text-gray-400 italic">No answer provided</div>
                )}
                {ans?.fileUrls && ans.fileUrls.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 uppercase mb-2">
                      Attached Photos ({ans.fileUrls.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ans.fileUrls.map((url: string, idx: number) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Attachment ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {needsGrading ? (
                <div className="section">
                  <div>
                    <label className="input-label">Score (Points):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 5"
                      value={scores[task.id] !== undefined ? scores[task.id] : ''}
                      onChange={(e) => setScores(prev => ({ ...prev, [task.id]: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="input-label">Feedback (Optional):</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Good job, but..."
                      value={feedback[task.id] || ''}
                      onChange={(e) => setFeedback(prev => ({ ...prev, [task.id]: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="progress-section__header">
                  <span>Auto-graded Score:</span>
                  <span className={`font-bold ${ans?.score > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {ans?.score} pts
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-20 left-4 right-4 z-50">
        <button className="btn btn--primary btn--full glass-btn" onClick={handleSubmit}>
          <CheckCircle size={20} className="mr-2" />
          Submit Grades
        </button>
      </div>
    </div>
  );
};
