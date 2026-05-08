export function buildDepartmentSummaryPath(
  departmentId: number,
  _departmentName?: string | null,
): string {
  const id = Number(departmentId);
  if (!Number.isFinite(id) || id <= 0) return '/';
  return `/departments/${id}/summary`;
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

