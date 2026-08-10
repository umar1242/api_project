import { useState, useEffect, useCallback } from 'react';
import { getUpcomingLessons, getLessonsByGroup } from '../api';
import type { Lesson } from '../types';

interface UseScheduleResult {
  lessons: Lesson[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches the upcoming lessons for a given groupId.
 * Returns the sorted list, loading state, and error.
 */
export function useSchedule(groupId: string | null | undefined, limit = 20): UseScheduleResult {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getUpcomingLessons(groupId, limit);
      setLessons(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load schedule';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, limit]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  return { lessons, isLoading, error, refetch: fetchSchedule };
}

/**
 * Fetches ALL lessons for a group (full calendar view).
 */
export function useFullSchedule(
  groupId: string | null | undefined,
  page = 0,
  pageSize = 20,
): UseScheduleResult & { total: number } {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await getLessonsByGroup(groupId, {
        skip: page * pageSize,
        take: pageSize,
      });
      setLessons(result.data);
      setTotal(result.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load schedule';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, page, pageSize]);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  return { lessons, total, isLoading, error, refetch: fetchSchedule };
}
