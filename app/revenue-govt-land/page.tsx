'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { departmentsApi, organizationsApi, revenueLandApi, type Department, type Organization } from '../../services/api';
import { Navbar } from '../../components/layout/Navbar';
import { PaginatedHorizontalTable, type TableColumn } from '../../components/common/PaginatedHorizontalTable';
import { useLanguage } from '../../components/i18n/LanguageContext';

function formatVal(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

type GovtLandRow = {
  org: Organization;
  profile: Record<string, unknown>;
};

export default function RevenueGovtLandTablePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isOdia = language === 'or';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<GovtLandRow[]>([]);

  const pageSize = 10;

  useEffect(() => {
    // When user comes from the revenue table page back to home, prevent
    // home-page "restore last department" from immediately redirecting again.
    window.sessionStorage.setItem('ama_gopalpur_skip_restore', '1');
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const depts: Department[] = await departmentsApi.list();
        const dept = depts.find((d) => (d.code || '').toUpperCase() === 'REVENUE_LAND');
        if (!dept) throw new Error('Revenue Govt Land department not found');

        const orgList = await organizationsApi.listByDepartment(dept.id, { skip: 0, limit: 1000 });

        const profiles = await Promise.all(
          orgList.map(async (o) => {
            try {
              return await revenueLandApi.getProfile(o.id);
            } catch {
              return {};
            }
          }),
        );

        const merged: GovtLandRow[] = orgList.map((org, idx) => ({
          org,
          profile: (profiles[idx] && typeof profiles[idx] === 'object' ? profiles[idx] : {}) as Record<
            string,
            unknown
          >,
        }));

        setRows(merged);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const columns = useMemo<TableColumn<GovtLandRow>[]>(
    () => [
      { key: 'tahasil', header: isOdia ? 'ତହସିଲ' : 'TAHASIL', render: (r) => formatVal(r.profile['tahasil']) },
      { key: 'ri_circle', header: isOdia ? 'ଆର୍.ଆଇ. ସର୍କଲ' : 'RI CIRCLE', render: (r) => formatVal(r.profile['ri_circle']) },
      { key: 'block_ulb', header: isOdia ? 'ବ୍ଲକ / ULB' : 'BLOCK/ULB', render: (r) => formatVal(r.profile['block_ulb']) },
      { key: 'gp_ward', header: isOdia ? 'GP / ୱାର୍ଡ' : 'GP/WARD', render: (r) => formatVal(r.profile['gp_ward']) },
      { key: 'mouza_village', header: isOdia ? 'ମୌଜା/ଗ୍ରାମ' : 'MOUZA/VILLAGE', render: (r) => formatVal(r.profile['mouza_village']) },
      {
        key: 'habitation_locality',
        header: isOdia ? 'ହାବିଟେସନ/ଲୋକାଲିଟି' : 'HABITATION/LOCALITY',
        render: (r) => formatVal(r.profile['habitation_locality']),
      },
      { key: 'govt_land_id', header: isOdia ? 'ସରକାରୀ ଜମି ID' : 'GOVT LAND ID', render: (r) => formatVal(r.profile['govt_land_id']) },
      { key: 'khata_no', header: isOdia ? 'ଖାତା ନଂ' : 'KHATA NO', render: (r) => formatVal(r.profile['khata_no']) },
      { key: 'plot_no', header: isOdia ? 'ପ୍ଲଟ୍ ନଂ' : 'PLOT NO', render: (r) => formatVal(r.profile['plot_no']) },
      { key: 'sub_plot_no', header: isOdia ? 'ଉପ-ପ୍ଲଟ୍ ନଂ' : 'SUB-PLOT NO', render: (r) => formatVal(r.profile['sub_plot_no']) },
      {
        key: 'land_type_govt_private_other',
        header: isOdia ? 'ଜମି ପ୍ରକାର (ସରକାରୀ/ବେସରକାରୀ/ଅନ୍ୟ)' : 'LAND TYPE (GOVT/PRIVATE/OTHER)',
        render: (r) =>
          formatVal(
            (r.profile['land_type_govt_private_other'] as unknown) ?? (r.profile['land_type'] as unknown),
          ),
      },
      {
        key: 'govt_land_category',
        header: isOdia
          ? 'ସରକାରୀ ଜମି ବର୍ଗ (ଗୋଚର/ଗ୍ରାମ୍ୟ ଜଙ୍ଗଲ/ସାର୍ବସାଧାରଣ/ଖାସମହଲ/ନଜୁଲ/ଅନ୍ୟ)'
          : 'GOVT LAND CATEGORY (Gochar/Gramya Jungle/Sarbasadharan/Khasmahal/Nazul/Other)',
        render: (r) =>
          formatVal(r.profile['govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other']),
      },
      { key: 'kisam', header: isOdia ? 'କିସମ' : 'KISAM', render: (r) => formatVal(r.profile['kisam']) },
      { key: 'kisam_description', header: isOdia ? 'କିସମ ବର୍ଣ୍ଣନା' : 'KISAM DESCRIPTION', render: (r) => formatVal(r.profile['kisam_description']) },
      { key: 'total_area_acres', header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ଏକର)' : 'TOTAL AREA (ACRES)', render: (r) => formatVal(r.profile['total_area_acres']) },
      { key: 'total_area_hectares', header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ହେକ୍ଟର)' : 'TOTAL AREA (HECTARES)', render: (r) => formatVal(r.profile['total_area_hectares']) },
      { key: 'total_area_sqft', header: isOdia ? 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ବର୍ଗ ଫୁଟ୍)' : 'TOTAL AREA (SQFT)', render: (r) => formatVal(r.profile['total_area_sqft']) },
      { key: 'ror_year', header: isOdia ? 'ROR ବର୍ଷ' : 'ROR YEAR', render: (r) => formatVal(r.profile['ror_year']) },
    ],
    [isOdia],
  );

  return (
    <div className="page-container">
      <Navbar />

      <main className="p-4 max-w-[1920px] mx-auto w-full min-w-0">
        {loading && <p className="text-sm text-text-muted">{isOdia ? 'ଲୋଡ୍ ହେଉଛି…' : 'Loading…'}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border/60 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text">
                  {isOdia ? 'ରେଭେନ୍ୟୁ ସରକାରୀ ଜମି (ଟେବୁଲ୍)' : 'Revenue Govt Land (Table)'}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {isOdia ? 'ପୋର୍ଟଫୋଲିଓ ଡ୍ୟାସବୋର୍ଡ ଖୋଲିବା ପାଇଁ ଏକ ଲାଇନ୍ କ୍ଲିକ୍ କରନ୍ତୁ।' : 'Click a row to open the portfolio dashboard.'}
                </p>
              </div>
            </div>

            <PaginatedHorizontalTable<GovtLandRow>
              columns={columns}
              rows={rows}
              pageSize={pageSize}
              getRowId={(r) => r.org.id}
              onRowClick={(r) => router.push(`/organizations/${r.org.id}`)}
              emptyText={isOdia ? 'ରେଭେନ୍ୟୁ ସରକାରୀ ଜମି ପାର୍ସେଲ୍ ମିଳିଲା ନାହିଁ।' : 'No revenue govt land parcels found.'}
            />
          </section>
        )}
      </main>
    </div>
  );
}

