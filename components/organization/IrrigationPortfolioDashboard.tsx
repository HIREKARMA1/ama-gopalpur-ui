import { useMemo, useState } from 'react';
import type { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, MARKER_COLORS } from '../../lib/mapConfig';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getMinorIrrigationProfileLabel } from '../../lib/profileLabels';
import {
  Droplets,
  MapPin,
  Hash,
  Home,
  Tag,
  Wrench,
  FileText,
  Activity,
  Gauge,
  Database,
  Layers,
  ArrowLeftRight,
  Ruler,
  Settings,
  CalendarClock,
  Radar,
  Trees,
  IndianRupee,
  Users,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Keep header -> key conversion consistent with backend CSV normalization
const snakeFromHeader = (label: string): string =>
  label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');

// Irrigation CSV-derived keys
const KEY_CATCHMENT = snakeFromHeader('CATCHMENT AREA (IN SQ KM.)');
const KEY_AYACUT = snakeFromHeader('COMMAND AREA / AYACUT (HA.)');
const KEY_STORAGE = snakeFromHeader('STORAGE CAPACITY (HAM.)');
const KEY_WATER_SPREAD = snakeFromHeader('WATER SPREAD AREA (HA.)');
const KEY_CANAL_LEN = snakeFromHeader('CANAL/ DISTRIBUTORY LENGTH (KM)');
const KEY_DESIGN_DISCHARGE = snakeFromHeader('DESIGN DISCHARGE (CUSECS)');
const KEY_INFLOW_SOURCE = snakeFromHeader('INFLOW SOURCE (RIVER/RAIN/STREAM/ CANAL)');
const KEY_YEAR_COMMISSIONING = snakeFromHeader('YEAR OF COMMISSIONING');
const KEY_PHYSICAL_CONDITION = snakeFromHeader(
  'CURRENT PHYSICAL CONDITION (GOOD/REPAIR NEEDED/CRITICAL)',
);
const KEY_FUNCTIONALITY = snakeFromHeader(
  'FUNCTIONALITY STATUS (FUNCTIONAL/PARTIAL/NON-FUNCTIONAL)',
);
const KEY_MANAGED_BY = snakeFromHeader('MANAGED BY (PANI PANCHAYAT/DEPT/WUA)');
const KEY_LAST_MAINTENANCE = snakeFromHeader('LAST MAINTENANCE/DESILTING YEAR');
const KEY_WATER_AVAILABILITY = snakeFromHeader('WATER AVAILABILITY (MONTHS/YEAR)');
const KEY_FUNDING_SCHEME = snakeFromHeader('FUNDING SCHEME (MGNREGS/STATE/CENTRAL)');
const KEY_REMARKS = snakeFromHeader('REMARKS/HISTORICAL BACKGROUND');

function formatVal(v: unknown): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

export interface IrrigationPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function IrrigationPortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
}: IrrigationPortfolioDashboardProps) {
  const [detailTab, setDetailTab] = useState<'overview' | 'technical' | 'operations' | 'finance'>('overview');
  const { language } = useLanguage();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const topStats = useMemo(() => {
    const catchment = (profile as any)?.[KEY_CATCHMENT] ?? (profile as any)?.catchment_area ?? null;
    const ayacut = (profile as any)?.[KEY_AYACUT] ?? (profile as any)?.command_area ?? null;
    const storage = (profile as any)?.[KEY_STORAGE] ?? (profile as any)?.storage_capacity ?? null;

    return [
      {
        label: t('minor.stat.catchment', language),
        value: catchment ?? '—',
        icon: Droplets,
        color: 'sky',
      },
      {
        label: t('minor.stat.ayacut', language),
        value: ayacut ?? '—',
        icon: Gauge,
        color: 'emerald',
      },
      {
        label: t('minor.stat.storage', language),
        value: storage ?? '—',
        icon: Database,
        color: 'indigo',
      },
    ] as const;
  }, [profile, language]);

  const highlightItems = useMemo(() => {
    const block = profile?.block_ulb ?? profile?.block ?? null;
    const gp = profile?.gp_ward ?? profile?.gp ?? null;
    const village = profile?.village_locality ?? (profile as any)['village__locality'] ?? null;
    const workName = profile?.work_name ?? profile?.work ?? null;
    const category = profile?.category ?? null;
    const typeIrr = profile?.type_of_irrigation_flowliftsolar ?? profile?.type_of_irrigation ?? null;
    const managedBy =
      (profile as any)?.[KEY_MANAGED_BY] ?? profile?.managed_by ?? null;
    const condition =
      (profile as any)?.[KEY_PHYSICAL_CONDITION] ?? profile?.current_physical_condition ?? null;
    const functionality =
      (profile as any)?.[KEY_FUNCTIONALITY] ?? profile?.functionality_status ?? null;
    const commissioningYear =
      (profile as any)?.[KEY_YEAR_COMMISSIONING] ?? profile?.year_of_commissioning ?? null;

    return [
      { label: t('minor.field.department', language), val: departmentName, icon: Tag, color: 'violet' },
      { label: t('irrigation.field.blockUlb', language), val: block, icon: MapPin, color: 'emerald' },
      { label: t('irrigation.field.gpWard', language), val: gp, icon: Home, color: 'amber' },
      { label: t('irrigation.field.villageLocality', language), val: village, icon: Home, color: 'sky' },
      { label: t('irrigation.field.workName', language), val: workName, icon: Droplets, color: 'blue' },
      { label: t('irrigation.field.category', language), val: category, icon: Tag, color: 'indigo' },
      { label: t('irrigation.field.typeOfIrrigation', language), val: typeIrr, icon: Droplets, color: 'teal' },
      { label: t('irrigation.field.managedBy', language), val: managedBy, icon: Wrench, color: 'teal' },
      { label: t('irrigation.field.physicalCondition', language), val: condition, icon: Activity, color: 'rose' },
      { label: t('irrigation.field.functionalityStatus', language), val: functionality, icon: Activity, color: 'pink' },
      { label: t('irrigation.field.yearOfCommissioning', language), val: commissioningYear, icon: CalendarClock, color: 'slate' },
      { label: t('irrigation.field.latitude', language), val: org.latitude ?? profile?.latitude, icon: MapPin, color: 'rose' },
      { label: t('irrigation.field.longitude', language), val: org.longitude ?? profile?.longitude, icon: MapPin, color: 'pink' },
    ] as const;
  }, [profile, org, departmentName, language]);

  const grouped = useMemo(() => {
    const entries = Object.entries(profile || {}).filter(([_, v]) => v != null && String(v).trim() !== '');
    const byKey = new Map(entries);

    const keys = (list: string[]) => list.filter((k) => byKey.has(k)).map((k) => [k, byKey.get(k)] as const);
    const consumed = new Set<string>();
    const take = (list: string[]) => {
      const out = keys(list);
      out.forEach(([k]) => consumed.add(k));
      return out;
    };

    const TECH_KEYS = [
      'category',
      'type_of_irrigation_flowliftsolar',
      KEY_CATCHMENT,
      KEY_AYACUT,
      KEY_STORAGE,
      KEY_WATER_SPREAD,
      KEY_CANAL_LEN,
      KEY_DESIGN_DISCHARGE,
      KEY_INFLOW_SOURCE,
    ];
    const OPS_KEYS = [
      KEY_YEAR_COMMISSIONING,
      KEY_PHYSICAL_CONDITION,
      KEY_FUNCTIONALITY,
      KEY_MANAGED_BY,
      KEY_LAST_MAINTENANCE,
      KEY_WATER_AVAILABILITY,
      KEY_FUNDING_SCHEME,
      KEY_REMARKS,
    ];
    const FIN_KEYS = [
      'beneficiary_farmers_count',
      'beneficiary_households',
    ];

    const overview = take([
      'block_ulb',
      'gp_ward',
      'village__locality',
      'work_name',
      'category',
      'type_of_irrigation_flowliftsolar',
      'latitude',
      'longitude',
    ]);
    const technical = take(TECH_KEYS);
    const operations = take(OPS_KEYS);
    const finance = take(FIN_KEYS);

    return { overview, technical, operations, finance };
  }, [profile]);

  const renderGrid = (entries: readonly (readonly [string, unknown])[], emptyText: string) => {
    if (!entries || entries.length === 0) {
      return <p className="text-sm text-slate-500">{emptyText}</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-4 items-center">
            {(() => {
              const iconConfig: Record<string, { icon: any; color: keyof typeof COLOR_MAP }> = {
                // --- Technical ---
                [KEY_CATCHMENT]: { icon: Droplets, color: 'sky' },
                [KEY_AYACUT]: { icon: Gauge, color: 'emerald' },
                [KEY_STORAGE]: { icon: Database, color: 'indigo' },
                [KEY_WATER_SPREAD]: { icon: Droplets, color: 'blue' },
                [KEY_CANAL_LEN]: { icon: Ruler, color: 'amber' },
                [KEY_DESIGN_DISCHARGE]: { icon: Gauge, color: 'violet' },
                [KEY_INFLOW_SOURCE]: { icon: Droplets, color: 'teal' },

                // --- Operations ---
                [KEY_YEAR_COMMISSIONING]: { icon: CalendarClock, color: 'slate' },
                [KEY_PHYSICAL_CONDITION]: { icon: Activity, color: 'rose' },
                [KEY_FUNCTIONALITY]: { icon: Activity, color: 'pink' },
                [KEY_MANAGED_BY]: { icon: Wrench, color: 'teal' },
                [KEY_LAST_MAINTENANCE]: { icon: CalendarClock, color: 'indigo' },
                [KEY_WATER_AVAILABILITY]: { icon: Droplets, color: 'sky' },
                [KEY_FUNDING_SCHEME]: { icon: Tag, color: 'amber' },
                [KEY_REMARKS]: { icon: FileText, color: 'slate' },

                // --- Finance / beneficiaries ---
                beneficiary_farmers_count: { icon: Users, color: 'emerald' },
                beneficiary_households: { icon: Users, color: 'amber' },
              };

              const COLOR_MAP = {
                blue: 'bg-blue-50 text-blue-600 border-blue-100',
                emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                green: 'bg-green-50 text-green-600 border-green-100',
                amber: 'bg-amber-50 text-amber-600 border-amber-100',
                violet: 'bg-violet-50 text-violet-600 border-violet-100',
                slate: 'bg-slate-100 text-slate-600 border-slate-200',
                teal: 'bg-teal-50 text-teal-600 border-teal-100',
                rose: 'bg-rose-50 text-rose-600 border-rose-100',
                pink: 'bg-pink-50 text-pink-600 border-pink-100',
                indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                sky: 'bg-sky-50 text-sky-600 border-sky-100',
              } as const;

              const item = iconConfig[key] || { icon: FileText, color: 'slate' as const };
              const Icon = item.icon;
              const cls = COLOR_MAP[item.color] ?? COLOR_MAP.slate;
              return (
                <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cls}`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              );
            })()}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                {getMinorIrrigationProfileLabel(key, language)}
              </p>
              <p className="text-[15px] font-bold text-[#0f172a] truncate">
                {formatVal(value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('minor.dashboard.title', language).replace('Minor Irrigation', 'Irrigation')}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {t('minor.dashboard.subtitle', language)}
        </p>
      </header>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('minor.details.title', language)}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDetailTab('overview')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    detailTab === 'overview'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Droplets size={14} />
                  <span>{t('minor.tab.overview', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('technical')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    detailTab === 'technical'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <FileText size={14} />
                  <span>{t('minor.tab.technical', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('operations')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    detailTab === 'operations'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Wrench size={14} />
                  <span>{t('minor.tab.operations', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('finance')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    detailTab === 'finance'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Tag size={14} />
                  <span>{t('minor.tab.finance', language)}</span>
                </button>
              </div>
            </div>

            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {highlightItems.map((item, idx) => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-100',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    amber: 'bg-amber-50 text-amber-600 border-amber-100',
                    violet: 'bg-violet-50 text-violet-600 border-violet-100',
                    slate: 'bg-slate-100 text-slate-600 border-slate-200',
                    teal: 'bg-teal-50 text-teal-600 border-teal-100',
                    rose: 'bg-rose-50 text-rose-600 border-rose-100',
                    pink: 'bg-pink-50 text-pink-600 border-pink-100',
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                    sky: 'bg-sky-50 text-sky-600 border-sky-100',
                  };
                  const cls = colorMap[item.color] || colorMap.slate;
                  return (
                    <div key={idx} className="flex gap-4 items-center">
                      <div
                        className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cls}`}
                      >
                        <item.icon size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                          {item.label}
                        </p>
                        <p className="text-[15px] font-bold text-[#0f172a] truncate">
                          {formatVal(item.val)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'technical' && (
              <div className="space-y-6">
                {renderGrid(grouped.technical, 'No technical fields found.')}
              </div>
            )}

            {detailTab === 'operations' && (
              <div className="space-y-6">
                {renderGrid(grouped.operations, 'No operations fields found.')}
              </div>
            )}

            {detailTab === 'finance' && (
              <div className="space-y-6">
                {renderGrid(grouped.finance, 'No finance/beneficiary fields found.')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-${stat.color}-200 bg-${stat.color}-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[13px] font-bold text-${stat.color}-900/70 mb-1 uppercase tracking-wider`}
                >
                  {stat.label}
                </p>
                <h3
                  className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none`}
                >
                  {formatVal(stat.value)}
                </h3>
              </div>
              <div
                className={`w-14 h-14 shrink-0 rounded-2xl bg-${stat.color}-200/50 flex items-center justify-center text-${stat.color}-700 ml-3 shadow-inner`}
              >
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

