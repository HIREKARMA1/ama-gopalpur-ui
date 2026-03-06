import { useMemo, useState } from 'react';
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
import {
  Droplets,
  MapPin,
  Building,
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
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';

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

function formatVal(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

// Icon/color mapping per water attribute (snake_case key)
function getWaterFieldConfig(key: string): { icon: any; color: string } {
  const config: Record<string, { icon: any; color: string }> = {
    // Basic
    district: { icon: MapPin, color: 'blue' },
    state: { icon: MapPin, color: 'sky' },
    commissioning_date: { icon: Calendar, color: 'emerald' },
    division: { icon: Building, color: 'indigo' },
    sub_division: { icon: Building, color: 'violet' },
    location: { icon: MapPin, color: 'rose' },
    region: { icon: MapPin, color: 'amber' },
    zone: { icon: MapPin, color: 'orange' },

    // Quality
    turbidity: { icon: Waves, color: 'emerald' },
    ph: { icon: Thermometer, color: 'sky' },
    tds: { icon: Layers, color: 'amber' },
    hardness: { icon: UtilityPole, color: 'slate' },
    iron: { icon: AlertTriangle, color: 'rose' },
    fluoride: { icon: AlertTriangle, color: 'pink' },
    seasonal_variation_notes: { icon: Wind, color: 'teal' },
    water_quality: { icon: Activity, color: 'blue' },

    // Treatment
    wtp_type: { icon: Settings, color: 'violet' },
    flash_mixer: { icon: Wrench, color: 'teal' },
    clariflocculator: { icon: Waves, color: 'blue' },
    rsf_units: { icon: Layers, color: 'indigo' },
    chlorination_system: { icon: Thermometer, color: 'emerald' },
    sludge_disposal_method: { icon: Wind, color: 'slate' },
    filter_media_status: { icon: Waves, color: 'cyan' },

    // Pumping
    pump_type: { icon: Settings, color: 'orange' },
    no_of_working_pumps: { icon: Activity, color: 'emerald' },
    no_of_standby_pumps: { icon: Timer, color: 'slate' },
    pump_capacity_m3_hr: { icon: TrendingUp, color: 'blue' },
    head_m: { icon: TrendingUp, color: 'indigo' },
    pump_running_hours_per_day: { icon: Timer, color: 'violet' },
    raw_water_transformer_capacity: { icon: Zap, color: 'amber' },
    raw_water_dg_set_details: { icon: Zap, color: 'orange' },
    wtp_transformer_capacity: { icon: Zap, color: 'yellow' },
    wtp_dg_set_details: { icon: Zap, color: 'pink' },

    // Distribution
    clear_water_reservoir_capacity: { icon: Droplets, color: 'sky' },
    esr_type_capacity: { icon: Droplets, color: 'blue' },
    total_distribution_length_km: { icon: TrendingUp, color: 'emerald' },
    pipe_type: { icon: Settings, color: 'slate' },
    household_connections: { icon: Users, color: 'teal' },
    stand_posts: { icon: MapPin, color: 'indigo' },
    water_tariff: { icon: FileText, color: 'amber' },
    flow_meter_status: { icon: Gauge, color: 'emerald' },
    staff_availability: { icon: Users, color: 'violet' },
  } as any;

  const direct = config[key];
  if (direct) return direct;

  // Fallbacks by key fragment
  const k = key.toLowerCase();
  if (k.includes('capacity') || k.includes('mld')) return { icon: Droplets, color: 'sky' };
  if (k.includes('level') || k.includes('quality') || k.includes('ph') || k.includes('tds')) return { icon: Activity, color: 'emerald' };
  if (k.includes('pump') || k.includes('motor')) return { icon: Settings, color: 'indigo' };
  if (k.includes('pipe') || k.includes('length') || k.includes('dist')) return { icon: TrendingUp, color: 'teal' };
  if (k.includes('power') || k.includes('transformer') || k.includes('volt') || k.includes('dg_') || k.includes('generator')) return { icon: Zap, color: 'amber' };
  if (k.includes('staff') || k.includes('employee') || k.includes('operator')) return { icon: Users, color: 'violet' };
  if (k.includes('date') || k.includes('year') || k.includes('time')) return { icon: Calendar, color: 'rose' };
  if (k.includes('phone') || k.includes('contact')) return { icon: Phone, color: 'emerald' };
  if (k.includes('address') || k.includes('pin') || k.includes('loc') || k.includes('ward')) return { icon: MapPin, color: 'pink' };

  return { icon: FileText, color: 'slate' };
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
      label: 'Intake Capacity (MLD)',
      value: intake,
      icon: Droplets,
      color: 'blue',
    },
    {
      label: 'Design Capacity (MLD)',
      value: designCapacity,
      icon: Gauge,
      color: 'emerald',
    },
    {
      label: 'Per Capita Supply (LPCD)',
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
  };

  const highlightedKeys = new Set([
    'block_ulb',
    'gp_ward',
    'village_locality',
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

  const extraAttributes = Object.entries(waterProfile || {}).filter(
    ([key, value]) =>
      value != null &&
      String(value).trim() !== '' &&
      !highlightedKeys.has(key),
  );

  const keyToLabel = (key: string) =>
    key
      .split('_')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
      .join(' ');

  const CATEGORY_MAP: Record<string, string[]> = {
    basic: ['district', 'state', 'commissioning_date', 'division', 'sub_division', 'location', 'region', 'zone'],
    quality: ['turbidity', 'ph', 'tds', 'hardness', 'iron', 'fluoride', 'seasonal_variation_notes', 'water_quality'],
    treatment: ['wtp_type', 'flash_mixer', 'clariflocculator', 'rsf_units', 'chlorination_system', 'sludge_disposal_method', 'filter_media_status'],
    pumping: ['pump_type', 'no_of_working_pumps', 'no_of_standby_pumps', 'pump_capacity_m3_hr', 'head_m', 'pump_running_hours_per_day', 'raw_water_transformer_capacity', 'raw_water_dg_set_details', 'wtp_transformer_capacity', 'wtp_dg_set_details'],
    dist: ['clear_water_reservoir_capacity', 'esr_type_capacity', 'total_distribution_length_km', 'pipe_type', 'household_connections', 'stand_posts', 'water_tariff', 'flow_meter_status', 'staff_availability'],
  };

  const categorizedAttributes = useMemo(() => {
    const cats: Record<string, [string, unknown][]> = {
      basic: [], quality: [], treatment: [], pumping: [], dist: [], other: []
    };

    extraAttributes.forEach(([key, value]) => {
      let matched = false;
      for (const [catName, keys] of Object.entries(CATEGORY_MAP)) {
        if (keys.includes(key)) {
          cats[catName].push([key, value]);
          matched = true;
          break;
        }
      }
      if (!matched) cats.other.push([key, value]);
    });
    return cats;
  }, [extraAttributes]);

  const assetTabs: { id: string; label: string; icon: any }[] = [
    { id: 'overview', label: 'Water Assets', icon: Gauge },
    { id: 'basic', label: 'General Data', icon: FileText },
    { id: 'quality', label: 'Water Quality', icon: Activity },
    { id: 'treatment', label: 'Treatment Plant (WTP)', icon: Droplets },
    { id: 'pumping', label: 'Pumping & Power', icon: Timer },
    { id: 'dist', label: 'Distribution & More', icon: MapPin },
    { id: 'other', label: 'Other Specs', icon: AlertTriangle },
  ].filter(t => t.id === 'overview' || categorizedAttributes[t.id]?.length > 0);

  const [detailTab, setDetailTab] = useState<string>('profile');

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {language === 'or' ? 'ଜଳ ଯୋଗାଣ ସଂପତ୍ତି ଡ୍ୟାସବୋର୍ଡ' : 'Water Supply Asset Dashboard'}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {language === 'or'
            ? 'ଏହି ଜଳ ଯୋଗାଣ ସଂସ୍ଥା ସମ୍ପର୍କିତ ତଥ୍ୟ ଓ ଅବସ୍ଥାନ।'
            : 'Scheme details and location from available WATCO/RWSS data.'}
        </p>
      </header>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {language === 'or' ? 'ସଂସ୍ଥା ବିବରଣୀ' : 'Scheme details'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                {[
                  { id: 'profile', label: language === 'or' ? 'ପ୍ରୋଫାଇଲ୍' : 'Profile', icon: Building },
                  ...assetTabs,
                ].map((tab) => (
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

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  {
                    label: language === 'or' ? 'ଷ୍ଟେସନ୍ ନାମ' : 'Station Name',
                    val: waterProfile['station_name'] || org.name,
                    icon: Building,
                    color: 'blue',
                  },
                  {
                    label: language === 'or' ? 'ଷ୍ଟେସନ୍ ID' : 'Station ID',
                    val: waterProfile['station_id'],
                    icon: FileText,
                    color: 'slate',
                  },
                  {
                    label: 'Station Type',
                    val: waterProfile['station_type'] || org.attributes?.station_type,
                    icon: Droplets,
                    color: 'indigo',
                  },
                  {
                    label: 'Block / ULB',
                    val: waterProfile['block_ulb'],
                    icon: MapPin,
                    color: 'emerald',
                  },
                  {
                    label: 'GP / Ward',
                    val: waterProfile['gp_ward'],
                    icon: MapPin,
                    color: 'sky',
                  },
                  {
                    label: 'Village / Locality',
                    val: waterProfile['village_locality'] || waterProfile['village'],
                    icon: MapPin,
                    color: 'violet',
                  },
                  {
                    label: language === 'or' ? 'ଯୋଜନା ନାମ' : 'Scheme Name',
                    val: waterProfile['scheme_name'],
                    icon: FileText,
                    color: 'teal',
                  },
                  {
                    label: language === 'or' ? 'ସେବା ପ୍ରାପ୍ତ ଜନସଂଖ୍ୟା' : 'Population served',
                    val: waterProfile['population_served'],
                    icon: Users,
                    color: 'amber',
                  },
                  {
                    label: 'Source Type',
                    val: waterProfile['source_type'],
                    icon: Droplets,
                    color: 'sky',
                  },
                  {
                    label: 'Source Name',
                    val: waterProfile['source_name'],
                    icon: Droplets,
                    color: 'blue',
                  },
                  {
                    label: 'Latitude',
                    val: org.latitude,
                    icon: MapPin,
                    color: 'rose',
                  },
                  {
                    label: 'Longitude',
                    val: org.longitude,
                    icon: MapPin,
                    color: 'pink',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
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
                ))}
              </div>
            )}

            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Intake Capacity (MLD)', val: intake, icon: Droplets, color: 'blue' },
                  { label: 'Design Capacity (MLD)', val: designCapacity, icon: Gauge, color: 'emerald' },
                  { label: 'Operational Capacity (MLD)', val: waterProfile['operational_capacity_mld'], icon: Activity, color: 'violet' },
                  { label: 'Supply Hours / Day', val: hours, icon: Timer, color: 'amber' },
                  { label: 'Per Capita Supply (LPCD)', val: perCapita, icon: Users, color: 'sky' },
                  { label: 'NRW (%)', val: waterProfile['nrw'], icon: AlertTriangle, color: 'rose' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
                      <item.icon size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                        {item.label}
                      </p>
                      <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(item.val)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab !== 'profile' && detailTab !== 'overview' && categorizedAttributes[detailTab]?.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categorizedAttributes[detailTab].map(([key, value]) => {
                    const cfg = getWaterFieldConfig(key);
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
                ? 'ଜଳ ଯୋଗାଣ ସଂସ୍ଥାର ମାନଚ୍ଚିତ୍ର ଅବସ୍ଥାନ।'
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
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section> */}

      {/* Daily Monitoring Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-cyan-200 bg-cyan-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Daily Monitoring</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Daily tracking of water operations, pump logs, and tank levels.</p>
          </div>

          <div className="space-y-10">
            {/* Date Picker & Quick Status */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Select Monitoring Date</label>
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
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">Active Leakages</p>
                          <p className="text-xs font-bold leading-tight">{activeLeakages > 0 ? `${activeLeakages} Reported` : 'None'}</p>
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
                    <h3 className="text-sm font-bold text-[#0f172a]">Water Production vs Supply</h3>
                    <p className="text-[11px] text-[#64748b]">Volume in MLD (Last 15 records)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Produced</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Supplied</span>
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
                  <h3 className="text-sm font-bold text-[#0f172a]">Pump Running Hours</h3>
                  <p className="text-[11px] text-[#64748b]">Total run time (Last 15 records)</p>
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
                  <h3 className="text-sm font-bold text-[#0f172a]">Daily Reservoir / Tank Levels</h3>
                  <p className="text-[11px] text-[#64748b]">Volume levels for {monitorDate}</p>
                </div>
                <div className="h-10 w-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                  <Droplets size={20} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tank Name</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Opening (ML)</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Intake (ML)</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Distributed (ML)</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Closing (ML)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const dayTanks = dailyTankLevels.filter(s => s.record_date.slice(0, 10) === monitorDate);
                      if (dayTanks.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic bg-white/20">
                              No tank level data available for this date.
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
    </div>
  );
}

