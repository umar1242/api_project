import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export default function HomeworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    WebApp.HapticFeedback.selectionChanged();
    setAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleSubmit = async () => {
    WebApp.HapticFeedback.notificationOccurred('success');
    WebApp.showConfirm('Are you sure you want to finish the homework?', async (confirm) => {
      if(confirm) {
        try {
          const userId = WebApp.initDataUnsafe?.user?.id?.toString() || '12345';
          await apiClient.post(`/variants/${id}/submissions`, {
            userId,
            answers,
          });
          WebApp.showAlert('Homework submitted successfully! Waiting for review...');
          navigate('/');
        } catch (error) {
          WebApp.HapticFeedback.notificationOccurred('error');
          WebApp.showAlert('Failed to submit homework. Try again.');
        }
      }
    });
  };

  if (loading) return <div className="loader-container"><div className="loader-spinner" /></div>;
  if (!test) return null;

  return (
    <div className="page" style={{ paddingBottom: '96px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '16px' }}>
        <button onClick={() => navigate('/')} style={{ color: 'var(--tg-hint)' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center', flex: 1, margin: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {test.title}
        </div>
      </div>

      <div className="glass-form" style={{ padding: '12px', borderRadius: 'var(--radius-lg)', fontSize: '14px', color: 'var(--tg-hint)', marginBottom: '24px' }}>
        Solve the homework tasks below. Make sure to attach any required photos.
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
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '18px', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '2px', marginTop: '4px' }}
                placeholder="Enter answer..."
                value={answers[task.id] || ''}
                onChange={(e) => handleAnswerChange(task.id, e.target.value)}
              />
            )}

            {task.type === 'WRITTEN_WORK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  className="form-textarea"
                  style={{ marginTop: '4px', fontSize: '14px' }}
                  placeholder="Type your detailed solution here..."
                  value={answers[task.id] || ''}
                  onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                />
                {task.requiresAdmin && (
                  <button className="upload-box" style={{ padding: '12px', flexDirection: 'row', justifyContent: 'center' }}>
                    <ImageIcon size={18} />
                    <span style={{ fontSize: '14px' }}>Attach Photo of Solution</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: '16px', left: '16px', right: '16px', zIndex: 50 }}>
        <button className="btn btn--full glass-btn" style={{ boxShadow: '0 8px 24px rgba(36, 129, 204, 0.4)' }} onClick={handleSubmit}>
          <CheckCircle size={20} style={{ marginRight: '8px' }} />
          Submit Homework
        </button>
      </div>
    </div>
  );
}
