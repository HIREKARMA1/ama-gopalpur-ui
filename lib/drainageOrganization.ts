import type { DrainFeature } from '../components/map/ConstituencyMap';
import type { MessageKey } from '../components/i18n/messages';
import { t } from '../components/i18n/messages';
import { getDrainLineKind, type DrainLineKind } from './mapConfig';
import type { Organization } from '../services/api';

export type { DrainLineKind };

export const DRAINAGE_CSV_HEADER =
  'PROJECT NAME,DRAIN NAME,DRAIN TYPE,LENGTH (KM),START LATITUDE,START LONGITUDE,END LATITUDE,END LONGITUDE,REMARKS,PATH COORDINATES';

export const DRAINAGE_TSV_HEADER =
  'PROJECT NAME\tDRAIN NAME\tDRAIN TYPE\tLENGTH (KM)\tSTART LATITUDE\tSTART LONGITUDE\tEND LATITUDE\tEND LONGITUDE\tREMARKS\tPATH COORDINATES';

export function getDrainLineKindFromOrg(org: Organization): DrainLineKind {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  const stored = String(attrs.drain_line_kind ?? '').trim().toUpperCase();
  if (stored === 'MAIN' || stored === 'BRANCH') return stored;
  return getDrainLineKind(org.name ?? '');
}

export function drainageTypeMessageKey(kind: string): MessageKey | null {
  if (kind === 'MAIN') return 'map.drainage.legend.mainChannel';
  if (kind === 'BRANCH') return 'map.drainage.legend.branchLink';
  return null;
}

export function parsePathCoordinates(raw: string | null | undefined): [number, number][] {
  const s = (raw || '').trim();
  if (!s) return [];

  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      const coords = parsed
        .filter((pt) => Array.isArray(pt) && pt.length >= 2)
        .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number])
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
      if (coords.length >= 2) return coords;
    }
  } catch {
    // fall through
  }

  const linestringMatch = s.match(/LINESTRING\s*\(([^)]+)\)/i);
  if (linestringMatch?.[1]) {
    const coords = linestringMatch[1]
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [lngStr = '', latStr = ''] = pair.split(/\s+/);
        return [Number(lngStr), Number(latStr)] as [number, number];
      })
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    if (coords.length >= 2) return coords;
  }

  for (const sep of ['|', ';'] as const) {
    if (!s.includes(sep)) continue;
    const legacyCoords = s
      .split(sep)
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [lngStr = '', latStr = ''] = pair.split(/\s+/);
        return [Number(lngStr), Number(latStr)] as [number, number];
      })
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    if (legacyCoords.length >= 2) return legacyCoords;
  }

  const nums = (s.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => Number(n));
  if (nums.length < 4) return [];
  const inferred: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lng = nums[i];
    const lat = nums[i + 1];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    inferred.push([lng, lat]);
  }
  return inferred.length >= 2 ? inferred : [];
}

export function orgToDrainFeature(org: Organization): DrainFeature | null {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  const pathCoordinates = parsePathCoordinates(String(attrs.path_coordinates ?? ''));
  const startLat = Number(attrs.start_lat ?? NaN);
  const startLng = Number(attrs.start_lng ?? NaN);
  const endLat = Number(attrs.end_lat ?? NaN);
  const endLng = Number(attrs.end_lng ?? NaN);
  const lineKind = getDrainLineKindFromOrg(org);

  const fallbackCoords: [number, number][] =
    Number.isFinite(startLat) &&
    Number.isFinite(startLng) &&
    Number.isFinite(endLat) &&
    Number.isFinite(endLng)
      ? [
          [startLng, startLat],
          [endLng, endLat],
        ]
      : org.latitude != null && org.longitude != null
        ? [[org.longitude, org.latitude]]
        : [];

  const coordinates =
    pathCoordinates.length >= 2
      ? pathCoordinates
      : fallbackCoords.length >= 2
        ? fallbackCoords
        : [];

  if (coordinates.length < 2) return null;

  return {
    type: 'Feature',
    properties: {
      organizationId: org.id,
      name: org.name,
      drainName: org.name,
      project: String(attrs.project_name ?? org.address ?? ''),
      drainLineKind: lineKind,
      lengthKm: String(attrs.length_km ?? ''),
      remarks: String(attrs.remarks ?? ''),
      block: String(attrs.project_name ?? attrs.block ?? org.address ?? ''),
    },
    geometry: { type: 'LineString', coordinates },
  };
}

/** Admin table + CSV-aligned columns (Drain Name is org.name). */
export const DRAINAGE_TABLE_COLUMNS = [
  'Drain Name',
  'Project',
  'Type',
  'Length (KM)',
  'Start Lat',
  'Start Lng',
  'End Lat',
  'End Lng',
  'Remarks',
] as const;

/** Extra columns on public department summary listing (after category). */
export const DRAINAGE_SUMMARY_TABLE_COLUMNS = [
  'Project',
  'Length (KM)',
  'Start Lat',
  'Start Lng',
  'End Lat',
  'End Lng',
  'Remarks',
] as const;

const DRAINAGE_SUMMARY_COLUMN_KEYS: Record<(typeof DRAINAGE_SUMMARY_TABLE_COLUMNS)[number], MessageKey> = {
  Project: 'dept.summary.drainage.project',
  'Length (KM)': 'dept.summary.drainage.lengthKm',
  'Start Lat': 'dept.summary.drainage.startLat',
  'Start Lng': 'dept.summary.drainage.startLng',
  'End Lat': 'dept.summary.drainage.endLat',
  'End Lng': 'dept.summary.drainage.endLng',
  Remarks: 'dept.summary.drainage.remarks',
};

export function drainageSummaryColumnLabel(
  column: (typeof DRAINAGE_SUMMARY_TABLE_COLUMNS)[number],
  lang: 'en' | 'or',
): string {
  const key = DRAINAGE_SUMMARY_COLUMN_KEYS[column];
  return key ? t(key, lang) : column;
}

export function getDrainTableColumnValue(org: Organization, column: string): string {
  const fallback = (v: unknown) => (v != null && String(v).trim() !== '' ? String(v) : '');
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  if (column === 'Drain Name') return fallback(org.name);
  const map: Record<string, unknown> = {
    Project: attrs.project_name ?? org.address,
    Type: attrs.drain_line_kind ?? getDrainLineKindFromOrg(org),
    'Length (KM)': attrs.length_km,
    'Start Lat': attrs.start_lat ?? org.latitude,
    'Start Lng': attrs.start_lng ?? org.longitude,
    'End Lat': attrs.end_lat,
    'End Lng': attrs.end_lng,
    Remarks: attrs.remarks,
  };
  return fallback(map[column]);
}
