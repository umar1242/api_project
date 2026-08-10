import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  telegramId: string;
  fullName: string;
  phone: string | null;
  role: 'STUDENT' | 'CURATOR' | 'ADMIN';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: ApiUser[];
  total: number;
}

export interface CreateUserPayload {
  telegramId: number;
  fullName: string;
  phone?: string;
  role?: 'STUDENT' | 'CURATOR' | 'ADMIN';
}

// ─── Client ──────────────────────────────────────────────────────────────────

/**
 * Typed HTTP client for the unified API.
 * Every request includes X-Service-Token for internal authentication.
 * Errors are caught and converted to human-readable messages.
 */
class ApiClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': config.serviceToken,
      },
    });

    // Response interceptor — extract useful error messages
    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const message =
          (err.response?.data as { message?: string })?.message ??
          err.message ??
          'API error';
        return Promise.reject(new Error(`API ${err.response?.status ?? '?'}: ${message}`));
      },
    );
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async ping(): Promise<{ status: string }> {
    const { data } = await this.http.get<{ status: string }>('/health');
    return data;
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  /**
   * Register or refresh a user. Idempotent — safe to call on every /start.
   */
  async upsertUser(payload: CreateUserPayload): Promise<ApiUser> {
    const { data } = await this.http.post<ApiUser>('/users/upsert', payload);
    return data;
  }

  /**
   * Find a user by their Telegram user_id.
   * Returns null if not registered yet.
   */
  async getUserByTelegramId(telegramId: number): Promise<ApiUser | null> {
    try {
      const { data } = await this.http.get<ApiUser>(
        `/users/by-telegram/${telegramId}`,
      );
      return data;
    } catch {
      return null;
    }
  }

  /**
   * List users with optional role filter and pagination.
   */
  async listUsers(params?: {
    role?: string;
    skip?: number;
    take?: number;
  }): Promise<UserListResponse> {
    const { data } = await this.http.get<UserListResponse>('/users', {
      params,
    });
    return data;
  }

  /**
   * Update a user's role or status.
   */
  async updateUser(
    id: string,
    payload: Partial<Pick<ApiUser, 'role' | 'status' | 'fullName' | 'phone'>>,
  ): Promise<ApiUser> {
    const { data } = await this.http.put<ApiUser>(`/users/${id}`, payload);
    return data;
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  /**
   * Create a new assignment.
   */
  async createAssignment(payload: {
    title: string;
    courseId?: string;
    description?: string;
    dueDate?: string;
  }): Promise<{ id: string; title: string }> {
    const { data } = await this.http.post<{ id: string; title: string }>('/assignments', payload);
    return data;
  }

  /**
   * Link an assignment to a lesson.
   */
  async linkHomework(assignmentId: string, lessonId: string): Promise<any> {
    const { data } = await this.http.post(`/assignments/${assignmentId}/link`, { lessonId });
    return data;
  }

  /**
   * Grade a homework submission.
   */
  async gradeHomework(submissionId: string, grade: string | number): Promise<any> {
    const { data } = await this.http.post(`/submissions/${submissionId}/grade`, { grade: Number(grade) });
    return data;
  }

  // ── Materials ──────────────────────────────────────────────────────────────

  /**
   * Create a material with a file from Telegram.
   */
  async createMaterial(payload: {
    groupId: string;
    lessonId?: string;
    telegramFileId: string;
    title: string;
    type?: string;
  }): Promise<any> {
    const { data } = await this.http.post(`/materials`, payload);
    return data;
  }
}

// Export a singleton — bots only need one client instance
export const apiClient = new ApiClient();
