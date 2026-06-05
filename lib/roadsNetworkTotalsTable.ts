import type { DepartmentSummaryContent, RoadsNetworkTotalsRow } from '../services/api';

export type { RoadsNetworkTotalsRow };

export const ROADS_NETWORK_TOTALS_COLUMNS = [
  { key: 'sl_no' as const, en: 'Sl. No.', or: 'କ୍ରମିକ ନং' },
  { key: 'total_pwd_road' as const, en: 'Total PWD road', or: 'ମୋଟ PWD ରୋଡ୍' },
  { key: 'total_rd_road' as const, en: 'Total RD road', or: 'ମୋଟ RD ରୋଡ୍' },
  { key: 'total_gp_road' as const, en: 'Total GP road', or: 'ମୋଟ GP ରୋଡ୍' },
] as const;

function asCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function rowHasData(row: RoadsNetworkTotalsRow): boolean {
  return ROADS_NETWORK_TOTALS_COLUMNS.some(
    (col) => col.key !== 'sl_no' && asCell(row[col.key]) !== '',
  );
}

function normalizeRow(raw: Record<string, unknown>): RoadsNetworkTotalsRow {
  const row: RoadsNetworkTotalsRow = {};
  for (const col of ROADS_NETWORK_TOTALS_COLUMNS) {
    const v = asCell(raw[col.key]);
    if (v) row[col.key] = v;
  }
  return row;
}

/** Pull legacy totals from old combined roads_progress_rows when needed. */
function legacyTotalsFromProgress(summary: DepartmentSummaryContent | null | undefined): RoadsNetworkTotalsRow[] {
  const progress = summary?.roads_progress_rows;
  if (!Array.isArray(progress)) return [];
  const rows: RoadsNetworkTotalsRow[] = [];
  for (const item of progress) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const row = normalizeRow({
      sl_no: raw.sl_no,
      total_pwd_road: raw.total_pwd_road,
      total_rd_road: raw.total_rd_road,
      total_gp_road: raw.total_gp_road,
    });
    if (rowHasData(row)) rows.push(row);
  }
  return rows;
}

export function parseRoadsNetworkTotalsRows(
  summary: DepartmentSummaryContent | null | undefined,
): RoadsNetworkTotalsRow[] {
  const raw = summary?.roads_network_totals_rows;
  if (Array.isArray(raw) && raw.length > 0) {
    const rows: RoadsNetworkTotalsRow[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const row = normalizeRow(item as Record<string, unknown>);
      if (rowHasData(row)) rows.push(row);
    }
    if (rows.length) return rows;
  }
  return legacyTotalsFromProgress(summary);
}

export function displayRoadsNetworkTotalsCell(value: string | null | undefined): string {
  const s = asCell(value);
  return s || '—';
}
