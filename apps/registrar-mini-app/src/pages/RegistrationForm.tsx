import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Please enter a valid phone number').optional().or(z.literal('')),
  parentPhone: z.string().optional().or(z.literal('')),
  parentRelation: z.string().optional().or(z.literal('')),
  aboutMe: z.string().optional().or(z.literal('')),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const RegistrationForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const refLink = searchParams.get('refLink');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  const onSubmit = async (data: RegistrationFormData) => {
    if (!refLink) {
      setError('Invalid referral link. Please use the link provided by the bot.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const res = await apiClient.post('/enrollments', {
        refLink,
        fullName: data.fullName,
        phone: data.phone || undefined,
        metadata: {
          userAgent: navigator.userAgent,
          registeredVia: 'MiniApp',
          parentPhone: data.parentPhone || undefined,
          parentRelation: data.parentRelation || undefined,
          aboutMe: data.aboutMe || undefined,
        }
      });
      
      if (res.data?.inviteLink) {
        setInviteLink(res.data.inviteLink);
      }
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="success-container">
        <CheckCircle2 className="success-icon" />
        <h2 className="page-title">Registration Successful!</h2>
        <p className="page-subtitle">
          You are now enrolled in the course.
        </p>
        
        {inviteLink ? (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ marginBottom: '10px' }}>Join the private group to continue:</p>
            <a 
              href={inviteLink} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn--primary btn--full glass-btn" 
              style={{ display: 'block', textDecoration: 'none' }}
              onClick={() => {
                setTimeout(() => WebApp.close(), 1000);
              }}
            >
              Join Group
            </a>
          </div>
        ) : (
          <button className="btn btn--primary btn--full glass-btn" onClick={() => WebApp.close()}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="page-title">Course Registration</h1>
      <p className="page-subtitle">Please fill out the details below to enroll</p>

      {error && (
        <div style={{ backgroundColor: 'rgba(255,59,48,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', color: 'var(--tg-theme-destructive-text-color)' }}>
          <AlertCircle size={20} style={{ marginRight: '8px' }} />
          <span>{error}</span>
        </div>
      )}

      {!refLink && (
        <div style={{ backgroundColor: 'rgba(255,204,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#8a6d00' }}>
          Warning: Missing course referral link. Registration might fail.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Full Name *</label>
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="John Doe"
            {...register('fullName')}
          />
          {errors.fullName && <span className="form-error">{errors.fullName.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            placeholder="+1234567890"
            {...register('phone')}
          />
          {errors.phone && <span className="form-error">{errors.phone.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parentPhone">Parent/Relative Phone (Optional)</label>
          <input
            id="parentPhone"
            type="tel"
            className="form-input"
            placeholder="+1234567890"
            {...register('parentPhone')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parentRelation">Whose phone is this? (Optional)</label>
          <input
            id="parentRelation"
            type="text"
            className="form-input"
            placeholder="e.g., Mother, Father, Brother"
            {...register('parentRelation')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="aboutMe">Briefly about yourself (Optional)</label>
          <textarea
            id="aboutMe"
            className="form-input"
            rows={3}
            placeholder="What are your goals?"
            {...register('aboutMe')}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn--primary btn--full glass-btn" 
          disabled={isSubmitting}
          style={{ marginTop: '16px' }}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};
