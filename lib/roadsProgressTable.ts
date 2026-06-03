import type { DepartmentSummaryContent, RoadsProgressRow } from '../services/api';

export type { RoadsProgressRow };

export const ROADS_PROGRESS_COLUMNS = [
  { key: 'sl_no' as const, en: 'Sl. No.', or: 'କ୍ରମିକ ନং' },
  { key: 'total_pwd_road' as const, en: 'Total PWD road', or: 'ମୋଟ PWD ରୋଡ୍' },
  { key: 'total_rd_road' as const, en: 'Total RD road', or: 'ମୋଟ RD ରୋଡ୍' },
  { key: 'total_gp_road' as const, en: 'Total GP road', or: 'ମୋଟ GP ରୋଡ୍' },
  { key: 'upgraded_gp_to_rd' as const, en: 'Upgraded GP → RD', or: 'GP ରୁ RD ଉନ୍ନତ' },
  { key: 'upgraded_rd_to_pwd' as const, en: 'Upgraded RD → PWD', or: 'RD ରୁ PWD ଉନ୍ନତ' },
  { key: 'fy' as const, en: 'FY', or: 'ଆର୍ଥିକ ବର୍ଷ' },
  { key: 'proposal_sent' as const, en: 'Proposal sent', or: 'ପ୍ରସ୍ତାବ ପଠାଯାଇଛି' },
  { key: 'proposal_approved' as const, en: 'Proposal approved', or: 'ପ୍ରସ୍ତାବ ଅନୁମୋଦିତ' },
] as const;

function asCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function rowHasData(row: RoadsProgressRow): boolean {
  return ROADS_PROGRESS_COLUMNS.some((col) => asCell(row[col.key]) !== '');
}

function normalizeRow(raw: Record<string, unknown>): RoadsProgressRow {
  const row: RoadsProgressRow = {};
  for (const col of ROADS_PROGRESS_COLUMNS) {
    const v = asCell(raw[col.key]);
    if (v) row[col.key] = v;
  }
  return row;
}

export function parseRoadsProgressRows(
  summary: DepartmentSummaryContent | null | undefined,
): RoadsProgressRow[] {
  const raw = summary?.roads_progress_rows;
  if (!Array.isArray(raw)) return [];
  const rows: RoadsProgressRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = normalizeRow(item as Record<string, unknown>);
    if (rowHasData(row)) rows.push(row);
  }
  return rows;
}

export function displayRoadsProgressCell(value: string | null | undefined): string {
  const s = asCell(value);
  return s || '—';
}
