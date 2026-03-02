'use client';

import { useMemo, useState } from 'react';
import { Organization, AgricultureFacilityMaster } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import {
  Building, MapPin, Users, FileText, Phone, Hash, Home,
  Sprout, Droplet, CheckCircle2, XCircle, Activity, Warehouse
} from 'lucide-react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, AWC_MARKER_ICON } from '../../lib/mapConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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
  agricultureProfile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

const getNormalizedKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

const CATEGORIES = {
  basic: ['institutionid', 'nameofofficecenter', 'institutiontype', 'establishedyear', 'hostinstitutionaffiliatingbody', 'website', 'remarksdescription', 'remarks'],
  contact: ['officeemail', 'officephone', 'pincode', 'inchargename', 'inchargeemail', 'inchargecontact'],
  infrastructure: ['campusareaacres', 'libraryyesno', 'traininghallyesno', 'traininghallcapacityseats', 'computeritlabyesno', 'greenhousepolyhouseyesno', 'irrigationfacilityyesno'],
  demoFarm: ['demofarmyesno', 'demofarmareaacres', 'demounitscommaseparated'],
  seedSoil: ['seeddistributionyesno', 'seedprocessingunityesno', 'seedstoragecapacitymt', 'soiltestingyesno', 'soilsamplestestedperyear', 'soilhealthcardsissuedlastyear'],
  trainingReach: ['farmertrainingcapacityperbatch', 'trainingprogrammesconductedlastyear', 'onfarmtrialsfldlastyear', 'farmersservedlastyearapprox', 'villagesgpscoveredcount', 'keyschemescommaseparated'],
  staff: ['totalstaffcount', 'totalstaff', 'technicalstaffcount', 'scientistsofficerscount', 'extensionworkerscount'],
  machinery: ['machinerycustomhiringyesno']
};

const COLOR_CLASSES = [
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-violet-50 text-violet-600 border-violet-100',
  'bg-slate-100 text-slate-600 border-slate-200',
  'bg-teal-50 text-teal-600 border-teal-100',
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-sky-50 text-sky-600 border-sky-100'
];

export function AgriculturePortfolioDashboard({
  org,
  facilityMaster,
  agricultureProfile,
  departmentName,
  images = [],
}: AgriculturePortfolioDashboardProps) {
  const { language } = useLanguage();
  const [detailTab, setDetailTab] = useState<'overview' | 'infrastructure' | 'operations' | 'staff'>('overview');

  const toNumber = (v: unknown): number | null => {
    if (v == null || String(v).trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const totalStaff = toNumber(agricultureProfile.total_staff as unknown) ?? facilityMaster?.total_staff ?? null;
  const farmersServed = toNumber(agricultureProfile.farmers_served_last_year as unknown) ?? facilityMaster?.farmers_served_last_year ?? null;
  const trainingConducted = toNumber(agricultureProfile.training_programmes_conducted_last_year as unknown) ?? facilityMaster?.training_programmes_conducted_last_year ?? null;
  const soilTests = toNumber(agricultureProfile.soil_samples_tested_per_year as unknown) ?? facilityMaster?.soil_samples_tested_per_year ?? null;

  type Stat = { label: string; value: number | string | null; icon: any; color: string };
  const topStats: Stat[] = [
    { label: 'Total staff', value: totalStaff, icon: Users, color: 'emerald' },
    { label: 'Farmers served (last yr)', value: farmersServed, icon: Sprout, color: 'teal' },
    { label: 'Training programs', value: trainingConducted, icon: Users, color: 'blue' },
    { label: 'Soil samples tested', value: soilTests, icon: Droplet, color: 'amber' },
  ].filter(s => s.value != null && String(s.value).trim() !== '');

  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 19.28, lng: 84.86 };
  }, [org.latitude, org.longitude]);

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

  delete combinedProfile.latitude;
  delete combinedProfile.longitude;
  delete combinedProfile.name;

  const categorizedData: Record<string, { label: string, value: any, key: string }[]> = {
    overview: [],
    infrastructure: [],
    operations: [],
    staff: [],
    other: []
  };

  Object.entries(combinedProfile).forEach(([k, v]) => {
    if (v == null || String(v).trim() === '') return;
    const norm = getNormalizedKey(k);

    const item = { label: formatLabel(k), value: v, key: norm };

    if (CATEGORIES.basic.some(c => norm.includes(c)) || CATEGORIES.contact.some(c => norm.includes(c))) {
      categorizedData.overview.push(item);
    } else if (CATEGORIES.infrastructure.some(c => norm.includes(c)) || CATEGORIES.demoFarm.some(c => norm.includes(c)) || CATEGORIES.machinery.some(c => norm.includes(c))) {
      categorizedData.infrastructure.push(item);
    } else if (CATEGORIES.seedSoil.some(c => norm.includes(c)) || CATEGORIES.trainingReach.some(c => norm.includes(c))) {
      categorizedData.operations.push(item);
    } else if (CATEGORIES.staff.some(c => norm.includes(c))) {
      categorizedData.staff.push(item);
    } else {
      // If it didn't match anything, put it in overview or other
      if (!['block_ulb', 'gp_ward', 'village_locality'].includes(k)) {
        categorizedData.other.push(item);
      }
    }
  });

  const renderValue = (label: string, value: any) => {
    const sVal = String(value).toLowerCase();
    if (sVal === 'yes' || value === true || sVal === '1') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-sm mt-1"><CheckCircle2 size={14} /> Yes</span>;
    }
    if (sVal === 'no' || value === false || sVal === '0') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 shadow-sm mt-1"><XCircle size={14} /> No</span>;
    }
    return <span className="text-[14px] font-bold text-[#0f172a] block">{formatVal(value)}</span>;
  }

  const renderDataGrid = (items: typeof categorizedData.overview) => {
    if (!items || items.length === 0) return (
      <div className="p-8 text-center text-slate-500 text-sm font-medium bg-white/40 rounded-2xl border border-dashed border-slate-300">
        No specific data available in this category.
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div key={item.key} className="flex gap-4 items-start p-4 bg-white/60 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md hover:bg-white/90">
            <div className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${COLOR_CLASSES[idx % COLOR_CLASSES.length]} mt-0.5 shadow-sm`}>
              <FileText size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1 leading-tight">{item.label.replace('Demo ', '').replace(/_\d+$/, '')}</p>
              {renderValue(item.label, item.value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Generate Chart Data dynamically based on numbers found in operations
  const opsChartData = categorizedData.operations
    .map(item => ({
      name: item.label.replace('Demo ', '').replace(/_\d+$/, '').replace(/(\(.*?\)|Last Year|Per Year|Per Batch|Approx|Count|Last|Year)/gi, '').trim() || item.label,
      value: toNumber(item.value)
    }))
    .filter(item => item.value != null && item.value > 0 && !item.name.toLowerCase().includes('comma separated'));

  // Generate Staff chart data dynamically
  const staffChartData = categorizedData.staff
    .map(item => ({
      name: item.label.replace('Demo ', '').replace(/_\d+$/, '').replace(/(\(.*?\)|Count)/gi, '').trim() || item.label,
      value: toNumber(item.value)
    }))
    .filter(item => item.value != null && item.value > 0 && !item.name.toLowerCase().includes('total'));


  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          Agriculture Facility Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Insights and detailed resources across all dimensions
        </p>
      </header>

      {/* Stats row */}
      {topStats.length > 0 && (
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topStats.map((stat, i) => (
              <div key={i} className={`rounded-3xl border border-${stat.color}-200 bg-${stat.color}-50/60 p-6 shadow-sm flex justify-between items-center backdrop-blur-md hover:bg-white transition`}>
                <div className="min-w-0">
                  <p className={`text-[12px] font-bold text-${stat.color}-900/70 mb-1 uppercase tracking-widest`}>{stat.label}</p>
                  <h3 className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none`}>{formatVal(stat.value)}</h3>
                </div>
                <div className={`w-14 h-14 shrink-0 rounded-2xl bg-white border border-${stat.color}-100 flex items-center justify-center text-${stat.color}-600 ml-3 shadow-sm`}>
                  <stat.icon size={28} strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab Navigation & Content */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative min-h-[400px]">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/40 to-transparent pointer-events-none hidden sm:block" />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-emerald-200/50 pb-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-[#0f172a]">
                Facility Details & Records
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-white/60 border border-slate-200 shadow-sm p-1.5 w-full sm:w-auto overflow-x-auto gap-1">
                <button
                  onClick={() => setDetailTab('overview')}
                  className={`flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${detailTab === 'overview' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Building size={16} /> Overview
                </button>
                <button
                  onClick={() => setDetailTab('infrastructure')}
                  className={`flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${detailTab === 'infrastructure' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Warehouse size={16} /> Infrastructure & Demo
                </button>
                <button
                  onClick={() => setDetailTab('operations')}
                  className={`flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${detailTab === 'operations' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Activity size={16} /> Seed, Soil & Training
                </button>
                <button
                  onClick={() => setDetailTab('staff')}
                  className={`flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition whitespace-nowrap ${detailTab === 'staff' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Users size={16} /> Staff & Resources
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}

            {detailTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 mb-4 bg-emerald-100/50 inline-block px-3 py-1 rounded-full">Basic & Contact Info</h3>
                  {renderDataGrid(categorizedData.overview)}
                </div>
                {categorizedData.other.length > 0 && (
                  <div className="pt-6 border-t border-slate-200/60 mt-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4 bg-slate-100 inline-block px-3 py-1 rounded-full">Other Information</h3>
                    {renderDataGrid(categorizedData.other)}
                  </div>
                )}
              </div>
            )}

            {detailTab === 'infrastructure' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-teal-800 mb-4 bg-teal-100/50 inline-block px-3 py-1 rounded-full">Campus, Amenities & Demo Farms</h3>
                {renderDataGrid(categorizedData.infrastructure)}
              </div>
            )}

            {detailTab === 'operations' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-800 mb-4 bg-blue-100/50 inline-block px-3 py-1 rounded-full">Seed, Soil & Training Activities</h3>
                  {renderDataGrid(categorizedData.operations)}
                </div>

                {opsChartData.length > 0 && (
                  <div className="mt-8 p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white/70 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-2">Key Operations Metrics</h3>
                    <p className="text-xs text-slate-500 mb-8 font-medium">Visualizing numerical data records for operations</p>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={opsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                          <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }} />
                          <Bar dataKey="value" fill="#0EA5E9" radius={[6, 6, 0, 0]} barSize={48}>
                            {opsChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899'][index % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'staff' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-purple-800 mb-4 bg-purple-100/50 inline-block px-3 py-1 rounded-full">Human Resources & Staff Distribution</h3>
                  {renderDataGrid(categorizedData.staff)}
                </div>

                {staffChartData.length > 0 && (
                  <div className="mt-8 p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white/70 shadow-sm flex flex-col md:flex-row items-center justify-center gap-10">
                    <div className="h-72 w-full md:w-1/2 flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={staffChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value" stroke="none">
                            {staffChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][index % 4]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 max-w-sm">
                      <h3 className="text-xl font-black text-slate-800 mb-2">Staff Distribution</h3>
                      <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">Breakdown of technical and extension human resources stationed at the facility.</p>
                      <div className="space-y-3">
                        {staffChartData.map((d, i) => (
                          <div key={i} className="flex justify-between items-center p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][i % 4] }} />
                              <span className="text-sm font-bold text-slate-700">{d.name}</span>
                            </div>
                            <span className="font-black text-slate-900 text-lg bg-slate-50 px-3 py-0.5 rounded-full">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8 mt-12">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-black text-[#0f172a] tracking-tight">Facility Location</h2>
            <p className="text-[14px] font-medium text-[#64748b] mt-1">Geographical footprint mapping for the agriculture facility.</p>
          </div>
          <div className="h-[400px] w-full rounded-2xl bg-[#f8f9fa] overflow-hidden relative flex items-center justify-center border border-slate-200 shadow-inner">
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
                <MapPin size={24} className="text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-bold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
