import type { DepartmentSummaryContent } from '../services/api';

export type DepartmentSummaryMinister = {
  id: string;
  name?: string | null;
  name_od?: string | null;
  designation?: string | null;
  designation_od?: string | null;
  message?: string | null;
  message_od?: string | null;
  photo_url?: string | null;
};

export type SummaryLang = 'en' | 'od';

/** Map app language (`or`) and summary lang (`od`) to minister field locale. */
export function toSummaryLang(language: string): SummaryLang {
  if (language === 'or' || language === 'od') return 'od';
  return 'en';
}

export function newMinisterRow(): DepartmentSummaryMinister {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
    name: '',
    name_od: '',
    designation: '',
    designation_od: '',
    message: '',
    message_od: '',
    photo_url: '',
  };
}

function pickLocalized(en?: string | null, od?: string | null, lang: SummaryLang = 'en'): string {
  const enText = (en || '').trim();
  const odText = (od || '').trim();
  if (lang === 'od') return odText || enText;
  return enText || odText;
}

function normalizeRow(raw: unknown, index: number): DepartmentSummaryMinister | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  const designation = String(row.designation ?? '').trim();
  const message = String(row.message ?? '').trim();
  const photo = String(row.photo_url ?? '').trim();
  if (!name && !designation && !message && !photo) return null;
  return {
    id: String(row.id ?? `minister-${index}`),
    name: name || null,
    name_od: String(row.name_od ?? '').trim() || null,
    designation: designation || null,
    designation_od: String(row.designation_od ?? '').trim() || null,
    message: message || null,
    message_od: String(row.message_od ?? '').trim() || null,
    photo_url: photo || null,
  };
}

export function parseSummaryMinisters(raw: unknown): DepartmentSummaryMinister[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => normalizeRow(item, index))
    .filter((row): row is DepartmentSummaryMinister => row != null);
}

/** Ministers shown on the public summary page (admin-managed list order only). */
export function resolveSummaryMinisters(
  summary: DepartmentSummaryContent | null | undefined,
  _lang: SummaryLang = 'en',
): DepartmentSummaryMinister[] {
  if (!summary) return [];
  return parseSummaryMinisters(summary.summary_ministers);
}

export function ministersForSave(rows: DepartmentSummaryMinister[]): DepartmentSummaryMinister[] {
  return rows
    .map((row) => ({
      id: row.id,
      name: (row.name || '').trim() || null,
      name_od: (row.name_od || '').trim() || null,
      designation: (row.designation || '').trim() || null,
      designation_od: (row.designation_od || '').trim() || null,
      message: (row.message || '').trim() || null,
      message_od: (row.message_od || '').trim() || null,
      photo_url: (row.photo_url || '').trim() || null,
    }))
    .filter(
      (row) =>
        row.name ||
        row.name_od ||
        row.designation ||
        row.designation_od ||
        row.message ||
        row.message_od ||
        row.photo_url,
    );
}

export function reorderMinisters(
  rows: DepartmentSummaryMinister[],
  dragId: string,
  targetId: string,
): DepartmentSummaryMinister[] {
  if (dragId === targetId) return rows;
  const from = rows.findIndex((r) => r.id === dragId);
  const to = rows.findIndex((r) => r.id === targetId);
  if (from < 0 || to < 0) return rows;
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function localizedMinisterField(
  row: DepartmentSummaryMinister,
  field: 'name' | 'designation' | 'message',
  lang: SummaryLang,
): string {
  if (field === 'name') return pickLocalized(row.name, row.name_od, lang);
  if (field === 'designation') return pickLocalized(row.designation, row.designation_od, lang);
  return pickLocalized(row.message, row.message_od, lang);
}
