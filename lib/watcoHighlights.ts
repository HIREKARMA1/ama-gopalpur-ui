import type { MessageKey } from '../components/i18n/messages';
import { t } from '../components/i18n/messages';
import type { Organization } from '../services/api';
import { normalizeLegendParam } from './departmentSummaryHighlights';
import {
  normalizeWatcoSubDepartment,
  WATCO_SUB_DEPARTMENTS,
  type WatcoSubDepartment,
} from './watcoOrganization';

export type WatcoHighlightCard = {
  title: string;
  count: string;
  legendKey: string;
};

export type WatcoHighlightGroup = {
  id: WatcoSubDepartment;
  centerLabel: string;
  cards: WatcoHighlightCard[];
};

const WATCO_GROUP_LABEL_KEYS: Record<WatcoSubDepartment, MessageKey> = {
  WATCO: 'map.legend.watco',
  RWSS: 'map.legend.rwss',
};

/** Compound legend param: WATCO__SVS — filters sub-department and station type together. */
export function watcoCompoundLegendKey(subDepartment: WatcoSubDepartment, stationTypeRaw: string): string {
  const station = normalizeLegendParam(stationTypeRaw);
  return `${subDepartment}__${station}`;
}

function stationTypeLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

function buildStationTypeRows(organizations: Organization[]): { rawLabel: string; label: string; count: number }[] {
  const bucket = new Map<string, number>();
  for (const org of organizations) {
    const station = String((org.attributes?.station_type as string) || org.type || '').trim();
    if (!station) continue;
    bucket.set(station, (bucket.get(station) || 0) + 1);
  }
  return Array.from(bucket.entries())
    .map(([rawLabel, count]) => ({
      rawLabel,
      label: stationTypeLabel(rawLabel),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildWatcoRwssHighlightGroups(
  organizations: Organization[],
  language: 'en' | 'or',
): WatcoHighlightGroup[] {
  return WATCO_SUB_DEPARTMENTS.map((sub) => {
    const scoped = organizations.filter(
      (org) => normalizeWatcoSubDepartment(org.sub_department) === sub,
    );
    const cards: WatcoHighlightCard[] = buildStationTypeRows(scoped).map((row) => ({
      title: row.label,
      count: String(row.count),
      legendKey: watcoCompoundLegendKey(sub, row.rawLabel),
    }));
    return {
      id: sub,
      centerLabel: t(WATCO_GROUP_LABEL_KEYS[sub], language),
      cards,
    };
  });
}

export function watcoHighlightMapHref(departmentCode: string, legendKey: string): string {
  return `/?dept=${encodeURIComponent(departmentCode)}&legend=${encodeURIComponent(legendKey)}`;
}
