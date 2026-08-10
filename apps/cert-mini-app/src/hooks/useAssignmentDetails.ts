import { useState, useEffect, useCallback } from 'react';
import { getAssignmentById, getMySubmission, submitAssignment } from '../api';
import type { Assignment, AssignmentSubmission } from '../types';

export function useAssignmentDetails(assignmentId: string | undefined, userId: string | undefined) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!assignmentId || !userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const [assignmentData, submissionData] = await Promise.all([
        getAssignmentById(assignmentId),
        getMySubmission(assignmentId, userId),
      ]);
      setAssignment(assignmentData);
      setSubmission(submissionData);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment details');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, userId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const submit = async (payload: { answerText?: string; fileUrl?: string }) => {
    if (!assignmentId || !userId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const newSubmission = await submitAssignment(assignmentId, { ...payload, userId });
      setSubmission(newSubmission);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assignment');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    assignment,
    submission,
    isLoading,
    error,
    isSubmitting,
    submitError,
    refetch: fetchData,
    submit,
  };
}
