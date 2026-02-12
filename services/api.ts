// Use relative /api so Next.js rewrites can proxy to backend (works with localhost or Docker).
const API_BASE_URL = '';

interface ApiError {
  detail: string;
}

const TOKEN_KEY = 'ama_gopalpur_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL || ''}${path}`;

  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!resp.ok) {
    let error: ApiError | undefined;
    try {
      error = (await resp.json()) as ApiError;
    } catch {
      // ignore
    }
    if (resp.status === 401) {
      clearToken();
    }
    throw new Error(error?.detail || `Request failed with status ${resp.status}`);
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  return (await resp.json()) as T;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'DEPT_ADMIN';
  department_id?: number | null;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Organization {
  id: number;
  department_id: number;
  name: string;
  type: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  attributes?: Record<string, string | number | null> | null;
}

export const departmentsApi = {
  list: () => apiFetch<Department[]>('/api/v1/departments/'),
};

export const organizationsApi = {
  listByDepartment: (departmentId: number) =>
    apiFetch<Organization[]>(`/api/v1/organizations?department_id=${departmentId}`),
  get: (id: number) => apiFetch<Organization>(`/api/v1/organizations/${id}`),
  delete: (id: number) =>
    apiFetch<void>(`/api/v1/organizations/${id}`, { method: 'DELETE' }),
  create: (payload: {
    department_id: number;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    description?: string;
    address?: string;
    attributes?: Record<string, string | number | null>;
  }) =>
    apiFetch<Organization>('/api/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    id: number,
    payload: {
      name?: string;
      latitude?: number;
      longitude?: number;
      description?: string;
      address?: string;
      attributes?: Record<string, string | number | null>;
    },
  ) =>
    apiFetch<Organization>(`/api/v1/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<Token>('/api/v1/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ username: email, password }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
  me: () => apiFetch<User>('/api/v1/auth/me'),
};

export const adminApi = {
  listAdmins: () => apiFetch<User[]>('/api/v1/admins/'),
  createAdmin: (payload: { email: string; full_name: string; password: string; department_id: number }) =>
    apiFetch<User>('/api/v1/admins/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

