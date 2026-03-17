"use client";

import { useMemo, useState } from 'react';
import {
  Organization,
  AgricultureDailyMetric,
  AgricultureMonthlyReport,
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
  ResponsiveContainer,
} from 'recharts';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import {
  Users,
  MapPin,
  Home,
  Building,
  Phone,
  Globe,
  Leaf,
  Sprout,
  Beaker,
  Tractor,
  BookOpen,
  FlaskConical,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

type AgProfile = Record<string, unknown>;

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

interface AgriculturePortfolioDashboardProps {
  org: Organization;
  profile: AgProfile;
  departmentName?: string | null;
  images?: string[];
  dailyMetrics?: AgricultureDailyMetric[];
  monthlyReports?: AgricultureMonthlyReport[];
}

export function AgriculturePortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
  dailyMetrics = [],
  monthlyReports = [],
}: AgriculturePortfolioDashboardProps) {
  const { language } = useLanguage();
  const [detailTab, setDetailTab] = useState<
    'profile' | 'infrastructure' | 'outreach' | 'notes'
  >('profile');
  const [monitorDate, setMonitorDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const p: any = profile;

  const block = p.block_ulb;
  const gpWard = p.gp_ward;
  const village = p.village_locality;
  const institutionType = p.institution_type;
  const institutionId = p.institution_id;
  const hostInstitution = p.host_institution_affiliating_body || p.host_institution;
  const establishedYear = p.established_year;
  const pinCode = p.pin_code;

  const inChargeName = p.in_charge_name;
  const inChargeContact = p.in_charge_contact;
  const inChargeEmail = p.in_charge_email;
  const officePhone = p.office_phone;
  const officeEmail = p.office_email;
  const website = p.website;

  const campusArea = p.campus_area_acres;
  const trainingHall = p.training_hall_yes_no || p.training_hall;
  const trainingHallCapacity = p.training_hall_capacity_seats;
  const soilTesting = p.soil_testing_yes_no || p.soil_testing;
  const soilSamplesPerYear = p.soil_samples_tested_per_year;
  const seedDistribution = p.seed_distribution_yes_no || p.seed_distribution;
  const seedProcessingUnit = p.seed_processing_unit_yes_no || p.seed_processing_unit;
  const seedStorageCapacity = p.seed_storage_capacity_mt;

  const demoUnits = p.demo_units_comma_separated || p.demo_units;
  const demoFarm = p.demo_farm_yes_no || p.demo_farm;
  const demoFarmArea = p.demo_farm_area_acres;
  const greenhousePolyhouse = p.greenhouse_polyhouse_yes_no || p.greenhouse_polyhouse;
  const irrigationFacility = p.irrigation_facility_yes_no || p.irrigation_facility;
  const machineryHiring = p.machinery_custom_hiring_yes_no || p.machinery_custom_hiring;
  const computerLab = p.computer_it_lab_yes_no || p.computer_it_lab;
  const library = p.library_yes_no || p.library;
  const keySchemes = p.key_schemes_comma_separated || p.key_schemes;

  const totalStaff = p.total_staff_count ?? p.total_staff;
  const scientists = p.scientists_officers_count ?? p.scientists_officers;
  const technicalStaff = p.technical_staff_count ?? p.technical_staff;
  const extensionWorkers = p.extension_workers_count ?? p.extension_workers;

  const farmerCapacity = p.farmer_training_capacity_per_batch;
  const trainingsLastYear = p.training_programmes_conducted_last_year;
  const trialsLastYear = p.on_farm_trials_fld_last_year ?? p.on_farm_trials_last_year;
  const villagesCovered = p.villages_gps_covered_count ?? p.villages_covered;
  const soilCards = p.soil_health_cards_issued_last_year;
  const farmersServed = p.farmers_served_last_year_approx ?? p.farmers_served_last_year;
  const remarks = p.remarks_description || p.remarks;

  const tabBtnClass = (active: boolean) =>
    `flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
    }`;

  const Tile = ({
    icon: Icon,
    label,
    value,
    tone,
    multiline = false,
  }: {
    icon: any;
    label: string;
    value: any;
    tone: 'emerald' | 'sky' | 'amber' | 'violet' | 'slate' | 'teal' | 'rose';
    multiline?: boolean;
  }) => {
    const tones: any = {
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      sky: 'bg-sky-50 text-sky-600 border-sky-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      violet: 'bg-violet-50 text-violet-600 border-violet-100',
      slate: 'bg-slate-100 text-slate-600 border-slate-200',
      teal: 'bg-teal-50 text-teal-600 border-teal-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
      <div className="flex gap-4 items-center">
        <div
          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
            {label}
          </p>
          <p
            className={`text-[15px] font-bold text-[#0f172a] ${
              multiline ? 'whitespace-pre-line break-words' : 'truncate'
            }`}
          >
            {formatVal(value)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[320px] sm:h-[380px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          Agriculture Facility Dashboard
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          Facility profile, infrastructure and outreach from available data
        </p>
        {departmentName && (
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {departmentName}
          </p>
        )}
      </header>

      {/* Facility details tabs */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
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
                  className={tabBtnClass(detailTab === 'profile')}
                >
                  <Building size={14} />
                  <span>Facility profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('infrastructure')}
                  className={tabBtnClass(detailTab === 'infrastructure')}
                >
                  <Tractor size={14} />
                  <span>Infrastructure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('outreach')}
                  className={tabBtnClass(detailTab === 'outreach')}
                >
                  <Leaf size={14} />
                  <span>Outreach</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('notes')}
                  className={tabBtnClass(detailTab === 'notes')}
                >
                  <BookOpen size={14} />
                  <span>Schemes & notes</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Tile icon={Building} label="Facility name" value={org.name} tone="emerald" />
                <Tile icon={MapPin} label="Block / ULB" value={block} tone="sky" />
                <Tile icon={Home} label="GP / Ward" value={gpWard} tone="amber" />
                <Tile icon={MapPin} label="Village / Locality" value={village} tone="violet" />
                <Tile icon={ClipboardList} label="Institution type" value={institutionType} tone="slate" />
                <Tile icon={ClipboardList} label="Institution ID" value={institutionId} tone="slate" />
                <Tile icon={Building} label="Host institution / affiliating body" value={hostInstitution} tone="emerald" />
                <Tile icon={ClipboardList} label="Established year" value={establishedYear} tone="sky" />
                <Tile icon={ClipboardList} label="PIN code" value={pinCode} tone="slate" />
              </div>
            )}

            {detailTab === 'infrastructure' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Tile icon={Leaf} label="Campus area (acres)" value={campusArea} tone="emerald" />
                <Tile icon={Building} label="Training hall" value={trainingHall} tone="amber" />
                <Tile icon={Users} label="Training hall capacity (seats)" value={trainingHallCapacity} tone="slate" />
                <Tile icon={Beaker} label="Soil testing" value={soilTesting} tone="teal" />
                <Tile icon={FlaskConical} label="Soil samples tested / year" value={soilSamplesPerYear} tone="teal" />
                <Tile
                  icon={Sprout}
                  label="Seed distribution / processing"
                  value={`${formatVal(seedDistribution)} / ${formatVal(seedProcessingUnit)}`}
                  tone="emerald"
                />
                <Tile icon={Sprout} label="Seed storage capacity (MT)" value={seedStorageCapacity} tone="emerald" />
                <Tile icon={Tractor} label="Machinery custom hiring" value={machineryHiring} tone="sky" />
                <Tile icon={Globe} label="Computer / IT lab" value={computerLab} tone="violet" />
                <Tile icon={BookOpen} label="Library" value={library} tone="rose" />
                <Tile icon={Leaf} label="Demo farm" value={demoFarm} tone="emerald" />
                <Tile icon={Leaf} label="Demo farm area (acres)" value={demoFarmArea} tone="emerald" />
                <Tile icon={Sprout} label="Greenhouse / polyhouse" value={greenhousePolyhouse} tone="teal" />
                <Tile icon={Beaker} label="Irrigation facility" value={irrigationFacility} tone="sky" />
              </div>
            )}

            {detailTab === 'outreach' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Tile icon={Users} label="Total staff" value={totalStaff} tone="slate" />
                <Tile icon={ClipboardList} label="Scientists / officers" value={scientists} tone="emerald" />
                <Tile icon={ClipboardList} label="Technical staff" value={technicalStaff} tone="sky" />
                <Tile icon={Leaf} label="Extension workers" value={extensionWorkers} tone="teal" />

                <Tile icon={Users} label="Farmer training capacity (per batch)" value={farmerCapacity} tone="amber" />
                <Tile icon={ClipboardList} label="Trainings conducted last year" value={trainingsLastYear} tone="violet" />
                <Tile icon={Beaker} label="On-farm trials / FLD last year" value={trialsLastYear} tone="teal" />
                <Tile icon={MapPin} label="Villages / GPs covered (count)" value={villagesCovered} tone="sky" />
                <Tile icon={FlaskConical} label="Soil health cards issued last year" value={soilCards} tone="teal" />
                <Tile icon={Leaf} label="Farmers served last year (approx)" value={farmersServed} tone="emerald" />
              </div>
            )}

            {detailTab === 'notes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Tile
                  icon={ClipboardList}
                  label="Key schemes"
                  value={keySchemes}
                  tone="violet"
                  multiline
                />
                <Tile
                  icon={Leaf}
                  label="Demo units"
                  value={demoUnits}
                  tone="emerald"
                  multiline
                />
                <Tile
                  icon={BookOpen}
                  label="Remarks / description"
                  value={remarks}
                  tone="slate"
                  multiline
                />
                {!keySchemes && !demoUnits && !remarks && (
                  <div className="text-sm text-slate-600">No notes available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Daily Monitoring Section (same UI design as Health) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">Daily Monitoring</h2>
            <p className="text-[13px] text-[#64748b] mt-1">
              Trainings, farmers served and outreach metrics over time.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                  Select date
                </label>
                <input
                  type="date"
                  value={monitorDate}
                  onChange={(e) => setMonitorDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily metrics: Trainings & Farmers served (last 15) */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a]">Daily outreach</h3>
                    <p className="text-[11px] text-[#64748b]">Trainings and farmers served (last 15 records)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Trainings</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Farmers</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...dailyMetrics].slice(0, 15).reverse().map((d) => ({
                        date: (d.record_date || '').slice(5, 10).split('-').reverse().join('/'),
                        trainings: d.trainings_conducted ?? 0,
                        farmers: d.farmers_served ?? 0,
                      }))}
                    >
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
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="trainings" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="farmers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly report totals */}
              <div className="rounded-2xl border border-slate-100 bg-white/50 p-6 flex flex-col h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">Monthly summary</h3>
                  <p className="text-[11px] text-[#64748b]">Totals by month (last 12 records)</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyReports.slice(0, 12).reverse().map((m) => ({
                        period: `${m.year}-${String(m.month).padStart(2, '0')}`,
                        trainings: m.total_trainings ?? 0,
                        farmers: m.total_farmers_served ?? 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="period"
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
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="trainings"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="farmers"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table: daily metrics for selected date */}
            <div className="rounded-2xl border border-slate-100 bg-white/40 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">Daily metrics</h3>
                  <p className="text-[11px] text-[#64748b]">Records for {monitorDate}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Activity size={20} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Trainings</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Farmers served</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Trials</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Villages</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Soil cards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const dayRows = dailyMetrics.filter(
                        (d) => (d.record_date || '').slice(0, 10) === monitorDate,
                      );
                      if (dayRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic bg-white/20">
                              No daily metrics for this date. Add data from the Agriculture admin panel.
                            </td>
                          </tr>
                        );
                      }
                      return dayRows.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-white/40 transition">
                          <td className="px-6 py-4 font-bold text-[#334155]">
                            {(row.record_date || '').slice(0, 10)}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">
                            {row.trainings_conducted ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                            {row.farmers_served ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">
                            {row.trials_conducted ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-slate-600">
                            {row.villages_covered_count ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              {row.soil_cards_issued ?? '—'}
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

      {/* Map Section with legend */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-100/40 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f172a]">
                Agriculture Facility Location
              </h2>
              <p className="text-[13px] text-[#64748b] mt-1">
                Agriculture facility location on map.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-[11px] font-semibold text-slate-600">
                  {t('map.legend', language)} · {t('map.viewProfile', language)}
                </span>
              </div>
            </div>
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
                <MapPin size={24} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {t('minor.map.loading', language)}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

