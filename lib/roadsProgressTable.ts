import type { DepartmentSummaryContent, RoadsProgressRow } from '../services/api';

export type { RoadsProgressRow };

export const ROADS_PROGRESS_COLUMNS = [
  { key: 'sl_no' as const, en: 'Sl. No.', or: 'କ୍ରମିକ ନং' },
  { key: 'fy' as const, en: 'FY', or: 'ଆର୍ଥିକ ବର୍ଷ' },
  {
    key: 'upgraded_gp_to_rd' as const,
    en: 'Total km of Upgraded GP → RD',
    or: 'GP ରୁ RD ଉନ୍ନତ ମୋଟ କି.ମି.',
  },
  {
    key: 'upgraded_rd_to_pwd' as const,
    en: 'Total km of Upgraded RD → PWD',
    or: 'RD ରୁ PWD ଉନ୍ନତ ମୋଟ କି.ମି.',
  },
  {
    key: 'total_no_upgraded_gp_to_rd' as const,
    en: 'Total no of Upgraded GP → RD',
    or: 'GP ରୁ RD ଉନ୍ନତ ମୋଟ ସଂଖ୍ୟା',
  },
  {
    key: 'total_no_upgraded_rd_to_pwd' as const,
    en: 'Total no of Upgraded RD → PWD',
    or: 'RD ରୁ PWD ଉନ୍ନତ ମୋଟ ସଂଖ୍ୟା',
  },
  { key: 'proposal_l_no' as const, en: 'Proposal LNo', or: 'ପ୍ରସ୍ତାବ LNo' },
  {
    key: 'proposal_sent_date' as const,
    en: 'Proposal sent date',
    or: 'ପ୍ରସ୍ତାବ ପଠାଇବା ତାରିଖ',
  },
  {
    key: 'proposal_approved' as const,
    en: 'Proposal approved',
    or: 'ପ୍ରସ୍ତାବ ଅନୁମୋଦିତ',
  },
] as const;

const ROADS_PROGRESS_VALUE_KEYS = [
  'fy',
  'upgraded_gp_to_rd',
  'upgraded_rd_to_pwd',
  'total_no_upgraded_gp_to_rd',
  'total_no_upgraded_rd_to_pwd',
  'proposal_l_no',
  'proposal_sent_date',
  'proposal_approved',
] as const satisfies readonly (keyof RoadsProgressRow)[];

function asCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function rowHasData(row: RoadsProgressRow): boolean {
  return ROADS_PROGRESS_VALUE_KEYS.some((key) => asCell(row[key]) !== '');
}

function normalizeRow(raw: Record<string, unknown>): RoadsProgressRow {
  const row: RoadsProgressRow = {};
  const keys = new Set<string>(['sl_no', ...ROADS_PROGRESS_VALUE_KEYS]);
  for (const key of keys) {
    const v = asCell(raw[key]);
    if (v) row[key as keyof RoadsProgressRow] = v;
  }
  if (!row.proposal_sent_date) {
    const legacySent = asCell(raw.proposal_sent);
    if (legacySent) row.proposal_sent_date = legacySent;
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
