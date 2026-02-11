// Use relative /api so Next.js rewrites can proxy to backend (works with localhost or Docker).
const API_BASE_URL = '';

interface ApiError {
  detail: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL || ''}${path}`;

  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!resp.ok) {
    let error: ApiError | undefined;
    try {
      error = (await resp.json()) as ApiError;
    } catch {
      // ignore
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
};

