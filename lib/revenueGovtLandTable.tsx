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
        ? 'ସରକାରୀ ଜମି ବର୍ଗ (ଗୋଚର/ଗ୍ରାମ୍ୟ ଜଙ୍ଗଲ/ସାର୍ବସାଧାରଣ/ଖାସମହଲ/ନଜୁଲ/ଅନ୍ୟ)'
        : 'GOVT LAND CATEGORY (Gochar/Gramya Jungle/Sarbasadharan/Khasmahal/Nazul/Other)',
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
