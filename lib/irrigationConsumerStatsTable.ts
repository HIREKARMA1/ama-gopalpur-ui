import type { DepartmentSummaryContent, IrrigationConsumerStatsRow } from '../services/api';

export type { IrrigationConsumerStatsRow };

export const IRRIGATION_CONSUMER_STATS_COLUMNS = [
  { key: 'sl_no' as const, en: 'Sl. No.', or: 'କ୍ରମିକ ନଂ' },
  {
    key: 'total_panchayat_covered' as const,
    en: 'Total panchayat covered',
    or: 'ମୋଟ ପଞ୍ଚାୟତ ଆବୃତ',
  },
  { key: 'total_ayacut_area' as const, en: 'Total ayacut area', or: 'ମୋଟ ଆୟାକଟ୍ କ୍ଷେତ୍ର' },
  { key: 'total_beneficiaries' as const, en: 'Total beneficiaries', or: 'ମୋଟ ଲାଭାନ୍ବିତ' },
  { key: 'total_crops' as const, en: 'Total crops', or: 'ମୋଟ ଫସଲ' },
] as const;

function asCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function rowHasData(row: IrrigationConsumerStatsRow): boolean {
  return IRRIGATION_CONSUMER_STATS_COLUMNS.some((col) => asCell(row[col.key]) !== '');
}

function normalizeRow(raw: Record<string, unknown>): IrrigationConsumerStatsRow {
  const row: IrrigationConsumerStatsRow = {};
  for (const col of IRRIGATION_CONSUMER_STATS_COLUMNS) {
    const v = asCell(raw[col.key]);
    if (v) row[col.key] = v;
  }
  return row;
}

export function parseIrrigationConsumerStatsRows(
  summary: DepartmentSummaryContent | null | undefined,
): IrrigationConsumerStatsRow[] {
  const raw = summary?.irrigation_consumer_stats_rows;
  if (!Array.isArray(raw)) return [];
  const rows: IrrigationConsumerStatsRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = normalizeRow(item as Record<string, unknown>);
    if (rowHasData(row)) rows.push(row);
  }
  return rows;
}

export function displayIrrigationConsumerStatsCell(value: string | null | undefined): string {
  const s = asCell(value);
  return s || '—';
}

