import type { Organization } from '../services/api';

/** True when road sector is GP (may appear as map pin or line when coordinates exist). */
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

/** True when road sector is Municipality (may appear as map pin or line when coordinates exist). */
export function isMunicipalityRoadSector(raw: unknown): boolean {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  if (!s) return false;
  if (s === 'MUNICIPALITY' || s === 'MUNICIPAL' || s === 'MUNICIPAL ROAD' || s === 'MUNICIPAL ROADS') {
    return true;
  }
  if (s.includes('MUNICIPALITY') || s.includes('MUNICIPAL')) return true;
  return s.split(/[/,|]/).some((part) => {
    const p = part.trim();
    return p === 'MUNICIPALITY' || p === 'MUNICIPAL';
  });
}

/** GP or Municipality roads may be listed without map geometry; start lat/lng enables a map pin. */
export function isSummaryOnlyRoadSector(raw: unknown): boolean {
  return isGpRoadSector(raw) || isMunicipalityRoadSector(raw);
}

/** Bulk CSV: GP / Municipality rows need location fields (no coordinates). */
export function validateSummaryOnlyRoadImportRow(parts: {
  block?: string;
  gpWard?: string;
  village?: string;
  roadName?: string;
  roadSector?: string;
}): string | null {
  if (!isSummaryOnlyRoadSector(parts.roadSector)) return null;
  if (!String(parts.roadName ?? '').trim()) return 'ROAD NAME is required';
  if (!String(parts.roadSector ?? '').trim()) return 'ROAD SECTOR is required (use GP or Municipality)';
  const isGp = isGpRoadSector(parts.roadSector);
  const isMunicipality = isMunicipalityRoadSector(parts.roadSector);
  const sectorLabel = isMunicipality && !isGp ? 'Municipality' : isGp && !isMunicipality ? 'GP' : 'GP/Municipality';
  if (!String(parts.block ?? '').trim()) return `BLOCK is required for ${sectorLabel} roads`;
  if (!String(parts.gpWard ?? '').trim()) return `GP/WARD is required for ${sectorLabel} roads`;
  if (isGp && !String(parts.village ?? '').trim()) return 'VILLAGE is required for GP roads';
  return null;
}

/** Header aliases for ROAD SECTOR column in minister CSV templates. */
export const ROAD_SECTOR_CSV_HEADER_ALIASES = [
  'road sector(nh/sh/pwd/rd/ps/gp/municipality)',
  'road sector(nh/sh/pwd/rd/ps/gp)',
  'road_sector',
  'road sector',
  'type',
] as const;

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

/** Parse "A to B" / "A - B" road names into start/end labels. */
export function parseRoadPointNames(roadName: unknown): { pointA: string; pointB: string } {
  const name = String(roadName ?? '').trim();
  if (!name) return { pointA: '', pointB: '' };
  const match = name.match(/^\s*(.+?)\s+(?:to|-|–|—)\s+(.+?)\s*$/i);
  if (!match) return { pointA: '', pointB: '' };
  return { pointA: match[1].trim(), pointB: match[2].trim() };
}

/** Count usable points in a path_coordinates attribute string. */
export function countRoadPathPoints(raw: unknown): number {
  return parseRoadPathCoordinates(String(raw ?? '')).length;
}

/** Normalize before/after image URL lists from road attributes. */
export function parseRoadImageKeys(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u).trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u).trim()).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }
  return s
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

export type RoadMapGeometry =
  | { kind: 'line'; coordinates: [number, number][] }
  | { kind: 'point'; coordinates: [number, number] };

function parseRoadCoordNumber(raw: unknown): number | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** True when lat/lng are non-blank, in range, and not zero (invalid for this constituency). */
export function isUsableRoadLatLng(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  if (lat === 0 || lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

function isDistinctRoadEndpointPair(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): boolean {
  return Math.abs(startLat - endLat) > 1e-6 || Math.abs(startLng - endLng) > 1e-6;
}

/** Resolved map geometry for an organization (line track or start pin). */
export function getRoadMapGeometry(org: Organization): RoadMapGeometry | null {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  const pathCoordinates = parseRoadPathCoordinates(String(attrs.path_coordinates ?? ''));
  const startLat = parseRoadCoordNumber(attrs.start_lat);
  const startLng = parseRoadCoordNumber(attrs.start_lng);
  const endLat = parseRoadCoordNumber(attrs.end_lat);
  const endLng = parseRoadCoordNumber(attrs.end_lng);
  const hasStart = isUsableRoadLatLng(startLat, startLng);
  const hasEnd = isUsableRoadLatLng(endLat, endLng);

  if (pathCoordinates.length >= 2) {
    return { kind: 'line', coordinates: pathCoordinates };
  }
  if (
    hasStart &&
    hasEnd &&
    isDistinctRoadEndpointPair(startLat!, startLng!, endLat!, endLng!)
  ) {
    return { kind: 'line', coordinates: [[startLng!, startLat!], [endLng!, endLat!]] };
  }
  if (hasStart) {
    return { kind: 'point', coordinates: [startLng!, startLat!] };
  }
  const orgLat = parseRoadCoordNumber(org.latitude);
  const orgLng = parseRoadCoordNumber(org.longitude);
  if (isUsableRoadLatLng(orgLat, orgLng)) {
    return { kind: 'point', coordinates: [orgLng!, orgLat!] };
  }
  return null;
}

/** Organization can be drawn on the map (polyline or start pin). */
export function organizationHasRoadMapGeometry(org: Organization): boolean {
  return getRoadMapGeometry(org) != null;
}

export type RoadImportGeometryFields = {
  pathCoordinates?: string | null;
  startLat?: string | null;
  startLng?: string | null;
  endLat?: string | null;
  endLng?: string | null;
};

/** CSV / admin row has enough data to place the road on the map. */
export function roadImportRowHasMapGeometry(row: RoadImportGeometryFields): boolean {
  const path = parseRoadPathCoordinates(String(row.pathCoordinates ?? ''));
  if (path.length >= 2) return true;
  const startLat = parseRoadCoordNumber(row.startLat);
  const startLng = parseRoadCoordNumber(row.startLng);
  const endLat = parseRoadCoordNumber(row.endLat);
  const endLng = parseRoadCoordNumber(row.endLng);
  const hasStart = isUsableRoadLatLng(startLat, startLng);
  const hasEnd = isUsableRoadLatLng(endLat, endLng);
  if (
    hasStart &&
    hasEnd &&
    isDistinctRoadEndpointPair(startLat!, startLng!, endLat!, endLng!)
  ) {
    return true;
  }
  return hasStart;
}

/** Normalize lat/lng + summary_only from import/manual road rows. */
export function resolveRoadImportGeometry(row: RoadImportGeometryFields) {
  const path = parseRoadPathCoordinates(String(row.pathCoordinates ?? ''));
  const sLat = parseRoadCoordNumber(row.startLat);
  const sLng = parseRoadCoordNumber(row.startLng);
  const eLat = parseRoadCoordNumber(row.endLat);
  const eLng = parseRoadCoordNumber(row.endLng);
  const hasStart = isUsableRoadLatLng(sLat, sLng);
  const hasEnd = isUsableRoadLatLng(eLat, eLng);
  const hasDistinctEnd =
    hasStart && hasEnd && isDistinctRoadEndpointPair(sLat!, sLng!, eLat!, eLng!);
  const hasMapGeometry = roadImportRowHasMapGeometry(row);
  const pathRaw = String(row.pathCoordinates ?? '').trim();

  let start_lat: string | null = null;
  let start_lng: string | null = null;
  let end_lat: string | null = null;
  let end_lng: string | null = null;
  let path_coordinates: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (path.length >= 2) {
    path_coordinates = pathRaw || null;
    start_lat = hasStart ? String(sLat) : String(path[0][1]);
    start_lng = hasStart ? String(sLng) : String(path[0][0]);
    end_lat = String(path[path.length - 1][1]);
    end_lng = String(path[path.length - 1][0]);
    latitude = Number(
      (((parseRoadCoordNumber(start_lat) ?? 0) + (parseRoadCoordNumber(end_lat) ?? 0)) / 2).toFixed(6),
    );
    longitude = Number(
      (((parseRoadCoordNumber(start_lng) ?? 0) + (parseRoadCoordNumber(end_lng) ?? 0)) / 2).toFixed(6),
    );
  } else if (hasDistinctEnd) {
    start_lat = String(sLat);
    start_lng = String(sLng);
    end_lat = String(eLat);
    end_lng = String(eLng);
    latitude = Number(((sLat! + eLat!) / 2).toFixed(6));
    longitude = Number(((sLng! + eLng!) / 2).toFixed(6));
  } else if (hasStart) {
    start_lat = String(sLat);
    start_lng = String(sLng);
    latitude = sLat;
    longitude = sLng;
  }

  return {
    hasMapGeometry,
    latitude,
    longitude,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    path_coordinates,
    summary_only: hasMapGeometry ? null : ('true' as const),
  };
}

/** GP, Municipality, or flagged roads listed on summary only — not shown on map. */
export function isSummaryOnlyGpRoad(org: Organization): boolean {
  if (organizationHasRoadMapGeometry(org)) return false;
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  if (String(attrs.summary_only ?? '').toLowerCase() === 'true') return true;
  return isSummaryOnlyRoadSector(attrs.road_sector);
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

/** Block hidden from summary listing when road type filter is GP. */
export const ROADS_GP_EXCLUDED_BLOCK = 'BERHAMPUR_URBAN_I' as const;

/** True when road-type filter value is Municipality (not ALL). */
export function roadTypeFilterIsMunicipality(filterValue: string): boolean {
  if (filterValue === 'ALL') return false;
  return isMunicipalityRoadSector(filterValue);
}

/** True when road-type filter value is GP (not ALL). */
export function roadTypeFilterIsGp(filterValue: string): boolean {
  if (filterValue === 'ALL') return false;
  return isGpRoadSector(filterValue) && !isMunicipalityRoadSector(filterValue);
}

export function constituencyBlocksForRoadTypeFilter(roadTypeFilter: string) {
  if (!roadTypeFilterIsGp(roadTypeFilter)) return [...ROADS_CONSTITUENCY_BLOCKS];
  return ROADS_CONSTITUENCY_BLOCKS.filter((b) => b.value !== ROADS_GP_EXCLUDED_BLOCK);
}

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

/** True when road sector is PWD or RD (maintenance columns on public summary). */
export function isPwdOrRdRoadSector(raw: unknown): boolean {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  if (!s) return false;
  if (s === 'PWD' || s === 'RD') return true;
  return s.split(/[/,|]/).some((part) => {
    const p = part.trim();
    return p === 'PWD' || p === 'RD';
  });
}

/** Public summary: show length / repaired / condition columns for this filter (not GP/Municipality-only views). */
export function roadsSummaryFilterShowsMaintenanceColumns(roadTypeFilter: string): boolean {
  if (roadTypeFilter === 'ALL') return true;
  if (roadTypeFilterIsGp(roadTypeFilter) || roadTypeFilterIsMunicipality(roadTypeFilter)) return false;
  return isPwdOrRdRoadSector(roadTypeFilter);
}

/** Public summary: row should display maintenance column values (PWD/RD only). */
export function roadOrgShowsMaintenanceColumns(org: Organization): boolean {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  if (isSummaryOnlyRoadSector(attrs.road_sector)) return false;
  return isPwdOrRdRoadSector(attrs.road_sector);
}

export function roadLastRepairedDate(attrs: Record<string, unknown> | null | undefined): string {
  if (!attrs) return '';
  return String(attrs.last_repaired_date ?? attrs.last_maintenance_date ?? '').trim();
}

export function roadPresentCondition(attrs: Record<string, unknown> | null | undefined): string {
  if (!attrs) return '';
  return String(attrs.present_condition ?? '').trim();
}
