'use client';

import { useState, useMemo } from 'react';
import {
  Organization,
  EducationSchoolMaster,
  EducationInfrastructure,
  EducationGovtRegistry,
  EducationTeacher,
  EducationMonthlyProgress,
  EducationBeneficiaryAnalytics,
} from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import {
  MapPin,
  Users,
  Building,
  Monitor,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  UserCheck,
  Home,
  Hash,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ImageSlider } from './ImageSlider';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, AWC_MARKER_ICON, EDUCATION_TYPE_LABELS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function getFirstDefined(obj: any, keys: string[]): unknown {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }
  return undefined;
}

export interface EducationPortfolioDashboardProps {
  org: Organization;
  schoolMaster: EducationSchoolMaster | null;
  infra: EducationInfrastructure | null;
  /** Raw profile from CSV-based API (educationApi.getProfile) */
  educationProfile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
  govtRegistry?: EducationGovtRegistry | null;
  teachers?: EducationTeacher[];
  monthly?: EducationMonthlyProgress[];
  beneficiaryAnalytics?: EducationBeneficiaryAnalytics[];
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') {
    return Number.isFinite(v) ? String(v) : '—';
  }
  const s = String(v).trim();
  if (s === '') return '—';
  return s;
}

export function EducationPortfolioDashboard({
  org,
  schoolMaster,
  infra,
  educationProfile,
  departmentName,
  images = [],
  govtRegistry,
  teachers = [],
  monthly = [],
  beneficiaryAnalytics = [],
}: EducationPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [detailTab, setDetailTab] = useState<'profile' | 'staff'>('profile');
  const [mealDateFilter, setMealDateFilter] = useState('');
  const [mealPage, setMealPage] = useState(1);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  // Map center
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 }; // Default fallback
  }, [org.latitude, org.longitude]);

  const profile = educationProfile as any;

  // Derive whether this org is a school or college/university
  const educationTypeLabel =
    (org.type && EDUCATION_TYPE_LABELS[org.type]) || org.type.replace(/_/g, ' ');
  const isHigherEd = /college|university/i.test(educationTypeLabel);
  const entityLabel = isHigherEd ? 'College' : 'School';
  const entityLabelLower = isHigherEd ? 'college' : 'school';

  // Profile data extraction (prefer typed backend fields, then CSV profile, then org attributes)
  const categoryStr = formatVal(
    (getFirstDefined(profile, ['category']) as string | undefined) ??
      schoolMaster?.school_type ??
      (org.attributes && (org.attributes['sector'] as string | undefined)) ??
      null,
  );

  const block = formatVal(
    schoolMaster?.block ??
      (getFirstDefined(profile, ['block_ulb', 'block']) as string | undefined) ??
      (org.attributes && (org.attributes['ulb_block'] as string | undefined)) ??
      org.address ??
      null,
  );

  const gpWard = formatVal(
    (getFirstDefined(profile, ['gp_ward']) as string | undefined) ??
      (org.attributes && (org.attributes['gp_name'] as string | undefined)) ??
      schoolMaster?.village ??
      null,
  );

  const village = formatVal(
    (getFirstDefined(profile, ['village']) as string | undefined) ??
      schoolMaster?.village ??
      (org.attributes && (org.attributes['ward_village'] as string | undefined)) ??
      null,
  );

  const district = formatVal(
    schoolMaster?.district ??
      (getFirstDefined(profile, ['district']) as string | undefined) ??
      null,
  );

  // Teacher / classroom stats – prefer typed infra & counts, avoid hard-coded defaults
  const totalTeachersFromProfileRaw = getFirstDefined(profile, ['total_teachers', 'no_of_ts']);
  const totalTeachersFromProfile =
    typeof totalTeachersFromProfileRaw === 'number'
      ? totalTeachersFromProfileRaw
      : totalTeachersFromProfileRaw != null
      ? Number(totalTeachersFromProfileRaw)
      : null;

  const totalTeachers =
    (Number.isFinite(totalTeachersFromProfile as number) ? (totalTeachersFromProfile as number) : null) ??
    (teachers.length > 0 ? teachers.length : null);

  const totalRoomsFromProfileRaw = getFirstDefined(profile, ['no_of_rooms']);
  const totalRoomsFromProfile =
    typeof totalRoomsFromProfileRaw === 'number'
      ? totalRoomsFromProfileRaw
      : totalRoomsFromProfileRaw != null
      ? Number(totalRoomsFromProfileRaw)
      : null;

  const totalRooms =
    (Number.isFinite(totalRoomsFromProfile as number) ? (totalRoomsFromProfile as number) : null) ??
    infra?.classrooms ??
    null;

  const smartRoomsFromProfileRaw = getFirstDefined(profile, ['no_of_smart_class_rooms']);
  const smartRoomsFromProfile =
    typeof smartRoomsFromProfileRaw === 'number'
      ? smartRoomsFromProfileRaw
      : smartRoomsFromProfileRaw != null
      ? Number(smartRoomsFromProfileRaw)
      : null;

  const smartRooms =
    infra?.smart_classrooms ??
    (Number.isFinite(smartRoomsFromProfile as number) ? (smartRoomsFromProfile as number) : null) ??
    null;

  const estYear = formatVal(
    schoolMaster?.established_year ??
      (getFirstDefined(profile, ['esst_year', 'established_year']) as string | number | undefined) ??
      null,
  );

  const headMaster = formatVal(
    (getFirstDefined(profile, ['name_of_hm', 'hm_name', 'head_master']) as string | undefined) ??
      null,
  );
  const hmContact = formatVal(
    (getFirstDefined(profile, ['contact_of_hm', 'hm_contact']) as string | undefined) ?? null,
  );
  const deoName = formatVal(
    (getFirstDefined(profile, ['deo_name']) as string | undefined) ?? null,
  );
  const deoContact = formatVal(
    (getFirstDefined(profile, ['deo_contact']) as string | undefined) ?? null,
  );
  const beoName = formatVal(
    (getFirstDefined(profile, ['beo_name']) as string | undefined) ?? null,
  );
  const beoContact = formatVal(
    (getFirstDefined(profile, ['beo_contact']) as string | undefined) ?? null,
  );

  const latLongStr = `${(org.latitude || 19.3378).toFixed(5)}, ${(org.longitude || 84.8560).toFixed(5)}`;
  const description = formatVal(
    (getFirstDefined(profile, ['description']) as string | undefined) ?? null,
  );

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">

      {/* Hero: image slider */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[240px] sm:h-[320px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {entityLabel} Portfolio Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {entityLabel} details and infrastructure from available data
        </p>
      </header>

      {/* School / College details tabs – profile / staff */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {entityLabel} details
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
                  <Building size={14} />
                  <span>{entityLabel} profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('staff')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'staff'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <UserCheck size={14} />
                  <span>Staff & contact</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <Building size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                      {entityLabel} name
                    </p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(org.name)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Block</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(block)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <Home size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">GP / Ward</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(gpWard)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Village</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(village)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                    <Hash size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">District</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(district)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <Calendar size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Established</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(estYear)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Coordinates</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate text-xs">{latLongStr}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Building size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Category</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(categoryStr)}</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'staff' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <UserCheck size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Head Master</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(headMaster)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <Phone size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">HM Contact</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(hmContact)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <UserCheck size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">DEO Name</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(deoName)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <Phone size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">DEO Contact</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(deoContact)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <UserCheck size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">BEO Name</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(beoName)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                    <Phone size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">BEO Contact</p>
                    <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(beoContact)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats row – Teachers & key infrastructure */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-amber-900/70 mb-1 uppercase tracking-wider">Total teachers</p>
              <h3 className="text-[28px] sm:text-[32px] font-black text-amber-950 leading-none">{totalTeachers}</h3>
              <p className="text-[11px] text-amber-800/60 mt-1 font-medium">teaching staff</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-200/50 flex items-center justify-center text-amber-700 ml-3 shadow-inner">
              <Users size={28} strokeWidth={2.5} />
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-emerald-900/70 mb-1 uppercase tracking-wider">Classrooms</p>
              <p className="text-[28px] sm:text-[32px] font-black text-emerald-950 leading-none">{totalRooms}</p>
              <p className="text-[11px] text-emerald-800/60 mt-0.5 font-medium">total rooms</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-200/50 flex items-center justify-center text-emerald-700 ml-3 shadow-inner">
              <Building size={28} strokeWidth={2.5} />
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-indigo-900/70 mb-1 uppercase tracking-wider">Smart classes</p>
              <p className="text-[28px] sm:text-[32px] font-black text-indigo-950 leading-none">{smartRooms}</p>
              <p className="text-[11px] text-indigo-800/60 mt-0.5 font-medium">equipped rooms</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-200/50 flex items-center justify-center text-indigo-700 ml-3 shadow-inner">
              <Monitor size={28} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </section>

      {/* Description snippet when present */}
      {description != null && String(description).trim() !== '' && (
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-3xl border border-slate-300 bg-slate-100/50 p-6 sm:p-8 shadow-sm backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b] mb-2">
              {isHigherEd ? 'About this college' : 'About this school'}
            </h2>
            <p className="text-[14px] text-[#334155] leading-relaxed">{formatVal(description)}</p>
          </div>
        </section>
      )}

      {/* Infrastructure overview */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-teal-200 bg-teal-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Infrastructure & Facilities</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Complete facility details and amenities available at the {entityLabelLower}.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Science Lab', value: educationProfile?.science_lab || '—' },
              { label: 'Library', value: educationProfile?.library || 'No' },
              { label: 'Boys Toilet', value: educationProfile?.toilet_m || '—' },
              { label: 'Girls Toilet', value: educationProfile?.toilet_f || '—' },
              { label: 'Drinking Water', value: educationProfile?.drinking_water_tap ? 'Yes' : 'No' },
              { label: 'Electricity', value: educationProfile?.electricity ? 'Yes' : 'No' },
              { label: 'Internet', value: educationProfile?.internet ? 'Yes' : 'No' },
              { label: 'CCTV', value: educationProfile?.cctv ? 'Yes' : 'No' },
            ].map(({ label, value }, idx) => (
              <div key={label} className="bg-white rounded-xl border border-teal-100 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700 mb-2">{label}</p>
                <p className="text-[18px] font-black text-[#0f172a]">{formatVal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map – school location from CSV (lat/long) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">School Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">School location on map.</p>
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
                <MapPin size={24} className="text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Meal Distribution Daily Stock – charts + table */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Meal Distribution Daily Stock</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Opening balance, received and expenditure for Mid Day Meal Scheme.
            </p>
          </div>

          {/* Meal graphs – always visible; empty state when no data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-sky-900 mb-3">Stock trend (Kg)</h3>
              <div className="h-[260px] w-full">
                <div className="h-full w-full flex flex-col items-center justify-center rounded-lg bg-slate-100/80 border border-dashed border-slate-300 text-slate-500">
                  <p className="text-sm font-medium">No meal stock data</p>
                  <p className="text-xs mt-1">Add daily meal records to see the chart</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-amber-900 mb-3">Distributed vs remaining (Kg)</h3>
              <div className="h-[260px] w-full">
                <div className="h-full w-full flex flex-col items-center justify-center rounded-lg bg-slate-100/80 border border-dashed border-slate-300 text-slate-500">
                  <p className="text-sm font-medium">No meal stock data</p>
                  <p className="text-xs mt-1">Add daily meal records to see the chart</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#0f172a]">Daily records</h3>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                Filter by date
              </label>
              <input
                type="date"
                value={mealDateFilter}
                onChange={(e) => {
                  setMealPage(1);
                  setMealDateFilter(e.target.value);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-rose-100/60 shadow-sm overflow-hidden backdrop-blur-sm">
            <table className="w-full text-center text-sm whitespace-nowrap lg:whitespace-normal">
              <thead className="bg-rose-100/40">
                <tr>
                  <th className="px-4 py-3 font-bold text-rose-900 text-left">Date</th>
                  <th className="px-4 py-3 font-bold text-rose-900">Opening Kg</th>
                  <th className="px-4 py-3 font-bold text-rose-900">Received Kg</th>
                  <th className="px-4 py-3 font-bold text-rose-900">Distributed Kg</th>
                  <th className="px-4 py-3 font-bold text-rose-900">Closing Kg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                <tr className="bg-white/60 hover:bg-white/80 transition">
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <p className="font-medium">No meal stock data available</p>
                    <p className="text-xs mt-1">Add daily meal distribution records to view details</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
