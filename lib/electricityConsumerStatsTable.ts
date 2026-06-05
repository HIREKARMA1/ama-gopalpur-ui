import type { DepartmentSummaryContent, ElectricityConsumerStatsRow } from '../services/api';

export type { ElectricityConsumerStatsRow };

export const ELECTRICITY_CONSUMER_STATS_COLUMNS = [
  { key: 'sl_no' as const, en: 'Sl. No.', or: 'କ୍ରମିକ ନং' },
  { key: 'total_substation' as const, en: 'Total substation', or: 'ମୋଟ ସବ୍-ଷ୍ଟେସନ' },
  { key: 'total_consumer' as const, en: 'Total consumer', or: 'ମୋଟ ଗ୍ରାହକ' },
  { key: 'total_domestic_consumer' as const, en: 'Total domestic consumer', or: 'ମୋଟ ଘରୋଇ ଗ୍ରାହକ' },
  { key: 'total_commercial_consumer' as const, en: 'Total commercial consumer', or: 'ମୋଟ ବାଣିଜ୍ୟିକ ଗ୍ରାହକ' },
] as const;

function asCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function rowHasData(row: ElectricityConsumerStatsRow): boolean {
  return ELECTRICITY_CONSUMER_STATS_COLUMNS.some((col) => asCell(row[col.key]) !== '');
}

function normalizeRow(raw: Record<string, unknown>): ElectricityConsumerStatsRow {
  const row: ElectricityConsumerStatsRow = {};
  for (const col of ELECTRICITY_CONSUMER_STATS_COLUMNS) {
    const v = asCell(raw[col.key]);
    if (v) row[col.key] = v;
  }
  return row;
}

export function parseElectricityConsumerStatsRows(
  summary: DepartmentSummaryContent | null | undefined,
): ElectricityConsumerStatsRow[] {
  const raw = summary?.electricity_consumer_stats_rows;
  if (!Array.isArray(raw)) return [];
  const rows: ElectricityConsumerStatsRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = normalizeRow(item as Record<string, unknown>);
    if (rowHasData(row)) rows.push(row);
  }
  return rows;
}

export function displayElectricityConsumerStatsCell(value: string | null | undefined): string {
  const s = asCell(value);
  return s || '—';
}
