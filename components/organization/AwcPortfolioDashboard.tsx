'use client';

import { useMemo, useState } from 'react';
import { Organization, CenterProfile, SnpDailyStock } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { Users, User, UserCog, UserCheck, CheckCircle2, AlertTriangle, Building, MapPin, ActivitySquare, TrendingUp, Contact } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

const SNP_ROWS_PER_PAGE = 10;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Logical groups for portfolio tables – strictly from ICDS CSV
const PROFILE_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Block / ULB', key: 'block_name' },
  { attribute: 'GP / Ward', key: 'gram_panchayat' },
  { attribute: 'Village', key: 'village_ward' },
  { attribute: 'Name of AWC', key: 'org.name' },
  { attribute: 'AWC ID', key: 'center_code' },
  { attribute: 'Building status', key: 'building_type' },
  { attribute: 'Latitude', key: 'org.latitude' },
  { attribute: 'Longitude', key: 'org.longitude' },
  { attribute: 'Description', key: 'description' },
];

const CONTACT_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Centre contact', key: 'contact_number' },
  { attribute: 'CPDO name', key: 'cpdo_name' },
  { attribute: 'CPDO contact no', key: 'cpdo_contact_no' },
  { attribute: 'Supervisor name', key: 'supervisor_name' },
  { attribute: 'Supervisor contact', key: 'supervisor_contact_name' },
  { attribute: 'AWW name', key: 'worker_name' },
  { attribute: 'AWW contact no', key: 'aww_contact_no' },
  { attribute: 'AWH name', key: 'helper_name' },
  { attribute: 'AWH contact no', key: 'awh_contact_no' },
];

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

function getValue(org: Organization | null, profile: CenterProfile | null, key: string): string | number | null | undefined {
  if (key.startsWith('org.')) {
    const k = key.slice(4) as keyof Organization;
    return org ? (org[k] as string | number | null | undefined) : undefined;
  }
  return profile ? (profile[key as keyof CenterProfile] as string | number | null | undefined) : undefined;
}

export interface AwcPortfolioDashboardProps {
  org: Organization;
  awcProfile: CenterProfile | null;
  departmentName?: string | null;
  /** Gallery image URLs (admin can add later). */
  images?: string[];
  /** SNP (Supplementary Nutrition Programme) daily stock – date-wise. */
  snpDailyStock?: SnpDailyStock[];
}

function snpKg(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v} Kg`;
}

export function AwcPortfolioDashboard({
  org,
  awcProfile,
  departmentName,
  images = [],
  snpDailyStock = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [snpDateFilter, setSnpDateFilter] = useState('');
  const [snpPage, setSnpPage] = useState(1);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });


  const snpFiltered = useMemo(() => {
    if (!snpDailyStock.length) return [];
    if (!snpDateFilter.trim()) return snpDailyStock;
    return snpDailyStock.filter((row) => {
      const d = row.record_date;
      if (!d) return false;
      const rowDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return rowDate === snpDateFilter;
    });
  }, [snpDailyStock, snpDateFilter]);

  const snpTotalRows = snpFiltered.length;
  const snpTotalPages = Math.max(1, Math.ceil(snpTotalRows / SNP_ROWS_PER_PAGE));
  const snpPageClamped = Math.min(Math.max(1, snpPage), snpTotalPages);
  const snpStart = (snpPageClamped - 1) * SNP_ROWS_PER_PAGE;
  const snpPaginated = snpFiltered.slice(snpStart, snpStart + SNP_ROWS_PER_PAGE);
  const snpShowStart = snpTotalRows === 0 ? 0 : snpStart + 1;
  const snpShowEnd = Math.min(snpStart + SNP_ROWS_PER_PAGE, snpTotalRows);

  const blockName = getValue(org, awcProfile, 'block_name') || '—';
  const estYear = getValue(org, awcProfile, 'establishment_year') || '2010'; // using as fallback
  const centreType = getValue(org, awcProfile, 'center_type') || 'Main Centre';

  const studentStrength = getValue(org, awcProfile, 'student_strength') || 0;
  const healthCheckups = Number(studentStrength) > 0 ? Math.round(Number(studentStrength) * 0.85) : 0; // Mock derived metric for dashboard


  // Center for map
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 }; // Default fallback
  }, [org.latitude, org.longitude]);


  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans pb-16">

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] sm:text-[32px]">
          Anganwadi Centre Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Real-time monitoring of infrastructure, resources, and key performance metrics
        </p>
      </header>

      {/* Selector & Info Summary Card */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-2xl border border-[#8D8989] bg-white p-5 sm:p-6 shadow-sm overflow-hidden relative">
          {/* Subtle background accent */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">

            {/* Left side: Selector Title & Dropdown */}
            <div className="w-full lg:w-[380px] shrink-0">
              <h2 className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Select Facility</h2>
              <div className="group flex w-full items-center justify-between rounded-xl bg-slate-50 hover:bg-[#fff9f0] transition-all duration-200 px-4 py-3.5 cursor-pointer border border-[#8D8989]/30 hover:border-orange-300 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 shadow-sm">
                    <MapPin size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[15px] font-extrabold text-[#0f172a]">{org.name}</span>
                </div>
                <div className="bg-white rounded p-1 shadow-sm border border-[#8D8989]/20 group-hover:border-orange-200 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-500 group-hover:text-orange-500 transition-colors" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Divider for mobile, vertical rule for desktop */}
            <div className="hidden lg:block w-px h-16 bg-[#8D8989] opacity-20"></div>
            <div className="block lg:hidden h-px w-full bg-[#8D8989] opacity-20 my-1"></div>

            {/* Right side: Summary Stats */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  <Building size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Centre Type</p>
                  <p className="text-[15px] font-bold text-[#0f172a] tracking-tight">{formatVal(centreType)}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <MapPin size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Location Block</p>
                  <p className="text-[15px] font-bold text-[#0f172a] tracking-tight">{formatVal(blockName)}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                  <CheckCircle2 size={18} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">Established</p>
                  <p className="text-[15px] font-bold text-[#0f172a] tracking-tight">{formatVal(estYear)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Top Main KPIs */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Enrollment */}
          <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm flex justify-between items-center h-full">
            <div>
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Total Enrollment</p>
              <h3 className="text-[32px] font-black text-[#0f172a] leading-none mb-1">{studentStrength || 185}</h3>
              <p className="text-[11px] text-[#94a3b8] mb-3">children</p>
              <div className="inline-flex items-center gap-1 text-[#10b981]">
                <span className="text-[11px] font-bold">↑ 12% from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-xl bg-[#fff8eb] flex items-center justify-center text-[#4f46e5]">
              <Users size={28} />
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm flex justify-between items-center h-full">
            <div>
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Attendance Rate</p>
              <h3 className="text-[32px] font-black text-[#0f172a] leading-none mb-1">88%</h3>
              <p className="text-[11px] text-[#94a3b8] mb-3">on average</p>
              <div className="inline-flex items-center gap-1 text-[#10b981]">
                <span className="text-[11px] font-bold">↑ 4% from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-xl bg-[#e8fbf0] flex items-center justify-center text-[#10b981]">
              <UserCheck size={28} />
            </div>
          </div>

          {/* Health Checkups */}
          <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm flex justify-between items-center h-full">
            <div>
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Health Checkups</p>
              <h3 className="text-[32px] font-black text-[#0f172a] leading-none mb-1">{healthCheckups || 160}</h3>
              <p className="text-[11px] text-[#94a3b8] mb-3">completed</p>
              <div className="inline-flex items-center gap-1 text-[#10b981]">
                <span className="text-[11px] font-bold">↑ 10% from last month</span>
              </div>
            </div>
            <div className="w-[52px] h-[52px] rounded-xl bg-[#e8fbf0] flex items-center justify-center text-[#db2777]">
              <ActivitySquare size={28} />
            </div>
          </div>

          {/* Total Shortage */}
          <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm flex justify-between items-center h-full">
            <div>
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Total Shortage</p>
              <h3 className="text-[32px] font-black text-[#0f172a] leading-none mb-1">378</h3>
              <p className="text-[11px] text-[#94a3b8]">items needed</p>
            </div>
            <div className="w-[52px] h-[52px] rounded-xl bg-[#fee2e2] flex items-center justify-center">
              <AlertTriangle size={24} fill="#fcd34d" stroke="#fcd34d" className="text-[#ea580c]" />
            </div>
          </div>
        </div>
      </section>

      {/* Map & Resource Shortage Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Map & Infra Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Widget */}
            <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#0f172a]">Infrastructure Map & Locations</h2>
                <p className="text-[13px] text-[#64748b] mt-1">Live marking of all Anganwadi centres, schools, libraries, and kitchens. Click on any location for details.</p>
              </div>
              <div className="h-[400px] w-full rounded-xl bg-[#f8f9fa]  overflow-hidden relative flex items-center justify-center">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={14}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      styles: [
                        {
                          "elementType": "geometry",
                          "stylers": [{ "color": "#f5f5f5" }]
                        },
                        {
                          "featureType": "poi",
                          "stylers": [{ "visibility": "off" }]
                        },
                        {
                          "featureType": "transit",
                          "stylers": [{ "visibility": "off" }]
                        }
                      ]
                    }}
                  >
                    <Marker position={mapCenter} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }} />
                  </GoogleMap>
                ) : (
                  <div className="text-center">
                    <MapPin size={24} className="text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Google Maps Integration</p>
                    <p className="text-xs text-slate-500 mt-1">Map view with live infrastructure markers</p>
                    <p className="text-[10px] text-slate-400 mt-2">Green: Functional | Amber: Partial | Red: Non-functional</p>
                  </div>
                )}
              </div>
            </div>

            {/* Infrastructure Summary Widget */}
            <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#334155] mb-4">Infrastructure Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* AWC Card */}
                <div className="group rounded-xl border border-[#10b981] bg-white hover:bg-[#f59e0b] hover:border-[#f59e0b] p-4 flex justify-between items-start shadow-sm border-l-4 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <Building size={20} className="text-slate-400 group-hover:text-white mt-0.5 transition-colors" />
                    <div>
                      <p className="text-[14px] font-bold text-[#0f172a] group-hover:text-white leading-tight transition-colors">Anganwadi Centre - {formatVal(blockName)}</p>
                      <p className="text-[11px] text-[#64748b] group-hover:text-white/80 mt-1 transition-colors">85/100 capacity</p>
                    </div>
                  </div>
                  <span className="bg-[#ecfdf5] group-hover:bg-white text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors">Functional</span>
                </div>

                {/* School Card */}
                <div className="group rounded-xl border border-[#10b981] bg-white hover:bg-[#f59e0b] hover:border-[#f59e0b] p-4 flex justify-between items-start shadow-sm border-l-4 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <Building size={20} className="text-amber-500 group-hover:text-white mt-0.5 transition-colors" />
                    <div>
                      <p className="text-[14px] font-bold text-[#0f172a] group-hover:text-white leading-tight transition-colors">Government Primary School - {formatVal(blockName)}</p>
                      <p className="text-[11px] text-[#64748b] group-hover:text-white/80 mt-1 transition-colors">180/250 capacity</p>
                    </div>
                  </div>
                  <span className="bg-[#ecfdf5] group-hover:bg-white text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors">Functional</span>
                </div>

                {/* Library Card */}
                <div className="group rounded-xl border border-[#10b981] bg-white hover:bg-[#f59e0b] hover:border-[#f59e0b] p-4 flex justify-between items-start shadow-sm border-l-4 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <Building size={20} className="text-orange-500 group-hover:text-white mt-0.5 transition-colors" />
                    <div>
                      <p className="text-[14px] font-bold text-[#0f172a] group-hover:text-white leading-tight transition-colors">Community Library - {formatVal(blockName)}</p>
                      <p className="text-[11px] text-[#64748b] group-hover:text-white/80 mt-1 transition-colors">350/500 capacity</p>
                    </div>
                  </div>
                  <span className="bg-[#ecfdf5] group-hover:bg-white text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors">Functional</span>
                </div>

                {/* Kitchen Card */}
                <div className="group rounded-xl border border-[#10b981] bg-white hover:bg-[#f59e0b] hover:border-[#f59e0b] p-4 flex justify-between items-start shadow-sm border-l-4 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <Building size={20} className="text-indigo-600 group-hover:text-white mt-0.5 transition-colors" />
                    <div>
                      <p className="text-[14px] font-bold text-[#0f172a] group-hover:text-white leading-tight transition-colors">Central Kitchen - Midday Meal</p>
                      <p className="text-[11px] text-[#64748b] group-hover:text-white/80 mt-1 transition-colors">450/500 capacity</p>
                    </div>
                  </div>
                  <span className="bg-[#ecfdf5] group-hover:bg-white text-[#10b981] text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors">Functional</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-[#8D8989]">
                <div>
                  <p className="text-[11px] text-[#64748b] mb-1">Total Infrastructure</p>
                  <p className="text-[22px] font-black text-[#f59e0b]">4</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-1">Functional</p>
                  <p className="text-[22px] font-black text-[#10b981]">4</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-1">Partial</p>
                  <p className="text-[22px] font-black text-[#f59e0b]">0</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#64748b] mb-1">Non-functional</p>
                  <p className="text-[22px] font-black text-[#ef4444]">0</p>
                </div>
              </div>
            </div>
          </div>


          {/* Right Column: Resource Shortage Status */}
          <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#0f172a]">Resource Shortage Status</h2>
              <p className="text-[13px] text-[#64748b] mt-1">What is the need of the hour - Critical shortages and resource gaps</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl bg-[#f1f5f9] p-4">
                <p className="text-[11px] font-medium text-[#64748b] mb-1">Total Shortage</p>
                <p className="text-[28px] font-black text-[#ef4444] leading-tight">378</p>
                <p className="text-[11px] text-[#64748b]">items</p>
              </div>
              <div className="rounded-xl bg-[#fffbeb] p-4">
                <p className="text-[11px] font-medium text-[#64748b] mb-1">Availability</p>
                <p className="text-[28px] font-black text-[#f59e0b] leading-tight">83%</p>
                <p className="text-[11px] text-[#64748b]">overall</p>
              </div>
            </div>

            <h3 className="text-[13px] font-bold text-[#334155] mb-5">All Resources</h3>

            <div className="space-y-6 relative">
              {/* Custom Scrollbar track indicator */}
              <div className="absolute right-[-10px] top-0 bottom-0 w-[4px] bg-slate-100 rounded-full flex flex-col justify-between items-center py-1">
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-slate-400"></div>
                <div className="w-1.5 h-16 bg-slate-500 rounded-full my-auto"></div>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>

              {/* Infrastructure Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-orange-500" />
                    <span className="text-[14px] font-bold text-[#0f172a]">Infrastructure</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded">88% Available</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-[11px] text-[#64748b]">
                  <span>Available: 7 • Required: 8</span>
                  <span className="font-bold text-[#ef4444]">Shortage: 1</span>
                </div>
                <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              {/* Seats Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-[#8b5cf6]" />
                    <span className="text-[14px] font-bold text-[#0f172a]">Seats</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded">84% Available</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-[11px] text-[#64748b]">
                  <span>Available: 210 • Required: 250</span>
                  <span className="font-bold text-[#ef4444]">Shortage: 40</span>
                </div>
                <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8b5cf6] rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              {/* Meals Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-[#a855f7]" />
                    <span className="text-[14px] font-bold text-[#0f172a]">Meals</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded">93% Available</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-[11px] text-[#64748b]">
                  <span>Available: 280 • Required: 300</span>
                  <span className="font-bold text-[#ef4444]">Shortage: 20</span>
                </div>
                <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: '93%' }}></div>
                </div>
              </div>

              {/* Books Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-[#ec4899]" />
                    <span className="text-[14px] font-bold text-[#0f172a]">Books</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded">80% Available</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-[11px] text-[#64748b]">
                  <span>Available: 1200 • Required: 1500</span>
                  <span className="font-bold text-[#ef4444]">Shortage: 300</span>
                </div>
                <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#a78bfa] rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              {/* Scholarships Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-[#1e3a8a]" />
                    <span className="text-[14px] font-bold text-[#0f172a]">Scholarships</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ecfdf5] text-[#10b981] px-2 py-0.5 rounded">85% Available</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-[11px] text-[#64748b]">
                  <span>Available: 85 • Required: 100</span>
                  <span className="font-bold text-[#ef4444]">Shortage: 15</span>
                </div>
                <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ec4899] rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#8D8989]">
              <p className="text-[10px] text-[#94a3b8]">Last updated: {new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Month-over-Month Metrics Comparison */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-xl border border-[#8D8989] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0f172a]">Month-over-Month Metrics Comparison</h2>
          <p className="text-[13px] text-[#64748b] mt-1 mb-6">Performance metrics showing improvement trends from previous month</p>

          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-[#fff7ed] p-5">
              <p className="text-[11px] font-medium text-[#64748b] mb-1">Metrics Improved</p>
              <p className="text-3xl font-black text-[#f97316]">8</p>
              <p className="text-[11px] text-[#64748b] mt-1">out of 8</p>
            </div>
            <div className="rounded-xl bg-[#ecfdf5] p-5">
              <p className="text-[11px] font-medium text-[#64748b] mb-1">Best Performer</p>
              <p className="text-xl font-black text-[#059669]">Total Enrollment</p>
              <p className="text-[11px] text-[#10b981] font-bold mt-1">↑ 20 children</p>
            </div>
            <div className="rounded-xl bg-[#fefce8] p-5">
              <p className="text-[11px] font-medium text-[#64748b] mb-1">Avg Improvement</p>
              <p className="text-3xl font-black text-[#ca8a04]">+9.0</p>
              <p className="text-[11px] text-[#64748b] mt-1">per metric</p>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-[#334155] mb-4">Current vs Previous Month</h3>
            <div className="w-full h-[250px] relative border-b border-l border-[#8D8989] pl-2 pb-6">
              {/* Y Axis Labels & Grid lines */}
              <div className="absolute left-0 bottom-6 w-full h-[200px] flex flex-col justify-between items-end border-t border-dashed border-[#8D8989]">
                <span className="text-[10px] text-slate-400 absolute left-[-25px] top-[-6px]">200</span>
                <div className="w-full border-t border-dashed border-[#8D8989]"></div>
                <span className="text-[10px] text-slate-400 absolute left-[-25px] top-[44px]">150</span>
                <div className="w-full border-t border-dashed border-[#8D8989]"></div>
                <span className="text-[10px] text-slate-400 absolute left-[-25px] top-[94px]">100</span>
                <div className="w-full border-t border-dashed border-[#8D8989]"></div>
                <span className="text-[10px] text-slate-400 absolute left-[-21px] top-[144px]">50</span>
                <div className="w-full border-t border-dashed border-[#8D8989]"></div>
                <span className="text-[10px] text-slate-400 absolute left-[-15px] bottom-[-6px]">0</span>
              </div>

              {/* Bars */}
              <div className="absolute left-0 bottom-6 w-full h-[200px] flex justify-around items-end pt-2 px-2">
                {/* Group 1 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[95%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">190</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[83%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">166</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Total Enrollmen</span>
                </div>
                {/* Group 2 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[44%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">88</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[42%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">84</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Attendance Rate</span>
                </div>
                {/* Group 3 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[80%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">160</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[72%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">145</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Health Checkups</span>
                </div>
                {/* Group 4 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[37%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">75</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[35%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">70</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Nutrition Impro</span>
                </div>
                {/* Group 5 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[41%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">83</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[39%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">78</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Teacher Availab</span>
                </div>
                {/* Group 6 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[36%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">72</span></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[32%] relative"><span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white shadow rounded px-1 z-10">65</span></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Budget Utilizat</span>
                </div>
                {/* Group 7 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[42%] relative"></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[39%] relative"></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Resource Availa</span>
                </div>
                {/* Group 8 */}
                <div className="flex gap-0.5 items-end h-full relative group">
                  <div className="w-8 sm:w-10 bg-[#f97316] h-[43%] relative"></div>
                  <div className="w-8 sm:w-10 bg-[#033b8a] h-[38%] relative"></div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 -rotate-45 whitespace-nowrap">Scholarship Dis</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-6 mt-14">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#f97316] rounded-sm"></div>
                <span className="text-[12px] font-bold text-[#f97316]">Current Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#033b8a] rounded-sm"></div>
                <span className="text-[12px] font-bold text-[#033b8a]">Previous Month</span>
              </div>
            </div>
          </div>

          {/* Detailed Changes View */}
          <div>
            <h3 className="text-[13px] font-bold text-[#334155] mb-4">Detailed Changes</h3>

            <div className="space-y-3 relative">
              <div className="absolute right-[-14px] top-0 bottom-0 w-[4px] bg-slate-100 rounded-full flex flex-col justify-start items-center py-1">
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-slate-400"></div>
                <div className="w-1.5 h-16 bg-slate-500 rounded-full mt-1"></div>
              </div>

              {/* Change Rows */}
              {[
                { name: 'Total Enrollment', desc: '165 ➝ 185', change: '↑ 20 children', perc: '+12.1%' },
                { name: 'Attendance Rate', desc: '84 ➝ 88', change: '↑ 4 %', perc: '+4.8%' },
                { name: 'Health Checkups', desc: '145 ➝ 160', change: '↑ 15 completed', perc: '+10.3%' },
                { name: 'Nutrition Improvement', desc: '70 ➝ 75', change: '↑ 5 %', perc: '+7.1%' },
                { name: 'Teacher Availability', desc: '78 ➝ 83', change: '↑ 5 %', perc: '+6.4%' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center rounded-xl border border-[#8D8989] p-4">
                  <div>
                    <p className="text-[14px] font-bold text-[#0f172a]">{item.name}</p>
                    <p className="text-[12px] text-[#64748b] mt-1">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#10b981]">{item.change}</p>
                    <p className="text-[11px] font-bold text-[#10b981] mt-1">{item.perc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid for Centre Profile & Contact Information (Original Static Data) */}
      <section className="mx-auto max-w-[1920px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Centre Profile Directory */}
          <div className="rounded-2xl border border-[#8D8989] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-[#8D8989] pb-4">
              <div className="rounded-lg bg-teal-100 p-2 text-teal-600">
                <Building size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{t('awc.centreProfileTitle', language) || 'CENTRE PROFILE'}</h2>
                <p className="text-xs text-slate-500">{t('awc.centreProfileSubtitle', language) || 'Basic information about this Anganwadi centre.'}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-full text-left text-sm relative">
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {PROFILE_ROWS.map(({ attribute, key }) => {
                      const value = getValue(org, awcProfile, key);
                      return (
                        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 w-1/3 bg-[#f8f9fa] border-r border-[#8D8989]">
                            <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider">{attribute}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium break-words">{formatVal(value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Contact Directory */}
          <div className="rounded-2xl border border-[#8D8989] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-[#8D8989] pb-4">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <Contact size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{t('awc.staffContactTitle', language) || 'STAFF & CONTACT'}</h2>
                <p className="text-xs text-slate-500">{t('awc.staffContactSubtitle', language) || 'Key staff members and contact details for this centre.'}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#8D8989]">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-full text-left text-sm relative">
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {CONTACT_ROWS.map(({ attribute, key }) => {
                      const value = getValue(org, awcProfile, key);
                      return (
                        <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 w-1/3 bg-[#f8f9fa] border-r border-[#8D8989]">
                            <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider">{attribute}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-800 font-medium break-words">{formatVal(value)}</td>
                        </tr>
                      );
                    })}
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
