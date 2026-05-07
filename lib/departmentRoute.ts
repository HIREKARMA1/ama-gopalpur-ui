export function buildDepartmentSummaryPath(
  departmentId: number,
  departmentName?: string | null,
): string {
  const id = Number(departmentId);
  if (!Number.isFinite(id) || id <= 0) return '/';
  const nameSlug = slugifySegment(departmentName || 'department');
  return `/departments/${nameSlug}-${id}/summary`;
}

export function extractDepartmentIdFromParam(rawParam: string): number {
  const raw = String(rawParam || '').trim();
  if (!raw) return NaN;
  const direct = Number(raw);
  if (Number.isFinite(direct)) return direct;
  const match = raw.match(/(\d+)(?!.*\d)/);
  if (!match?.[1]) return NaN;
  return Number(match[1]);
}

function slugifySegment(raw: string): string {
  return String(raw || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
