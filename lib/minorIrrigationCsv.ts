import type { Organization } from '../services/api';
import { MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM } from '../components/admin/MinorIrrigationPortfolioAdminForm';

/** Minister / MIP attribute columns (original bulk format). */
export const MINOR_IRRIGATION_MINISTER_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,MIP ID,NAME OF M.I.P,CATEGORY/TYPE,LATITUDE,LONGITUDE,LOCATION PRECISION (METER),CATCHMENT AREA (SQ KM),COMMAND AREA KHARIF (ACRES),COMMAND AREA RABI (ACRES),TOTAL AYACUT (ACRES),STORAGE CAPACITY (MCUM),MWL (FT),FRL (FT),TBL (FT),SPILLWAY TYPE,SPILLWAY WIDTH (FT),NO OF SLUICES,SLUICE TYPE,CONDITION,FUNCTIONALITY,MANAGED BY,LAST MAINTENANCE,SENSORS INSTALLED,LAST GEOTAGGED DATE,BENEFICIARY FARMERS COUNT,BENEFICIARY SC/ST COUNT,SANCTIONED AMT (LAKHS),EXPENDITURE (LAKHS),FOREST CLEARANCE (Y/N),REMARKS';

/** Portfolio / public-site fields (images, JSON card arrays, contact, etc.). */
export const MINOR_IRRIGATION_PORTFOLIO_CSV_COLUMNS = Object.keys(
  MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM,
) as (keyof typeof MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM)[];

export const MINOR_IRRIGATION_JSON_PROFILE_KEYS = new Set([
  'minor_key_admin_cards_json',
  'minor_facility_cards_json',
  'minor_faculty_cards_json',
  'minor_staff_rows_json',
  'gallery_images',
]);

export function splitCsvHeaderLine(header: string): string[] {
  return header.trim().replace(/\n$/, '').split(',').map((h) => h.trim());
}

export function minorIrrigationSnakeFromHeader(label: string): string {
  return label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[?]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

export function getMinorIrrigationMinisterCsvHeaders(): string[] {
  return splitCsvHeaderLine(MINOR_IRRIGATION_MINISTER_CSV_HEADER);
}

/** Full round-trip header: minister columns + all portfolio keys. */
export function getMinorIrrigationAllCsvHeaders(): string[] {
  return [...getMinorIrrigationMinisterCsvHeaders(), ...MINOR_IRRIGATION_PORTFOLIO_CSV_COLUMNS];
}

export const MINOR_IRRIGATION_CSV_HEADER = `${getMinorIrrigationAllCsvHeaders().join(',')}\n`;

function stringifyProfileValue(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function displayProfileValue(raw: unknown, maxLen = 80): string {
  const s = stringifyProfileValue(raw);
  if (!s) return '';
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

/** Resolve one CSV column to export string. */
export function minorIrrigationExportCell(
  org: Organization,
  profile: Record<string, unknown> | undefined,
  header: string,
): string {
  const key = minorIrrigationSnakeFromHeader(header);
  if (header === 'NAME OF M.I.P') return org.name?.trim() || stringifyProfileValue(profile?.[key]);
  if (header === 'LATITUDE') {
    return org.latitude != null ? String(org.latitude) : stringifyProfileValue(profile?.[key]);
  }
  if (header === 'LONGITUDE') {
    return org.longitude != null ? String(org.longitude) : stringifyProfileValue(profile?.[key]);
  }
  if (MINOR_IRRIGATION_PORTFOLIO_CSV_COLUMNS.includes(header as keyof typeof MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM)) {
    return stringifyProfileValue(profile?.[header]);
  }
  return stringifyProfileValue(profile?.[key]);
}

/** Table cell display (truncated for wide JSON / URLs). */
export function minorIrrigationTableCell(
  org: Organization,
  profile: Record<string, unknown> | undefined,
  header: string,
): string {
  const full = minorIrrigationExportCell(org, profile, header);
  if (!full) return '';
  const key = MINOR_IRRIGATION_PORTFOLIO_CSV_COLUMNS.includes(
    header as keyof typeof MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM,
  )
    ? header
    : minorIrrigationSnakeFromHeader(header);
  const isJsonCol =
    MINOR_IRRIGATION_JSON_PROFILE_KEYS.has(key) ||
    key.endsWith('_json') ||
    key === 'gallery_images';
  const isUrlCol = key.includes('image') || key.includes('photo') || key.includes('hero');
  if (isJsonCol || isUrlCol) return displayProfileValue(full, 72);
  return full.length > 96 ? `${full.slice(0, 96)}…` : full;
}

export function minorIrrigationTableColSpan(): number {
  // checkbox + sl + name + minister (minus name col) + portfolio + actions
  return 3 + getMinorIrrigationAllCsvHeaders().filter((h) => h !== 'NAME OF M.I.P').length + 1;
}
