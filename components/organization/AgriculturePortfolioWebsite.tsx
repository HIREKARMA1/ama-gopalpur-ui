'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AgricultureDailyMetric, AgricultureMonthlyReport, Organization } from '../../services/api';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  PsAboutSection,
  PsContactSection,
  PsFacilitiesCarouselSection,
  PsFacultySection,
  PsGallerySection,
  PsHeroSection,
  PsPersonCardsSection,
  asString,
  displayText,
  parseArray,
  type FacilityCard,
  type Faculty,
  type GalleryItem,
  type Lang,
  type PsPersonCard,
} from './EducationPsSections';
import { useLanguage } from '../i18n/LanguageContext';

interface AgricultureDailyMetricExtended extends AgricultureDailyMetric {
  staff_present_count?: number | null;
}

type AgDailyStockRow = {
  record_date?: string;
  item_name?: string;
  opening?: number | string;
  received?: number | string;
  used?: number | string;
  closing?: number | string;
};

type AgStaffAttendanceRow = {
  record_date?: string;
  staff_present_count?: number | null;
  expert_present?: boolean | null;
  remarks?: string | null;
};

export interface AgriculturePortfolioWebsiteProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
  dailyMetrics?: AgricultureDailyMetric[];
  monthlyReports?: AgricultureMonthlyReport[];
}

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';
const EMPTY = '—';

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseObjectMap(raw: unknown): Record<string, Record<string, boolean>> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, Record<string, boolean>>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, Record<string, boolean>>;
  return {};
}

function dateKey(value: unknown): string {
  const s = asString(value);
  return s ? s.slice(0, 10) : '';
}

function latestDate(values: string[]): string {
  if (!values.length) return new Date().toISOString().slice(0, 10);
  return [...values].sort((a, b) => b.localeCompare(a))[0];
}

function boolLabel(v: unknown): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return EMPTY;
}

function buildFacilityCards(profile: Record<string, unknown>): FacilityCard[] {
  const fromJson = parseArray<FacilityCard>(profile.ag_facility_cards_json);
  const fromForm = fromJson.length > 0 ? fromJson : parseArray<FacilityCard>(profile.ag_facility_cards);
  if (fromForm.length > 0) return fromForm;

  const fallbackRows: FacilityCard[] = [
    {
      title: 'Training hall',
      description: `Available: ${boolLabel(profile.training_hall)} | Capacity: ${displayText(profile.training_hall_capacity)}`,
    },
    {
      title: 'Soil testing',
      description: `Available: ${boolLabel(profile.soil_testing)} | Samples/year: ${displayText(profile.soil_samples_tested_per_year)}`,
    },
    {
      title: 'Seed support',
      description: `Distribution: ${boolLabel(profile.seed_distribution)} | Processing: ${boolLabel(profile.seed_processing_unit)} | Storage MT: ${displayText(profile.seed_storage_capacity_mt)}`,
    },
    {
      title: 'Demo and machinery',
      description: `Demo farm: ${boolLabel(profile.demo_farm)} | Area acres: ${displayText(profile.demo_farm_area_acres)} | Machinery hiring: ${boolLabel(profile.machinery_custom_hiring)}`,
    },
  ];
  return fallbackRows;
}

function AgriculturePortfolioMonitoringSection({
  profile,
  dailyMetrics = [],
}: {
  profile: Record<string, unknown>;
  dailyMetrics: AgricultureDailyMetricExtended[];
}) {
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));

  const metricDates = useMemo(
    () => dailyMetrics.map((m) => dateKey(m.record_date)).filter(Boolean),
    [dailyMetrics],
  );
  const metricByDate = useMemo(() => {
    const grouped = new Map<string, AgricultureDailyMetricExtended[]>();
    for (const row of dailyMetrics) {
      const key = dateKey(row.record_date);
      if (!key) continue;
      const current = grouped.get(key) || [];
      current.push(row);
      grouped.set(key, current);
    }
    return grouped;
  }, [dailyMetrics]);

  useEffect(() => {
    if (!metricDates.length) return;
    if (!metricDates.includes(monitorDate)) {
      setMonitorDate(latestDate(metricDates));
    }
  }, [metricDates, monitorDate]);

  const staffAttendanceRows = useMemo(
    () =>
      parseArray<AgStaffAttendanceRow>(profile.ag_staff_attendance_rows).length > 0
        ? parseArray<AgStaffAttendanceRow>(profile.ag_staff_attendance_rows)
        : parseArray<AgStaffAttendanceRow>(profile.ag_staff_attendance_rows_json),
    [profile],
  );

  const trendRows = useMemo(() => {
    const base = dailyMetrics
      .slice(-15)
      .map((m) => ({
        date: dateKey(m.record_date),
        dateLabel: dateKey(m.record_date).slice(5).split('-').reverse().join('/'),
        trainings: toNumber(m.trainings_conducted),
        farmers: toNumber(m.farmers_served),
        staffPresent: toNumber(m.staff_present_count),
      }))
      .filter((r) => r.date);
    const byDate = new Map(base.map((r) => [r.date, r]));
    for (const row of staffAttendanceRows) {
      const d = dateKey(row.record_date);
      if (!d) continue;
      const current = byDate.get(d);
      if (current) {
        current.staffPresent =
          row.staff_present_count != null ? toNumber(row.staff_present_count) : current.staffPresent;
      } else {
        byDate.set(d, {
          date: d,
          dateLabel: d.slice(5).split('-').reverse().join('/'),
          trainings: 0,
          farmers: 0,
          staffPresent: toNumber(row.staff_present_count),
        });
      }
    }
    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);
  }, [dailyMetrics, staffAttendanceRows]);

  const stockRows = useMemo(
    () =>
      parseArray<AgDailyStockRow>(profile.ag_daily_stock_rows_json).length > 0
        ? parseArray<AgDailyStockRow>(profile.ag_daily_stock_rows_json)
        : parseArray<AgDailyStockRow>(profile.ag_daily_stock_rows),
    [profile],
  );

  const stockDates = useMemo(
    () => stockRows.map((r) => dateKey(r.record_date)).filter(Boolean),
    [stockRows],
  );
  const stockDate = stockDates.includes(monitorDate) ? monitorDate : latestDate(stockDates);
  const shownStocks = useMemo(
    () => stockRows.filter((r) => dateKey(r.record_date) === stockDate),
    [stockRows, stockDate],
  );

  const dayMetrics = metricByDate.get(monitorDate) || [];

  return (
    <section className="rounded-[28px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 p-5 shadow-md md:p-7">
      <h2 className={SECTION_H2}>Daily Monitoring</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Date-wise operations summary with attendance, outreach, and inventory view.
      </p>

      <div className="mt-8 space-y-10">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
              Select monitoring date
            </label>
            <input
              type="date"
              value={monitorDate}
              onChange={(e) => setMonitorDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0f172a]">Daily Service Trends</h3>
              <p className="text-[11px] text-[#64748b]">Trainings and farmers served (last 15 records)</p>
            </div>
            <div className="min-h-0 flex-1">
              {trendRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="trainings" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="farmers" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                  No trend data available.
                </div>
              )}
            </div>
          </div>

          <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0f172a]">Attendance Trends</h3>
              <p className="text-[11px] text-[#64748b]">Staff present count (last 15 records)</p>
            </div>
            <div className="min-h-0 flex-1">
              {trendRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="staffPresent"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                  No attendance data available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 p-5">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Daily Service Numbers</h3>
              <p className="text-[11px] text-[#64748b]">Records for {monitorDate}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Trainings</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Farmers served</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Trials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="bg-white/20 px-6 py-10 text-center italic text-slate-400">
                      No daily records available for this date.
                    </td>
                  </tr>
                ) : (
                  dayMetrics.map((row, idx) => (
                    <tr key={`${dateKey(row.record_date)}-${idx}`} className="transition hover:bg-white/40">
                      <td className="px-6 py-4 font-bold text-[#334155]">{dateKey(row.record_date)}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.trainings_conducted ?? 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">{row.farmers_served ?? 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{row.trials_conducted ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 p-5">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Daily Stock / Inventory</h3>
              <p className="text-[11px] text-[#64748b]">Inventory level for {stockDate}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Item name</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Opening</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Received</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Used</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Closing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shownStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="bg-white/20 px-6 py-10 text-center italic text-slate-400">
                      No stock rows available for this date.
                    </td>
                  </tr>
                ) : (
                  shownStocks.map((stock, idx) => (
                    <tr key={`${dateKey(stock.record_date)}-${stock.item_name}-${idx}`} className="transition hover:bg-white/40">
                      <td className="px-6 py-4 font-bold text-[#334155]">{displayText(stock.item_name)}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{displayText(stock.opening)}</td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">{displayText(stock.received)}</td>
                      <td className="px-6 py-4 text-center font-semibold text-rose-500">{displayText(stock.used)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700">{displayText(stock.closing)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AgriculturePortfolioWebsite({
  org,
  profile,
  departmentName: _departmentName,
  images = [],
  dailyMetrics = [],
  monthlyReports = [],
}: AgriculturePortfolioWebsiteProps) {
  const { language } = useLanguage();
  const lang = language as Lang;

  const heroSlides = useMemo(() => {
    const direct = [profile.ag_hero_1, profile.ag_hero_2, profile.ag_hero_3]
      .map((v) => asString(v))
      .filter(Boolean);
    if (direct.length > 0) return direct;
    return images.slice(0, 3);
  }, [images, profile.ag_hero_1, profile.ag_hero_2, profile.ag_hero_3]);

  const locationFallback = [asString(profile.block_ulb), asString(profile.gp_ward), asString(profile.village_locality)]
    .filter(Boolean)
    .join(', ');

  const psProfile = useMemo(() => {
    return {
      ...profile,
      school_name_en: asString(profile.ag_display_name) || org.name || '',
      hero_primary_tagline_en:
        asString(profile.ag_hero_tagline) ||
        asString(profile.ag_tagline) ||
        asString(profile.institution_type) ||
        'Agriculture center',
      about_short_en: asString(profile.ag_about) || asString(profile.remarks) || '',
      about_image: asString(profile.ag_campus_image),
      esst_year: asString(profile.established_year),
      school_type_en: asString(profile.facility_type) || asString(profile.institution_type),
      location_en: asString(profile.ag_location_line) || locationFallback || asString(org.address),
      headmaster_message_en: asString(profile.ag_head_message),
      name_of_hm: asString(profile.ag_head_name) || asString(profile.in_charge_name),
      headmaster_photo: asString(profile.ag_head_photo),
      hm_qualification: asString(profile.ag_head_qualification) || asString(profile.qualification),
      hm_experience: asString(profile.ag_head_experience) || asString(profile.experience),
      headmaster_contact: asString(profile.ag_head_contact) || asString(profile.in_charge_contact),
      headmaster_email: asString(profile.ag_head_email) || asString(profile.in_charge_email),
      faculty_attendance: profile.ag_expert_attendance_json || profile.ag_expert_attendance || {},
    } as Record<string, unknown>;
  }, [locationFallback, org.address, org.name, profile]);

  const keyContacts: PsPersonCard[] = useMemo(() => {
    const rows = parseArray<Record<string, unknown>>(profile.ag_key_admin_cards_json).length
      ? parseArray<Record<string, unknown>>(profile.ag_key_admin_cards_json)
      : parseArray<Record<string, unknown>>(profile.ag_key_admin_cards);
    if (rows.length === 0) {
      return [
        {
          role: 'Officer in charge',
          image: asString(profile.ag_head_photo),
          name: asString(profile.in_charge_name) || EMPTY,
          contact: asString(profile.in_charge_contact) || EMPTY,
          email: asString(profile.in_charge_email) || EMPTY,
        },
      ];
    }
    return rows.map((r) => ({
      role: asString(r.role) || 'Key contact',
      image: asString(r.image),
      name: asString(r.name) || EMPTY,
      contact: asString(r.contact) || EMPTY,
      email: asString(r.email) || EMPTY,
    }));
  }, [profile]);

  const facilities = useMemo(() => buildFacilityCards(profile), [profile]);

  const experts: Faculty[] = useMemo(() => {
    const fromJson = parseArray<Record<string, unknown>>(profile.ag_expert_cards_json);
    const fromSaved = parseArray<Record<string, unknown>>(profile.ag_expert_cards);
    const rows =
      fromJson.length > 0
        ? fromJson
        : fromSaved.length > 0
          ? fromSaved
          : parseArray<Record<string, unknown>>(profile.ag_team_experts);
    return rows.map((r) => ({
      photo: asString(r.photo),
      name: asString(r.name),
      subject: asString(r.department) || asString(r.specialization),
      qualification: asString(r.qualification),
      designation: asString(r.designation),
    }));
  }, [profile]);

  const staffRows = useMemo(
    () =>
      parseArray<Record<string, unknown>>(profile.ag_staff_rows_json).length
        ? parseArray<Record<string, unknown>>(profile.ag_staff_rows_json)
        : parseArray<Record<string, unknown>>(profile.ag_staff_rows),
    [profile],
  );

  const highlights = useMemo(
    () => [
      ['Total staff', asString(profile.total_staff_count ?? profile.total_staff) || '0'],
      ['Villages covered', asString(profile.villages_gps_covered_count ?? profile.villages_covered) || '0'],
      [
        'Farmers served',
        asString(profile.farmers_served_last_year_approx ?? profile.farmers_served_last_year) || '0',
      ],
    ],
    [profile],
  );

  const galleryItems = useMemo(() => {
    const list = parseArray<GalleryItem>(profile.ag_photo_gallery_json).length
      ? parseArray<GalleryItem>(profile.ag_photo_gallery_json)
      : parseArray<GalleryItem>(profile.ag_photo_gallery);
    if (list.length > 0) return list;
    const galleryImages = parseArray<string>(profile.gallery_images);
    return galleryImages.map((url) => ({ image: url, title: '', description: '' }));
  }, [profile]);

  const contactProfile = useMemo(
    () => ({
      ...profile,
      contact_address_en:
        asString(profile.ag_full_address) || [asString(profile.block_ulb), asString(profile.gp_ward), asString(profile.village_locality)].filter(Boolean).join(', '),
      contact_phone: asString(profile.ag_helpdesk_phone) || asString(profile.office_phone),
      health_emergency_phone: asString(profile.ag_emergency_phone) || asString(profile.in_charge_contact),
      contact_email: asString(profile.ag_public_email) || asString(profile.office_email),
      office_hours_en: asString(profile.ag_office_hours),
    }),
    [profile],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={psProfile} language={lang} sliderImages={heroSlides} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={org}
          profile={psProfile}
          language={lang}
          sliderImages={heroSlides}
          hideVisionMission
          hideExtendedLeaderBio
          leaderLabels={{
            title: 'Institution Head',
            messageHeading: "Institution head's message",
          }}
        />

        <PsPersonCardsSection title="Key admin contacts" people={keyContacts} gridClassName="md:grid-cols-2 xl:grid-cols-4" />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilities}
          sectionTitle="Facilities"
          emptySlotCount={facilities.length ? undefined : 7}
        />

        <PsFacultySection
          faculty={experts}
          profile={psProfile}
          sectionTitle="Team"
          subjectLabel="Department / Specialization"
          showAttendance
        />

        <section className="py-2 md:py-4">
          <h2 className={SECTION_H2}>Staff Table</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Staff name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Role / Designation</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Department</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Email</th>
                </tr>
              </thead>
              <tbody>
                {(staffRows.length ? staffRows : [{} as Record<string, unknown>]).map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{displayText(row.staff_name)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.category)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.role_designation)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.department)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.contact_number)}</td>
                    <td className="px-4 py-3 text-slate-600">{displayText(row.email)}</td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
          <h2 className="text-xl font-bold sm:text-2xl">Key highlights</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <AgriculturePortfolioMonitoringSection
          profile={profile}
          dailyMetrics={dailyMetrics as AgricultureDailyMetricExtended[]}
        />

        <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
          <h2 className="text-xl font-bold sm:text-2xl">Monthly summary</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Month</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Trainings</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Farmers served</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Trials</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Soil cards</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(monthlyReports.length ? monthlyReports : [{} as AgricultureMonthlyReport]).map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.month && row.year ? `${String(row.month).padStart(2, '0')}/${row.year}` : EMPTY}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.total_trainings)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.total_farmers_served)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.total_trials)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.total_soil_cards)}</td>
                    <td className="px-4 py-3 text-slate-600">{displayText(row.remarks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
        </section>

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={contactProfile} language={lang} />
      </main>
    </div>
  );
}
