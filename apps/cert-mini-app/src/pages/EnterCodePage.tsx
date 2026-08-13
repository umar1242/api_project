import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;

export const EnterCodePage: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 5) {
      WebApp.showAlert('Please enter a 5-character code.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.get(`/variants/by-code/${trimmed}`);
      WebApp.HapticFeedback?.notificationOccurred('success');
      navigate(`/tests/${data.id}`);
    } catch (error: any) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      const msg = error.response?.data?.message || 'Invalid or unknown code';
      WebApp.showAlert(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1 className="page-header__title gradient-text">Enter Code</h1>
        <KeyRound className="page-header__icon" style={{ color: 'var(--tg-btn)' }} />
      </div>

      <div className="card glass-form" style={{ marginTop: '16px', textAlign: 'center' }}>
        <p className="text-sm" style={{ color: 'var(--tg-hint)', marginBottom: '16px' }}>
          Enter the 5-character code your teacher gave you to open a test.
        </p>
        <input
          type="text"
          className="form-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
          placeholder="ABCDE"
          maxLength={5}
          style={{ fontFamily: 'monospace', fontSize: '28px', letterSpacing: '6px', textAlign: 'center', textTransform: 'uppercase' }}
        />
        <button
          className="btn btn--primary btn--full glass-btn"
          style={{ marginTop: '16px' }}
          onClick={handleSubmit}
          disabled={isLoading || code.length !== 5}
        >
          {isLoading ? 'Checking...' : (<>Open Test <ArrowRight size={16} /></>)}
        </button>
      </div>
    </div>
  );
};
