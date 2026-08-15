import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Phone, Search, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import WebAppModule from "@twa-dev/sdk";
const WebApp = (WebAppModule as any).default || WebAppModule;
import { apiClient } from '../api/client';
import type { Enrollment } from '../types';

interface GroupInfo {
  id: string;
  title: string;
  telegramChatId: string;
  course?: {
    id: string;
    title: string;
    type?: 'FREE' | 'PAID';
  };
}

export const GroupMembersPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);

      const [groupsRes, enrollmentsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get(`/groups/${groupId}/enrollments`),
      ]);

      const allGroups: GroupInfo[] = Array.isArray(groupsRes.data)
        ? groupsRes.data
        : (groupsRes.data?.data || []);
      const currentGroup = allGroups.find(g => g.id === groupId) || null;
      setGroup(currentGroup);

      const enrollmentsData = Array.isArray(enrollmentsRes.data)
        ? enrollmentsRes.data
        : (enrollmentsRes.data?.data || []);
      setEnrollments(enrollmentsData);
    } catch (err: any) {
      console.error('Failed to load group members:', err);
      setError(err.response?.data?.message || 'Failed to load group members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleStatusChange = async (enrollmentId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'EXCLUDED' | 'COMPLETED') => {
    try {
      setUpdatingId(enrollmentId);
      WebApp.HapticFeedback?.impactOccurred('light');

      await apiClient.patch(`/enrollments/${enrollmentId}/status`, {
        status: newStatus,
      });

      setEnrollments(prev =>
        prev.map(e => (e.id === enrollmentId ? { ...e, status: newStatus } : e))
      );
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error('Failed to update status:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'Failed to update enrollment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmPayment = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to confirm payment for this student?')) {
      return;
    }

    try {
      setUpdatingId(enrollmentId);
      WebApp.HapticFeedback?.impactOccurred('medium');

      const res = await apiClient.patch(`/enrollments/${enrollmentId}/payment`);

      setEnrollments(prev =>
        prev.map(e =>
          e.id === enrollmentId
            ? { ...e, paymentPaidAt: res.data?.paymentPaidAt || new Date().toISOString() }
            : e
        )
      );
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      WebApp.HapticFeedback?.notificationOccurred('error');
      alert(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const name = e.user?.fullName?.toLowerCase() || '';
    const phone = e.user?.phone?.toLowerCase() || '';
    const telegramId = e.user?.telegramId?.toString() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || phone.includes(query) || telegramId.includes(query);
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge--green">Active</span>;
      case 'PAUSED':
        return <span className="badge badge--yellow">Paused</span>;
      case 'EXCLUDED':
        return <span className="badge badge--red">Excluded</span>;
      case 'COMPLETED':
        return <span className="badge badge--purple">Completed</span>;
      default:
        return <span className="badge badge--gray">{status}</span>;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading group members...</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/groups')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Back to groups"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="stat-card__value" style={{ fontSize: '20px' }}>
            {group?.title || `Group #${groupId}`}
          </h1>
          {group?.course && (
            <p className="text-xs text-blue-600 font-semibold">
              Course: {group.course.title}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold mb-4">
          {error}
        </div>
      )}

      {/* Stats and Search */}
      <div className="card mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm font-semibold">
              Total Members: <strong>{enrollments.length}</strong>
            </span>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px' }}
            placeholder="Search by name, phone or Telegram ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['ALL', 'ACTIVE', 'PAUSED', 'EXCLUDED', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-10 card empty-state">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No students match the filter'
                : 'No students enrolled in this group yet'}
            </p>
          </div>
        ) : (
          filteredEnrollments.map(e => {
            const isExpanded = expandedMemberId === e.id;
            const isUpdating = updatingId === e.id;
            const isPaid = !!e.paymentPaidAt;
            const hasDue = !!e.paymentDueAt;

            return (
              <div key={e.id} className="card flex flex-col space-y-3">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">
                      {e.user?.fullName || `User #${e.userId}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>ID: <span className="font-mono">{e.user?.telegramId || e.userId}</span></span>
                      {e.user?.xp !== undefined && (
                        <span className="badge badge--yellow text-[10px] px-1.5 py-0">
                          ⭐ {e.user.xp} XP
                        </span>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(e.status)}</div>
                </div>

                {/* Contact & Payment details */}
                <div className="bg-gray-50 p-2.5 rounded-xl space-y-2 text-xs">
                  {e.user?.phone && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      <span>{e.user.phone}</span>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} className={isPaid ? 'text-green-600' : 'text-amber-600'} />
                      <span className="font-medium">
                        Payment:
                      </span>
                      {isPaid ? (
                        <span className="text-green-700 font-semibold">
                          ✓ Paid {new Date(e.paymentPaidAt!).toLocaleDateString()}
                        </span>
                      ) : hasDue ? (
                        <span className="text-amber-700 font-semibold">
                          Due: {new Date(e.paymentDueAt!).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          Not recorded / Free
                        </span>
                      )}
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => handleConfirmPayment(e.id)}
                        disabled={isUpdating}
                        className="btn btn--primary py-1 px-2 text-xs rounded-lg shadow-sm"
                      >
                        {isUpdating ? '...' : 'Confirm'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status selector & Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Change Status:
                  </span>
                  <select
                    className="form-select text-xs py-1 px-2 rounded-lg flex-1"
                    value={e.status}
                    disabled={isUpdating}
                    onChange={event =>
                      handleStatusChange(
                        e.id,
                        event.target.value as 'ACTIVE' | 'PAUSED' | 'EXCLUDED' | 'COMPLETED'
                      )
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="EXCLUDED">EXCLUDED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>

                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <button
                      onClick={() => setExpandedMemberId(isExpanded ? null : e.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                      title="Toggle registration info"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>

                {/* Metadata Details Accordion */}
                {isExpanded && e.metadata && (
                  <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl text-xs space-y-1.5 border border-blue-100 text-blue-900">
                    <p className="font-semibold text-blue-950">Registration Details:</p>
                    {e.metadata.parentPhone && (
                      <p>Parent Phone: <strong>{e.metadata.parentPhone}</strong> {e.metadata.parentRelation ? `(${e.metadata.parentRelation})` : ''}</p>
                    )}
                    {e.metadata.aboutMe && (
                      <p>About: <em>{e.metadata.aboutMe}</em></p>
                    )}
                    {e.createdAt && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Enrolled at: {new Date(e.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
