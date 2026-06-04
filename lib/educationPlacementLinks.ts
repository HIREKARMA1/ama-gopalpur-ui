import type { DepartmentSummaryContent } from '../services/api';

/** Sub-departments that support a shared placement-cell redirect URL in admin. */
export const EDUCATION_PLACEMENT_LINK_SUB_DEPTS = [
  'ENGINEERING_COLLEGE',
  'ITI',
  'DIPLOMA_COLLEGE',
  'UNIVERSITY',
] as const;

export type EducationPlacementLinkSubDept = (typeof EDUCATION_PLACEMENT_LINK_SUB_DEPTS)[number];

const SUB_DEPT_LABELS: Record<EducationPlacementLinkSubDept, string> = {
  ENGINEERING_COLLEGE: 'Engineering College',
  ITI: 'ITI',
  DIPLOMA_COLLEGE: 'Diploma College',
  UNIVERSITY: 'University',
};

export function isEducationPlacementLinkSubDept(
  subDept: string | null | undefined,
): subDept is EducationPlacementLinkSubDept {
  const u = (subDept || '').trim().toUpperCase();
  return (EDUCATION_PLACEMENT_LINK_SUB_DEPTS as readonly string[]).includes(u);
}

export function educationPlacementLinkSubDeptLabel(subDept: string): string {
  const u = subDept.trim().toUpperCase() as EducationPlacementLinkSubDept;
  return SUB_DEPT_LABELS[u] ?? subDept;
}

export function parseEducationPlacementLinks(
  summary: DepartmentSummaryContent | null | undefined,
): Record<string, string> {
  const raw = summary?.education_placement_links;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const url = String(value ?? '').trim();
    if (url) out[key.trim().toUpperCase()] = url;
  }
  return out;
}

export function getEducationPlacementLink(
  summary: DepartmentSummaryContent | null | undefined,
  subDept: string | null | undefined,
): string | null {
  const key = (subDept || '').trim().toUpperCase();
  if (!key) return null;
  return parseEducationPlacementLinks(summary)[key] ?? null;
}

export function mergeEducationPlacementLink(
  summary: DepartmentSummaryContent | null | undefined,
  subDept: string,
  url: string,
): DepartmentSummaryContent {
  const key = subDept.trim().toUpperCase();
  const links = { ...parseEducationPlacementLinks(summary) };
  const trimmed = url.trim();
  if (trimmed) links[key] = trimmed;
  else delete links[key];
  return {
    ...(summary ?? {}),
    education_placement_links: links,
  };
}
