'use client';

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
} from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getHealthProfileLabel, HEALTH_PROFILE_KEYS } from '../../lib/profileLabels';
import { Users, User, Phone, Wrench, CheckCircle2, AlertTriangle, TrendingUp, BarChart4, Activity, Stethoscope, BedDouble, HeartPulse, ActivitySquare, Clock, FileText, Monitor } from 'lucide-react';

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
}: HealthPortfolioDashboardProps) {
  const { language } = useLanguage();
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
  const totalOpd = toStatVal(healthProfile.total_opd);
  const totalIpd = toStatVal(healthProfile.total_ipd);
  const beds =
    toStatVal(healthProfile.no_of_bed) ?? facilityMaster?.num_beds ?? infra?.beds_total ?? null;
  const icuBeds = toStatVal(healthProfile.no_of_icu) ?? infra?.icu_beds ?? null;

  const topStats = [
    { label: t('health.stat.opd', language), value: totalOpd, icon: ActivitySquare },
    { label: t('health.stat.ipd', language), value: totalIpd, icon: HeartPulse },
    { label: t('health.stat.beds', language), value: beds, icon: BedDouble },
    { label: t('health.stat.icuBeds', language), value: icuBeds, icon: Stethoscope },
  ];

  // --- Derived Staff Data ---
  let avgExperience = 0;
  let uniqueDesignations = new Set<string>();
  const staffByRole = staff.reduce((acc, member) => {
    const role = member.role || 'Other Staff';
    uniqueDesignations.add(role);
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, typeof staff>);

  if (staff.length > 0) {
    const totalExp = staff.reduce((sum, s) => sum + parseNum(s.experience_years || 5), 0);
    avgExperience = parseFloat((totalExp / staff.length).toFixed(1));
  }

  // --- Derived Equipment Data ---
  const equipTotal = equipment.length;
  // If the word operational or good is anywhere
  const equipOperational = equipment.filter(e => String(e.condition).toLowerCase().includes('good') || String(e.condition).toLowerCase().includes('operational')).length;
  const equipMaintenance = equipment.filter(e => String(e.condition).toLowerCase().includes('maintenance') || String(e.condition).toLowerCase().includes('repair')).length;
  const equipNonOp = equipTotal - equipOperational - equipMaintenance;
  const equipOpPercent = equipTotal > 0 ? Math.round((equipOperational / equipTotal) * 100) : 0;

  // --- Derived Patient / Services Data ---
  // If no services data from API, fallback to 0.
  let opdCount = patientServices.length > 0 ? patientServices.reduce((sum, p) => sum + parseNum(p.opd_count), 0) : parseNum(totalOpd || 0);
  let ipdCount = patientServices.length > 0 ? patientServices.reduce((sum, p) => sum + parseNum(p.ipd_count), 0) : parseNum(totalIpd || 0);
  let vaccinationCount = immunisation.length > 0 ? immunisation.reduce((sum, i) => sum + parseNum(i.doses_given), 0) : 0;
  let antenatalCount = parseNum(healthProfile?.total_deliveries || 0); // using deliveries as a proxy if simple schema, else just 0

  const totalPatientsThisMonth = opdCount + ipdCount + vaccinationCount + antenatalCount;

  // We do not have historical data natively except via 'monthly' records
  let prevOpd = 0;
  let prevVacc = 0;
  let prevAntenatal = 0;

  if (monthly.length >= 2) {
    const sorted = [...monthly].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
    prevOpd = parseNum(sorted[1].total_opd);
    prevVacc = parseNum(sorted[1].total_immunisation);
    prevAntenatal = parseNum(sorted[1].total_deliveries);
  }

  const prevTotal = prevOpd + prevVacc + prevAntenatal;
  const growthRate = prevTotal > 0 ? `${(((totalPatientsThisMonth - prevTotal) / prevTotal) * 100).toFixed(1)}%` : '0.0%';
  const growthRateSign = totalPatientsThisMonth >= prevTotal ? '+' : '';

  const patientCategories = [
    { name: 'Outpatient', current: opdCount, previous: prevOpd, color: '#034ea2' },
    { name: 'Vaccination', current: vaccinationCount, previous: prevVacc, color: '#f59e0b' },
    { name: 'Antenatal', current: antenatalCount, previous: prevAntenatal, color: '#10b981' },
  ];

  const totalPie = patientCategories.reduce((s, c) => s + c.current, 0) || 1;
  let currentAngle = 0;
  const pieStops = totalPie === 1 && totalPatientsThisMonth === 0
    ? '#f1f5f9 0% 100%'
    : patientCategories.map(cat => {
      const percentage = (cat.current / totalPie) * 100;
      const start = currentAngle;
      currentAngle += percentage;
      return `${cat.color} ${start}% ${currentAngle}%`;
    }).join(', ');

  // Bar chart simple logic
  const maxBarValue = Math.max(...patientCategories.flatMap(c => [c.current, c.previous])) || 1;

  // Derive Health Service Metrics summary
  let servicesImproved = 0;
  let maxImprovementVal = -Infinity;
  let bestMetricName = 'None';
  let totalImprovementChange = 0;

  patientCategories.forEach(c => {
    const change = c.current - c.previous;
    totalImprovementChange += change;
    if (change > 0) {
      servicesImproved++;
    }
    if (change > maxImprovementVal && change > 0) {
      maxImprovementVal = change;
      bestMetricName = c.name;
    }
  });

  const avgImprovement = patientCategories.length > 0 ? Math.round(totalImprovementChange / patientCategories.length) : 0;

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-800 font-sans pb-16">
      {/* Header Profile Info & Images */}
      <header className="mx-auto max-w-[1920px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Profile Title, Info & Stats */}
          <div className="flex-1 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="inline-flex items-center rounded bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-600 border border-orange-500/20">
                  {t('health.badge', language)}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {org.name}
                </h1>
                {departmentName && (
                  <p className="mt-1.5 text-sm font-medium text-slate-500">{departmentName}</p>
                )}
                {locationLine && (
                  <p className="mt-0.5 text-sm text-slate-400">{locationLine}</p>
                )}
              </div>
              {facilityMaster?.facility_type && (
                <div className="rounded border border-amber-200/60 bg-amber-500/5 px-4 py-3 text-xs text-slate-600 shadow-sm min-w-[150px]">
                  <div className="font-semibold text-amber-800/80 uppercase tracking-widest text-[10px]">
                    {t('health.facilityProfileTitle', language)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {facilityMaster.facility_type}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {topStats.map(({ label, value, icon: Icon }) => {
                const theme = {
                  shadow: 'shadow-sm hover:shadow-md',
                  outline: 'border-emerald-200/60 bg-emerald-50/30',
                  iconBg: 'bg-emerald-100/60',
                  iconColor: 'text-emerald-600',
                  valueBg: 'bg-emerald-100/50 text-emerald-800'
                };

                return (
                  <div
                    key={label}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center ${theme.outline} ${theme.shadow} transition-all duration-300`}
                  >
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] ${theme.iconBg} ${theme.iconColor}`}>
                      {Icon && <Icon size={24} strokeWidth={2.5} />}
                    </div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
                    <div className={`rounded-full px-5 py-2 ${theme.valueBg}`}>
                      <p className="text-[22px] font-black tracking-tight">{formatVal(value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Photo Gallery */}
          <div className="w-full lg:w-1/3 xl:w-[450px] min-h-[300px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <ImageSlider images={images} altPrefix={org.name} className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      {/* Grid for Medical Staff & Equipment */}
      <section className="mx-auto max-w-[1920px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Medical Staff Directory */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Medical Staff Directory</h2>
                <p className="text-xs text-slate-500">Healthcare professionals and support staff</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Staff', value: staff.length, icon: User, theme: { outline: 'border-orange-200/80 bg-orange-50/40', iconBg: 'bg-orange-100/80', iconColor: 'text-orange-600', valueBg: 'bg-orange-100/60 text-slate-800' } },
                { label: 'Avg Experience', value: `${avgExperience} yrs`, icon: Clock, theme: { outline: 'border-emerald-200/80 bg-emerald-50/40', iconBg: 'bg-emerald-100/80', iconColor: 'text-emerald-600', valueBg: 'bg-emerald-100/60 text-emerald-700' } },
                { label: 'Designations', value: uniqueDesignations.size, icon: FileText, theme: { outline: 'border-indigo-200/80 bg-indigo-50/40', iconBg: 'bg-indigo-100/80', iconColor: 'text-indigo-600', valueBg: 'bg-indigo-100/60 text-slate-800' } },
              ].map(({ label, value, icon: Icon, theme }) => (
                <div key={label} className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center ${theme.outline} shadow-sm transition-all duration-300`}>
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] ${theme.iconBg} ${theme.iconColor}`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
                  <div className={`rounded-full px-5 py-2 ${theme.valueBg}`}>
                    <p className="text-[22px] font-black tracking-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(staffByRole).map(([role, members]) => (
                <div key={role}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700">{role}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {members.length} staff
                    </span>
                  </div>
                  <div className="space-y-3">
                    {members.map(member => (
                      <div key={member.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-2">
                              <User size={14} className="text-slate-400" />
                              {member.name || 'Unnamed Staff'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 pl-5">{member.qualification || 'No qualification listed'}</p>
                            <p className="mt-1 text-[11px] text-slate-400 pl-5 uppercase tracking-wider">{member.employment_type || 'Unknown term'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-amber-600">{member.experience_years ? `${member.experience_years} yrs exp` : ''}</p>
                            <p className="mt-1 flex items-center gap-1 justify-end text-xs text-slate-500">
                              <Phone size={12} /> {member.contact || 'No contact'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <p className="text-sm text-slate-500 italic py-4">No staff data available.</p>
              )}
            </div>
          </div>

          {/* Medical Equipment Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-6 pb-2">
              <h2 className="text-2xl font-bold text-[#0f172a]">Medical Equipment Status</h2>
              <p className="mt-1 text-sm text-[#64748b]">Equipment availability and maintenance schedule</p>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Green Card */}
              <div className="rounded-2xl border border-teal-200/60 bg-teal-50/40 p-6 flex justify-around shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-teal-100/60 text-teal-600">
                    <BedDouble size={24} strokeWidth={2.5} />
                  </div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-800">Total</p>
                  <div className="rounded-full px-4 py-1.5 bg-teal-100/60 text-teal-700 font-bold text-sm">
                    {equipTotal} (100%)
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-teal-100/60 text-teal-600">
                    <Monitor size={24} strokeWidth={2.5} />
                  </div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-800">Operational</p>
                  <div className="rounded-full px-4 py-1.5 bg-teal-100/60 text-teal-700 font-bold text-sm">
                    {equipOperational} ({equipTotal > 0 ? Math.round((equipOperational / equipTotal) * 100) : 0}%)
                  </div>
                </div>
              </div>

              {/* Orange/Yellow Card */}
              <div className="rounded-2xl border border-amber-100 bg-[#fffdf0] p-6 flex justify-around shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-amber-100/60 text-amber-600">
                    <Wrench size={24} strokeWidth={2.5} />
                  </div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-800">Maintenance</p>
                  <div className="rounded-full px-4 py-1.5 bg-amber-100/60 text-amber-600 font-bold text-sm">
                    {equipMaintenance} ({equipTotal > 0 ? Math.round((equipMaintenance / equipTotal) * 100) : 0}%)
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-amber-100/60 text-amber-600">
                    <AlertTriangle size={24} strokeWidth={2.5} />
                  </div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-800">Non-Op</p>
                  <div className="rounded-full px-4 py-1.5 bg-rose-100/60 text-rose-600 font-bold text-sm">
                    {equipNonOp} ({equipTotal > 0 ? Math.round((equipNonOp / equipTotal) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                <table className="w-full min-w-[500px] text-left text-sm relative">
                  <thead className="bg-[#f8f9fa] text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">Equipment Type</th>
                      <th className="px-4 py-4 text-center">Total</th>
                      <th className="px-4 py-4 text-center">Operational</th>
                      <th className="px-4 py-4 text-center">Maintenance</th>
                      <th className="px-4 py-4 text-center">Non-Op</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {equipment.map((item, idx) => {
                      const total = item.quantity || 1;
                      const isOp = String(item.condition).toLowerCase().includes('good') || String(item.condition).toLowerCase().includes('operational');
                      const isMaint = String(item.condition).toLowerCase().includes('maintenance') || String(item.condition).toLowerCase().includes('repair');
                      const opCount = isOp ? total : 0;
                      const maintCount = isMaint ? total : 0;
                      const nonopCount = (!isOp && !isMaint) ? total : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-2">
                            <span className="font-medium text-[#475569]">{item.equipment_name || 'Unnamed Equipment'}</span>
                          </td>
                          <td className="px-4 py-4 text-center text-[#475569]">{total}</td>
                          <td className="px-4 py-4 text-center text-[#475569]">{opCount}</td>
                          <td className="px-4 py-4 text-center text-[#475569]">{maintCount}</td>
                          <td className="px-4 py-4 text-center text-[#475569]">{nonopCount}</td>
                        </tr>
                      );
                    })}
                    {equipment.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 italic">No equipment data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Statistics & Analytics */}
      <section className="mx-auto max-w-[1920px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Patient Statistics & Analytics</h2>
              <p className="text-xs text-slate-500">Patient volume and category breakdown</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-5">
              <p className="text-xs font-semibold text-slate-500">Total Patients (Current)</p>
              <p className="mt-2 text-3xl font-extrabold text-orange-500">{totalPatientsThisMonth.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-400">this month</p>
            </div>
            <div className={`rounded-xl border p-5 ${totalPatientsThisMonth >= prevTotal ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
              <p className="text-xs font-semibold text-slate-500">Growth Rate</p>
              <p className={`mt-2 text-3xl font-extrabold ${totalPatientsThisMonth >= prevTotal ? 'text-emerald-500' : 'text-rose-500'}`}>{growthRateSign}{growthRate}</p>
              <p className="mt-1 text-xs text-slate-400">vs last month</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
              <p className="text-xs font-semibold text-slate-500">Categories</p>
              <p className="mt-2 text-3xl font-extrabold text-blue-600">{patientCategories.length}</p>
              <p className="mt-1 text-xs text-slate-400">service types</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-b border-slate-100 pb-8">
            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <h3 className="mb-6 text-sm font-bold text-slate-700">Patient Distribution</h3>
              <div
                className="w-48 h-48 rounded-full shadow-inner relative flex items-center justify-center transform hover:scale-105 transition-transform"
                style={{ background: `conic-gradient(${pieStops})` }}
              >
                <div className="w-24 h-24 bg-white rounded-full"></div>
              </div>
              {/* Legend overlaying kinda */}
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {patientCategories.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }}></div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">{c.name}: {c.current}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="mb-6 text-sm font-bold text-slate-700">Month Comparison</h3>
              <div className="h-48 flex items-end justify-between border-l border-b border-slate-200 pb-2 pl-2 relative">
                {/* Grid lines */}
                <div className="absolute top-0 left-0 w-full border-t border-dashed border-slate-200"></div>
                <div className="absolute top-[33%] left-0 w-full border-t border-dashed border-slate-200"></div>
                <div className="absolute top-[66%] left-0 w-full border-t border-dashed border-slate-200"></div>
                <div className="absolute top-0 -left-8 text-[9px] text-slate-400 font-medium">{maxBarValue}</div>
                <div className="absolute top-[33%] -left-8 text-[9px] text-slate-400 font-medium">{Math.floor(maxBarValue * 0.66)}</div>
                <div className="absolute top-[66%] -left-8 text-[9px] text-slate-400 font-medium">{Math.floor(maxBarValue * 0.33)}</div>
                <div className="absolute bottom-0 -left-6 text-[9px] text-slate-400 font-medium">0</div>

                {patientCategories.map((cat, i) => (
                  <div key={i} className="flex gap-1 w-full justify-center group relative z-10 items-end h-full">
                    {/* Previous Month */}
                    <div
                      className="w-8 sm:w-12 bg-orange-400 hover:bg-orange-500 transition-colors rounded-t-sm"
                      style={{ height: `${(cat.previous / maxBarValue) * 100}%` }}
                      title={`Previous: ${cat.previous}`}
                    ></div>
                    {/* Current Month */}
                    <div
                      className="w-8 sm:w-12 bg-[#034ea2] hover:bg-[#023e82] transition-colors shadow-sm rounded-t-sm"
                      style={{ height: `${(cat.current / maxBarValue) * 100}%` }}
                      title={`Current: ${cat.current}`}
                    ></div>
                    <div className="absolute -bottom-6 w-full text-center text-[10px] font-semibold text-slate-500 lowercase">{cat.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-center gap-6">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div><span className="text-xs text-slate-500 font-medium">Previous</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#034ea2] rounded-sm"></div><span className="text-xs text-slate-500 font-medium">Current</span></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-sm font-bold text-slate-700">Patient Category Breakdown</h3>
            <div className="space-y-4">
              {patientCategories.map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{cat.name}</span>
                    <div className="text-right">
                      <span>{cat.current}</span>
                      <div className="text-[10px] text-emerald-500 block">+{cat.current - cat.previous}</div>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(cat.current / maxBarValue) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Health Service Metrics */}
      <section className="mx-auto max-w-[1920px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Health Service Metrics</h2>
            <p className="text-xs text-slate-500">Current vs Previous Month Performance</p>
          </div>

          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
              <p className="text-xs text-slate-500 mb-1">Services Improved</p>
              <p className="text-2xl font-bold text-amber-600">{servicesImproved}</p>
              <p className="text-[10px] mt-1 text-slate-400">out of {patientCategories.length}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
              <p className="text-xs text-slate-500 mb-1">Best Metric</p>
              <p className="text-xl font-bold text-emerald-700">{bestMetricName}</p>
              {maxImprovementVal > -Infinity && (
                <p className="text-[10px] mt-1 text-emerald-500 font-bold">+{maxImprovementVal}</p>
              )}
            </div>
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
              <p className="text-xs text-slate-500 mb-1">Avg Improvement</p>
              <p className="text-2xl font-bold text-blue-700">{avgImprovement > 0 ? `+${avgImprovement}` : avgImprovement}</p>
              <p className="text-[10px] mt-1 text-slate-400">per metric</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-700">Detailed Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Metric</th>
                    <th className="px-4 py-3 font-semibold">Previous</th>
                    <th className="px-4 py-3 font-semibold">Current</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-lg">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {patientCategories.map(c => {
                    const perc = c.previous > 0 ? (((c.current - c.previous) / c.previous) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">{c.name} Services</td>
                        <td className="px-4 py-3 text-slate-600">{c.previous}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{c.current}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <TrendingUp size={14} /> {perc}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* Raw Database Fields Profile Fields Fallback Display */}
      <section className="mx-auto max-w-[1920px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-teal-200/80 bg-teal-500/5 shadow-sm overflow-hidden">
          <div className="border-b border-teal-200/60 bg-teal-500/10 px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
              {t('health.facilityProfileTitle', language)} Overview
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {t('health.facilityProfileSubtitle', language) || 'Additional information and metrics about this health facility.'}
            </p>
          </div>
          <div className="p-4 sm:p-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Object.entries(healthProfile || {})
              .filter(([, v]) => v != null && String(v).trim() !== '')
              .sort(([aKey], [bKey]) => {
                const ia = HEALTH_PROFILE_KEYS.indexOf(aKey);
                const ib = HEALTH_PROFILE_KEYS.indexOf(bKey);
                if (ia === -1 && ib === -1) return aKey.localeCompare(bKey);
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              })
              .map(([key, value]) => (
                <div key={key} className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm hover:bg-white hover:border-teal-300 transition-colors flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 leading-tight line-clamp-2" title={getHealthProfileLabel(key)}>
                    {getHealthProfileLabel(key)}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 break-words">
                    {formatVal(value as string | number | null | undefined)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}


