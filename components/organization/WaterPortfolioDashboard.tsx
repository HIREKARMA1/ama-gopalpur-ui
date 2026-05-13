import { useEffect, useMemo, useState } from 'react';
import {
  Organization,
  WatcoDailyOperation,
  WatcoDailyPumpLog,
  WatcoDailyTankLevel,
} from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getHealthProfileLabel, getMinorIrrigationProfileLabel } from '../../lib/profileLabels';
import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  MapPin,
  Building,
  Building2,
  Gauge,
  Activity,
  Users,
  Timer,
  AlertTriangle,
  FileText,
  Zap,
  TrendingUp,
  Settings,
  Wind,
  Wrench,
  Thermometer,
  Layers,
  Phone,
  Calendar,
  Waves,
  UtilityPole,
  Hash,
  Factory,
  LayoutGrid,
  Signpost,
  Home,
  ClipboardList,
  Compass,
  Navigation,
  Flag,
  Warehouse,
  LocateFixed,
  Globe2,
  Hexagon,
  CircleDot,
  FlaskConical,
  Sparkles,
  AlertCircle,
  Eye,
  Cpu,
  Cog,
  Box,
  Package,
  Ruler,
  Anchor,
  Shield,
  Battery,
  Plug,
  SunMedium,
  CloudRain,
  Filter,
  Droplet,
  ArrowUpFromLine,
  Route,
  Landmark,
  Coins,
  BarChart3,
  Clipboard,
  CircleGauge,
  Orbit,
  Radio,
  Satellite,
  Cable,
  Fan,
  Heater,
  Snowflake,
  Leaf,
  Mountain,
  TreeDeciduous,
  OctagonAlert,
  BadgePercent,
  Banknote,
  Receipt,
  CircleDollarSign,
  HardHat,
  Truck,
  Milestone,
  Fence,
  CircleParking,
  Bookmark,
  Briefcase,
  Award,
  Star,
  Bell,
  Camera,
  Image,
  Link2,
  Share2,
  CircleHelp,
  Info,
  Lightbulb,
  BookOpen,
  NotebookText,
  ListChecks,
  ListOrdered,
  Grid3x3,
  PanelsTopLeft,
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';
import {
  PsGallerySection,
  parseArray,
  type GalleryItem,
} from './EducationPsSections';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface WaterPortfolioDashboardProps {
  org: Organization;
  waterProfile: Record<string, unknown>;
  images?: string[];
  departmentName?: string | null;
  dailyOperations?: WatcoDailyOperation[];
  dailyPumpLogs?: WatcoDailyPumpLog[];
  dailyTankLevels?: WatcoDailyTankLevel[];
}

const HIGHLIGHTED_SCHEME_KEYS = new Set([
  'block_ulb',
  'gp_ward',
  'village_locality',
  'village',
  'station_id',
  'station_name',
  'scheme_name',
  'population_served',
  'source_type',
  'source_name',
  'intake_capacity_mld',
  'design_capacity_mld',
  'operational_capacity_mld',
  'supply_hours_day',
  'per_capita_supply_lpcd',
  'nrw',
  'latitude',
  'longitude',
]);

/** Keys never shown as generic scheme-detail rows (gallery is rendered separately). */
const WATER_SCHEME_TAB_EXCLUDED_KEYS = new Set(['watco_photo_gallery', 'gallery_images']);

const WATER_SCHEME_CATEGORY_MAP = {
  basic: ['district', 'state', 'commissioning_date', 'division', 'sub_division', 'location', 'region', 'zone'],
  quality: ['turbidity', 'ph', 'tds', 'hardness', 'iron', 'fluoride', 'seasonal_variation_notes', 'water_quality'],
  treatment: ['wtp_type', 'flash_mixer', 'clariflocculator', 'rsf_units', 'chlorination_system', 'sludge_disposal_method', 'filter_media_status'],
  pumping: [
    'pump_type',
    'no_of_working_pumps',
    'no_of_standby_pumps',
    'pump_capacity_m3_hr',
    'head_m',
    'pump_running_hours_per_day',
    'raw_water_transformer_capacity',
    'raw_water_dg_set_details',
    'wtp_transformer_capacity',
    'wtp_dg_set_details',
  ],
  dist: [
    'clear_water_reservoir_capacity',
    'esr_type_capacity',
    'total_distribution_length_km',
    'pipe_type',
    'household_connections',
    'stand_posts',
    'water_tariff',
    'flow_meter_status',
    'staff_availability',
  ],
} as const;

type WaterSchemeCategoryTabId = keyof typeof WATER_SCHEME_CATEGORY_MAP;

const ALL_CATEGORY_KEYS_FLAT = new Set(
  (Object.values(WATER_SCHEME_CATEGORY_MAP) as unknown as string[][]).flat(),
);

/** Icons are unique within each category tab (order matches WATER_SCHEME_CATEGORY_MAP). */
const CATEGORY_TAB_STYLES: Record<WaterSchemeCategoryTabId, { icon: LucideIcon; color: string }[]> = {
  basic: [
    { icon: MapPin, color: 'blue' },
    { icon: Flag, color: 'sky' },
    { icon: Calendar, color: 'emerald' },
    { icon: Building2, color: 'indigo' },
    { icon: Warehouse, color: 'violet' },
    { icon: LocateFixed, color: 'rose' },
    { icon: Globe2, color: 'amber' },
    { icon: Hexagon, color: 'teal' },
  ],
  quality: [
    { icon: Waves, color: 'emerald' },
    { icon: Thermometer, color: 'sky' },
    { icon: Layers, color: 'amber' },
    { icon: UtilityPole, color: 'slate' },
    { icon: CircleDot, color: 'rose' },
    { icon: FlaskConical, color: 'pink' },
    { icon: Wind, color: 'teal' },
    { icon: Sparkles, color: 'violet' },
  ],
  treatment: [
    { icon: Settings, color: 'violet' },
    { icon: Wrench, color: 'teal' },
    { icon: Droplets, color: 'blue' },
    { icon: Package, color: 'indigo' },
    { icon: Thermometer, color: 'emerald' },
    { icon: CloudRain, color: 'slate' },
    { icon: Filter, color: 'cyan' },
  ],
  pumping: [
    { icon: Cog, color: 'orange' },
    { icon: Cpu, color: 'emerald' },
    { icon: Battery, color: 'slate' },
    { icon: TrendingUp, color: 'blue' },
    { icon: Ruler, color: 'indigo' },
    { icon: Timer, color: 'violet' },
    { icon: Zap, color: 'amber' },
    { icon: Plug, color: 'orange' },
    { icon: Satellite, color: 'pink' },
    { icon: Cable, color: 'yellow' },
  ],
  dist: [
    { icon: Droplet, color: 'sky' },
    { icon: Anchor, color: 'blue' },
    { icon: Route, color: 'emerald' },
    { icon: Box, color: 'slate' },
    { icon: Users, color: 'teal' },
    { icon: Signpost, color: 'indigo' },
    { icon: Coins, color: 'amber' },
    { icon: CircleGauge, color: 'violet' },
    { icon: HardHat, color: 'rose' },
  ],
};

function buildCategoryStyleByKeyMap(): Record<
  WaterSchemeCategoryTabId,
  Record<string, { icon: LucideIcon; color: string }>
> {
  const tabIds: WaterSchemeCategoryTabId[] = ['basic', 'quality', 'treatment', 'pumping', 'dist'];
  const out = {} as Record<WaterSchemeCategoryTabId, Record<string, { icon: LucideIcon; color: string }>>;
  for (const cat of tabIds) {
    const keys = [...WATER_SCHEME_CATEGORY_MAP[cat]];
    const styles = CATEGORY_TAB_STYLES[cat];
    const row: Record<string, { icon: LucideIcon; color: string }> = {};
    keys.forEach((key, i) => {
      row[key] = styles[i]!;
    });
    out[cat] = row;
  }
  return out;
}

const CATEGORY_STYLE_BY_KEY = buildCategoryStyleByKeyMap();

const OTHER_TAB_ICON_POOL: { icon: LucideIcon; color: string }[] = [
  { icon: Truck, color: 'blue' },
  { icon: Milestone, color: 'sky' },
  { icon: Fence, color: 'emerald' },
  { icon: CircleParking, color: 'indigo' },
  { icon: Bookmark, color: 'violet' },
  { icon: Briefcase, color: 'rose' },
  { icon: Award, color: 'amber' },
  { icon: Star, color: 'teal' },
  { icon: Bell, color: 'pink' },
  { icon: Camera, color: 'slate' },
  { icon: Image, color: 'blue' },
  { icon: Link2, color: 'sky' },
  { icon: Share2, color: 'emerald' },
  { icon: CircleHelp, color: 'indigo' },
  { icon: Info, color: 'violet' },
  { icon: Lightbulb, color: 'amber' },
  { icon: BookOpen, color: 'teal' },
  { icon: NotebookText, color: 'rose' },
  { icon: ListChecks, color: 'pink' },
  { icon: ListOrdered, color: 'slate' },
  { icon: Grid3x3, color: 'blue' },
  { icon: PanelsTopLeft, color: 'sky' },
  { icon: Phone, color: 'emerald' },
  { icon: FileText, color: 'indigo' },
  { icon: Building, color: 'violet' },
  { icon: MapPin, color: 'rose' },
  { icon: BarChart3, color: 'amber' },
  { icon: Clipboard, color: 'teal' },
  { icon: Receipt, color: 'pink' },
  { icon: Banknote, color: 'slate' },
  { icon: BadgePercent, color: 'blue' },
  { icon: CircleDollarSign, color: 'sky' },
  { icon: Orbit, color: 'emerald' },
  { icon: Radio, color: 'indigo' },
  { icon: Fan, color: 'violet' },
  { icon: Heater, color: 'rose' },
  { icon: Snowflake, color: 'amber' },
  { icon: Leaf, color: 'teal' },
  { icon: Mountain, color: 'pink' },
  { icon: TreeDeciduous, color: 'slate' },
  { icon: OctagonAlert, color: 'blue' },
  { icon: AlertTriangle, color: 'sky' },
  { icon: Shield, color: 'emerald' },
  { icon: SunMedium, color: 'indigo' },
  { icon: ArrowUpFromLine, color: 'violet' },
  { icon: Landmark, color: 'rose' },
  { icon: Activity, color: 'amber' },
  { icon: Gauge, color: 'teal' },
  { icon: Eye, color: 'pink' },
];

function formatVal(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (Array.isArray(v)) {
      if (v.length === 0) return '';
      if (typeof v[0] === 'object') return '';
      return v
        .map((x) => String(x).trim())
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }
  const s = String(v).trim();
  return s === '' ? '' : s;
}

function hasWaterSchemeValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'number') return !Number.isNaN(v);
  if (typeof v === 'boolean') return true;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0 && typeof v[0] !== 'object';
  if (typeof v === 'object') return false;
  return String(v).trim() !== '';
}

export function WaterPortfolioDashboard({
  org,
  waterProfile,
  images = [],
  departmentName,
  dailyOperations = [],
  dailyPumpLogs = [],
  dailyTankLevels = [],
}: WaterPortfolioDashboardProps) {
  const { language } = useLanguage();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const intake = waterProfile['intake_capacity_mld'];
  const designCapacity = waterProfile['design_capacity_mld'];
  const perCapita = waterProfile['per_capita_supply_lpcd'];
  const hours = waterProfile['supply_hours_day'];

  const topStats = [
    {
      label: t('water.top.intakeCapacity', language),
      value: intake,
      icon: Droplets,
      color: 'blue',
    },
    {
      label: t('water.top.designCapacity', language),
      value: designCapacity,
      icon: Gauge,
      color: 'emerald',
    },
    {
      label: t('water.top.perCapita', language),
      value: perCapita,
      icon: Users,
      color: 'amber',
    },
  ];

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
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  const keyToLabel = (key: string) =>
    key
      .split('_')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
      .join(' ');

  const wp = waterProfile || {};

  const otherFieldKeys = useMemo(
    () =>
      Object.keys(wp)
        .filter(
          (k) =>
            !HIGHLIGHTED_SCHEME_KEYS.has(k) &&
            !ALL_CATEGORY_KEYS_FLAT.has(k) &&
            !WATER_SCHEME_TAB_EXCLUDED_KEYS.has(k),
        )
        .sort(),
    [wp],
  );

  const categoryRowsFull = useMemo(() => {
    const rows: Record<string, [string, unknown][]> = {
      basic: WATER_SCHEME_CATEGORY_MAP.basic.map((k) => [k, wp[k]] as [string, unknown]),
      quality: WATER_SCHEME_CATEGORY_MAP.quality.map((k) => [k, wp[k]] as [string, unknown]),
      treatment: WATER_SCHEME_CATEGORY_MAP.treatment.map((k) => [k, wp[k]] as [string, unknown]),
      pumping: WATER_SCHEME_CATEGORY_MAP.pumping.map((k) => [k, wp[k]] as [string, unknown]),
      dist: WATER_SCHEME_CATEGORY_MAP.dist.map((k) => [k, wp[k]] as [string, unknown]),
      other: otherFieldKeys.map((k) => [k, wp[k]] as [string, unknown]),
    };
    return rows;
  }, [wp, otherFieldKeys]);

  const otherTabStylesByKey = useMemo(() => {
    const m: Record<string, { icon: LucideIcon; color: string }> = {};
    otherFieldKeys.forEach((k, i) => {
      m[k] = OTHER_TAB_ICON_POOL[i % OTHER_TAB_ICON_POOL.length]!;
    });
    return m;
  }, [otherFieldKeys]);

  const profileRows = useMemo(
    () =>
      [
        { key: 'station_name', label: t('water.field.stationName', language), raw: wp['station_name'], icon: Building2, color: 'blue' },
        { key: 'station_id', label: t('water.field.stationId', language), raw: wp['station_id'], icon: Hash, color: 'slate' },
        {
          key: 'station_type',
          label: t('water.field.stationType', language),
          raw: wp['station_type'] ?? org.attributes?.station_type,
          icon: Factory,
          color: 'indigo',
        },
        { key: 'block_ulb', label: getHealthProfileLabel('block_ulb', language), raw: wp['block_ulb'], icon: LayoutGrid, color: 'emerald' },
        { key: 'gp_ward', label: getHealthProfileLabel('gp_ward', language), raw: wp['gp_ward'], icon: Home, color: 'sky' },
        {
          key: 'village_locality',
          label: getMinorIrrigationProfileLabel('village_locality', language),
          raw: wp['village_locality'] ?? wp['village'],
          icon: Signpost,
          color: 'violet',
        },
        { key: 'scheme_name', label: t('water.field.schemeName', language), raw: wp['scheme_name'], icon: ClipboardList, color: 'teal' },
        { key: 'population_served', label: t('water.field.populationServed', language), raw: wp['population_served'], icon: Users, color: 'amber' },
        { key: 'source_type', label: t('water.field.sourceType', language), raw: wp['source_type'], icon: Droplets, color: 'cyan' },
        { key: 'source_name', label: t('water.field.sourceName', language), raw: wp['source_name'], icon: Waves, color: 'orange' },
        { key: 'latitude', label: getHealthProfileLabel('latitude', language), raw: org.latitude, icon: Compass, color: 'rose' },
        { key: 'longitude', label: getHealthProfileLabel('longitude', language), raw: org.longitude, icon: Navigation, color: 'pink' },
      ] as const,
    [language, wp, org.attributes?.station_type, org.latitude, org.longitude],
  );

  const profileTabVisible = useMemo(() => profileRows.some((r) => hasWaterSchemeValue(r.raw)), [profileRows]);

  const overviewDefs = useMemo(
    () => [
      { key: 'intake', label: t('water.overview.intakeCapacity', language), raw: intake, icon: Droplets, color: 'blue' },
      { key: 'design', label: t('water.overview.designCapacity', language), raw: designCapacity, icon: Gauge, color: 'emerald' },
      { key: 'operational', label: t('water.overview.operationalCapacity', language), raw: wp['operational_capacity_mld'], icon: Activity, color: 'violet' },
      { key: 'hours', label: t('water.overview.supplyHours', language), raw: hours, icon: Timer, color: 'amber' },
      { key: 'percap', label: t('water.overview.perCapita', language), raw: perCapita, icon: BarChart3, color: 'sky' },
      { key: 'nrw', label: t('water.overview.nrw', language), raw: wp['nrw'], icon: AlertTriangle, color: 'rose' },
    ],
    [language, intake, designCapacity, hours, perCapita, wp],
  );

  const overviewTabVisible = useMemo(() => overviewDefs.some((r) => hasWaterSchemeValue(r.raw)), [overviewDefs]);

  const schemeTabs = useMemo(() => {
    const tabs: { id: string; label: string; icon: LucideIcon }[] = [];
    if (profileTabVisible) tabs.push({ id: 'profile', label: t('water.tab.profile', language), icon: Building });
    if (overviewTabVisible) tabs.push({ id: 'overview', label: t('water.assets.waterAssets', language), icon: Gauge });
    if (categoryRowsFull.basic.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'basic', label: t('water.assets.generalData', language), icon: FileText });
    }
    if (categoryRowsFull.quality.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'quality', label: t('water.assets.waterQuality', language), icon: Activity });
    }
    if (categoryRowsFull.treatment.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'treatment', label: t('water.assets.treatmentPlant', language), icon: Droplets });
    }
    if (categoryRowsFull.pumping.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'pumping', label: t('water.assets.pumpingPower', language), icon: Timer });
    }
    if (categoryRowsFull.dist.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'dist', label: t('water.assets.distribution', language), icon: MapPin });
    }
    if (categoryRowsFull.other.some(([, v]) => hasWaterSchemeValue(v))) {
      tabs.push({ id: 'other', label: t('water.assets.otherSpecs', language), icon: AlertTriangle });
    }
    return tabs;
  }, [profileTabVisible, overviewTabVisible, categoryRowsFull, language]);

  const [detailTab, setDetailTab] = useState<string>('profile');

  useEffect(() => {
    if (schemeTabs.length === 0) return;
    if (!schemeTabs.some((x) => x.id === detailTab)) {
      setDetailTab(schemeTabs[0]!.id);
    }
  }, [schemeTabs, detailTab]);
  const galleryItems = parseArray<GalleryItem>(waterProfile.watco_photo_gallery);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('water.portfolio.title', language)}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {t('water.portfolio.subtitle', language)}
        </p>
      </header>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('water.portfolio.schemeDetails', language)}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                {schemeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === tab.id
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">
                      {tab.id === 'profile' ? tab.label : tab.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {detailTab === 'profile' && profileTabVisible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {profileRows.filter((item) => hasWaterSchemeValue(item.raw)).map((item) => (
                  <div key={item.key} className="flex gap-4 items-center">
                    <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
                      <item.icon size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                        {item.label}
                      </p>
                      <p className="text-[15px] font-bold text-[#0f172a] truncate">
                        {formatVal(item.raw)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'overview' && overviewTabVisible && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {overviewDefs.filter((item) => hasWaterSchemeValue(item.raw)).map((item) => (
                  <div key={item.key} className="flex gap-4 items-center">
                    <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
                      <item.icon size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                        {item.label}
                      </p>
                      <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(item.raw)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab !== 'profile' &&
              detailTab !== 'overview' &&
              (detailTab === 'basic' ||
                detailTab === 'quality' ||
                detailTab === 'treatment' ||
                detailTab === 'pumping' ||
                detailTab === 'dist' ||
                detailTab === 'other') && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryRowsFull[detailTab]
                    .filter(([, value]) => hasWaterSchemeValue(value))
                    .map(([key, value]) => {
                    const cfg =
                      detailTab === 'other'
                        ? otherTabStylesByKey[key]!
                        : CATEGORY_STYLE_BY_KEY[detailTab as WaterSchemeCategoryTabId][key]!;
                    const colorClass = colorMap[cfg.color] || colorMap.slate;

                    return (
                      <div key={key} className="flex gap-4 items-center bg-white/40 p-3 rounded-2xl border border-white/60 shadow-sm">
                        <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorClass}`}>
                          <cfg.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#64748b] mb-1 truncate title={keyToLabel(key)}">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-sm sm:text-[15px] font-bold text-[#0f172a] break-words line-clamp-2 title={formatVal(value)}">
                            {formatVal(value)}
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

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-${stat.color}-200 bg-${stat.color}-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm`}
            >
              <div className="min-w-0">
                <p className={`text-[13px] font-bold text-${stat.color}-900/70 mb-1 uppercase tracking-wider`}>
                  {stat.label}
                </p>
                <h3 className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none`}>
                  {formatVal(stat.value)}
                </h3>
              </div>
              <div className={`w-14 h-14 shrink-0 rounded-2xl bg-${stat.color}-200/50 flex items-center justify-center text-${stat.color}-700 ml-3 shadow-inner`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">
              {language === 'or' ? 'ସଂସ୍ଥାର ଅବସ୍ଥାନ' : 'Scheme Location'}
            </h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              {language === 'or'
                ? 'ଜଳ ଯୋଗାଣ ଓ ପରିମଳ ସଂସ୍ଥାର ମାନଚ୍ଚିତ୍ର ଅବସ୍ଥାନ।'
                : 'Water supply scheme location on the map.'}
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
                  styles: [
                    { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
                  ],
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: true,
                  scaleControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  minZoom: 11,
                  maxZoom: 18,
                }}
              >
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : (
              <div className="text-center">
                <MapPin size={24} className="text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">{t('portfolio.loadingMap', language)}</p>
              </div>
            )}
          </div>
        </div>
      </section> */}

      {/* Daily monitoring (WATCO/RWSS portfolio): temporarily hidden — set to true to restore */}
      {false && (
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-cyan-200 bg-cyan-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">{t('water.daily.title', language)}</h2>
            <p className="text-[13px] text-[#64748b] mt-1">{t('water.daily.subtitle', language)}</p>
          </div>

          <div className="space-y-10">
            {/* Date Picker & Quick Status */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">{t('portfolio.selectMonitoringDate', language)}</label>
                <input
                  type="date"
                  value={monitorDate}
                  onChange={(e) => setMonitorDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                {(() => {
                  const dayOps = dailyOperations.find(d => d.record_date.slice(0, 10) === monitorDate);
                  const activeLeakages = dayOps?.active_leakages ?? 0;

                  return (
                    <>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${activeLeakages > 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                        <AlertTriangle size={18} className={activeLeakages > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">{t('water.daily.activeLeakages', language)}</p>
                          <p className="text-xs font-bold leading-tight">
                            {activeLeakages > 0
                              ? t('water.daily.leakagesCountLine', language).replace('{count}', String(activeLeakages))
                              : t('water.daily.leakagesNone', language)}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Production vs Supply Trends */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a]">{t('water.daily.productionVsSupply', language)}</h3>
                    <p className="text-[11px] text-[#64748b]">{t('water.daily.volumeMld15', language)}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{t('water.daily.legend.produced', language)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{t('water.daily.legend.supplied', language)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyOperations.slice(-15).map(p => ({
                      date: p.record_date.slice(5, 10).split('-').reverse().join('/'),
                      produced: p.water_produced_mld || 0,
                      supplied: p.water_supplied_mld || 0,
                    }))}>
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
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="produced" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="supplied" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pump Logs Trends */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">{t('water.daily.pumpHours', language)}</h3>
                  <p className="text-[11px] text-[#64748b]">{t('water.daily.pumpHoursSubtitle', language)}</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyPumpLogs.slice(-15).map(a => ({
                      date: a.record_date.slice(5, 10).split('-').reverse().join('/'),
                      hours: a.total_running_hours || 0,
                    }))}>
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
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tank Levels for Selected Day */}
            <div className="rounded-2xl border border-slate-100 bg-white/40 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">{t('water.daily.tankLevelsTitle', language)}</h3>
                  <p className="text-[11px] text-[#64748b]">{t('water.daily.tankLevelsForDate', language).replace('{date}', monitorDate)}</p>
                </div>
                <div className="h-10 w-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                  <Droplets size={20} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('water.daily.tankName', language)}</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">{t('water.daily.openingMl', language)}</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">{t('water.daily.intakeMl', language)}</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">{t('water.daily.distributedMl', language)}</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">{t('water.daily.closingMl', language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const dayTanks = dailyTankLevels.filter(s => s.record_date.slice(0, 10) === monitorDate);
                      if (dayTanks.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic bg-white/20">
                              {t('water.daily.noTankData', language)}
                            </td>
                          </tr>
                        );
                      }
                      return dayTanks.map((tank, idx) => (
                        <tr key={idx} className="hover:bg-white/40 transition">
                          <td className="px-6 py-4 font-bold text-[#334155]">{tank.tank_name}</td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">{tank.opening_level_ml || 0}</td>
                          <td className="px-6 py-4 text-center font-semibold text-emerald-600">+{tank.intake_ml || 0}</td>
                          <td className="px-6 py-4 text-center font-semibold text-blue-500">-{tank.distributed_ml || 0}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700">
                              {tank.closing_level_ml || 0}
                            </span>
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
      )}

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <PsGallerySection gallery={galleryItems} />
      </section>
    </div>
  );
}

