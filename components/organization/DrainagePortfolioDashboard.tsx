import { useMemo } from 'react';
import { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import {
  MapPin,
  Waves,
  Activity,
  AlertTriangle,
  Ruler,
  Droplets,
  FileText,
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface DrainagePortfolioDashboardProps {
  org: Organization;
  drainageProfile: Record<string, unknown>;
  images?: string[];
}

function formatVal(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

function labelFromKey(key: string): string {
  if (!key) return '';
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function DrainagePortfolioDashboard({
  org,
  drainageProfile,
  images = [],
}: DrainagePortfolioDashboardProps) {
  const { language } = useLanguage();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const totalLength = drainageProfile['total_length_km'];
  const siltationLevel = drainageProfile['siltation_level'];
  const floodRisk = drainageProfile['flood_risk_level'];

  const entries = Object.entries(drainageProfile || {}).filter(([_, v]) => {
    if (v == null) return false;
    const s = String(v).trim();
    return s !== '' && s !== '—';
  });

  const topStats = [
    {
      label: 'Total Length (km)',
      value: totalLength,
      icon: Ruler,
      color: 'blue',
    },
    {
      label: 'Siltation Level',
      value: siltationLevel,
      icon: Activity,
      color: 'amber',
    },
    {
      label: 'Flood Risk Level',
      value: floodRisk,
      icon: AlertTriangle,
      color: 'rose',
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

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[320px] sm:h-[380px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('govBar.title', language).includes('Odisha')
            ? 'Drainage Asset Dashboard'
            : 'ନିସ୍କାଷଣ ସମ୍ପତ୍ତି ଡ୍ୟାସବୋର୍ଡ'}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {t('govBar.title', language).includes('Odisha')
            ? 'Drain details and location from available data.'
            : 'ଉପଲବ୍ଧ ତଥ୍ୟ ଆଧାରରେ ନିସ୍କାଷଣ ସମ୍ପତ୍ତି ଏବଂ ଅବସ୍ଥାନ।'}
        </p>
      </header>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Drain details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="flex gap-4 items-center">
                <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap.blue}`}>
                  <Waves size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Drain Name
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(org.name)}</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap.emerald}`}>
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Coordinates
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {org.latitude != null && org.longitude != null
                      ? `${org.latitude.toFixed(6)}, ${org.longitude.toFixed(6)}`
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap.slate}`}>
                  <FileText size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Description
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(org.description ?? drainageProfile['remarks'])}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap.sky}`}>
                  <Droplets size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Flow Direction
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(drainageProfile['flow_direction'])}
                  </p>
                </div>
              </div>
            </div>
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

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">
              {t('map.legend', language)} – Attributes
            </h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Detailed attributes for this drain from the CSV profile.
            </p>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-[#64748b] italic">No drainage profile data available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {entries.map(([key, value]) => (
                <div key={key} className="flex gap-4 items-center">
                  <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap.slate}`}>
                    <FileText size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                      {labelFromKey(key)}
                    </p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">
                      {formatVal(value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">Drain Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Drain alignment on the map.</p>
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
      </section>
    </div>
  );
}

