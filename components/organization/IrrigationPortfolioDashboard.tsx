import { useState, useMemo } from 'react';
import { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import {
  MapPin,
  Droplets,
  Ruler,
  Hash,
  Home,
  Box,
  Droplet,
  Clock,
  Settings,
  Users,
  ArrowRightCircle,
} from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, MARKER_COLORS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface IrrigationPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  images?: string[];
}

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

const asNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const asString = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
};

export function IrrigationPortfolioDashboard({
  org,
  profile,
  images = [],
}: IrrigationPortfolioDashboardProps) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [detailTab, setDetailTab] = useState<'profile' | 'resources'>('profile');

  const workId = asString(profile['work_id'] ?? profile['work_id_']);
  const category = asString(profile['category']);
  const typeOfIrrigation =
    asString(profile['type_of_irrigation_flow_lift_solar']) ??
    asString(profile['type_of_irrigation']);
  const commandArea = asNumber(profile['command_area_ayacut_acres']);
  const waterSpreadArea = asNumber(profile['water_spread_area_acres']);
  const canalLength = asNumber(profile['canal_distributory_length_km']);
  const designDischarge = asNumber(profile['design_discharge_cusecs']);
  const inflowSource = asString(profile['inflow_source_river_rain_stream']);
  const yearCommissioned = asString(profile['year_of_commissioning']);
  const physicalCondition = asString(
    profile['current_physical_condition_good_repair_needed_critical']
  );
  const functionalityStatus = asString(
    profile['functionality_status_functional_partial_non_functional']
  );
  const managedBy = asString(profile['managed_by_pani_panchayat_dept_wua']);

  const block = asString(profile['block_ulb']);
  const gpWard = asString(profile['gp_ward']);
  const village = asString(profile['village_locality'] ?? profile['village_locality_']);

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 19.29, lng: 84.78 };
  }, [org.latitude, org.longitude]);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero Header */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {org.name}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Irrigation Asset Dashboard
        </p>
      </header>

      {/* Detail Tabs */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-sky-200 bg-sky-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Asset details
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDetailTab('profile')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'profile'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <MapPin size={14} />
                  <span>Asset Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('resources')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'resources'
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Droplets size={14} />
                  <span>Parameters</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Work ID', val: workId, icon: Hash, color: 'blue' },
                  { label: 'Category', val: category, icon: Box, color: 'violet' },
                  { label: 'Type', val: typeOfIrrigation, icon: Droplet, color: 'emerald' },
                  { label: 'Block / ULB', val: block, icon: MapPin, color: 'sky' },
                  { label: 'GP / Ward', val: gpWard, icon: Home, color: 'amber' },
                  { label: 'Village', val: village, icon: Home, color: 'teal' },
                  { label: 'Latitude', val: org.latitude, icon: MapPin, color: 'rose' },
                  { label: 'Longitude', val: org.longitude, icon: MapPin, color: 'pink' },
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
                          {formatVal(item.val as string | number | null | undefined)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'resources' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Command Area (Acres)', val: commandArea, icon: Ruler, color: 'amber' },
                  { label: 'Water Spread (Acres)', val: waterSpreadArea, icon: Droplets, color: 'sky' },
                  { label: 'Canal Length (KM)', val: canalLength, icon: ArrowRightCircle, color: 'emerald' },
                  { label: 'Design Discharge', val: designDischarge, icon: Droplet, color: 'blue' },
                  { label: 'Inflow Source', val: inflowSource, icon: Droplets, color: 'teal' },
                  { label: 'Commissioned Year', val: yearCommissioned, icon: Clock, color: 'indigo' },
                  { label: 'Physical Condition', val: physicalCondition, icon: Settings, color: 'rose' },
                  { label: 'Managed By', val: managedBy, icon: Users, color: 'violet' },
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
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
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
                          {formatVal(item.val as string | number | null | undefined)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overview Stats Row */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Command Area', value: commandArea, icon: Ruler, color: 'emerald' },
            { label: 'Water Spread', value: waterSpreadArea, icon: Droplets, color: 'sky' },
            { label: 'Status', value: functionalityStatus, icon: Settings, color: 'violet' },
            { label: 'Canal Length (km)', value: canalLength, icon: ArrowRightCircle, color: 'amber' },
          ].map((stat, i) => (
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
                  className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none truncate`}
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

      {/* Map Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-sky-200 bg-sky-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">Asset Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Irrigation asset location on map.
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
                    latLngBounds: GOPALPUR_BOUNDS,
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
                <Marker position={mapCenter} icon={MARKER_COLORS.blue} />
              </GoogleMap>
            ) : (
              <div className="text-center">
                <MapPin size={24} className="text-sky-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
