export function buildOrganizationProfilePath(
  id: number,
  options?: { departmentCode?: string | null; organizationName?: string | null },
): string {
  const safeId = Number(id);
  if (!Number.isFinite(safeId) || safeId <= 0) return '/organizations';

  const deptSlug = slugifySegment(options?.departmentCode || 'department');
  const orgSlug = slugifySegment(options?.organizationName || 'organization');
  return `/organizations/${deptSlug}-${orgSlug}-${safeId}`;
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
