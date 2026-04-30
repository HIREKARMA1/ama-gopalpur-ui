import { useMemo, useState } from 'react';
import { CiShare1 } from 'react-icons/ci';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import type { Department, Organization } from '../../services/api';
import {
  PsAboutSection,
  type Lang,
} from '../organization/EducationPsSections';
import { useLanguage } from '../i18n/LanguageContext';
import { t, type MessageKey } from '../i18n/messages';
import { Navbar } from '../layout/Navbar';
import { DepartmentHighlightsSection } from './DepartmentHighlightsSection';
import { getDepartmentLabel } from './DepartmentSidebar';

type Props = {
  department: Department;
  organizationCount: number;
  organizations: Organization[];
};

export function DepartmentSummaryPage({ department, organizationCount, organizations }: Props) {
  const { language } = useLanguage();
  const isRoadsDept = (department.code || '').toUpperCase() === 'ROADS';
  const trStatic = (en: string, or: string) => (language === 'or' ? or : en);
  const localizedSummaryText = (en?: string | null, od?: string | null) => {
    const enText = (en || '').trim();
    const odText = (od || '').trim();
    if (language === 'or') return odText || enText;
    return enText || odText;
  };
  const lang = language as Lang;
  const tr = (key: MessageKey, vars?: Record<string, string | number>) => {
    let text = t(key, language);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };
  const summary = department.department_summary;
  const sidebarLocalizedDepartmentName = getDepartmentLabel(department, language);
  const localizedDepartmentName =
    localizedSummaryText(
      sidebarLocalizedDepartmentName,
      summary?.department_name_od,
    ) || sidebarLocalizedDepartmentName;
  const overviewText =
    localizedSummaryText(summary?.overview, summary?.overview_od) || '—';
  const ministerMessageText =
    localizedSummaryText(summary?.minister_message, summary?.minister_message_od) || '—';
  const ministerNameText =
    localizedSummaryText(summary?.minister_name || 'Shri Bibhuti Bhusan Jena', summary?.minister_name_od) ||
    'Shri Bibhuti Bhusan Jena';
  const stats = summary?.key_statistics ?? [];
  const list = (items?: string[]) => (items ?? []).filter(Boolean).slice(0, 12);

  const virtualOrg: Organization = {
    id: department.id,
    department_id: department.id,
    name: localizedDepartmentName,
    type: 'OTHER',
    description: department.description ?? null,
    latitude: null,
    longitude: null,
    address: null,
    sub_department: null,
    attributes: null,
    cover_image_key: null,
  };

  const profile: Record<string, unknown> = {
    school_name_en: localizedDepartmentName,
    hero_primary_tagline_en: summary?.headline || `${localizedDepartmentName} ${trStatic('Department', 'ବିଭାଗ')}`,
    about_short_en: overviewText,
    about_image: summary?.about_image || '',
    headmaster_message_en: ministerMessageText,
    name_of_hm: ministerNameText,
    hm_designation:
      language === 'or'
        ? 'ବାଣିଜ୍ୟ, ପରିବହନ, ଇସ୍ପାତ ଓ ଖଣି ମନ୍ତ୍ରୀ, ଓଡ଼ିଶା ସରକାର'
        : 'Minister of Commerce, Transport, Steel & Mine, Government of Odisha',
    headmaster_photo: 'https://ama-gopalpur.s3.ap-south-1.amazonaws.com/Bibhuti_Bhusan_Jena.png',
    esst_year: '',
    school_type_en: trStatic('Government Department', 'ସରକାରୀ ବିଭାଗ'),
    location_en: trStatic('Gopalpur Constituency', 'ଗୋପାଳପୁର ନିର୍ବାଚନ ମଣ୍ଡଳୀ'),
    vision_text_en: '',
    mission_text_en: '',
    contact_address_en: trStatic('Gopalpur Constituency, Odisha', 'ଗୋପାଳପୁର ନିର୍ବାଚନ ମଣ୍ଡଳୀ, ଓଡ଼ିଶା'),
    contact_phone: '',
    contact_email: '',
    office_hours_en: '',
  };

  const legendRows = buildLegendRows(organizations, department.code);
  const highlightCards = [
    ...(summary?.highlight_cards ?? [])
      .map((c) => ({
        title: (c.title || '').trim(),
        count: (c.value || '').trim(),
        legendKey: normalizeLegendParam(c.title || ''),
      }))
      .filter((c) => c.title && c.count),
    ...legendRows.map((row) => ({
      title: row.label,
      count: String(row.count),
      legendKey: normalizeLegendParam(row.rawLabel),
    })),
  ];
  const topOrganizations = [...organizations].sort((a, b) => a.name.localeCompare(b.name));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'name' | 'category' | 'address'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          topOrganizations
            .map(
              (o) =>
              ((isRoadsDept
                ? ((o.attributes?.road_sector as string) || '')
                : '') ||
                o.sub_department ||
                  (o.attributes?.category as string) ||
                  (o.attributes?.institution_type as string) ||
                  '') as string,
            )
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [topOrganizations, isRoadsDept],
  );

  const filteredOrganizations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return topOrganizations.filter((org) => {
      const categoryLabel = organizationCategory(org);
      const address = (org.address || '').toString();
      const attrs = (org.attributes ?? {}) as Record<string, unknown>;
      const roadCode = String(attrs.road_code ?? '').toLowerCase();
      const roadBlock = String(attrs.block ?? '').toLowerCase();
      const roadRemarks = String(attrs.remarks ?? '').toLowerCase();

      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        categoryLabel.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q) ||
        (isRoadsDept &&
          (roadCode.includes(q) || roadBlock.includes(q) || roadRemarks.includes(q)));
      const matchesCategory = categoryFilter === 'ALL' || categoryLabel === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [topOrganizations, searchTerm, categoryFilter, isRoadsDept]);

  const sortedOrganizations = useMemo(() => {
    const rows = [...filteredOrganizations];
    rows.sort((a, b) => {
      const aCategory = organizationCategory(a);
      const bCategory = organizationCategory(b);
      const aAddress = (a.address || '') as string;
      const bAddress = (b.address || '') as string;
      const factor = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortKey === 'category') return aCategory.localeCompare(bCategory) * factor;
      return aAddress.localeCompare(bAddress) * factor;
    });
    return rows;
  }, [filteredOrganizations, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedOrganizations.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageButtons = pageWindow(safeCurrentPage, totalPages);
  const pagedOrganizations = sortedOrganizations.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const onSort = (key: 'name' | 'category' | 'address') => {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };
  const summaryParagraphs = toParagraphs(
    overviewText ||
    '—',
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={virtualOrg}
          profile={profile}
          language={lang}
          sliderImages={[]}
          aboutTitleOverride={localizedDepartmentName}
          hideAboutMeta
          hideAboutText
          hideAboutImage
          hideLeaderMeta
          hideDesignationLabel
          hideVisionMission
          hideExtendedLeaderBio
          leaderLabels={{
            title: tr('dept.summary.leader.title'),
            messageHeading: tr('dept.summary.leader.messageHeading'),
          }}
        />

        <section>
          <h2 className="text-xl font-bold sm:text-2xl">{tr('dept.summary.section.summary')}</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
            {summaryParagraphs.map((para, idx) => (
              <p key={`summary-para-${idx}`}>{para}</p>
            ))}
          </div>
        </section>

        <DepartmentHighlightsSection
          sectionTitle={tr('dept.summary.section.highlights')}
          emptyText={tr('dept.summary.empty.highlights')}
          infoText={trStatic('Click any node to view matching organizations.', 'ଯେକୌଣସି ନୋଡ୍‌କୁ ଦବାନ୍ତୁ ଏବଂ ସମ୍ବନ୍ଧିତ ସଂଗଠନ ଦେଖନ୍ତୁ।')}
          departmentName={localizedDepartmentName}
          departmentCode={department.code || ''}
          highlightCards={highlightCards}
        />

        <section>
          <h2 className="text-xl font-bold sm:text-2xl">{tr('dept.summary.section.organizationListing')}</h2>
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 md:grid-cols-3">
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={tr('dept.summary.search.placeholder')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">{tr('dept.summary.search.allCategories')}</option>
              {categoryOptions.map((opt) => (
                <option key={`cat-${opt}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {tr('dept.summary.table.slNo')}
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('name')} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {tr('dept.summary.table.organization')} <SortIcon active={sortKey === 'name'} direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('category')} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {tr('dept.summary.table.subDepartmentCategory')} <SortIcon active={sortKey === 'category'} direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('address')} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {tr('dept.summary.table.address')} <SortIcon active={sortKey === 'address'} direction={sortDir} />
                      </button>
                    </th>
                    {isRoadsDept ? (
                      <>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Road code', 'ରୋଡ୍ କୋଡ୍')}
                        </th>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Remarks', 'ରିମାର୍କସ୍')}
                        </th>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Street View', 'ସ୍ଟ୍ରିଟ ଭ୍ୟୁ')}
                        </th>
                      </>
                    ) : (
                      <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                        {tr('dept.summary.table.portfolio')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedOrganizations.length ? (
                    pagedOrganizations.map((org, idx) => (
                      <tr key={org.id} className="border-t border-slate-100/90 bg-white hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 text-sm text-slate-600">
                          {(safeCurrentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800">{org.name}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600">
                          {organizationCategory(org) || '—'}
                        </td>
                        <td className="max-w-[280px] px-4 py-2.5 text-sm text-slate-600">
                          <span className="line-clamp-1">{org.address || '—'}</span>
                        </td>
                        {isRoadsDept ? (
                          <>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              {String((org.attributes as Record<string, unknown> | null)?.road_code ?? '—')}
                            </td>
                            <td className="max-w-[280px] px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">
                                {String((org.attributes as Record<string, unknown> | null)?.remarks ?? '—')}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">
                              <a
                                href={roadStreetViewUrl(org)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-base font-semibold text-slate-500 hover:text-slate-800"
                                aria-label={`Open street view for ${org.name}`}
                                title={trStatic('Open street view', 'ସ୍ଟ୍ରିଟ ଭ୍ୟୁ ଖୋଲନ୍ତୁ')}
                              >
                                <CiShare1 className="text-lg" />
                              </a>
                            </td>
                          </>
                        ) : (
                          <td className="px-4 py-2.5 text-slate-700">
                            <a
                              href={`/organizations/${org.id}`}
                              className="inline-flex items-center text-base font-semibold text-slate-500 hover:text-slate-800"
                              aria-label={`Open portfolio for ${org.name}`}
                              title={tr('dept.summary.table.openPortfolio')}
                            >
                              <CiShare1 className="text-lg" />
                            </a>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-3 text-slate-600" colSpan={isRoadsDept ? 7 : 5}>
                        {tr('dept.summary.empty.organizations')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {tr('dept.summary.pagination.showing', {
                start: (safeCurrentPage - 1) * pageSize + (pagedOrganizations.length ? 1 : 0),
                end: (safeCurrentPage - 1) * pageSize + pagedOrganizations.length,
                total: sortedOrganizations.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr('dept.summary.pagination.previous')}
              </button>
              <div className="flex items-center gap-1">
                {pageButtons.map((p) => (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`h-6 min-w-6 rounded border px-1.5 text-sm ${
                      p === safeCurrentPage
                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr('dept.summary.pagination.next')}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function organizationCategory(org: Organization): string {
  return (
    (org.attributes?.road_sector as string) ||
    org.sub_department ||
    (org.attributes?.category as string) ||
    (org.attributes?.institution_type as string) ||
    ''
  );
}

function parseRoadPathCoordinates(raw: unknown): Array<[number, number]> {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((pt) => Array.isArray(pt) && pt.length >= 2)
        .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number])
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    }
  } catch {
    // ignore, try legacy formats
  }
  return s
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lngStr = '', latStr = ''] = pair.split(/\s+/);
      return [Number(lngStr), Number(latStr)] as [number, number];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

function roadStreetViewUrl(org: Organization): string {
  const attrs = (org.attributes ?? {}) as Record<string, unknown>;
  const path = parseRoadPathCoordinates(attrs.path_coordinates);
  const mid = path.length ? path[Math.floor(path.length / 2)] : null;
  const startLat = Number(attrs.start_lat ?? NaN);
  const startLng = Number(attrs.start_lng ?? NaN);
  const endLat = Number(attrs.end_lat ?? NaN);
  const endLng = Number(attrs.end_lng ?? NaN);
  const fallback =
    Number.isFinite(startLat) && Number.isFinite(startLng)
      ? [startLng, startLat]
      : Number.isFinite(endLat) && Number.isFinite(endLng)
        ? [endLng, endLat]
        : org.latitude != null && org.longitude != null
          ? [org.longitude, org.latitude]
          : null;
  const spot = mid || (fallback as [number, number] | null);
  if (!spot) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(org.name)}`;
  const [lng, lat] = spot;
  return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0`;
}

function pageWindow(currentPage: number, totalPages: number): number[] {
  const maxButtons = 7;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}) {
  const upClass = active && direction === 'asc' ? 'text-slate-700' : 'text-slate-300';
  const downClass = active && direction === 'desc' ? 'text-slate-700' : 'text-slate-300';
  return (
    <span className="inline-flex flex-col leading-none">
      <FiChevronUp className={`-mb-0.5 text-[12px] ${upClass}`} />
      <FiChevronDown className={`-mt-0.5 text-[12px] ${downClass}`} />
    </span>
  );
}

function buildLegendRows(organizations: Organization[], departmentCode?: string): { label: string; rawLabel: string; count: number }[] {
  const code = (departmentCode || '').toUpperCase();
  const bucket = new Map<string, number>();
  const add = (label?: string | null) => {
    const l = (label || '').trim();
    if (!l) return;
    bucket.set(l, (bucket.get(l) || 0) + 1);
  };

  for (const org of organizations) {
    if (code === 'EDUCATION') {
      add(org.sub_department || org.type);
      continue;
    }
    if (code === 'HEALTH') {
      add((org.attributes?.category as string) || org.type);
      continue;
    }
    if (code === 'AGRICULTURE') {
      add(org.sub_department || (org.attributes?.sub_department as string) || org.type);
      continue;
    }
    if (code === 'ELECTRICITY') {
      add((org.attributes?.institution_type as string) || org.type);
      continue;
    }
    if (code === 'ARCS') {
      add((org.attributes?.jurisdiction_type as string) || org.type);
      continue;
    }
    if (code === 'WATCO_RWSS') {
      add((org.attributes?.station_type as string) || org.type);
      continue;
    }
    if (code === 'ROADS') {
      add(
        (org.attributes?.road_sector as string) ||
          org.sub_department ||
          (org.attributes?.category as string) ||
          org.type,
      );
      continue;
    }
    if (code === 'MINOR_IRRIGATION') {
      add((org.attributes?.category_type as string) || org.type);
      continue;
    }
    if (code === 'IRRIGATION') {
      add((org.attributes?.category as string) || org.type);
      continue;
    }
    if (code === 'REVENUE_LAND') {
      add(org.sub_department || (org.attributes?.land_type as string) || org.type);
      continue;
    }
    add(org.sub_department || org.type);
  }

  return Array.from(bucket.entries())
    .map(([label, count]) => ({ label: label.replace(/_/g, ' '), rawLabel: label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function toParagraphs(text: string): string[] {
  return String(text || '')
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function normalizeLegendParam(label: string): string {
  return String(label || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
}
