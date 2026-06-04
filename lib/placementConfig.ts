import type { DepartmentSummaryContent } from '../services/api';
import { getEducationPlacementLink } from './educationPlacementLinks';

/** Resolve placement-cell redirect URL: per-org profile first, then sub-department default. */
export function resolvePlacementRecordsUrl(
  profile: Record<string, unknown>,
  subDept?: string | null,
  departmentSummary?: DepartmentSummaryContent | null,
): string | null {
  const fromProfile = String(profile.placement_records_url ?? '').trim();
  if (fromProfile) return fromProfile;
  const fromSubDept = getEducationPlacementLink(departmentSummary, subDept);
  return fromSubDept || null;
}

/** External “View Placement Records” button is only for engineering colleges. */
export function showEngineeringPlacementRecordsLink(subDept: string | null | undefined): boolean {
  return (subDept || '').trim().toUpperCase() === 'ENGINEERING_COLLEGE';
}
