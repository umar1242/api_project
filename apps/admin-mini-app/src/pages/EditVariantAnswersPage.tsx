import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { Loader } from '../components/Loader';
import { MathKeyboard } from '../components/MathKeyboard';
import WebAppModule from '@twa-dev/sdk';
const WebApp = (WebAppModule as any).default || WebAppModule;

export const EditVariantAnswersPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await apiClient.get(`/variants/${id}`);
        if (data.tasks) {
          data.tasks.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
          const initialAnswers: Record<string, string> = {};
          data.tasks.forEach((t: any) => {
            if (t.correctAnswer) initialAnswers[t.id] = t.correctAnswer;
          });
          setAnswers(initialAnswers);
        }
        setTest(data);
      } catch (err) {
        WebApp.showAlert('Variant not found');
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

  const handleSave = async () => {
    setSaving(true);
    WebApp.HapticFeedback.notificationOccurred('success');
    try {
      const payloadTasks = Object.keys(answers).map(taskId => ({
        id: taskId,
        correctAnswer: answers[taskId],
      }));
      
      await apiClient.post(`/variants/${id}/tasks`, { tasks: payloadTasks });
      WebApp.showAlert('Answers saved successfully! You can now close this app.');
      navigate('/');
    } catch (err) {
      WebApp.showAlert('Failed to save answers.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="app-shell"><Loader message="Loading variant..." /></div>;
  if (!test) return null;

  return (
    <div className="page" style={{ paddingBottom: '96px' }}>
      <div className="page-header">
        <button onClick={() => navigate('/')} style={{ color: 'var(--tg-hint)' }}>
          <ArrowLeft size={24} />
        </button>
        <div className="page-header__title" style={{ flex: 1, textAlign: 'center' }}>Set Correct Answers</div>
        <div style={{ width: '24px' }}></div>
      </div>

      <div className="glass-form" style={{ padding: '12px', borderRadius: 'var(--radius-lg)', fontSize: '14px', color: 'var(--tg-hint)', marginBottom: '16px' }}>
        <strong>{test.title}</strong><br/>
        Please provide the correct answers for automatic grading.
      </div>

      <div className="tasks-container">
        {test.tasks?.map((task: any) => (
          <div key={task.id} className="card glass-form">
            <div className="task-card__header">
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--tg-text)' }}>
                Task {task.orderIndex}
              </span>
              <span className="task-card__type">
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
              <div style={{ fontSize: '14px', color: 'var(--tg-hint)' }}>
                <em>No auto-grading possible. Will be graded manually.</em>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: '16px', left: '16px', right: '16px', zIndex: 50 }}>
        <button className="btn btn--full glass-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : <><CheckCircle size={20} style={{ marginRight: '8px' }} /> Save Answers</>}
        </button>
      </div>
    </div>
  );
};
