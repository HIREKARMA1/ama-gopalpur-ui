import {
  arcsApi,
  organizationsApi,
  type DepartmentSummaryContent,
  type DepartmentSummaryHighlightCard,
  type Organization,
} from '../services/api';
import type { MessageKey } from '../components/i18n/messages';
import { t } from '../components/i18n/messages';
import { getDrainLineKindFromOrg } from './drainageOrganization';

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
    if (code === 'DRAINAGE') {
      add(getDrainLineKindFromOrg(org));
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
    .map(([rawLabel, count]) => {
      const label =
        code === 'DRAINAGE' && rawLabel === 'MAIN'
          ? 'Main'
          : code === 'DRAINAGE' && rawLabel === 'BRANCH'
            ? 'Branch'
            : rawLabel.replace(/_/g, ' ');
      return { label, rawLabel, count };
    })
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
    legend_key: normalizeLegendParam(row.rawLabel),
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

const DRAINAGE_HIGHLIGHT_KEYS: Record<string, MessageKey> = {
  MAIN: 'map.drainage.legend.mainChannel',
  BRANCH: 'map.drainage.legend.branchLink',
};

const ROAD_HIGHLIGHT_KEYS: Record<string, MessageKey> = {
  NH: 'roads.type.nh',
  SH: 'roads.type.sh',
  PWD: 'roads.type.pwd',
  RD: 'roads.type.rd',
  PS: 'roads.type.ps',
  GP: 'roads.type.gp',
  OTHER: 'roads.type.other',
};

/** Localized title for summary highlight nodes (map legend filter links). */
export function legendHighlightTitle(
  card: Pick<DepartmentSummaryHighlightCard, 'title' | 'legend_key'>,
  departmentCode: string | undefined,
  lang: 'en' | 'or',
): string {
  const code = (departmentCode || '').toUpperCase();
  const legendKey = normalizeLegendParam(card.legend_key || card.title);
  if (code === 'DRAINAGE') {
    const key = DRAINAGE_HIGHLIGHT_KEYS[legendKey];
    if (key) return t(key, lang);
  }
  if (code === 'ROADS') {
    const key = ROAD_HIGHLIGHT_KEYS[legendKey];
    if (key) return t(key, lang);
  }
  return (card.title || '').trim();
}

export type ArcsSummaryTableColumn = {
  id: 'block_ulb' | 'total_membership';
  labelKey: MessageKey;
  keys: string[];
};

export const ARCS_SUMMARY_TABLE_COLUMNS: ArcsSummaryTableColumn[] = [
  { id: 'block_ulb', labelKey: 'arcs.field.blockUlb', keys: ['ulb_block', 'block_ulb'] },
  { id: 'total_membership', labelKey: 'arcs.fieldLabel.totalMembership', keys: ['total_membership'] },
];

function arcsJurisdictionFromProfile(profile: Record<string, unknown>): string {
  const raw = String(profile.jurisdiction_type_rural_urban_mixed ?? '').toUpperCase();
  if (!raw) return '';
  if (raw.includes('RURAL') && raw.includes('URBAN')) return 'MIXED';
  if (raw.includes('MIX')) return 'MIXED';
  if (raw.startsWith('URBAN')) return 'URBAN';
  if (raw.startsWith('RURAL')) return 'RURAL';
  return '';
}

/** Load ARCS profile fields used by the summary organization table. */
export async function enrichArcsOrganizationsForListing(orgs: Organization[]): Promise<Organization[]> {
  return Promise.all(
    orgs.map(async (org) => {
      const attrs: Record<string, string | number | null> = { ...(org.attributes || {}) };
      let profile: Record<string, unknown> = {};
      try {
        profile = await arcsApi.getProfile(org.id);
      } catch {
        profile = {};
      }

      const jurisdiction =
        String(attrs.jurisdiction_type ?? '').trim() || arcsJurisdictionFromProfile(profile);
      if (jurisdiction) attrs.jurisdiction_type = jurisdiction;

      const block = String(attrs.ulb_block ?? attrs.block_ulb ?? profile.block_ulb ?? '').trim();
      if (block) {
        attrs.ulb_block = block;
        attrs.block_ulb = block;
      }

      const totalMembership = String(attrs.total_membership ?? profile.total_membership ?? '').trim();
      if (totalMembership) attrs.total_membership = totalMembership;

      return { ...org, attributes: attrs };
    }),
  );
}

export function organizationListingArcsAttribute(org: Organization, keys: string[]): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const value = String(attrs[key] ?? '').trim();
    if (value) return value.replace(/_/g, ' ');
  }
  return '';
}

/** Category column value on the department summary organization table. */
export function organizationListingCategory(org: Organization, departmentCode?: string): string {
  const code = (departmentCode || '').toUpperCase();
  if (code === 'DRAINAGE') {
    return getDrainLineKindFromOrg(org);
  }
  if (code === 'ARCS') {
    const jurisdiction = String(org.attributes?.jurisdiction_type ?? '').trim();
    if (jurisdiction) return jurisdiction.replace(/_/g, ' ');
    return (org.type || '').trim();
  }
  return (
    (org.attributes?.road_sector as string) ||
    org.sub_department ||
    (org.attributes?.category as string) ||
    (org.attributes?.institution_type as string) ||
    ''
  ).trim();
}
