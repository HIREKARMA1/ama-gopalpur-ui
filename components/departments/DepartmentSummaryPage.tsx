import { useMemo, useState } from 'react';
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
import {
  ARCS_SUMMARY_TABLE_COLUMNS,
  legendHighlightTitle,
  normalizeLegendParam,
  organizationListingArcsAttribute,
  organizationListingCategory,
  resolveEffectiveHighlightCards,
} from '../../lib/departmentSummaryHighlights';
import {
  DRAINAGE_SUMMARY_TABLE_COLUMNS,
  drainageSummaryColumnLabel,
  drainageTypeMessageKey,
  getDrainLineKindFromOrg,
  getDrainTableColumnValue,
} from '../../lib/drainageOrganization';

type Props = {
  department: Department;
  organizationCount: number;
  organizations: Organization[];
};

export function DepartmentSummaryPage({ department, organizationCount, organizations }: Props) {
  const { language } = useLanguage();
  const deptCode = (department.code || '').toUpperCase();
  const isRoadsDept = deptCode === 'ROADS';
  const isArcsDept = deptCode === 'ARCS';
  const isDrainageDept = deptCode === 'DRAINAGE';
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

  const highlightCards = resolveEffectiveHighlightCards(summary, organizations, department.code).map(
    (card) => ({
      title: legendHighlightTitle(card, department.code, language),
      count: card.value,
      legendKey: normalizeLegendParam(card.legend_key || card.title),
    }),
  );
  const topOrganizations = [...organizations].sort((a, b) => a.name.localeCompare(b.name));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'name' | 'category' | 'address'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const categoryOptions = useMemo(() => {
    if (isDrainageDept) {
      return ['MAIN', 'BRANCH'] as const;
    }
    return Array.from(
      new Set(
        topOrganizations
          .map((o) => organizationListingCategory(o, department.code))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [topOrganizations, department.code, isDrainageDept]);

  const filteredOrganizations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return topOrganizations.filter((org) => {
      const categoryLabel = organizationListingCategory(org, department.code);
      const address = (org.address || '').toString();
      const attrs = (org.attributes ?? {}) as Record<string, unknown>;
      const roadCode = String(attrs.road_code ?? '').toLowerCase();
      const roadBlock = String(attrs.block ?? '').toLowerCase();
      const roadGpWard = String(attrs.gp_ward ?? attrs.gpward ?? attrs.gp_ward_name ?? '').toLowerCase();
      const roadVillage = String(attrs.village ?? attrs.village_name ?? '').toLowerCase();
      const roadLength = String(attrs.length_km ?? '').toLowerCase();

      const arcsSearchText = isArcsDept
        ? ARCS_SUMMARY_TABLE_COLUMNS.map((col) => organizationListingArcsAttribute(org, col.keys).toLowerCase()).join(' ')
        : '';

      const drainageSearchText = isDrainageDept
        ? [
          org.name,
          ...DRAINAGE_SUMMARY_TABLE_COLUMNS.map((col) => getDrainTableColumnValue(org, col)),
        ]
          .join(' ')
          .toLowerCase()
        : '';

      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        categoryLabel.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q) ||
        (isArcsDept && arcsSearchText.includes(q)) ||
        (isDrainageDept && drainageSearchText.includes(q)) ||
        (isRoadsDept &&
          (
            roadCode.includes(q) ||
            roadBlock.includes(q) ||
            roadGpWard.includes(q) ||
            roadVillage.includes(q) ||
            roadLength.includes(q)
          ));
      const drainKind = isDrainageDept ? getDrainLineKindFromOrg(org) : '';
      const matchesCategory =
        categoryFilter === 'ALL' ||
        (isDrainageDept ? drainKind === categoryFilter : categoryLabel === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [topOrganizations, searchTerm, categoryFilter, isRoadsDept, isArcsDept, isDrainageDept, department.code]);

  const sortedOrganizations = useMemo(() => {
    const rows = [...filteredOrganizations];
    rows.sort((a, b) => {
      const aCategory = organizationListingCategory(a, department.code);
      const bCategory = organizationListingCategory(b, department.code);
      const aAddress = (a.address || '') as string;
      const bAddress = (b.address || '') as string;
      const factor = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortKey === 'category') return aCategory.localeCompare(bCategory) * factor;
      return aAddress.localeCompare(bAddress) * factor;
    });
    return rows;
  }, [filteredOrganizations, sortKey, sortDir, department.code]);

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
          infoText={tr('dept.summary.highlights.clickHint')}
          departmentName={localizedDepartmentName}
          departmentCode={department.code || ''}
          highlightCards={highlightCards}
        />

        <section>
          <h2 className="text-xl font-bold sm:text-2xl">
            {isRoadsDept ? trStatic('Road Listing', 'ରୋଡ୍ ତାଲିକା') : tr('dept.summary.section.organizationListing')}
          </h2>
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
              aria-label={
                isArcsDept
                  ? tr('dept.summary.table.jurisdictionType')
                  : isDrainageDept
                    ? tr('dept.summary.drainage.allDrainTypes')
                    : tr('dept.summary.search.allCategories')
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">
                {isArcsDept
                  ? tr('dept.summary.search.allJurisdictionTypes')
                  : isDrainageDept
                    ? tr('dept.summary.drainage.allDrainTypes')
                    : tr('dept.summary.search.allCategories')}
              </option>
              {categoryOptions.map((opt) => (
                <option key={`cat-${opt}`} value={opt}>
                  {isDrainageDept
                    ? (() => {
                      const key = drainageTypeMessageKey(opt);
                      return key ? tr(key) : opt;
                    })()
                    : opt}
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
                        {isRoadsDept ? trStatic('Road', 'ରୋଡ୍') : tr('dept.summary.table.organization')} <SortIcon active={sortKey === 'name'} direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('category')} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {isArcsDept
                          ? tr('dept.summary.table.jurisdictionType')
                          : isDrainageDept
                            ? tr('dept.summary.drainage.drainType')
                            : isRoadsDept
                              ? trStatic('Road type', 'ରୋଡ୍ ପ୍ରକାର')
                              : tr('dept.summary.table.subDepartmentCategory')}{' '}
                        <SortIcon active={sortKey === 'category'} direction={sortDir} />
                      </button>
                    </th>
                    {isArcsDept
                      ? ARCS_SUMMARY_TABLE_COLUMNS.map((col) => (
                        <th
                          key={col.id}
                          className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {tr(col.labelKey)}
                        </th>
                      ))
                      : null}
                    {isDrainageDept
                      ? DRAINAGE_SUMMARY_TABLE_COLUMNS.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {drainageSummaryColumnLabel(col, language)}
                        </th>
                      ))
                      : isRoadsDept ? null : (
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          <button type="button" onClick={() => onSort('address')} className="inline-flex items-center gap-1 hover:text-slate-700">
                            {tr('dept.summary.table.address')} <SortIcon active={sortKey === 'address'} direction={sortDir} />
                          </button>
                        </th>
                      )}
                    {isRoadsDept ? (
                      <>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Block', 'ବ୍ଲକ୍')}
                        </th>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('GP/Ward', 'ଜିପି/ୱାର୍ଡ')}
                        </th>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Village', 'ଗ୍ରାମ')}
                        </th>
                        <th className="px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Length (km)', 'ଦୈର୍ଘ୍ୟ (କି.ମି.)')}
                        </th>
                      </>
                    ) : null}
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
                          {isDrainageDept
                            ? (() => {
                              const kind = getDrainLineKindFromOrg(org);
                              const key = drainageTypeMessageKey(kind);
                              return key ? tr(key) : kind || '—';
                            })()
                            : organizationListingCategory(org, department.code) || '—'}
                        </td>
                        {isArcsDept
                          ? ARCS_SUMMARY_TABLE_COLUMNS.map((col) => (
                            <td key={`${org.id}-${col.id}`} className="px-4 py-2.5 text-sm text-slate-600">
                              {organizationListingArcsAttribute(org, col.keys) || '—'}
                            </td>
                          ))
                          : null}
                        {isDrainageDept
                          ? DRAINAGE_SUMMARY_TABLE_COLUMNS.map((col) => (
                            <td key={`${org.id}-${col}`} className="px-4 py-2.5 text-sm text-slate-600">
                              <span className={col === 'Remarks' ? 'line-clamp-2' : ''}>
                                {getDrainTableColumnValue(org, col) || '—'}
                              </span>
                            </td>
                          ))
                          : isRoadsDept ? null : (
                            <td className="max-w-[280px] px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">{org.address || '—'}</span>
                            </td>
                          )}
                        {isRoadsDept ? (
                          <>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">
                                {String((org.attributes as Record<string, unknown> | null)?.block ?? '—')}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">
                                {String(
                                  (org.attributes as Record<string, unknown> | null)?.gp_ward ??
                                  (org.attributes as Record<string, unknown> | null)?.gpward ??
                                  (org.attributes as Record<string, unknown> | null)?.gp_ward_name ??
                                  '—',
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">
                                {String(
                                  (org.attributes as Record<string, unknown> | null)?.village ??
                                  (org.attributes as Record<string, unknown> | null)?.village_name ??
                                  '—',
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">
                              <span className="line-clamp-1">
                                {String((org.attributes as Record<string, unknown> | null)?.length_km ?? '—')}
                              </span>
                            </td>
                          </>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-3 text-slate-600"
                        colSpan={
                          isRoadsDept ? 7 : isArcsDept ? 7 : isDrainageDept ? 10 : 4
                        }
                      >
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
                    className={`h-6 min-w-6 rounded border px-1.5 text-sm ${p === safeCurrentPage
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

function toParagraphs(text: string): string[] {
  return String(text || '')
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

