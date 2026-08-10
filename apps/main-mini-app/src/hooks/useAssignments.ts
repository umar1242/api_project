import { useState, useEffect, useCallback } from 'react';
import { getAssignmentsByGroup } from '../api';
import type { Assignment } from '../types';

export function useAssignments(groupId: string | null | undefined) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!groupId) {
      setAssignments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAssignmentsByGroup(groupId);
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, isLoading, error, refetch: fetchAssignments };
}
