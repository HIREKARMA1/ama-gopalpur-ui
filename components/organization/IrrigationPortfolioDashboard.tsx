import { useMemo } from 'react';
import { Organization } from '../../services/api';
import { MapPin, Droplets, Ruler, CalendarClock, Info, Navigation } from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, MARKER_COLORS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface IrrigationPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
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

export function IrrigationPortfolioDashboard({ org, profile }: IrrigationPortfolioDashboardProps) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

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
  const physicalCondition = asString(profile['current_physical_condition_good_repair_needed_critical']);
  const functionalityStatus = asString(profile['functionality_status_functional_partial_non_functional']);
  const managedBy = asString(profile['managed_by_pani_panchayat_dept_wua']);
  const paniPanchayat = asString(profile['name_of_pani_panchayat_wua']);

  const block = asString(profile['block_ulb']);
  const gpWard = asString(profile['gp_ward']);
  const village = asString(profile['village_locality'] ?? profile['village_locality_']);

  const locationLine = [village, gpWard, block]
    .filter(Boolean)
    .join(' · ');

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 19.29, lng: 84.78 };
  }, [org.latitude, org.longitude]);

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-900 pb-16">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 mb-1 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white">
            <Droplets className="h-3.5 w-3.5" />
          </span>
          Irrigation asset profile
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {org.name}
        </h1>
        {locationLine && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-sky-600" />
            {locationLine}
          </p>
        )}
      </header>

      {/* Stats + map */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-2 mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Ruler className="h-4 w-4 text-sky-600" />
            Key parameters
          </h2>
          <dl className="grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Command area (acres)</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {commandArea ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Water spread area (acres)</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {waterSpreadArea ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Canal / distributory length (km)</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {canalLength ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Design discharge (cusecs)</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {designDischarge ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Type of irrigation</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {typeOfIrrigation ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {category ?? '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-sky-600" />
            Condition & management
          </h2>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Commissioned</dt>
              <dd className="font-semibold text-slate-900">{yearCommissioned ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Physical condition</dt>
              <dd className="font-semibold text-slate-900">
                {physicalCondition ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Functionality</dt>
              <dd className="font-semibold text-slate-900">
                {functionalityStatus ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Managed by</dt>
              <dd className="font-semibold text-slate-900">{managedBy ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Pani Panchayat / WUA</dt>
              <dd className="font-semibold text-slate-900">
                {paniPanchayat ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Inflow source</dt>
              <dd className="font-semibold text-slate-900">
                {inflowSource ?? '—'}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Map + details */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-sky-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-sky-600" />
              Location on map
            </h2>
            {org.latitude != null && org.longitude != null && (
              <span className="text-[11px] text-slate-500">
                {org.latitude.toFixed(5)}, {org.longitude.toFixed(5)}
              </span>
            )}
          </div>
          <div className="h-[260px]">
            {isLoaded && org.latitude != null && org.longitude != null ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                options={{
                  restriction: {
                    latLngBounds: GOPALPUR_BOUNDS,
                    strictBounds: true,
                  },
                  streetViewControl: false,
                  mapTypeControl: true,
                  zoomControl: true,
                }}
              >
                <Marker
                  position={{ lat: org.latitude, lng: org.longitude }}
                  title={org.name}
                  icon={MARKER_COLORS.blue}
                />
              </GoogleMap>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Map location not available
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600" />
            Additional details
          </h2>
          <dl className="space-y-2 text-xs">
            {workId && (
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Work ID</dt>
                <dd className="font-semibold text-slate-900">{workId}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Block / ULB</dt>
              <dd className="font-semibold text-slate-900">{block ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">GP / Ward</dt>
              <dd className="font-semibold text-slate-900">{gpWard ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Village / locality</dt>
              <dd className="font-semibold text-slate-900">{village ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

