import { useMemo, useState } from 'react';
import {
  Organization,
  HealthFacilityMaster,
  HealthInfrastructure,
  HealthStaff,
  HealthEquipment,
  HealthPatientService,
  HealthImmunisation,
  HealthMedicinesStock,
  HealthScheme,
  HealthMonthlyReport,
  HealthDailyAttendance,
  HealthDailyMedicineStock,
  HealthDailyExtraData,
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
import { getHealthProfileLabel, HEALTH_PROFILE_KEYS } from '../../lib/profileLabels';
import { Users, User, Phone, MapPin, Wrench, AlertTriangle, Stethoscope, BedDouble, Clock, FileText, Monitor, Building, UserCheck, Hash, Home, Tag, Syringe, UserPlus, Activity, Trash2 } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, HEALTH_MARKER_ICONS, MARKER_COLORS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

const parseNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export interface HealthPortfolioDashboardProps {
  org: Organization;
  facilityMaster: HealthFacilityMaster | null;
  infra: HealthInfrastructure | null;
  healthProfile: Record<string, unknown>;
  staff: HealthStaff[];
  equipment?: HealthEquipment[];
  patientServices?: HealthPatientService[];
  immunisation?: HealthImmunisation[];
  medicines?: HealthMedicinesStock[];
  schemes?: HealthScheme[];
  monthly?: HealthMonthlyReport[];
  dailyAttendance?: HealthDailyAttendance[];
  dailyMedicineStock?: HealthDailyMedicineStock[];
  dailyExtraData?: HealthDailyExtraData[];
  departmentName?: string | null;
  images?: string[];
}

export function HealthPortfolioDashboard({
  org,
  facilityMaster,
  infra,
  healthProfile,
  staff,
  equipment = [],
  patientServices = [],
  immunisation = [],
  medicines = [],
  schemes = [],
  monthly = [],
  departmentName,
  images = [],
  dailyAttendance = [],
  dailyMedicineStock = [],
  dailyExtraData = [],
}: HealthPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [detailTab, setDetailTab] = useState<'profile' | 'resources'>('profile');
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const locationLine =
    [
      org.address,
      org.latitude != null && org.longitude != null
        ? `${org.latitude.toFixed(5)}, ${org.longitude.toFixed(5)}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || null;

  const toStatVal = (v: unknown): string | number | null | undefined =>
    v == null ? null : typeof v === 'object' ? undefined : (v as string | number);

  // Stats for the top row
  const beds =
    toStatVal(healthProfile['no_of_bed']) ?? facilityMaster?.num_beds ?? infra?.beds_total ?? null;
  const icuBeds = toStatVal(healthProfile['no_of_icu']) ?? infra?.icu_beds ?? null;

  // --- Derived Staff Data ---
  const displayStaff = useMemo(() => {
    if (staff.length > 0) return staff;

    const fallback: HealthStaff[] = [];
    const headName = healthProfile['inst_head_name'] as string | undefined;
    const headContact = healthProfile['inst_head_contact'] as string | undefined;

    if (headName && headName.trim()) {
      fallback.push({
        id: -1,
        organization_id: org.id,
        name: headName,
        role: 'Institute Head',
        contact: headContact,
      });
    }

    // Add counts as virtual staff entries
    const staffCounts: Record<string, string> = {
      no_of_mo: 'Medical Officer',
      no_of_anm: 'ANM',
      no_of_pharmacist: 'Pharmacist',
      no_of_health_worker: 'Health Worker',
      no_of_pathology: 'Pathology Staff',
      no_of_clerk: 'Clerk',
      no_of_sweeper: 'Sweeper',
      no_of_nw: 'NW',
      no_of_ts: 'Technical Staff',
      no_of_nts: 'Non-Technical Staff',
    };

    Object.entries(staffCounts).forEach(([key, role], idx) => {
      const count = parseNum(healthProfile[key]);
      if (count > 0) {
        fallback.push({
          id: -(idx + 2),
          organization_id: org.id,
          name: `${role} (${count})`,
          role: role,
        });
      }
    });

    return fallback;
  }, [staff, healthProfile, org.id]);

  let avgExperience = 0;
  let uniqueDesignations = new Set<string>();
  const staffByRole = displayStaff.reduce((acc, member) => {
    const role = member.role || 'Staff';
    uniqueDesignations.add(role);
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, HealthStaff[]>);

  if (displayStaff.length > 0) {
    const withExp = displayStaff.filter(s => s.experience_years != null);
    if (withExp.length > 0) {
      const totalExp = withExp.reduce((sum, s) => sum + parseNum(s.experience_years), 0);
      avgExperience = parseFloat((totalExp / withExp.length).toFixed(1));
    }
  }

  // --- Derived Equipment Data ---
  const displayEquipment = useMemo(() => {
    if (equipment.length > 0) return equipment;

    const fallback: HealthEquipment[] = [];
    const items = [
      { key: 'x_ray_availabilty', name: 'X-Ray Machine' },
      { key: 'ct_scan_availability', name: 'CT-Scan Machine' },
      { key: 'availability_of_pathology_testing', name: 'Pathology Testing Unit' },
    ];

    items.forEach((item, idx) => {
      const avail = healthProfile[item.key];
      // Check for 'Yes', true, or 1
      if (avail === 'Yes' || avail === true || avail === 1 || String(avail).toLowerCase() === 'yes') {
        fallback.push({
          id: -(idx + 1),
          organization_id: org.id,
          equipment_name: item.name,
          quantity: 1,
          condition: 'Operational',
        });
      }
    });

    return fallback;
  }, [equipment, healthProfile, org.id]);

  const equipTotal = displayEquipment.length;
  const equipOperational = displayEquipment.filter(e =>
    String(e.condition).toLowerCase().includes('good') ||
    String(e.condition).toLowerCase().includes('operational')
  ).length;
  const equipMaintenance = displayEquipment.filter(e =>
    String(e.condition).toLowerCase().includes('maintenance') ||
    String(e.condition).toLowerCase().includes('repair')
  ).length;
  const equipNonOp = equipTotal - equipOperational - equipMaintenance;

  const topStats = [
    { label: t('health.stat.beds', language), value: beds, icon: BedDouble, color: 'amber' },
    { label: 'Total staff', value: displayStaff.length, icon: Users, color: 'emerald' },
    { label: t('health.stat.icuBeds', language), value: icuBeds, icon: Stethoscope, color: 'indigo' },
  ];

  // Map center
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 }; // Default fallback
  }, [org.latitude, org.longitude]);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          Health Facility Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Facility details and resources from available data
        </p>
      </header>

      {/* Facility details tabs */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Facility details
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
                  <span>{t('health.facilityProfileTitle', language) || 'Facility profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('resources')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'resources'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Monitor size={14} />
                  <span>Resources</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Facility Name', val: org.name, icon: Building, color: 'blue' },
                  { label: 'Facility Type', val: org.type, icon: MapPin, color: 'violet' },
                  { label: 'ID', val: org.id, icon: Hash, color: 'slate' },
                  { label: 'Block / ULB', val: healthProfile['block_ulb'] || healthProfile['block_name'], icon: MapPin, color: 'emerald' },
                  { label: 'GP / Ward', val: healthProfile['gp_ward'] || healthProfile['district'], icon: Home, color: 'amber' },
                  { label: 'Village', val: healthProfile['village'], icon: Home, color: 'sky' },
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
                    pink: 'bg-pink-50 text-pink-600 border-pink-100'
                  };
                  return (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
                        <item.icon size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{item.label}</p>
                        <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(item.val as string | number | null | undefined)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'resources' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(healthProfile || {})
                    .filter(([key, v]) =>
                      HEALTH_PROFILE_KEYS.includes(key) &&
                      v != null &&
                      String(v).trim() !== '' &&
                      !['block_ulb', 'block_name', 'gp_ward', 'district', 'village', 'latitude', 'longitude', 'name'].includes(key)
                    )
                    .sort(([aKey], [bKey]) => {
                      const ia = HEALTH_PROFILE_KEYS.indexOf(aKey);
                      const ib = HEALTH_PROFILE_KEYS.indexOf(bKey);
                      return ia - ib;
                    })
                    .map(([key, value]) => {
                      const config: Record<string, { icon: any, color: string }> = {
                        category: { icon: Tag, color: 'indigo' },
                        village: { icon: Home, color: 'blue' },
                        inst_head_name: { icon: User, color: 'emerald' },
                        inst_head_contact: { icon: Phone, color: 'teal' },
                        no_of_ts: { icon: Users, color: 'orange' },
                        no_of_nts: { icon: Users, color: 'slate' },
                        no_of_mo: { icon: Stethoscope, color: 'rose' },
                        no_of_pharmacist: { icon: Syringe, color: 'emerald' },
                        no_of_anm: { icon: UserCheck, color: 'amber' },
                        no_of_health_worker: { icon: UserPlus, color: 'violet' },
                        no_of_pathology: { icon: Activity, color: 'indigo' },
                        no_of_clerk: { icon: FileText, color: 'slate' },
                        no_of_sweeper: { icon: Trash2, color: 'rose' },
                        no_of_nw: { icon: Users, color: 'sky' },
                        no_of_bed: { icon: BedDouble, color: 'amber' },
                        no_of_icu: { icon: BedDouble, color: 'rose' },
                        x_ray_availabilty: { icon: Monitor, color: 'blue' },
                        ct_scan_availability: { icon: Monitor, color: 'indigo' },
                        availability_of_pathology_testing: { icon: Activity, color: 'emerald' },
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
                          <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}>
                            <item.icon size={20} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel(key)}</p>
                            <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(value as string | number | null | undefined)}</p>
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

      {/* Stats row */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div key={i} className={`rounded-2xl border border-${stat.color}-200 bg-${stat.color}-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm`}>
              <div className="min-w-0">
                <p className={`text-[13px] font-bold text-${stat.color}-900/70 mb-1 uppercase tracking-wider`}>{stat.label}</p>
                <h3 className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none`}>{formatVal(stat.value)}</h3>
              </div>
              <div className={`w-14 h-14 shrink-0 rounded-2xl bg-${stat.color}-200/50 flex items-center justify-center text-${stat.color}-700 ml-3 shadow-inner`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Map Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">Facility Location</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Health facility location on map.</p>
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
                <Marker position={mapCenter} icon={HEALTH_MARKER_ICONS[org.type] || MARKER_COLORS.blue} />
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

      {/* Daily Monitoring Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Daily Monitoring</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Daily tracking of medicine inventory, attendance and patient traffic.</p>
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
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                {(() => {
                  const dayExtra = dailyExtraData.find(d => d.record_date.slice(0, 10) === monitorDate);
                  const dayAttendance = dailyAttendance.find(d => d.record_date.slice(0, 10) === monitorDate);
                  const isVanAvailable = dayExtra?.mobile_van_available;
                  const isDoctorPresent = dayAttendance?.doctor_present;

                  return (
                    <>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isVanAvailable ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <Activity size={18} className={isVanAvailable ? 'text-emerald-500' : 'text-slate-400'} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">Mobile Van</p>
                          <p className="text-xs font-bold leading-tight">{isVanAvailable ? 'Available' : 'Unavailable'}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isDoctorPresent ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <UserCheck size={18} className={isDoctorPresent ? 'text-blue-500' : 'text-slate-400'} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">Doctor Presence</p>
                          <p className="text-xs font-bold leading-tight">{isDoctorPresent ? 'Present Today' : 'Not Present'}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Patient Trends */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a]">Daily Patient Traffic</h3>
                    <p className="text-[11px] text-[#64748b]">OPD and IPD trends (Last 15 records)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">OPD</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">IPD</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientServices.slice(-15).map(p => ({
                      date: p.record_date.slice(5, 10).split('-').reverse().join('/'),
                      opd: p.opd_count || 0,
                      ipd: p.ipd_count || 0,
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
                      <Bar dataKey="opd" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="ipd" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Attendance Trends */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">Attendance Trends</h3>
                  <p className="text-[11px] text-[#64748b]">Staff presence count (Last 15 records)</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyAttendance.slice(-15).map(a => ({
                      date: a.record_date.slice(5, 10).split('-').reverse().join('/'),
                      count: a.staff_present_count || 0,
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
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Medicine Stock for Selected Day */}
            <div className="rounded-2xl border border-slate-100 bg-white/40 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">Daily Medicine Inventory</h3>
                  <p className="text-[11px] text-[#64748b]">Inventory level for {monitorDate}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Syringe size={20} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Medicine Name</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Opening</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Received</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Issued</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Closing Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const dayStocks = dailyMedicineStock.filter(s => s.record_date.slice(0, 10) === monitorDate);
                      if (dayStocks.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic bg-white/20">
                              No medicine stock data available for this date.
                            </td>
                          </tr>
                        );
                      }
                      return dayStocks.map((stock, idx) => (
                        <tr key={idx} className="hover:bg-white/40 transition">
                          <td className="px-6 py-4 font-bold text-[#334155]">{stock.medicine_name}</td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">{stock.opening_balance || 0}</td>
                          <td className="px-6 py-4 text-center font-semibold text-emerald-600">+{stock.received || 0}</td>
                          <td className="px-6 py-4 text-center font-semibold text-rose-500">-{stock.issued || 0}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(stock.closing_balance || 0) < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {stock.closing_balance || 0}
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


