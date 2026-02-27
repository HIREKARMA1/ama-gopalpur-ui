'use client';

import { useMemo } from 'react';
import { Organization, AgricultureFacilityMaster } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { Building, MapPin, Users, FileText, Phone } from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, AWC_MARKER_ICON } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function formatVal(v: string | number | null | undefined | boolean): string {
  if (v == null || String(v).trim() === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function formatLabel(key: string): string {
  if (!key) return '';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface AgriculturePortfolioDashboardProps {
  org: Organization;
  facilityMaster: AgricultureFacilityMaster | null;
  /** Raw profile from CSV-based API (agricultureApi.getProfile) */
  agricultureProfile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function AgriculturePortfolioDashboard({
  org,
  facilityMaster,
  agricultureProfile,
  departmentName,
  images = [],
}: AgriculturePortfolioDashboardProps) {
  const locationLine =
    [
      org.address,
      org.latitude != null && org.longitude != null
        ? `${org.latitude.toFixed(5)}, ${org.longitude.toFixed(5)}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || null;

  const toNumber = (v: unknown): number | null => {
    if (v == null || String(v).trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const totalStaff =
    toNumber((agricultureProfile.total_staff as unknown) ?? null) ??
    facilityMaster?.total_staff ??
    null;
  const farmersServed =
    toNumber((agricultureProfile.farmers_served_last_year as unknown) ?? null) ??
    facilityMaster?.farmers_served_last_year ??
    null;
  const trainingConducted =
    toNumber(
      (agricultureProfile.training_programmes_conducted_last_year as unknown) ?? null,
    ) ?? facilityMaster?.training_programmes_conducted_last_year ??
    null;
  const soilTests =
    toNumber((agricultureProfile.soil_samples_tested_per_year as unknown) ?? null) ??
    facilityMaster?.soil_samples_tested_per_year ??
    null;

  type Stat = { label: string; value: number | string | null; helper?: string };
  const stats: Stat[] = [
    { label: 'Total staff', value: totalStaff, helper: 'Staff strength at the centre' },
    {
      label: 'Farmers served (last year)',
      value: farmersServed,
      helper: 'Unique farmers supported in previous year',
    },
    {
      label: 'Training programmes (last year)',
      value: trainingConducted,
      helper: 'Capacity building events conducted',
    },
    {
      label: 'Soil samples tested / year',
      value: soilTests,
      helper: 'Soil health samples analysed annually',
    },
  ];

  const hasValue = (v: number | string | null) =>
    v != null && v !== '' && String(v).trim() !== '';
  let finalStats: Stat[] = stats.filter((s) => hasValue(s.value));

  // Auto-fill other numeric stats from profile if less than 4
  if (finalStats.length < 4) {
    const numericEntries = Object.entries(agricultureProfile || {}).filter(
      ([key, v]) => {
        if (key === 'latitude' || key === 'longitude' || key.includes('year')) return false;
        return toNumber(v) != null;
      },
    );
    for (const [key, v] of numericEntries) {
      if (finalStats.length >= 4) break;
      const label = formatLabel(key);
      if (finalStats.some((s) => s.label === label)) continue;
      const num = toNumber(v);
      if (num == null) continue;
      finalStats.push({ label, value: num });
    }
  }

  // Combine facility master data and profile data
  const combinedProfile: Record<string, unknown> = { ...(agricultureProfile || {}) };
  if (facilityMaster) {
    Object.entries(facilityMaster).forEach(([k, v]) => {
      if (k !== 'id' && k !== 'organization_id' && k !== 'created_at' && k !== 'updated_at') {
        if (v != null && String(v).toString().trim() !== '') {
          combinedProfile[k] = v;
        }
      }
    });
  }

  // Avoid duplicating latitude, longitude, name if they exist
  delete combinedProfile.latitude;
  delete combinedProfile.longitude;
  delete (combinedProfile as Record<string, unknown>)['NAME OF OFFICE/CENTER'];
  delete combinedProfile.name;

  const aboutText =
    (agricultureProfile.remarks as string | null | undefined) ??
    facilityMaster?.remarks ??
    null;

  // Map centre – fall back to a generic point if not available
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 19.28, lng: 84.86 }; // Gopalpur centre fallback
  }, [org.latitude, org.longitude]);

  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const attributes = (org.attributes || {}) as Record<string, string | number | null>;
  const block =
    (attributes.ulb_block as string | null | undefined) ||
    (agricultureProfile.block_ulb as string | null | undefined) ||
    null;
  const gpWard =
    (attributes.gp_name as string | null | undefined) ||
    (agricultureProfile.gp_ward as string | null | undefined) ||
    null;
  const village =
    (attributes.ward_village as string | null | undefined) ||
    (agricultureProfile.village_locality as string | null | undefined) ||
    null;

  const inChargeName = facilityMaster?.in_charge_name ?? null;
  const inChargeContact =
    facilityMaster?.in_charge_contact ?? facilityMaster?.office_phone ?? null;

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero: facility photo (from admin-uploaded images) */}
      <section className="w-full">
        <ImageSlider
          images={images}
          altPrefix={org.name}
          className="h-[240px] sm:h-[320px]"
        />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          Agriculture Facility Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Facility details, reach and location from available data
        </p>
      </header>

      {/* Centre details – match AWC layout */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Centre details
              </h2>

              {facilityMaster?.institution_id && (
                <div className="mt-1 sm:mt-0 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 text-[11px] text-slate-700 shadow-sm inline-flex items-center gap-2">
                  <FileText size={14} className="text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    {facilityMaster.institution_id}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Building size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Facility name
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(org.name)}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Address
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(locationLine ?? '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Block / ULB
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(block ?? '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    GP / Ward
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(gpWard ?? '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Village
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(village ?? '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    In-charge
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(inChargeName ?? '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Phone size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    Contact
                  </p>
                  <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(inChargeContact ?? '')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row – key agriculture metrics */}
      {finalStats.length > 0 && (
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {finalStats.map(({ label, value, helper }, idx) => {
              const cards = [
                'border-emerald-200 bg-emerald-100/40',
                'border-lime-200 bg-lime-100/40',
                'border-teal-200 bg-teal-100/40',
                'border-sky-200 bg-sky-100/40',
              ];
              return (
                <div
                  key={label}
                  className={`rounded-2xl border p-6 shadow-sm flex flex-col justify-between backdrop-blur-sm ${cards[idx % cards.length]}`}
                >
                  <div>
                    <p className="text-[13px] font-bold text-slate-900/80 mb-1 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-[28px] sm:text-[30px] font-black text-slate-900 leading-none">
                      {formatVal(value)}
                    </p>
                    {helper && (
                      <p className="text-[11px] text-slate-700/70 mt-2 font-medium">
                        {helper}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* About this facility */}
      {aboutText && String(aboutText).trim() !== '' && (
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-3xl border border-slate-300 bg-slate-100/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b] mb-2">
              About this facility
            </h2>
            <p className="text-[14px] text-[#334155] leading-relaxed">
              {formatVal(aboutText)}
            </p>
          </div>
        </section>
      )}

      {/* Map – facility location from org lat/long */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-100/40 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">Facility Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Agriculture facility location on map.
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
                <Marker position={mapCenter} icon={AWC_MARKER_ICON} />
              </GoogleMap>
            ) : (
              <div className="text-center">
                <MapPin size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detailed facility profile – tabular view */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden backdrop-blur-md">
          <div className="border-b border-emerald-200/70 bg-emerald-500/10 px-6 py-6 sm:px-10">
            <h2 className="text-lg font-black uppercase tracking-widest text-emerald-900">
              Agriculture Facility Profile
            </h2>
            <p className="mt-1 text-sm text-emerald-900/70 font-semibold">
              Detailed metrics and infrastructure overview
            </p>
          </div>
          <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-emerald-200/40">
            {Object.entries(combinedProfile)
              .filter(([, v]) => v != null && String(v).toString().trim() !== '')
              .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
              .reduce<[Array<[string, unknown]>, Array<[string, unknown]>]>(
                (cols, entry, idx) => {
                  cols[idx % 2].push(entry);
                  return cols;
                },
                [[], []],
              )
              .map((colEntries, colIdx) => (
                <div key={colIdx} className="p-6 sm:p-8 lg:p-10 bg-white/40">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-left">
                      <tbody>
                        {colEntries.map(([key, value]) => (
                          <tr
                            key={key}
                            className="border-b border-emerald-200/30 last:border-0"
                          >
                            <td className="w-1/2 px-4 py-3 font-semibold text-emerald-900/80">
                              {formatLabel(key)}
                            </td>
                            <td className="px-4 py-3 text-slate-900 font-bold">
                              {formatVal(
                                value as string | number | null | undefined | boolean,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
