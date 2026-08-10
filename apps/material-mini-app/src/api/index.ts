import { apiClient } from './client';
import type { UserProfile, Enrollment, Material } from '../types';

export async function getUserByTelegramId(telegramId: number): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/users/by-telegram/${telegramId}`);
  return data;
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const { data } = await apiClient.get<{ data: Enrollment[]; total: number }>(
    `/enrollments`,
    { params: { userId } },
  );
  return data.data;
}

export async function getMaterialsByGroup(groupId: string): Promise<Material[]> {
  const { data } = await apiClient.get<Material[]>(`/materials/group/${groupId}`);
  return data;
}
