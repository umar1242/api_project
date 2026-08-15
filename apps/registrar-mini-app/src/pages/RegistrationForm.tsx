import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { CheckCircle2, AlertCircle, UserPlus, Loader2 } from 'lucide-react';
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
  const { refLink } = useParams<{ refLink: string }>();
  const [courseInfo, setCourseInfo] = useState<{ title: string; description?: string } | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState(false);
  
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [isRetryingInvite, setIsRetryingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(false);

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

  useEffect(() => {
    if (!refLink || refLink === 'invalid') {
      setCourseLoading(false);
      setCourseError(true);
      return;
    }
    apiClient.get(`/courses/${refLink}`)
      .then(res => setCourseInfo({ title: res.data.title, description: res.data.description }))
      .catch(() => setCourseError(true))
      .finally(() => setCourseLoading(false));
  }, [refLink]);

  const onSubmit = async (data: RegistrationFormData) => {
    if (!refLink || refLink === 'invalid' || courseError) {
      setError('Invalid course code. Please open this page via the bot with a valid code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      WebApp.HapticFeedback?.impactOccurred('medium');
      
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
      setEnrollmentId(res.data?.id || null);

      setIsSuccess(true);
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error(err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryInviteLink = async () => {
    if (!enrollmentId) return;
    try {
      setIsRetryingInvite(true);
      setInviteError(false);
      WebApp.HapticFeedback?.impactOccurred('light');
      const res = await apiClient.get(`/enrollments/${enrollmentId}/invite-link`);
      if (res.data?.inviteLink) {
        setInviteLink(res.data.inviteLink);
        WebApp.HapticFeedback?.notificationOccurred('success');
      }
    } catch (err) {
      setInviteError(true);
      WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsRetryingInvite(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="app-container">
        <div className="success-container">
          <CheckCircle2 className="success-icon" />
          <h2 className="page-title gradient-text">Registration Successful!</h2>
          <p className="page-subtitle">
            You are now enrolled in the course.
          </p>
          
          {inviteLink ? (
            <div className="w-full flex flex-col gap-3 mt-4">
              <p className="text-sm font-semibold text-gray-700">Join the private group to continue:</p>
              <a 
                href={inviteLink} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn--primary btn--full"
                onClick={() => {
                  setTimeout(() => WebApp.close(), 1000);
                }}
              >
                Join Telegram Group
              </a>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3 mt-4">
              {inviteError && (
                <p className="text-xs text-red-600 font-semibold text-center">Failed to get invite link. Please try again.</p>
              )}
              <button
                className="btn btn--primary btn--full"
                onClick={retryInviteLink}
                disabled={isRetryingInvite}
              >
                {isRetryingInvite ? 'Getting link...' : 'Get Group Invite Link'}
              </button>
              <button className="btn btn--secondary btn--full" onClick={() => WebApp.close()}>
                Close Mini App
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="page-title gradient-text">Course Registration</h1>
          <UserPlus size={24} className="text-blue-500" />
        </div>
        <p className="page-subtitle">Please fill out your details to enroll in the course</p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {courseLoading && (
          <div className="p-3 text-center text-sm text-gray-500 mb-3">Loading course...</div>
        )}
        {courseError && (
          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 font-semibold mb-3">
            ⚠️ Course not found. Please open this form via the bot using a valid code.
          </div>
        )}
        {courseInfo && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-3">
            <p className="text-sm font-bold text-blue-900">{courseInfo.title}</p>
            {courseInfo.description && <p className="text-xs text-blue-700 mt-1">{courseInfo.description}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
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
              placeholder="+998901234567"
              {...register('phone')}
            />
            {errors.phone && <span className="form-error">{errors.phone.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="parentPhone">Parent / Relative Phone (Optional)</label>
            <input
              id="parentPhone"
              type="tel"
              className="form-input"
              placeholder="+998901234567"
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
              placeholder="What are your learning goals?"
              {...register('aboutMe')}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn--primary btn--full mt-3" 
            disabled={isSubmitting || courseLoading || courseError}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Registering...</span>
              </div>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
