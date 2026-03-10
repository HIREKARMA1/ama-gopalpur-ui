import { useMemo, useState } from 'react';
import { Organization, RevenueLandStatusRecord } from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MapPin,
  Layers,
  Landmark,
  AlertTriangle,
  FileText,
  Scale,
  Building,
  Monitor,
  Hash,
  Home,
  Tag,
  Shield,
  Activity,
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface RevenueLandPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  statusRecords?: RevenueLandStatusRecord[];
  departmentName?: string | null;
  images?: string[];
}

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

const keyToLabel = (key: string) =>
  key
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');

export function RevenueLandPortfolioDashboard({
  org,
  profile,
  statusRecords = [],
  departmentName,
  images = [],
}: RevenueLandPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [detailTab, setDetailTab] = useState<'overview' | 'tenure' | 'use' | 'risk'>('overview');
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const totalAreaAcres = profile['total_area_acres'] as string | number | null | undefined;
  const availableAreaAcres = profile['available_vacant_area_acres'] as
    | string
    | number
    | null
    | undefined;
  const landBankFlag =
    (profile['is_in_land_bank_yes_no'] as string | null | undefined) ??
    (profile['is_in_land_bank'] as string | null | undefined);
  const landBankCategory =
    (profile['land_bank_category_a_b_other'] as string | null | undefined) ??
    (profile['land_bank_category'] as string | null | undefined);
  const encroachmentStatus =
    (profile['encroachment_status'] as string | null | undefined) ??
    (profile['encroachment_status_none_notice_eviction_pending_evicted_regularised'] as
      | string
      | null
      | undefined);
  const litigationStatus =
    (profile['litigation_status'] as string | null | undefined) ??
    (profile['litigation_status_none_pending_decreed_stayed'] as string | null | undefined);

  const topStats = [
    { label: 'Total area (acres)', value: totalAreaAcres, icon: Layers, color: 'amber' },
    { label: 'Available vacant area (acres)', value: availableAreaAcres, icon: Scale, color: 'emerald' },
    { label: 'In land bank', value: landBankFlag, icon: Landmark, color: 'indigo' },
  ] as const;

  const statColorClasses: Record<
    (typeof topStats)[number]['color'],
    { card: string; label: string; value: string; iconWrap: string }
  > = {
    amber: {
      card: 'border-amber-200 bg-amber-100/40',
      label: 'text-amber-900/70',
      value: 'text-amber-950',
      iconWrap: 'bg-amber-200/50 text-amber-700',
    },
    emerald: {
      card: 'border-emerald-200 bg-emerald-100/40',
      label: 'text-emerald-900/70',
      value: 'text-emerald-950',
      iconWrap: 'bg-emerald-200/50 text-emerald-700',
    },
    indigo: {
      card: 'border-indigo-200 bg-indigo-100/40',
      label: 'text-indigo-900/70',
      value: 'text-indigo-950',
      iconWrap: 'bg-indigo-200/50 text-indigo-700',
    },
  };

  const highlightedKeys = new Set<string>([
    'tahasil',
    'ri_circle',
    'block_ulb',
    'gp_ward',
    'mouza_village',
    'habitation_locality',
    'urban_rural',
    'nearest_landmark',
    'road_connectivity_abutting_road_name',
    'distance_from_main_road_meters',
    'govt_land_id',
    'khata_no',
    'plot_no',
    'sub_plot_no',
    'land_type_govt_private_other',
    'govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other',
    'kisam',
    'kisam_description',
    'department_recorded_as_owner',
    'department_in_possession',
    'present_use_office_school_health_centre_rli_road_pond_market_vacant_other',
    'proposed_use',
    'is_in_land_bank_yes_no',
    'land_bank_category_a_b_other',
    'leased_out_yes_no',
    'lessee_name',
    'lease_purpose',
    'lease_deed_no',
    'lease_period_from_dd_mm_yyyy',
    'lease_period_to_dd_mm_yyyy',
    'lease_premium_amount_rs',
    'lease_annual_rent_rs',
    'building_existing_yes_no',
    'building_name',
    'building_floors',
    'building_construction_year',
    'bhunaksha_sheet_no',
    'bhunaksha_plot_id',
    'ror_no',
    'ror_year',
    'last_mutation_case_no',
    'encroachment_case_no_ople',
    'encroachment_status',
    'court_case_no',
    'court_name',
    'litigation_status',
    'crz_zone_if_any',
    'flood_prone_yes_no',
    'other_restrictions_conditions',
    'remarks_description',
    'latitude',
    'longitude',
  ]);

  const locationFields: [string, unknown][] = [
    ['tahasil', profile['tahasil']],
    ['ri_circle', profile['ri_circle']],
    ['block_ulb', profile['block_ulb']],
    ['gp_ward', profile['gp_ward']],
    ['mouza_village', profile['mouza_village']],
    ['habitation_locality', profile['habitation_locality']],
    ['urban_rural', profile['urban_rural']],
    ['nearest_landmark', profile['nearest_landmark']],
    ['road_connectivity_abutting_road_name', profile['road_connectivity_abutting_road_name']],
    ['distance_from_main_road_meters', profile['distance_from_main_road_meters']],
  ];

  const tenureFields: [string, unknown][] = [
    ['govt_land_id', profile['govt_land_id']],
    ['khata_no', profile['khata_no']],
    ['plot_no', profile['plot_no']],
    ['sub_plot_no', profile['sub_plot_no']],
    ['land_type_govt_private_other', profile['land_type_govt_private_other']],
    [
      'govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other',
      profile['govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other'],
    ],
    ['kisam', profile['kisam']],
    ['kisam_description', profile['kisam_description']],
    ['department_recorded_as_owner', profile['department_recorded_as_owner']],
    ['department_in_possession', profile['department_in_possession']],
  ];

  const riskFields: [string, unknown][] = [
    ['encroachment_status', encroachmentStatus],
    ['encroachment_case_no_ople', profile['encroachment_case_no_ople']],
    ['court_case_no', profile['court_case_no']],
    ['court_name', profile['court_name']],
    ['litigation_status', litigationStatus],
    ['flood_prone_yes_no', profile['flood_prone_yes_no']],
    ['crz_zone_if_any', profile['crz_zone_if_any']],
  ];

  const useFields: [string, unknown][] = [
    [
      'present_use_office_school_health_centre_rli_road_pond_market_vacant_other',
      profile['present_use_office_school_health_centre_rli_road_pond_market_vacant_other'],
    ],
    ['proposed_use', profile['proposed_use']],
    ['is_in_land_bank_yes_no', landBankFlag],
    ['land_bank_category_a_b_other', landBankCategory],
    ['leased_out_yes_no', profile['leased_out_yes_no']],
    ['lessee_name', profile['lessee_name']],
    ['lease_purpose', profile['lease_purpose']],
    ['lease_deed_no', profile['lease_deed_no']],
    ['lease_period_from_dd_mm_yyyy', profile['lease_period_from_dd_mm_yyyy']],
    ['lease_period_to_dd_mm_yyyy', profile['lease_period_to_dd_mm_yyyy']],
    ['lease_premium_amount_rs', profile['lease_premium_amount_rs']],
    ['lease_annual_rent_rs', profile['lease_annual_rent_rs']],
  ];

  const buildingFields: [string, unknown][] = [
    ['building_existing_yes_no', profile['building_existing_yes_no']],
    ['building_name', profile['building_name']],
    ['building_floors', profile['building_floors']],
    ['building_construction_year', profile['building_construction_year']],
  ];

  const descriptionFields: [string, unknown][] = [
    ['other_restrictions_conditions', profile['other_restrictions_conditions']],
    ['remarks_description', profile['remarks_description']],
  ];

  const renderFieldList = (items: [string, unknown][]) => (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {items.map(([key, value]) => (
        <div key={key} className="border-b border-border/40 pb-1.5 last:border-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {keyToLabel(key)}
          </dt>
          <dd className="mt-0.5 text-sm text-slate-900">{formatVal(value as any)}</dd>
        </div>
      ))}
    </dl>
  );

  const galleryImages = Array.isArray((profile as any)?.gallery_images)
    ? ((profile as any).gallery_images as string[])
    : [];
  const finalImages =
    images.length > 0
      ? images
      : galleryImages.length > 0
        ? galleryImages
        : org.cover_image_key
          ? [org.cover_image_key]
          : [];

  const attributeEntries = Object.entries(profile || {})
    .filter(([key]) => !highlightedKeys.has(key) && key !== 'gallery_images')
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16 overflow-x-hidden">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider
          images={finalImages}
          altPrefix={org.name}
          className="h-[240px] min-[420px]:h-[280px] sm:h-[360px] lg:h-[410px]"
        />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          Land Parcel Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Parcel details, legal status, and utilization from available data
        </p>
      </header>

      {/* Parcel details tabs (mirrors Health layout) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Parcel details
              </h2>
              <div className="grid grid-cols-2 sm:flex items-center rounded-xl sm:rounded-full bg-slate-100 p-1 w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={() => setDetailTab('overview')}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold transition ${detailTab === 'overview'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Building size={14} />
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('tenure')}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold transition ${detailTab === 'tenure'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Monitor size={14} />
                  <span>Tenure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('use')}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold transition ${detailTab === 'use'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Scale size={14} />
                  <span>Use & lease</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('risk')}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold transition ${detailTab === 'risk'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <AlertTriangle size={14} />
                  <span>Risk & records</span>
                </button>
              </div>
            </div>

            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Parcel name', val: org.name, icon: Building, color: 'blue' },
                  { label: 'Govt land ID', val: profile['govt_land_id'], icon: FileText, color: 'violet' },
                  { label: 'Tahasil', val: profile['tahasil'], icon: MapPin, color: 'emerald' },
                  { label: 'RI Circle', val: profile['ri_circle'], icon: MapPin, color: 'sky' },
                  { label: 'Block / ULB', val: profile['block_ulb'], icon: MapPin, color: 'amber' },
                  { label: 'GP / Ward', val: profile['gp_ward'], icon: MapPin, color: 'teal' },
                  { label: 'Mouza / Village', val: profile['mouza_village'], icon: MapPin, color: 'rose' },
                  {
                    label: 'Habitation / Locality',
                    val: profile['habitation_locality'],
                    icon: MapPin,
                    color: 'pink',
                  },
                  { label: 'Latitude', val: org.latitude ?? profile['latitude'], icon: MapPin, color: 'slate' },
                  { label: 'Longitude', val: org.longitude ?? profile['longitude'], icon: MapPin, color: 'slate' },
                ].map((item, idx) => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-100',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    amber: 'bg-amber-50 text-amber-600 border-amber-100',
                    violet: 'bg-violet-50 text-violet-600 border-violet-100',
                    slate: 'bg-slate-100 text-slate-600 border-slate-200',
                    teal: 'bg-teal-50 text-teal-600 border-teal-100',
                    rose: 'bg-rose-50 text-rose-600 border-rose-100',
                    pink: 'bg-pink-50 text-pink-600 border-pink-100',
                    sky: 'bg-sky-50 text-sky-600 border-sky-100',
                  };
                  return (
                    <div key={idx} className="flex gap-4 items-center">
                      <div
                        className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                      >
                        <item.icon size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                          {item.label}
                        </p>
                        <p className="text-[15px] font-bold text-[#0f172a] truncate">
                          {formatVal(item.val as any)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'tenure' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {tenureFields.map(([key, value]) => {
                    const config: Record<string, { icon: any; color: string }> = {
                      govt_land_id: { icon: Hash, color: 'indigo' },
                      khata_no: { icon: FileText, color: 'emerald' },
                      plot_no: { icon: FileText, color: 'amber' },
                      sub_plot_no: { icon: FileText, color: 'sky' },
                      land_type_govt_private_other: { icon: Tag, color: 'violet' },
                      govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other: {
                        icon: Tag,
                        color: 'pink',
                      },
                      kisam: { icon: FileText, color: 'teal' },
                      kisam_description: { icon: FileText, color: 'slate' },
                      department_recorded_as_owner: { icon: Shield, color: 'rose' },
                      department_in_possession: { icon: Shield, color: 'orange' },
                    };

                    const item = config[key] || { icon: FileText, color: 'slate' };
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
                      orange: 'bg-orange-50 text-orange-600 border-orange-100',
                      sky: 'bg-sky-50 text-sky-600 border-sky-100',
                    };

                    return (
                      <div key={key} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detailTab === 'use' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {useFields.map(([key, value]) => {
                    const config: Record<string, { icon: any; color: string }> = {
                      present_use_office_school_health_centre_rli_road_pond_market_vacant_other: {
                        icon: Layers,
                        color: 'emerald',
                      },
                      proposed_use: { icon: FileText, color: 'indigo' },
                      is_in_land_bank_yes_no: { icon: Landmark, color: 'violet' },
                      land_bank_category_a_b_other: { icon: Tag, color: 'pink' },
                      leased_out_yes_no: { icon: Scale, color: 'amber' },
                      lessee_name: { icon: Building, color: 'sky' },
                      lease_purpose: { icon: FileText, color: 'teal' },
                      lease_deed_no: { icon: Hash, color: 'slate' },
                      lease_period_from_dd_mm_yyyy: { icon: FileText, color: 'orange' },
                      lease_period_to_dd_mm_yyyy: { icon: FileText, color: 'rose' },
                      lease_premium_amount_rs: { icon: FileText, color: 'emerald' },
                      lease_annual_rent_rs: { icon: FileText, color: 'blue' },
                    };

                    const item = config[key] || { icon: FileText, color: 'slate' };
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
                      orange: 'bg-orange-50 text-orange-600 border-orange-100',
                      sky: 'bg-sky-50 text-sky-600 border-sky-100',
                    };

                    return (
                      <div key={key} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detailTab === 'risk' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[
                    ...riskFields,
                    ['bhunaksha_sheet_no', profile['bhunaksha_sheet_no']],
                    ['bhunaksha_plot_id', profile['bhunaksha_plot_id']],
                    ['ror_no', profile['ror_no']],
                    ['ror_year', profile['ror_year']],
                    ['last_mutation_case_no', profile['last_mutation_case_no']],
                  ].map(([key, value]) => {
                    const config: Record<string, { icon: any; color: string }> = {
                      encroachment_status: { icon: AlertTriangle, color: 'rose' },
                      encroachment_case_no_ople: { icon: Activity, color: 'orange' },
                      court_case_no: { icon: FileText, color: 'slate' },
                      court_name: { icon: Home, color: 'indigo' },
                      litigation_status: { icon: AlertTriangle, color: 'amber' },
                      flood_prone_yes_no: { icon: AlertTriangle, color: 'emerald' },
                      crz_zone_if_any: { icon: Layers, color: 'sky' },
                      bhunaksha_sheet_no: { icon: FileText, color: 'teal' },
                      bhunaksha_plot_id: { icon: FileText, color: 'violet' },
                      ror_no: { icon: FileText, color: 'pink' },
                      ror_year: { icon: FileText, color: 'blue' },
                      last_mutation_case_no: { icon: FileText, color: 'slate' },
                    };

                    const item = config[key] || { icon: FileText, color: 'slate' };
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
                      orange: 'bg-orange-50 text-orange-600 border-orange-100',
                      sky: 'bg-sky-50 text-sky-600 border-sky-100',
                    };

                    return (
                      <div key={key} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats row – mirrors Health dashboard */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-5 sm:p-6 shadow-sm flex justify-between items-center backdrop-blur-sm ${statColorClasses[stat.color].card}`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[12px] sm:text-[13px] font-bold mb-1 uppercase tracking-wider ${statColorClasses[stat.color].label}`}
                >
                  {stat.label}
                </p>
                <h3
                  className={`text-[24px] sm:text-[32px] font-black leading-none ${statColorClasses[stat.color].value}`}
                >
                  {formatVal(stat.value as any)}
                </h3>
              </div>
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center ml-3 shadow-inner ${statColorClasses[stat.color].iconWrap}`}
              >
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Map Section – mirrors Health layout but for parcels */}
      {/* <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">Parcel Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Land parcel location on map within Gopalpur constituency.
            </p>
          </div>
          <div className="h-[400px] w-full rounded-xl bg-[#f8f9fa] overflow-hidden relative flex items-center justify-center">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                options={{
                  restriction: {
                    latLngBounds: {
                      south: GOPALPUR_BOUNDS.south,
                      west: GOPALPUR_BOUNDS.west,
                      north: GOPALPUR_BOUNDS.north,
                      east: GOPALPUR_BOUNDS.east,
                    },
                    strictBounds: true,
                  },
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                }}
              >
                {org.latitude != null && org.longitude != null && (
                  <Marker position={{ lat: org.latitude, lng: org.longitude }} title={org.name} />
                )}
              </GoogleMap>
            ) : (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
        </div>
      </section> */}

      {/* Status over time – dynamic data (charts & table) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Status over time</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Dynamic status records (encroachment, litigation, use, area) managed by the department admin.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Select date</label>
                <input
                  type="date"
                  value={monitorDate}
                  onChange={(e) => setMonitorDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {statusRecords.length === 0 && (
                <p className="text-xs text-slate-500 italic">No status records yet. Add records from the admin panel.</p>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-5 sm:p-6 flex flex-col h-[280px] sm:h-[320px] min-w-0">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">Area vacant (acres) over time</h3>
                  <p className="text-[11px] text-[#64748b]">Last 15 records</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={statusRecords.slice(0, 15).map((r) => ({
                        date: r.record_date?.slice(5, 10)?.split('-').reverse().join('/') ?? '',
                        acres: r.area_vacant_acres ?? 0,
                      })).reverse()}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="acres"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/50 p-5 sm:p-6 flex flex-col h-[280px] sm:h-[320px] min-w-0">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">Status records by date</h3>
                  <p className="text-[11px] text-[#64748b]">Count of records (last 15 dates)</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const byDate: Record<string, number> = {};
                        statusRecords.slice(0, 50).forEach((r) => {
                          const d = r.record_date?.slice(0, 10) ?? '';
                          byDate[d] = (byDate[d] ?? 0) + 1;
                        });
                        return Object.entries(byDate)
                          .sort((a, b) => b[0].localeCompare(a[0]))
                          .slice(0, 15)
                          .map(([date, count]) => ({
                            date: date.slice(5, 10).split('-').reverse().join('/'),
                            count,
                          }))
                          .reverse();
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-100 bg-white/40 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">Status records</h3>
                  <p className="text-[11px] text-[#64748b]">
                    {monitorDate ? `Records for ${monitorDate}` : 'All records (newest first)'}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Activity size={20} />
                </div>
              </div>
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left text-sm border-collapse min-w-[680px] sm:min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Encroachment</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Litigation</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Present use</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">In land bank</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Area vacant (acres)</th>
                      <th className="px-3 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filtered = monitorDate
                        ? statusRecords.filter((r) => r.record_date?.slice(0, 10) === monitorDate)
                        : statusRecords.slice(0, 20);
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic bg-white/20">
                              {monitorDate
                                ? `No status records for ${monitorDate}.`
                                : 'No status records yet. Add records from the admin panel.'}
                            </td>
                          </tr>
                        );
                      }
                      return filtered.map((r) => (
                        <tr key={r.id} className="hover:bg-white/40 transition">
                          <td className="px-3 sm:px-6 py-4 font-semibold text-[#334155]">
                            {r.record_date?.slice(0, 10) ?? '—'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-slate-600">{formatVal(r.encroachment_status)}</td>
                          <td className="px-3 sm:px-6 py-4 text-slate-600">{formatVal(r.litigation_status)}</td>
                          <td className="px-3 sm:px-6 py-4 text-slate-600">{formatVal(r.present_use)}</td>
                          <td className="px-3 sm:px-6 py-4 text-slate-600">{formatVal(r.in_land_bank)}</td>
                          <td className="px-3 sm:px-6 py-4 text-right font-semibold text-slate-700">
                            {formatVal(r.area_vacant_acres)}
                          </td>
                          <td
                            className="px-3 sm:px-6 py-4 text-slate-600 max-w-[160px] sm:max-w-[200px] truncate"
                            title={String(r.remarks ?? '')}
                          >
                            {formatVal(r.remarks)}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

