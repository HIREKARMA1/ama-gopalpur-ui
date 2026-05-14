import type { Organization } from '../services/api';
import type { TableColumn } from '../components/common/PaginatedHorizontalTable';

export type RevenueGovtLandRow = {
  org: Organization;
  profile: Record<string, unknown>;
};

export function formatRevenueGovtLandCell(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

/** Raw string for search/sort (empty if missing; not formatted as em-dash). */
export function getParcelFieldRaw(row: RevenueGovtLandRow, columnKey: string): string {
  if (columnKey === 'name') return String(row.org.name ?? '').trim();
  const p = row.profile;
  switch (columnKey) {
    case 'tahasil':
      return String(p.tahasil ?? '').trim();
    case 'ri_circle':
      return String(p.ri_circle ?? '').trim();
    case 'block_ulb':
      return String(p.block_ulb ?? '').trim();
    case 'gp_ward':
      return String(p.gp_ward ?? '').trim();
    case 'mouza_village':
      return String(p.mouza_village ?? '').trim();
    case 'habitation_locality':
      return String(p.habitation_locality ?? '').trim();
    case 'khata_no':
      return String(p.khata_no ?? '').trim();
    case 'plot_no':
      return String(p.plot_no ?? '').trim();
    case 'land_type_govt_private_other':
      return String(
        (p.land_type_govt_private_other as unknown) ?? (p.land_type as unknown) ?? '',
      ).trim();
    case 'govt_land_category':
      return String(
        p.govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other ?? '',
      ).trim();
    case 'kisam':
      return String(p.kisam ?? '').trim();
    case 'kisam_description':
      return String(p.kisam_description ?? '').trim();
    case 'total_area_acres':
      return String(p.total_area_acres ?? '').trim();
    case 'total_area_hectares':
      return String(p.total_area_hectares ?? '').trim();
    case 'total_area_sqft':
      return String(p.total_area_sqft ?? '').trim();
    case 'ror_year':
      return String(p.ror_year ?? '').trim();
    default:
      return String((p as Record<string, unknown>)[columnKey] ?? '').trim();
  }
}

const NUMERIC_SORT_KEYS = new Set([
  'total_area_acres',
  'total_area_hectares',
  'total_area_sqft',
  'ror_year',
]);

/** Compare two parcel rows by column; uses locale-aware string compare or numeric when appropriate. */
export function compareParcelRowsByColumn(
  a: RevenueGovtLandRow,
  b: RevenueGovtLandRow,
  columnKey: string,
  direction: 'asc' | 'desc',
): number {
  const va = getParcelFieldRaw(a, columnKey);
  const vb = getParcelFieldRaw(b, columnKey);
  let cmp = 0;
  if (NUMERIC_SORT_KEYS.has(columnKey)) {
    const na = Number(va.replace(/,/g, ''));
    const nb = Number(vb.replace(/,/g, ''));
    const fa = Number.isFinite(na) ? na : NaN;
    const fb = Number.isFinite(nb) ? nb : NaN;
    if (Number.isNaN(fa) && Number.isNaN(fb)) cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
    else if (Number.isNaN(fa)) cmp = 1;
    else if (Number.isNaN(fb)) cmp = -1;
    else cmp = fa === fb ? 0 : fa < fb ? -1 : 1;
  } else {
    cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
  }
  return direction === 'asc' ? cmp : -cmp;
}

/** Lowercase blob of all column values + name for global search. */
export function parcelRowSearchHaystack(row: RevenueGovtLandRow, columnKeys: string[]): string {
  const chunks = [getParcelFieldRaw(row, 'name'), ...columnKeys.map((k) => getParcelFieldRaw(row, k))];
  return chunks.join('\u0000').toLowerCase();
}

export function buildRevenueGovtLandColumns(isOdia: boolean): TableColumn<RevenueGovtLandRow>[] {
  return [
    {
      key: 'tahasil',
      header: isOdia ? 'ତହସିଲ' : 'TAHASIL',
      render: (r) => formatRevenueGovtLandCell(r.profile['tahasil']),
    },
    {
      key: 'ri_circle',
      header: isOdia ? 'ଆର୍.ଆଇ. ସର୍କଲ' : 'RI CIRCLE',
      render: (r) => formatRevenueGovtLandCell(r.profile['ri_circle']),
    },
    {
      key: 'block_ulb',
      header: isOdia ? 'ବ୍ଲକ / ULB' : 'BLOCK/ULB',
      render: (r) => formatRevenueGovtLandCell(r.profile['block_ulb']),
    },
    { key: 'gp_ward', header: isOdia ? 'GP / ୱାର୍ଡ' : 'GP/WARD', render: (r) => formatRevenueGovtLandCell(r.profile['gp_ward']) },
    {
      key: 'mouza_village',
      header: isOdia ? 'ମୌଜା/ଗ୍ରାମ' : 'MOUZA/VILLAGE',
      render: (r) => formatRevenueGovtLandCell(r.profile['mouza_village']),
    },
    {
      key: 'habitation_locality',
      header: isOdia ? 'ହାବିଟେସନ/ଲୋକାଲିଟି' : 'HABITATION/LOCALITY',
      render: (r) => formatRevenueGovtLandCell(r.profile['habitation_locality']),
    },
    {
      key: 'khata_no',
      header: isOdia ? 'ଖାତା ନଂ' : 'KHATA NO',
      render: (r) => formatRevenueGovtLandCell(r.profile['khata_no']),
    },
    {
      key: 'plot_no',
      header: isOdia ? 'ପ୍ଲଟ୍ ନଂ' : 'PLOT NO',
      render: (r) => formatRevenueGovtLandCell(r.profile['plot_no']),
    },
    {
      key: 'land_type_govt_private_other',
      header: isOdia ? 'ଜମି ପ୍ରକାର (ସରକାରୀ/ବେସରକାରୀ/ଅନ୍ୟ)' : 'LAND TYPE (GOVT/PRIVATE/OTHER)',
      render: (r) =>
        formatRevenueGovtLandCell(
          (r.profile['land_type_govt_private_other'] as unknown) ?? (r.profile['land_type'] as unknown),
        ),
    },
    {
      key: 'govt_land_category',
      header: isOdia
        ? 'ଜମି ବର୍ଗ (ଗୋଚର/ଗ୍ରାମ୍ୟ ଜଙ୍ଗଲ/ସାର୍ବସାଧାରଣ/ଖାସମହଲ/ନଜୁଲ/ଅନ୍ୟ)'
        : 'LAND CATEGORY (Gochar/Gramya Jungle/Sarbasadharan/Khasmahal/Nazul/Other)',
      render: (r) =>
        formatRevenueGovtLandCell(
          r.profile['govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other'],
        ),
    },
    { key: 'kisam', header: isOdia ? 'କିସମ' : 'KISAM', render: (r) => formatRevenueGovtLandCell(r.profile['kisam']) },
    {
      key: 'kisam_description',
      header: isOdia ? 'କିସମ ବର୍ଣ୍ଣନା' : 'KISAM DESCRIPTION',
      render: (r) => formatRevenueGovtLandCell(r.profile['kisam_description']),
    },
    {
      key: 'total_area_acres',
      header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ଏକର)' : 'TOTAL AREA (ACRES)',
      render: (r) => formatRevenueGovtLandCell(r.profile['total_area_acres']),
    },
    {
      key: 'total_area_hectares',
      header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ହେକ୍ଟର)' : 'TOTAL AREA (HECTARES)',
      render: (r) => formatRevenueGovtLandCell(r.profile['total_area_hectares']),
    },
    {
      key: 'total_area_sqft',
      header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ବର୍ଗ ଫୁଟ୍)' : 'TOTAL AREA (SQFT)',
      render: (r) => formatRevenueGovtLandCell(r.profile['total_area_sqft']),
    },
    { key: 'ror_year', header: isOdia ? 'ROR ବର୍ଷ' : 'ROR YEAR', render: (r) => formatRevenueGovtLandCell(r.profile['ror_year']) },
  ];
}
