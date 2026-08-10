import React from 'react';
import { Loader } from '@shared-ui/core';
import { AlertCircle, User, Phone, Shield, Activity, BookOpen } from 'lucide-react';
import type { UserProfile, Enrollment } from '../types';

interface ProfilePageProps {
  user: UserProfile | null;
  enrollment: Enrollment | null;
  isLoading: boolean;
  error: string | null;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-row__icon">{icon}</span>
    <div className="info-row__content">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{value ?? '—'}</span>
    </div>
  </div>
);

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '✅ Active',
  PAUSED: '⏸️ Paused',
  BANNED: '🚫 Banned',
};

const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '✅ Active',
  PAUSED: '⏸️ Paused',
  EXCLUDED: '❌ Excluded',
  COMPLETED: '🎓 Completed',
};

/**
 * Profile page — shows the student's personal info and enrollment status.
 */
export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  enrollment,
  isLoading,
  error,
}) => {
  if (isLoading) return <Loader message="Loading your profile..." />;

  if (error || !user) {
    return (
      <div className="error-state">
        <AlertCircle size={40} className="error-state__icon" />
        <p className="error-state__message">{error ?? 'Profile not found'}</p>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-header__title">My Profile</h1>
        <User size={24} className="page-header__icon" />
      </div>

      {/* Avatar + name */}
      <div className="profile-hero card">
        <div className="profile-hero__avatar">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-hero__info">
          <h2 className="profile-hero__name">{user.fullName}</h2>
          <span className="badge badge--blue">{user.role}</span>
        </div>
      </div>

      {/* Personal info section */}
      <div className="card section">
        <h3 className="section__title">Personal Info</h3>
        <InfoRow icon={<User size={16} />} label="Full Name" value={user.fullName} />
        <InfoRow icon={<Phone size={16} />} label="Phone" value={user.phone} />
        <InfoRow icon={<Shield size={16} />} label="Role" value={user.role} />
        <InfoRow
          icon={<Activity size={16} />}
          label="Account Status"
          value={STATUS_LABEL[user.status] ?? user.status}
        />
        <InfoRow icon={<BookOpen size={16} />} label="Member Since" value={memberSince} />
      </div>

      {/* Enrollment section */}
      {enrollment && (
        <div className="card section">
          <h3 className="section__title">Current Enrollment</h3>
          <InfoRow
            icon={<BookOpen size={16} />}
            label="Course"
            value={enrollment.group?.course?.title ?? '—'}
          />
          <InfoRow
            icon={<User size={16} />}
            label="Group"
            value={enrollment.group?.title ?? '—'}
          />
          <InfoRow
            icon={<Activity size={16} />}
            label="Enrollment Status"
            value={ENROLLMENT_STATUS_LABEL[enrollment.status] ?? enrollment.status}
          />
          {enrollment.paymentDueAt && (
            <InfoRow
              icon={<Shield size={16} />}
              label="Payment Due"
              value={new Date(enrollment.paymentDueAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            />
          )}
        </div>
      )}
    </div>
  );
};
