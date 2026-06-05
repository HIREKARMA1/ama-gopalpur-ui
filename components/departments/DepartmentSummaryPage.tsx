import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Search } from 'lucide-react';
import { DepartmentSummaryHero } from './DepartmentSummaryHero';
import { DepartmentSummarySection } from './DepartmentSummarySection';
import type { Department, Organization } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t, type MessageKey } from '../i18n/messages';
import { Navbar } from '../layout/Navbar';
import { DepartmentHighlightsSection } from './DepartmentHighlightsSection';
import { DepartmentSummaryMinistersSection } from './DepartmentSummaryMinistersSection';
import { resolveSummaryMinisters, toSummaryLang } from '../../lib/departmentSummaryMinisters';
import { getDepartmentLabel } from './DepartmentSidebar';
import {
  agricultureCategoryDisplayLabel,
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
import { parseElectricityConsumerStatsRows } from '../../lib/electricityConsumerStatsTable';
import { ElectricityConsumerStatsTableSection } from './ElectricityConsumerStatsTableSection';
import { parseRoadsProgressRows } from '../../lib/roadsProgressTable';
import { RoadsProgressTableSection } from './RoadsProgressTableSection';
import {
  buildDedupedRoadFilterOptions,
  constituencyBlocksForRoadTypeFilter,
  roadMatchesLocationFilter,
  roadTypeFilterIsGp,
  roadTypeFilterIsMunicipality,
  roadLastRepairedDate,
  roadOrgShowsMaintenanceColumns,
  roadPresentCondition,
  roadsSummaryFilterShowsMaintenanceColumns,
  ROADS_GP_EXCLUDED_BLOCK,
} from '../../lib/roadsOrganization';
import { parseIrrigationConsumerStatsRows } from '../../lib/irrigationConsumerStatsTable';
import { IrrigationConsumerStatsTableSection } from './IrrigationConsumerStatsTableSection';
import { parseMinorIrrigationConsumerStatsRows } from '../../lib/minorIrrigationConsumerStatsTable';
import { MinorIrrigationConsumerStatsTableSection } from './MinorIrrigationConsumerStatsTableSection';
import {
  summaryBlockFilterOptions,
  summaryLocationFilterOptions,
  summaryLocationSearchText,
  summaryMatchesBlockFilter,
  summaryMatchesGpFilter,
  summaryMatchesVillageFilter,
  summaryOrgBlock,
  summaryOrgGpWard,
  summaryOrgVillage,
} from '../../lib/summaryLocationFilters';

type Props = {
  department: Department;
  organizationCount: number;
  organizations: Organization[];
};

export function DepartmentSummaryPage({ department, organizationCount, organizations }: Props) {
  const { language } = useLanguage();
  const deptCode = (department.code || '').toUpperCase();
  const isElectricityDept = deptCode === 'ELECTRICITY';
  const isIrrigationDept = deptCode === 'IRRIGATION';
  const isMinorIrrigationDept = deptCode === 'MINOR_IRRIGATION';
  const isRoadsDept = deptCode === 'ROADS';
  const isArcsDept = deptCode === 'ARCS';
  const isAgricultureDept = deptCode === 'AGRICULTURE';
  const isDrainageDept = deptCode === 'DRAINAGE';
  const showPortfolioColumn = !isDrainageDept && !isRoadsDept;
  const trStatic = (en: string, or: string) => (language === 'or' ? or : en);
  const localizedSummaryText = (en?: string | null, od?: string | null) => {
    const enText = (en || '').trim();
    const odText = (od || '').trim();
    if (language === 'or') return odText || enText;
    return enText || odText;
  };
  const summaryLang = toSummaryLang(language);
  const tr = (key: MessageKey, vars?: Record<string, string | number>) => {
    let text = t(key, language);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };
  const categoryDisplayLabel = (raw: string) => {
    if (!raw) return '';
    if (isAgricultureDept) return agricultureCategoryDisplayLabel(raw, language);
    return raw;
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
  const summaryMinisters = useMemo(
    () => resolveSummaryMinisters(summary ?? undefined, summaryLang),
    [summary, summaryLang],
  );
  const stats = summary?.key_statistics ?? [];
  const list = (items?: string[]) => (items ?? []).filter(Boolean).slice(0, 12);

  const electricityConsumerStatsRows = useMemo(
    () => (isElectricityDept ? parseElectricityConsumerStatsRows(summary) : []),
    [isElectricityDept, summary],
  );

  const irrigationConsumerStatsRows = useMemo(
    () => (isIrrigationDept ? parseIrrigationConsumerStatsRows(summary) : []),
    [isIrrigationDept, summary],
  );

  const minorIrrigationConsumerStatsRows = useMemo(
    () => (isMinorIrrigationDept ? parseMinorIrrigationConsumerStatsRows(summary) : []),
    [isMinorIrrigationDept, summary],
  );

  const roadsProgressRows = useMemo(
    () => (isRoadsDept ? parseRoadsProgressRows(summary) : []),
    [isRoadsDept, summary],
  );

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
  const [roadTypeFilter, setRoadTypeFilter] = useState('ALL');
  const [locationBlockFilter, setLocationBlockFilter] = useState('ALL');
  const [locationGpFilter, setLocationGpFilter] = useState('ALL');
  const [locationVillageFilter, setLocationVillageFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<'name' | 'category' | 'address'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const roadsMaintenanceColumnsVisible = useMemo(
    () => isRoadsDept && roadsSummaryFilterShowsMaintenanceColumns(roadTypeFilter),
    [isRoadsDept, roadTypeFilter],
  );

  const roadsVillageColumnVisible = useMemo(
    () => isRoadsDept && !roadTypeFilterIsMunicipality(roadTypeFilter),
    [isRoadsDept, roadTypeFilter],
  );

  const locationColumnCount = isRoadsDept
    ? (roadsVillageColumnVisible ? 3 : 2)
    : 3;

  const listingTableColSpan = useMemo(() => {
    if (isRoadsDept) {
      return 5 + (roadsVillageColumnVisible ? 1 : 0) + (roadsMaintenanceColumnsVisible ? 3 : 0);
    }
    if (isDrainageDept) {
      return 3 + locationColumnCount + DRAINAGE_SUMMARY_TABLE_COLUMNS.length + (showPortfolioColumn ? 1 : 0);
    }
    if (isArcsDept) {
      return 3 + locationColumnCount + ARCS_SUMMARY_TABLE_COLUMNS.length + (showPortfolioColumn ? 1 : 0);
    }
    return 3 + locationColumnCount + (showPortfolioColumn ? 1 : 0);
  }, [
    isRoadsDept,
    isDrainageDept,
    isArcsDept,
    showPortfolioColumn,
    roadsMaintenanceColumnsVisible,
    roadsVillageColumnVisible,
    locationColumnCount,
  ]);

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

  const scopedForGpOptions = useMemo(
    () => topOrganizations.filter((org) => summaryMatchesBlockFilter(org, locationBlockFilter)),
    [topOrganizations, locationBlockFilter],
  );

  const scopedForVillageOptions = useMemo(
    () => scopedForGpOptions.filter((org) => summaryMatchesGpFilter(org, locationGpFilter)),
    [scopedForGpOptions, locationGpFilter],
  );

  const roadTypeOptions = useMemo(() => {
    if (!isRoadsDept) return [];
    return buildDedupedRoadFilterOptions(
      topOrganizations.map((o) => organizationListingCategory(o, department.code)),
    );
  }, [isRoadsDept, topOrganizations, department.code]);

  const roadTypeIsMunicipality = isRoadsDept && roadTypeFilterIsMunicipality(roadTypeFilter);
  const roadTypeIsGp = isRoadsDept && roadTypeFilterIsGp(roadTypeFilter);

  const roadBlockOptions = useMemo(() => {
    if (!isRoadsDept) return [];
    return constituencyBlocksForRoadTypeFilter(roadTypeFilter).map((b) => ({
      value: b.value,
      label: b.label,
    }));
  }, [isRoadsDept, roadTypeFilter]);

  useEffect(() => {
    if (!isRoadsDept) return;
    if (roadTypeIsMunicipality && locationVillageFilter !== 'ALL') {
      setLocationVillageFilter('ALL');
    }
    if (roadTypeIsGp && locationBlockFilter === ROADS_GP_EXCLUDED_BLOCK) {
      setLocationBlockFilter('ALL');
    }
  }, [isRoadsDept, roadTypeIsMunicipality, roadTypeIsGp, locationBlockFilter, locationVillageFilter]);

  const locationGpOptions = useMemo(
    () => summaryLocationFilterOptions(scopedForGpOptions.map(summaryOrgGpWard)),
    [scopedForGpOptions],
  );

  const locationVillageOptions = useMemo(
    () => summaryLocationFilterOptions(scopedForVillageOptions.map(summaryOrgVillage)),
    [scopedForVillageOptions],
  );

  const filteredOrganizations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return topOrganizations.filter((org) => {
      const categoryLabel = organizationListingCategory(org, department.code);
      const categorySearchText = isAgricultureDept
        ? `${categoryLabel} ${categoryDisplayLabel(categoryLabel)}`.toLowerCase()
        : categoryLabel.toLowerCase();
      const address = (org.address || '').toString();
      const attrs = (org.attributes ?? {}) as Record<string, unknown>;
      const roadCode = String(attrs.road_code ?? '').toLowerCase();
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

      const locationSearch = summaryLocationSearchText(org);

      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        categorySearchText.includes(q) ||
        address.toLowerCase().includes(q) ||
        locationSearch.includes(q) ||
        (isArcsDept && arcsSearchText.includes(q)) ||
        (isDrainageDept && drainageSearchText.includes(q)) ||
        (isRoadsDept &&
          (roadCode.includes(q) || roadLength.includes(q)));
      const drainKind = isDrainageDept ? getDrainLineKindFromOrg(org) : '';
      const matchesCategory =
        categoryFilter === 'ALL' ||
        (isDrainageDept ? drainKind === categoryFilter : categoryLabel === categoryFilter);

      const effectiveBlockFilter =
        isRoadsDept && roadTypeIsGp && locationBlockFilter === ROADS_GP_EXCLUDED_BLOCK
          ? 'ALL'
          : locationBlockFilter;
      const effectiveVillageFilter =
        isRoadsDept && roadTypeIsMunicipality ? 'ALL' : locationVillageFilter;

      const matchesRoadType =
        !isRoadsDept || roadMatchesLocationFilter(categoryLabel, roadTypeFilter);

      const matchesLocationFilters =
        summaryMatchesBlockFilter(org, effectiveBlockFilter) &&
        summaryMatchesGpFilter(org, locationGpFilter) &&
        summaryMatchesVillageFilter(org, effectiveVillageFilter);

      return matchesSearch && matchesCategory && matchesRoadType && matchesLocationFilters;
    });
  }, [
    topOrganizations,
    searchTerm,
    categoryFilter,
    isRoadsDept,
    isArcsDept,
    isDrainageDept,
    department.code,
    roadTypeFilter,
    locationBlockFilter,
    locationGpFilter,
    locationVillageFilter,
    roadTypeIsGp,
    roadTypeIsMunicipality,
  ]);

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
  const hasOverview = summaryParagraphs.length > 0 && overviewText !== '—';
  const listingTitle = isRoadsDept
    ? trStatic('Road listing', 'ରୋଡ୍ ତାଲିକା')
    : tr('dept.summary.section.organizationListing');
  const listingSubtitle = isRoadsDept
    ? trStatic('Search and filter constituency roads by type, block, GP, and village.', 'ରୋଡ୍ ପ୍ରକାର, ବ୍ଲକ୍, ଜିପି ଓ ଗ୍ରାମ ଅନୁସାରେ ଖୋଜନ୍ତୁ।')
    : tr('dept.summary.search.placeholder');

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <DepartmentSummaryHero
          departmentName={localizedDepartmentName}
          organizationCount={organizationCount}
          overviewLabel={trStatic('Department overview', 'ବିଭାଗ ସମୀକ୍ଷା')}
          statLabel={localizedDepartmentName}
          constituencyLabel={trStatic('Gopalpur Constituency', 'ଗୋପାଳପୁର ନିର୍ବାଚନ ମଣ୍ଡଳୀ')}
        />

        {summaryMinisters.length > 0 ? (
          <DepartmentSummaryMinistersSection ministers={summaryMinisters} language={summaryLang} />
        ) : null}

        <DepartmentSummarySection
          title={tr('dept.summary.section.summary')}
          subtitle={
            language === 'or'
              ? 'ବିଭାଗର ସଂକ୍ଷିପ୍ତ ବର୍ଣ୍ଣନା'
              : 'Brief description of this department'
          }
        >
          {hasOverview ? (
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
              {summaryParagraphs.map((para, idx) => (
                <p key={`summary-para-${idx}`}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
              {language === 'or'
                ? 'ବିଭାଗ ସାରାଂଶ ଏପର୍ଯ୍ୟନ୍ତ ଯୋଗ କରାଯାଇ ନାହିଁ।'
                : 'No department summary has been added yet.'}
            </p>
          )}
        </DepartmentSummarySection>

        <DepartmentHighlightsSection
          sectionTitle={tr('dept.summary.section.highlights')}
          emptyText={tr('dept.summary.empty.highlights')}
          infoText={tr('dept.summary.highlights.clickHint')}
          departmentName={localizedDepartmentName}
          departmentCode={department.code || ''}
          highlightCards={highlightCards}
        />

        {isElectricityDept ? (
          <ElectricityConsumerStatsTableSection rows={electricityConsumerStatsRows} language={language} />
        ) : null}

        {isIrrigationDept ? (
          <IrrigationConsumerStatsTableSection rows={irrigationConsumerStatsRows} language={language} />
        ) : null}

        {isMinorIrrigationDept ? (
          <MinorIrrigationConsumerStatsTableSection
            rows={minorIrrigationConsumerStatsRows}
            language={language}
          />
        ) : null}

        {isRoadsDept ? (
          <RoadsProgressTableSection rows={roadsProgressRows} language={language} />
        ) : null}

        <DepartmentSummarySection title={listingTitle} subtitle={listingSubtitle} flush>
          <div className="space-y-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            {isRoadsDept ? (
              <>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={trStatic(
                      'Search road name, block, GP, village…',
                      'ରୋଡ୍ ନାମ, ବ୍ଲକ୍, ଜିପି, ଗ୍ରାମ ଖୋଜନ୍ତୁ…',
                    )}
                    aria-label={trStatic('Search roads', 'ରୋଡ୍ ଖୋଜନ୍ତୁ')}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {trStatic('Road type', 'ରୋଡ୍ ପ୍ରକାର')}
                  <select
                    value={roadTypeFilter}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setRoadTypeFilter(nextType);
                      if (roadTypeFilterIsMunicipality(nextType)) {
                        setLocationVillageFilter('ALL');
                      }
                      if (
                        roadTypeFilterIsGp(nextType) &&
                        locationBlockFilter === ROADS_GP_EXCLUDED_BLOCK
                      ) {
                        setLocationBlockFilter('ALL');
                      }
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  >
                    <option value="ALL">{trStatic('All road types', 'ସମସ୍ତ ରୋଡ୍ ପ୍ରକାର')}</option>
                    {roadTypeOptions.map((opt) => (
                      <option key={`road-type-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {trStatic('Block', 'ବ୍ଲକ୍')}
                  <select
                    value={locationBlockFilter}
                    onChange={(e) => {
                      setLocationBlockFilter(e.target.value);
                      setLocationGpFilter('ALL');
                      setLocationVillageFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  >
                    <option value="ALL">{trStatic('All blocks', 'ସମସ୍ତ ବ୍ଲକ୍')}</option>
                    {roadBlockOptions.map((opt) => (
                      <option key={`road-block-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {trStatic('GP/Ward', 'ଜିପି/ୱାର୍ଡ')}
                  <select
                    value={locationGpFilter}
                    onChange={(e) => {
                      setLocationGpFilter(e.target.value);
                      setLocationVillageFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  >
                    <option value="ALL">{trStatic('All GP/Ward', 'ସମସ୍ତ ଜିପି/ୱାର୍ଡ')}</option>
                    {locationGpOptions.map((opt) => (
                      <option key={`road-gp-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label
                  className={`flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide ${
                    roadTypeIsMunicipality ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {trStatic('Village', 'ଗ୍ରାମ')}
                  <select
                    value={locationVillageFilter}
                    disabled={roadTypeIsMunicipality}
                    onChange={(e) => {
                      setLocationVillageFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="ALL">{trStatic('All villages', 'ସମସ୍ତ ଗ୍ରାମ')}</option>
                    {locationVillageOptions.map((opt) => (
                      <option key={`road-village-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              </>
            ) : (
              <>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={trStatic(
                      'Search name, block, GP, village…',
                      'ନାମ, ବ୍ଲକ୍, ଜିପି, ଗ୍ରାମ ଖୋଜନ୍ତୁ…',
                    )}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {isArcsDept
                      ? tr('dept.summary.table.jurisdictionType')
                      : isDrainageDept
                        ? tr('dept.summary.drainage.drainType')
                        : tr('dept.summary.table.subDepartmentCategory')}
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
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
                            : categoryDisplayLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {trStatic('Block', 'ବ୍ଲକ୍')}
                    <select
                      value={locationBlockFilter}
                      onChange={(e) => {
                        setLocationBlockFilter(e.target.value);
                        setLocationGpFilter('ALL');
                        setLocationVillageFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                    >
                      <option value="ALL">{trStatic('All blocks', 'ସମସ୍ତ ବ୍ଲକ୍')}</option>
                      {summaryBlockFilterOptions().map((opt) => (
                        <option key={`loc-block-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {trStatic('GP/Ward', 'ଜିପି/ୱାର୍ଡ')}
                    <select
                      value={locationGpFilter}
                      onChange={(e) => {
                        setLocationGpFilter(e.target.value);
                        setLocationVillageFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                    >
                      <option value="ALL">{trStatic('All GP/Ward', 'ସମସ୍ତ ଜିପି/ୱାର୍ଡ')}</option>
                      {locationGpOptions.map((opt) => (
                        <option key={`loc-gp-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {trStatic('Village', 'ଗ୍ରାମ')}
                    <select
                      value={locationVillageFilter}
                      onChange={(e) => {
                        setLocationVillageFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                    >
                      <option value="ALL">{trStatic('All villages', 'ସମସ୍ତ ଗ୍ରାମ')}</option>
                      {locationVillageOptions.map((opt) => (
                        <option key={`loc-village-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur-sm">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {tr('dept.summary.table.slNo')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('name')} className="inline-flex items-center gap-1 hover:text-orange-700">
                        {isRoadsDept ? trStatic('Road', 'ରୋଡ୍') : tr('dept.summary.table.organization')} <SortIcon active={sortKey === 'name'} direction={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <button type="button" onClick={() => onSort('category')} className="inline-flex items-center gap-1 hover:text-orange-700">
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
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {tr(col.labelKey)}
                        </th>
                      ))
                      : null}
                    {isDrainageDept
                      ? DRAINAGE_SUMMARY_TABLE_COLUMNS.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {drainageSummaryColumnLabel(col, language)}
                        </th>
                      ))
                      : isRoadsDept ? null : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {trStatic('Block', 'ବ୍ଲକ୍')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {trStatic('GP/Ward', 'ଜିପି/ୱାର୍ଡ')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {trStatic('Village', 'ଗ୍ରାମ')}
                          </th>
                        </>
                      )}
                    {isRoadsDept ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('Block', 'ବ୍ଲକ୍')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {trStatic('GP/Ward', 'ଜିପି/ୱାର୍ଡ')}
                        </th>
                        {roadsVillageColumnVisible ? (
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {trStatic('Village', 'ଗ୍ରାମ')}
                          </th>
                        ) : null}
                        {roadsMaintenanceColumnsVisible ? (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {trStatic('Length (km)', 'ଦୈର୍ଘ୍ୟ (କି.ମି.)')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {trStatic('Last repaired date', 'ଶେଷ ମରାମତି ତାରିଖ')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {trStatic('Present condition', 'ବର୍ତ୍ତମାନ ଅବସ୍ଥା')}
                            </th>
                          </>
                        ) : null}
                      </>
                    ) : null}
                    {showPortfolioColumn ? (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {tr('dept.summary.table.portfolio')}
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedOrganizations.length ? (
                    pagedOrganizations.map((org, idx) => (
                      <tr key={org.id} className="bg-white transition-colors hover:bg-orange-50/25">
                        <td className="px-4 py-3 text-sm tabular-nums text-slate-500">
                          {(safeCurrentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="max-w-[320px] px-4 py-3 text-sm font-semibold text-slate-900">{org.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {isDrainageDept
                            ? (() => {
                              const kind = getDrainLineKindFromOrg(org);
                              const key = drainageTypeMessageKey(kind);
                              return key ? tr(key) : kind || '—';
                            })()
                            : categoryDisplayLabel(organizationListingCategory(org, department.code)) || '—'}
                        </td>
                        {isArcsDept
                          ? ARCS_SUMMARY_TABLE_COLUMNS.map((col) => (
                            <td key={`${org.id}-${col.id}`} className="px-4 py-3 text-sm text-slate-600">
                              {organizationListingArcsAttribute(org, col.keys) || '—'}
                            </td>
                          ))
                          : null}
                        {isDrainageDept
                          ? DRAINAGE_SUMMARY_TABLE_COLUMNS.map((col) => (
                            <td key={`${org.id}-${col}`} className="px-4 py-3 text-sm text-slate-600">
                              <span className={col === 'Remarks' ? 'line-clamp-2' : ''}>
                                {getDrainTableColumnValue(org, col) || '—'}
                              </span>
                            </td>
                          ))
                          : isRoadsDept ? null : (
                            <>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="line-clamp-1">{summaryOrgBlock(org) || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="line-clamp-1">{summaryOrgGpWard(org) || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="line-clamp-1">{summaryOrgVillage(org) || '—'}</span>
                              </td>
                            </>
                          )}
                        {isRoadsDept ? (
                          <>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <span className="line-clamp-1">{summaryOrgBlock(org) || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <span className="line-clamp-1">{summaryOrgGpWard(org) || '—'}</span>
                            </td>
                            {roadsVillageColumnVisible ? (
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <span className="line-clamp-1">{summaryOrgVillage(org) || '—'}</span>
                              </td>
                            ) : null}
                            {roadsMaintenanceColumnsVisible ? (
                              <>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  <span className="line-clamp-1">
                                    {roadOrgShowsMaintenanceColumns(org)
                                      ? String(
                                          (org.attributes as Record<string, unknown> | null)?.length_km ?? '—',
                                        )
                                      : '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  <span className="line-clamp-1">
                                    {roadOrgShowsMaintenanceColumns(org)
                                      ? roadLastRepairedDate(
                                          org.attributes as Record<string, unknown> | null,
                                        ) || '—'
                                      : '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  <span className="line-clamp-1">
                                    {roadOrgShowsMaintenanceColumns(org)
                                      ? roadPresentCondition(
                                          org.attributes as Record<string, unknown> | null,
                                        ) || '—'
                                      : '—'}
                                  </span>
                                </td>
                              </>
                            ) : null}
                          </>
                        ) : null}
                        {showPortfolioColumn ? (
                          <td className="px-4 py-3 text-sm">
                            <Link
                              href={`/organizations/${org.id}`}
                              className="inline-flex font-semibold text-orange-600 underline-offset-2 transition hover:text-orange-800 hover:underline"
                            >
                              {tr('dept.summary.table.openPortfolio')}
                            </Link>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-sm text-slate-500"
                        colSpan={listingTableColSpan}
                      >
                        {tr('dept.summary.empty.organizations')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="font-medium">
              {tr('dept.summary.pagination.showing', {
                start: (safeCurrentPage - 1) * pageSize + (pagedOrganizations.length ? 1 : 0),
                end: (safeCurrentPage - 1) * pageSize + pagedOrganizations.length,
                total: sortedOrganizations.length,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr('dept.summary.pagination.previous')}
              </button>
              <div className="flex items-center gap-1">
                {pageButtons.map((p) => (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`min-h-8 min-w-8 rounded-lg border px-2 text-sm font-medium transition ${
                      p === safeCurrentPage
                        ? 'border-orange-400 bg-orange-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50'
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr('dept.summary.pagination.next')}
              </button>
            </div>
          </div>
        </DepartmentSummarySection>
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

