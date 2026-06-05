import type { Organization } from '../services/api';
import {
  buildDedupedRoadFilterOptions,
  normalizeConstituencyBlock,
  roadMatchesLocationFilter,
  ROADS_CONSTITUENCY_BLOCKS,
  ROADS_GP_EXCLUDED_BLOCK,
} from './roadsOrganization';

/** Urban block uses ward/locality only — hide village filter and column when selected. */
export const SUMMARY_BLOCK_WITHOUT_VILLAGE = ROADS_GP_EXCLUDED_BLOCK;

export function summaryBlockShowsVillageFilter(blockFilter: string): boolean {
  return blockFilter !== SUMMARY_BLOCK_WITHOUT_VILLAGE;
}

/** Block / ULB from organization attributes (minister CSV conventions). */
export function summaryOrgBlock(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return String(
    attrs.block ??
      attrs.block_ulb ??
      attrs.ulb_block ??
      attrs.ulb ??
      org.address ??
      '',
  ).trim();
}

/** GP / Ward from organization attributes. */
export function summaryOrgGpWard(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return String(
    attrs.gp_ward ??
      attrs.gpward ??
      attrs.gp_ward_name ??
      attrs.gp_name ??
      attrs.gp ??
      attrs.gram_panchayat ??
      attrs.ward ??
      '',
  ).trim();
}

/** Village / locality from organization attributes. */
export function summaryOrgVillage(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  return String(
    attrs.village ??
      attrs.village_name ??
      attrs.village_locality ??
      attrs.ward_village ??
      attrs.locality ??
      '',
  ).trim();
}

export function summaryBlockFilterOptions() {
  return ROADS_CONSTITUENCY_BLOCKS.map((b) => ({ value: b.value, label: b.label }));
}

export function summaryLocationFilterOptions(values: string[]) {
  return buildDedupedRoadFilterOptions(values);
}

export function summaryMatchesBlockFilter(org: Organization, filterValue: string): boolean {
  if (filterValue === 'ALL') return true;
  return normalizeConstituencyBlock(summaryOrgBlock(org)) === filterValue;
}

export function summaryMatchesGpFilter(org: Organization, filterValue: string): boolean {
  return roadMatchesLocationFilter(summaryOrgGpWard(org), filterValue);
}

export function summaryMatchesVillageFilter(org: Organization, filterValue: string): boolean {
  return roadMatchesLocationFilter(summaryOrgVillage(org), filterValue);
}

export function summaryLocationSearchText(org: Organization): string {
  return [summaryOrgBlock(org), summaryOrgGpWard(org), summaryOrgVillage(org)]
    .join(' ')
    .toLowerCase();
}
