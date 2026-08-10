import { useState, useEffect } from 'react';
import { getGamificationStats, getShopItems, purchaseShopItem } from '../api';
import type { GamificationStats, ShopItem } from '../types';

export function useGamificationStats(courseId: string | null | undefined, userId: string | undefined) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !userId) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getGamificationStats(courseId, userId);
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch gamification stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [courseId, userId]);

  const refresh = async () => {
    if (!courseId || !userId) return;
    try {
      const data = await getGamificationStats(courseId, userId);
      setStats(data);
    } catch {
      // Background refresh, ignore error
    }
  };

  return { stats, isLoading, error, refresh };
}

export function useShop(courseId: string | null | undefined, userId: string | undefined) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !userId) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getShopItems(courseId);
        setItems(data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch shop items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [courseId, userId]);

  const purchase = async (itemId: string) => {
    if (!courseId || !userId) throw new Error('No course ID or user ID');
    const res = await purchaseShopItem(courseId, itemId, userId);
    return res;
  };

  return { items, isLoading, error, purchase };
}
