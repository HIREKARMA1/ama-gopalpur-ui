import type { Organization } from '../services/api';

/** True when road sector is GP (summary listing; map line optional). */
export function isGpRoadSector(raw: unknown): boolean {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  if (!s) return false;
  if (s === 'GP' || s === 'GP ROAD' || s === 'GP ROADS') return true;
  if (s.endsWith('/GP') || s.endsWith(' GP')) return true;
  return s.split(/[/,|]/).some((part) => part.trim() === 'GP');
}

export function parseRoadPathCoordinates(raw: string): [number, number][] {
  const s = (raw || '').trim();
  if (!s) return [];

  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      const coords: [number, number][] = [];
      const walk = (node: unknown): void => {
        if (!Array.isArray(node)) return;
        if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
          coords.push([node[0], node[1]]);
          return;
        }
        for (const child of node) walk(child);
      };
      walk(parsed);
      if (coords.length >= 2) return coords;
    } catch {
      /* fall through */
    }
  }

  const legacyCoords = s
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lngStr = '', latStr = ''] = pair.split(/\s+/);
      return [Number(lngStr), Number(latStr)] as [number, number];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (legacyCoords.length >= 2) return legacyCoords;

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

/** Organization can be drawn as a road polyline on the map. */
export function organizationHasRoadMapGeometry(org: Organization): boolean {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  const pathCoordinates = parseRoadPathCoordinates(String(attrs.path_coordinates ?? ''));
  const startLat = Number(attrs.start_lat ?? NaN);
  const startLng = Number(attrs.start_lng ?? NaN);
  const endLat = Number(attrs.end_lat ?? NaN);
  const endLng = Number(attrs.end_lng ?? NaN);

  if (pathCoordinates.length >= 2) return true;
  return (
    Number.isFinite(startLat) &&
    Number.isFinite(startLng) &&
    Number.isFinite(endLat) &&
    Number.isFinite(endLng)
  );
}

/** GP (or flagged) roads listed on summary only — not shown on map. */
export function isSummaryOnlyGpRoad(org: Organization): boolean {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  if (String(attrs.summary_only ?? '').toLowerCase() === 'true') return true;
  return isGpRoadSector(attrs.road_sector) && !organizationHasRoadMapGeometry(org);
}

function normKeyPart(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/** Dedupe key for bulk import — when road code is missing, use location + name. */
export function roadImportDedupeKey(parts: {
  name: string;
  roadCode?: string;
  block?: string;
  gpWard?: string;
  village?: string;
  roadSector?: string;
}): string {
  const name = normKeyPart(parts.name);
  const code = normKeyPart(parts.roadCode);
  if (code) return `${name}__${code}`;
  return [
    name,
    normKeyPart(parts.block),
    normKeyPart(parts.gpWard),
    normKeyPart(parts.village),
    normKeyPart(parts.roadSector),
  ].join('__');
}

export function roadDedupeKeyFromOrg(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return roadImportDedupeKey({
    name: org.name ?? '',
    roadCode: String(attrs.road_code ?? ''),
    block: String(attrs.block ?? ''),
    gpWard: String(attrs.gp_ward ?? attrs.gpward ?? ''),
    village: String(attrs.village ?? attrs.village_name ?? ''),
    roadSector: String(attrs.road_sector ?? ''),
  });
}

/** Gopalpur constituency blocks shown in road summary / map filters. */
export const ROADS_CONSTITUENCY_BLOCKS = [
  { value: 'RANGEILUNDA', label: 'Rangeilunda' },
  { value: 'KUKUDAKHANDI', label: 'Kukudakhandi' },
  { value: 'BERHAMPUR_URBAN_I', label: 'Berhampur Urban-I' },
] as const;

export function normalizeConstituencyBlock(raw: string | null | undefined): string {
  const v = (raw || '')
    .toUpperCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!v) return '';
  if (v.includes('RANGEILUNDA') || v.includes('RANGAILUNDA')) return 'RANGEILUNDA';
  if (v.includes('KUKUDAKHANDI')) return 'KUKUDAKHANDI';
  if (v.includes('BERHAMPUR') && v.includes('URBAN')) return 'BERHAMPUR_URBAN_I';
  return '';
}

export function roadOrgBlock(org: Organization): string {
  return String((org.attributes ?? {}).block ?? '').trim();
}

export function roadMatchesBlockFilter(org: Organization, filterValue: string): boolean {
  if (filterValue === 'ALL') return true;
  return normalizeConstituencyBlock(roadOrgBlock(org)) === filterValue;
}

export function roadOrgGpWard(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return String(attrs.gp_ward ?? attrs.gpward ?? attrs.gp_ward_name ?? '').trim();
}

export function roadOrgVillage(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return String(attrs.village ?? attrs.village_name ?? '').trim();
}

/** Case-insensitive key for location / type filter dedupe and matching. */
export function normalizeRoadLocationKey(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function canonicalRoadLocationLabel(variants: string[]): string {
  const trimmed = variants.map((v) => v.trim()).filter(Boolean);
  if (!trimmed.length) return '';
  const mixed = trimmed.find((v) => v !== v.toUpperCase());
  if (mixed) return mixed;
  return trimmed[0]
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildDedupedRoadFilterOptions(rawValues: string[]): { value: string; label: string }[] {
  const groups = new Map<string, string[]>();
  for (const raw of rawValues) {
    const t = raw.trim();
    if (!t) continue;
    const key = normalizeRoadLocationKey(t);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([key, variants]) => ({
      value: key,
      label: canonicalRoadLocationLabel(variants),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

export function roadMatchesLocationFilter(
  raw: string,
  filterValue: string,
): boolean {
  if (filterValue === 'ALL') return true;
  const t = raw.trim();
  if (!t) return false;
  return normalizeRoadLocationKey(t) === filterValue;
}
