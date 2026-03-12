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
  HardHat,
  CalendarClock,
  Radar,
  Trees,
  IndianRupee,
  Users,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function formatVal(v: unknown): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

export interface MinorIrrigationPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function MinorIrrigationPortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
}: MinorIrrigationPortfolioDashboardProps) {
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
    const catchment = profile?.catchment_area_sq_km ?? profile?.catchment_area ?? null;
    const ayacut = profile?.total_ayacut_acres ?? profile?.total_ayacut ?? null;
    const storage = profile?.storage_capacity_mcum ?? profile?.storage_capacity ?? null;

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
    const village = profile?.village_locality ?? profile?.village ?? null;
    const mipId = profile?.mip_id ?? null;
    const name = profile?.name_of_m_i_p ?? org.name;
    const type = profile?.category_type ?? profile?.category ?? profile?.type ?? profile?.categorytype ?? null;
    const managedBy = profile?.managed_by ?? null;
    const condition = profile?.condition ?? null;
    const functionality = profile?.functionality ?? null;
    const lastMaintenance = profile?.last_maintenance ?? null;

    return [
      { label: t('minor.field.department', language), val: departmentName, icon: Tag, color: 'violet' },
      { label: getMinorIrrigationProfileLabel('block_ulb', language), val: block, icon: MapPin, color: 'emerald' },
      { label: getMinorIrrigationProfileLabel('gp_ward', language), val: gp, icon: Home, color: 'amber' },
      { label: getMinorIrrigationProfileLabel('village_locality', language), val: village, icon: Home, color: 'sky' },
      { label: getMinorIrrigationProfileLabel('mip_id', language), val: mipId, icon: Hash, color: 'slate' },
      { label: getMinorIrrigationProfileLabel('name_of_m_i_p', language), val: name, icon: Droplets, color: 'blue' },
      { label: getMinorIrrigationProfileLabel('category_type', language), val: type, icon: Tag, color: 'indigo' },
      { label: getMinorIrrigationProfileLabel('managed_by', language), val: managedBy, icon: Wrench, color: 'teal' },
      { label: getMinorIrrigationProfileLabel('condition', language), val: condition, icon: Activity, color: 'rose' },
      { label: getMinorIrrigationProfileLabel('functionality', language), val: functionality, icon: Activity, color: 'pink' },
      { label: getMinorIrrigationProfileLabel('last_maintenance', language), val: lastMaintenance, icon: FileText, color: 'slate' },
      { label: getMinorIrrigationProfileLabel('latitude', language), val: org.latitude ?? profile?.latitude, icon: MapPin, color: 'rose' },
      { label: getMinorIrrigationProfileLabel('longitude', language), val: org.longitude ?? profile?.longitude, icon: MapPin, color: 'pink' },
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

    // Keep keys snake_case (as stored in OrganizationProfile.data via _snake()).
    const TECH_KEYS = [
      'category_type',
      'spillway_type',
      'spillway_width_ft',
      'no_of_sluices',
      'sluice_type',
      'storage_capacity_mcum',
      'mwl_ft',
      'frl_ft',
      'tbl_ft',
      'location_precision_meter',
      'catchment_area_sq_km',
      'command_area_kharif_acres',
      'command_area_rabi_acres',
      'total_ayacut_acres',
    ];
    const OPS_KEYS = [
      'condition',
      'functionality',
      'managed_by',
      'last_maintenance',
      'sensors_installed',
      'last_geotagged_date',
      'forest_clearance_y_n',
      'remarks',
    ];
    const FIN_KEYS = [
      'beneficiary_farmers_count',
      'beneficiary_sc_st_count',
      'sanctioned_amt_lakhs',
      'expenditure_lakhs',
    ];

    // Overview/location/identity keys (top-row highlight cards already show some; keep list anyway for the grid below).
    const OVERVIEW_KEYS = [
      'block_ulb',
      'gp_ward',
      'village_locality',
      'mip_id',
      'name_of_m_i_p',
      'category_type',
      'latitude_raw',
      'longitude_raw',
      'latitude',
      'longitude',
    ];

    const overview = take(OVERVIEW_KEYS);
    const technical = take(TECH_KEYS);
    const operations = take(OPS_KEYS);
    const finance = take(FIN_KEYS);

    const other = entries
      .filter(([k]) => !consumed.has(k))
      .sort(([a], [b]) => a.localeCompare(b));

    return { overview, technical, operations, finance, other };
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
              const iconConfig: Record<
                string,
                { icon: any; color: keyof typeof COLOR_MAP }
              > = {
                // --- Technical ---
                storage_capacity_mcum: { icon: Database, color: 'indigo' },
                mwl_ft: { icon: Layers, color: 'blue' },
                frl_ft: { icon: Layers, color: 'violet' },
                tbl_ft: { icon: Layers, color: 'slate' },
                spillway_type: { icon: Settings, color: 'amber' },
                spillway_width_ft: { icon: Ruler, color: 'amber' },
                no_of_sluices: { icon: Hash, color: 'slate' },
                sluice_type: { icon: Settings, color: 'teal' },
                catchment_area_sq_km: { icon: Droplets, color: 'sky' },
                command_area_kharif_acres: { icon: ArrowLeftRight, color: 'emerald' },
                command_area_rabi_acres: { icon: ArrowLeftRight, color: 'green' },
                total_ayacut_acres: { icon: Gauge, color: 'emerald' },
                location_precision_meter: { icon: Radar, color: 'slate' },
                category_type: { icon: Tag, color: 'indigo' },

                // --- Operations ---
                condition: { icon: Activity, color: 'rose' },
                functionality: { icon: Activity, color: 'pink' },
                managed_by: { icon: Wrench, color: 'teal' },
                last_maintenance: { icon: CalendarClock, color: 'slate' },
                sensors_installed: { icon: Radar, color: 'indigo' },
                last_geotagged_date: { icon: CalendarClock, color: 'violet' },
                forest_clearance_y_n: { icon: Trees, color: 'emerald' },
                remarks: { icon: FileText, color: 'slate' },

                // --- Finance / beneficiaries ---
                beneficiary_farmers_count: { icon: Users, color: 'emerald' },
                beneficiary_sc_st_count: { icon: Users, color: 'amber' },
                sanctioned_amt_lakhs: { icon: IndianRupee, color: 'indigo' },
                expenditure_lakhs: { icon: IndianRupee, color: 'rose' },

                // --- Identity/location (may appear in grouped tabs depending on CSV variants) ---
                mip_id: { icon: Hash, color: 'slate' },
                name_of_m_i_p: { icon: Droplets, color: 'blue' },
                block_ulb: { icon: MapPin, color: 'emerald' },
                gp_ward: { icon: Home, color: 'amber' },
                village_locality: { icon: Home, color: 'sky' },
                latitude_raw: { icon: MapPin, color: 'rose' },
                longitude_raw: { icon: MapPin, color: 'pink' },
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
          {t('minor.dashboard.title', language)}
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

