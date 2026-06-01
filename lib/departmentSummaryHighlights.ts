import {
  organizationsApi,
  type DepartmentSummaryContent,
  type DepartmentSummaryHighlightCard,
  type Organization,
} from '../services/api';

export type LegendRow = { label: string; rawLabel: string; count: number };

export function buildLegendRows(organizations: Organization[], departmentCode?: string): LegendRow[] {
  const code = (departmentCode || '').toUpperCase();
  const bucket = new Map<string, number>();
  const add = (label?: string | null) => {
    const l = (label || '').trim();
    if (!l) return;
    bucket.set(l, (bucket.get(l) || 0) + 1);
  };

  for (const org of organizations) {
    if (code === 'EDUCATION') {
      add(org.sub_department || org.type);
      continue;
    }
    if (code === 'HEALTH') {
      add((org.attributes?.category as string) || org.type);
      continue;
    }
    if (code === 'AGRICULTURE') {
      add(org.sub_department || (org.attributes?.sub_department as string) || org.type);
      continue;
    }
    if (code === 'ELECTRICITY') {
      add((org.attributes?.institution_type as string) || org.type);
      continue;
    }
    if (code === 'ARCS') {
      add((org.attributes?.jurisdiction_type as string) || org.type);
      continue;
    }
    if (code === 'WATCO_RWSS') {
      add((org.attributes?.station_type as string) || org.type);
      continue;
    }
    if (code === 'ROADS') {
      add(
        (org.attributes?.road_sector as string) ||
          org.sub_department ||
          (org.attributes?.category as string) ||
          org.type,
      );
      continue;
    }
    if (code === 'MINOR_IRRIGATION') {
      add((org.attributes?.category_type as string) || org.type);
      continue;
    }
    if (code === 'IRRIGATION') {
      add((org.attributes?.category as string) || org.type);
      continue;
    }
    if (code === 'REVENUE_LAND') {
      add(org.sub_department || (org.attributes?.land_type as string) || org.type);
      continue;
    }
    add(org.sub_department || org.type);
  }

  return Array.from(bucket.entries())
    .map(([label, count]) => ({ label: label.replace(/_/g, ' '), rawLabel: label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Same highlight cards as shown on the public department summary page. */
export function resolveEffectiveHighlightCards(
  summary: DepartmentSummaryContent | null | undefined,
  organizations: Organization[],
  departmentCode?: string,
): DepartmentSummaryHighlightCard[] {
  const saved = (summary?.highlight_cards ?? [])
    .map((card) => ({
      title: (card.title || '').trim(),
      value: (card.value || '').trim(),
    }))
    .filter((card) => card.title && card.value);
  if (saved.length > 0) return saved;

  return buildLegendRows(organizations, departmentCode).map((row) => ({
    title: row.label,
    value: String(row.count),
  }));
}

export async function fetchAllOrganizationsForDepartment(departmentId: number): Promise<Organization[]> {
  const pageSize = 1000;
  let skip = 0;
  const all: Organization[] = [];
  while (true) {
    const batch = await organizationsApi.listByDepartment(departmentId, { skip, limit: pageSize });
    all.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
    if (skip > 100000) break;
  }
  return all;
}

export function normalizeLegendParam(label: string): string {
  return String(label || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
}
