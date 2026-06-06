import type { Organization } from '../services/api';

export type RevenueLandHighlightTreeNode = {
  id: string;
  label: string;
  count?: string;
  countLabel?: string;
  href?: string;
  children?: RevenueLandHighlightTreeNode[];
};

export function isRevenueTahasilOffice(org: Organization): boolean {
  return (org.sub_department || '').toUpperCase() === 'TAHASIL_OFFICE';
}

export function isRevenueLandParcel(org: Organization): boolean {
  return !isRevenueTahasilOffice(org);
}

function tahasilOfficeLabel(org: Organization, language: 'en' | 'or'): string {
  const name = (org.name || '').trim();
  if (name) return name;
  return language === 'or' ? 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ' : 'Tahasil office';
}

function parcelCountLabel(count: number, language: 'en' | 'or'): string {
  if (language === 'or') {
    return count === 1 ? 'ଜମି' : 'ଜମି';
  }
  return count === 1 ? 'land' : 'lands';
}

/** Count parcel orgs linked to a Tahasil office (by attributes.tahasil_office_org_id). */
export function countParcelsForTahasilOffice(
  parcels: Organization[],
  tahasilOrgId: number,
): number {
  return parcels.filter((parcel) => {
    const attrs = (parcel.attributes ?? {}) as Record<string, unknown>;
    const linked = Number(attrs.tahasil_office_org_id);
    return Number.isFinite(linked) && linked === tahasilOrgId;
  }).length;
}

export function buildRevenueLandHighlightTree(
  organizations: Organization[],
  rootLabel: string,
  departmentCode: string,
  language: 'en' | 'or',
): RevenueLandHighlightTreeNode {
  const tahasilOffices = organizations
    .filter(isRevenueTahasilOffice)
    .sort((a, b) => a.name.localeCompare(b.name));
  const parcels = organizations.filter(isRevenueLandParcel);

  const children: RevenueLandHighlightTreeNode[] = tahasilOffices.map((office) => {
    const count = countParcelsForTahasilOffice(parcels, office.id);
    return {
      id: `tahasil-${office.id}`,
      label: tahasilOfficeLabel(office, language),
      count: String(count),
      countLabel: parcelCountLabel(count, language),
      href: `/?dept=${encodeURIComponent(departmentCode)}&org=${office.id}`,
    };
  });

  return {
    id: 'revenue-root',
    label: rootLabel,
    children,
  };
}
