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
    ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
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
  listByDepartment: (departmentId: number, opts?: { skip?: number; limit?: number }) => {
    const params = new URLSearchParams();
    params.append('department_id', String(departmentId));
    if (opts?.skip != null) params.append('skip', String(opts.skip));
    if (opts?.limit != null) params.append('limit', String(opts.limit));
    return apiFetch<Organization[]>(`/api/v1/organizations?${params.toString()}`);
  },
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

// ----- AWC / Center profile (organizations under ICDS/AWC department) -----
export interface CenterProfile {
  organization_id: number;
  center_code?: string | null;
  center_type?: string | null;
  establishment_year?: number | null;
  scheme?: string | null;
  sector?: string | null;
  block_name?: string | null;
  district?: string | null;
  gram_panchayat?: string | null;
  village_ward?: string | null;
  full_address?: string | null;
  worker_name?: string | null;
  contact_number?: string | null;
  total_children_0_3?: number | null;
  total_children_3_6?: number | null;
  pregnant_women?: number | null;
  lactating_mothers?: number | null;
  total_active_beneficiaries?: number | null;
  student_strength?: number | null;
  cpdo_name?: string | null;
  cpdo_contact_no?: string | null;
  supervisor_contact_name?: string | null;
  aww_contact_no?: string | null;
  awh_contact_no?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export const profileApi = {
  getCenterProfile: (organizationId: number) =>
    apiFetch<CenterProfile>(`/api/v1/organizations/${organizationId}/profile`).catch(() => null),
  putCenterProfile: (organizationId: number, payload: Partial<CenterProfile>) =>
    apiFetch<CenterProfile>(`/api/v1/organizations/${organizationId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// ----- Education (organizations under Education department) -----
const educationBase = (orgId: number) => `/api/v1/education/organizations/${orgId}`;
export const educationApi = {
  getSchoolMaster: (orgId: number) => apiFetch<EducationSchoolMaster | null>(`${educationBase(orgId)}/school-master`).catch(() => null),
  getInfrastructure: (orgId: number) => apiFetch<EducationInfrastructure | null>(`${educationBase(orgId)}/infrastructure`).catch(() => null),
  getGovtRegistry: (orgId: number) => apiFetch<EducationGovtRegistry | null>(`${educationBase(orgId)}/govt-registry`).catch(() => null),
  listTeachers: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<EducationTeacher[]>(`/api/v1/education/teachers?${p}`);
  },
  listScholarships: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<EducationScholarship[]>(`/api/v1/education/scholarships?${p}`);
  },
  listMiddayMeals: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<EducationMiddayMeal[]>(`${educationBase(orgId)}/midday-meals?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listDigitalLearning: (orgId: number) =>
    apiFetch<EducationDigitalLearning[]>(`${educationBase(orgId)}/digital-learning?skip=0&limit=50`),
  listDevelopmentProjects: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<EducationDevelopmentProject[]>(`/api/v1/education/development-projects?${p}`);
  },
  listResourceRequirements: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<EducationResourceRequirement[]>(`/api/v1/education/resource-requirements?${p}`);
  },
  listMonthlyProgress: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<EducationMonthlyProgress[]>(`${educationBase(orgId)}/monthly-progress?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listBeneficiaryAnalytics: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<EducationBeneficiaryAnalytics[]>(`${educationBase(orgId)}/beneficiary-analytics?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  getProfile: (orgId: number) =>
    apiFetch<Record<string, unknown>>(`${educationBase(orgId)}/profile`).catch(() => ({})),
  putProfile: (orgId: number, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`${educationBase(orgId)}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  bulkCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<{ imported: number; errors: string[] }>('/api/v1/education/bulk-csv', {
      method: 'POST',
      body: form,
    });
  },
};

export interface EducationSchoolMaster {
  organization_id: number;
  udise_code?: string | null;
  school_type?: string | null;
  board?: string | null;
  medium?: string | null;
  management_type?: string | null;
  district?: string | null;
  block?: string | null;
  village?: string | null;
  established_year?: number | null;
  school_status?: string | null;
  contact_phone?: string | null;
  email?: string | null;
  website?: string | null;
  [key: string]: unknown;
}
export interface EducationInfrastructure {
  id: number;
  organization_id: number;
  classrooms?: number | null;
  smart_classrooms?: number | null;
  labs_science?: number | null;
  labs_computer?: number | null;
  library_books?: number | null;
  sports_ground?: boolean | null;
  toilets_boys?: number | null;
  toilets_girls?: number | null;
  drinking_water?: boolean | null;
  electricity?: boolean | null;
  internet?: boolean | null;
  [key: string]: unknown;
}
export interface EducationTeacher {
  id: number;
  organization_id: number;
  teacher_id?: string | null;
  name?: string | null;
  gender?: string | null;
  qualification?: string | null;
  experience_years?: number | null;
  subject_specialization?: string | null;
  employment_type?: string | null;
  contact?: string | null;
  email?: string | null;
  [key: string]: unknown;
}
export interface EducationScholarship {
  id: number;
  organization_id?: number | null;
  student_id?: string | null;
  scheme_name?: string | null;
  amount?: number | null;
  year?: number | null;
  status?: string | null;
  [key: string]: unknown;
}
export interface EducationMiddayMeal {
  id: number;
  organization_id: number;
  record_date: string;
  students_served?: number | null;
  meal_type?: string | null;
  food_quality_rating?: number | null;
  vendor_name?: string | null;
  [key: string]: unknown;
}
export interface EducationDigitalLearning {
  id: number;
  organization_id: number;
  platform_used?: string | null;
  device_available?: boolean | null;
  students_with_devices?: number | null;
  teachers_trained_digital?: number | null;
  online_classes_conducted?: number | null;
  monthly_usage_hours?: number | null;
  [key: string]: unknown;
}
export interface EducationDevelopmentProject {
  id: number;
  organization_id: number;
  project_id?: string | null;
  project_name?: string | null;
  description?: string | null;
  sanctioned_amount?: number | null;
  start_date?: string | null;
  expected_end_date?: string | null;
  status?: string | null;
  funding_scheme?: string | null;
  [key: string]: unknown;
}
export interface EducationResourceRequirement {
  id: number;
  organization_id: number;
  req_id?: string | null;
  resource_type?: string | null;
  quantity_required?: number | null;
  approval_status?: string | null;
  [key: string]: unknown;
}
export interface EducationMonthlyProgress {
  id: number;
  organization_id: number;
  month: number;
  year: number;
  students_enrolled?: number | null;
  dropouts?: number | null;
  budget_utilized?: number | null;
  remarks?: string | null;
  [key: string]: unknown;
}
export interface EducationBeneficiaryAnalytics {
  id: number;
  organization_id: number;
  region?: string | null;
  age_group?: string | null;
  gender?: string | null;
  caste_category?: string | null;
  student_count?: number | null;
  [key: string]: unknown;
}
export interface EducationGovtRegistry {
  id: number;
  organization_id: number;
  udise_code?: string | null;
  aishe_code?: string | null;
  nsp_code?: string | null;
  district_code?: string | null;
  block_code?: string | null;
  [key: string]: unknown;
}

// ----- Health (organizations under Health department) -----
const healthBase = (orgId: number) => `/api/v1/health/organizations/${orgId}`;
export const healthApi = {
  getFacilityMaster: (orgId: number) => apiFetch<HealthFacilityMaster | null>(`${healthBase(orgId)}/facility-master`).catch(() => null),
  getInfrastructure: (orgId: number) => apiFetch<HealthInfrastructure | null>(`${healthBase(orgId)}/infrastructure`).catch(() => null),
  listStaff: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<HealthStaff[]>(`/api/v1/health/staff?${p}`);
  },
  listEquipment: (orgId: number, params?: { skip?: number; limit?: number }) => {
    const p = new URLSearchParams({ organization_id: String(orgId) });
    if (params?.skip != null) p.set('skip', String(params.skip));
    if (params?.limit != null) p.set('limit', String(params.limit ?? 50));
    return apiFetch<HealthEquipment[]>(`/api/v1/health/equipment?${p}`);
  },
  listPatientServices: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<HealthPatientService[]>(`${healthBase(orgId)}/patient-services?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listImmunisation: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<HealthImmunisation[]>(`${healthBase(orgId)}/immunisation?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listMedicinesStock: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<HealthMedicinesStock[]>(`${healthBase(orgId)}/medicines-stock?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listSchemes: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<HealthScheme[]>(`${healthBase(orgId)}/schemes?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  listMonthlyReport: (orgId: number, params?: { skip?: number; limit?: number }) =>
    apiFetch<HealthMonthlyReport[]>(`${healthBase(orgId)}/monthly-report?skip=${params?.skip ?? 0}&limit=${params?.limit ?? 50}`),
  getProfile: (orgId: number) =>
    apiFetch<Record<string, unknown>>(`${healthBase(orgId)}/profile`).catch(() => ({})),
  putProfile: (orgId: number, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`${healthBase(orgId)}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  bulkCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<{ imported: number; errors: string[] }>('/api/v1/health/bulk-csv', {
      method: 'POST',
      body: form,
    });
  },
};

export interface HealthFacilityMaster {
  organization_id: number;
  facility_type?: string | null;
  district?: string | null;
  block?: string | null;
  village?: string | null;
  established_year?: number | null;
  registration_number?: string | null;
  contact_phone?: string | null;
  email?: string | null;
  num_beds?: number | null;
  operating_hours?: string | null;
  facility_status?: string | null;
  [key: string]: unknown;
}
export interface HealthInfrastructure {
  id: number;
  organization_id: number;
  beds_total?: number | null;
  icu_beds?: number | null;
  operation_theatre?: number | null;
  lab_available?: boolean | null;
  pharmacy_available?: boolean | null;
  ambulance_available?: boolean | null;
  blood_bank?: boolean | null;
  [key: string]: unknown;
}
export interface HealthStaff {
  id: number;
  organization_id: number;
  staff_id?: string | null;
  name?: string | null;
  role?: string | null;
  qualification?: string | null;
  gender?: string | null;
  contact?: string | null;
  employment_type?: string | null;
  [key: string]: unknown;
}
export interface HealthEquipment {
  id: number;
  organization_id: number;
  equipment_name?: string | null;
  quantity?: number | null;
  condition?: string | null;
  [key: string]: unknown;
}
export interface HealthPatientService {
  id: number;
  organization_id: number;
  record_date: string;
  opd_count?: number | null;
  ipd_count?: number | null;
  surgeries?: number | null;
  deliveries?: number | null;
  referrals_in?: number | null;
  referrals_out?: number | null;
  [key: string]: unknown;
}
export interface HealthImmunisation {
  id: number;
  organization_id: number;
  vaccine_name?: string | null;
  doses_given?: number | null;
  age_group?: string | null;
  [key: string]: unknown;
}
export interface HealthMedicinesStock {
  id: number;
  organization_id: number;
  medicine_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  expiry_date?: string | null;
  reorder_level?: number | null;
  [key: string]: unknown;
}
export interface HealthScheme {
  id: number;
  organization_id: number;
  scheme_name?: string | null;
  scheme_id?: string | null;
  beneficiaries_count?: number | null;
  year?: number | null;
  status?: string | null;
  [key: string]: unknown;
}
export interface HealthMonthlyReport {
  id: number;
  organization_id: number;
  month: number;
  year: number;
  total_opd?: number | null;
  total_ipd?: number | null;
  total_deliveries?: number | null;
  total_immunisation?: number | null;
  budget_utilized?: number | null;
  remarks?: string | null;
  [key: string]: unknown;
}