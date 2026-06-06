import { normalizeLegendParam } from './departmentSummaryHighlights';

export const WATCO_SUB_DEPARTMENTS = ['WATCO', 'RWSS'] as const;

type WatcoLegendOrg = {
  sub_department?: string | null;
  attributes?: Record<string, unknown> | null;
};

export type WatcoSubDepartment = (typeof WATCO_SUB_DEPARTMENTS)[number];

export function normalizeWatcoSubDepartment(
  raw: string | null | undefined,
): WatcoSubDepartment | null {
  const v = (raw || '').trim().toUpperCase();
  if (v === 'WATCO') return 'WATCO';
  if (v === 'RWSS') return 'RWSS';
  return null;
}

/** Station type keys match summary highlight / URL legend params (e.g. SVS, PUMP_HOUSE). */
export function normalizeWatcoStationType(raw: string | null | undefined): string {
  const value = (raw || '').trim();
  if (!value) return '';
  return normalizeLegendParam(value);
}

export function watcoOrgMatchesLegendFilter(org: WatcoLegendOrg, legendFilterType: string): boolean {
  const filter = legendFilterType.trim().toUpperCase();
  if (!filter) return true;

  const compoundIdx = filter.indexOf('__');
  if (compoundIdx > 0) {
    const subPart = filter.slice(0, compoundIdx);
    const stationPart = filter.slice(compoundIdx + 2);
    const subDepartment = normalizeWatcoSubDepartment(org.sub_department as string);
    const stationType = normalizeWatcoStationType((org.attributes?.station_type as string) || '');
    if (subPart === 'WATCO' || subPart === 'RWSS') {
      return subDepartment === subPart && stationType === stationPart;
    }
  }

  const subDepartment = normalizeWatcoSubDepartment(org.sub_department as string);
  if (filter === 'WATCO' || filter === 'RWSS') {
    return subDepartment === filter;
  }

  const stationType = normalizeWatcoStationType((org.attributes?.station_type as string) || '');
  return stationType === filter;
}
