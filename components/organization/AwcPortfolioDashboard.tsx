'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Package, UserCheck, Users } from 'lucide-react';
import type { CenterProfile, Organization, SnpDailyStock } from '../../services/api';
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
import { t } from '../i18n/messages';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';
const EMPTY = '—';

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return EMPTY;
  return String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dateKey(v: unknown): string {
  if (typeof v === 'string') return v.slice(0, 10);
  if (!v) return '';
  try {
    return new Date(String(v)).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function pick(profile: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = asString(profile[k]);
    if (v) return v;
  }
  return '';
}

function pickLatestDate(values: string[]): string | null {
  if (!values.length) return null;
  return [...values].sort((a, b) => b.localeCompare(a))[0] || null;
}

function shortDateLabel(iso: string) {
  if (iso.length < 10) return iso;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function ChartEmpty() {
  const { language } = useLanguage();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/60 text-slate-500">
      <p className="text-sm font-medium">{t('health.portfolio.chartNoSeries', language)}</p>
    </div>
  );
}

export interface AwcPortfolioDashboardProps {
  org: Organization;
  awcProfile: CenterProfile | null;
  departmentName?: string | null;
  images?: string[];
  snpDailyStock?: SnpDailyStock[];
}

export function AwcPortfolioDashboard({
  org,
  awcProfile,
  departmentName: _departmentName,
  images = [],
  snpDailyStock = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const trStatic = (en: string, or: string) => (language === 'or' ? or : en);
  const lang = language as Lang;
  const profile = (awcProfile ?? {}) as Record<string, unknown>;

  const [monitorDate, setMonitorDate] = useState(() => new Date().toISOString().slice(0, 10));

  const heroSlides = useMemo(() => {
    const fromProfile = parseArray<unknown>(profile.hero_slides)
      .map((it) => {
        if (typeof it === 'string') return it.trim();
        if (it && typeof it === 'object') {
          const rec = it as Record<string, unknown>;
          return asString(rec.image || rec.url || rec.src);
        }
        return '';
      })
      .filter(Boolean);
    const legacyHero = [
      pick(profile, 'awc_hero_1', 'hero_image_1'),
      pick(profile, 'awc_hero_2', 'hero_image_2'),
      pick(profile, 'awc_hero_3', 'hero_image_3'),
    ].filter(Boolean);
    const merged = fromProfile.length ? fromProfile : legacyHero;
    return merged.length ? merged : images.filter(Boolean);
  }, [images, profile]);

  const locationFallback = [pick(profile, 'block_name'), pick(profile, 'gram_panchayat'), pick(profile, 'village_ward')]
    .filter(Boolean)
    .join(', ');

  const psProfile = useMemo((): Record<string, unknown> => {
    const tag =
      pick(profile, 'awc_tagline', 'hero_tagline', 'hero_primary_tagline_en') ||
      pick(profile, 'center_type') ||
      trStatic('Anganwadi Centre', 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର');
    return {
      ...profile,
      school_name_en: pick(profile, 'name_of_awc') || org.name || '',
      hero_primary_tagline_en: tag,
      about_short_en: pick(profile, 'about_awc', 'description'),
      about_image: pick(profile, 'awc_campus_image', 'campus_image', 'about_image') || heroSlides[0] || '',
      esst_year: pick(profile, 'establishment_year'),
      school_type_en: pick(profile, 'center_type') || trStatic('Anganwadi Centre', 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର'),
      location_en: pick(profile, 'full_address') || locationFallback || org.address || '',

      name_of_hm: pick(profile, 'worker_name', 'aww_full_name'),
      headmaster_photo: pick(profile, 'worker_photo', 'aww_photo'),
      hm_qualification: pick(profile, 'worker_qualification', 'aww_qualification'),
      hm_experience:
        pick(profile, 'worker_experience', 'aww_experience') ||
        (profile.worker_experience_years != null && String(profile.worker_experience_years).trim() !== ''
          ? `${profile.worker_experience_years} ${trStatic('years', 'ବର୍ଷ')}`
          : ''),
      headmaster_contact: pick(profile, 'aww_contact_no', 'contact_number'),
      headmaster_email: pick(profile, 'worker_email', 'aww_email', 'contact_email'),
      headmaster_message_en: pick(profile, 'aww_message', 'center_message'),

      contact_address_en: pick(profile, 'full_address') || org.address || '',
      contact_phone: pick(profile, 'contact_number'),
      health_emergency_phone: pick(profile, 'cpdo_contact_no', 'supervisor_contact_name'),
      contact_email: pick(profile, 'aww_email', 'contact_email'),
      office_hours_en: pick(profile, 'working_hours', 'office_hours', 'timings', 'office_hours_en'),
    };
  }, [heroSlides, locationFallback, org.address, org.name, profile]);

  const contactProfile = useMemo(
    () => ({
      ...psProfile,
      contact_address_en: asString(psProfile.contact_address_en),
      contact_phone: asString(psProfile.contact_phone),
      health_emergency_phone: asString(psProfile.health_emergency_phone),
      contact_email: asString(psProfile.contact_email),
      office_hours_en: asString(psProfile.office_hours_en),
    }),
    [psProfile],
  );

  const adminPeople: PsPersonCard[] = useMemo(() => {
    const cardsFromProfile = parseArray<Record<string, unknown>>(profile.admin_cards);
    if (cardsFromProfile.length) {
      return cardsFromProfile.map((p) => ({
        role: asString(p.role) || trStatic('Key contact', 'ମୁଖ୍ୟ ଯୋଗାଯୋଗ'),
        image: asString(p.image),
        name: asString(p.name) || EMPTY,
        contact: asString(p.contact) || EMPTY,
        email: asString(p.email) || EMPTY,
      }));
    }
    const rows = parseArray<Record<string, string>>(
      profile.awc_key_admin_cards as unknown,
    ).map((r) => ({
      role: asString(r.role) || trStatic('Key contact', 'ମୁଖ୍ୟ ଯୋଗାଯୋଗ'),
      image: asString(r.image),
      name: asString(r.name) || EMPTY,
      contact: asString(r.contact) || EMPTY,
      email: asString(r.email) || EMPTY,
    }));
    if (rows.length) return rows;
    return [
      {
        role: trStatic('CDPO', 'ସିଡିପିଓ'),
        image: pick(profile, 'cdpo_photo', 'cpdo_photo'),
        name: pick(profile, 'cdpo_name', 'cpdo_name') || EMPTY,
        contact: pick(profile, 'cpdo_contact_no') || EMPTY,
        email: pick(profile, 'cdpo_email', 'cpdo_email') || EMPTY,
      },
      {
        role: trStatic('Supervisor', 'ସୁପରଭାଇଜର'),
        image: pick(profile, 'supervisor_photo'),
        name: pick(profile, 'supervisor_name') || EMPTY,
        contact: pick(profile, 'supervisor_contact_name') || EMPTY,
        email: pick(profile, 'supervisor_email') || EMPTY,
      },
    ];
  }, [profile]);

  /** Health parity: carousel comes from `facility_cards`; empty list shows placeholder slots (see `emptySlotCount`). */
  const facilityCards: FacilityCard[] = useMemo(() => {
    const fromProfile = parseArray<FacilityCard>(profile.facility_cards);
    if (fromProfile.length) return fromProfile;
    const awcCards = parseArray<FacilityCard>(profile.awc_facility_cards as unknown);
    if (awcCards.length) return awcCards;
    return [];
  }, [profile]);

  const helperFaculty: Faculty[] = useMemo(() => {
    const rows = parseArray<Record<string, string>>(profile.awc_helper_cards as unknown);
    if (rows.length) {
      return rows.map((r) => ({
        photo: asString(r.photo),
        name: asString(r.name),
        subject: asString(r.role) || 'Anganwadi Helper',
        qualification: asString(r.qualification),
        designation: asString(r.designation),
      }));
    }
    const awhName = pick(profile, 'helper_name', 'awh_name');
    if (!awhName && !pick(profile, 'helper_photo', 'awh_photo')) return [];
    return [
      {
        photo: pick(profile, 'helper_photo', 'awh_photo'),
        name: awhName,
        subject: 'Anganwadi Helper (AWH)',
        qualification: pick(profile, 'helper_qualification', 'awh_qualification'),
        designation: pick(profile, 'awh_contact_no'),
      },
    ];
  }, [profile]);

  const serviceRows = useMemo(() => {
    const rows = parseArray<Record<string, string>>(profile.awc_service_cards as unknown);
    if (rows.length) return rows;
    return [
      {
        service_title: trStatic('Supplementary Nutrition', 'ଅନୁପୂରକ ପୋଷଣ'),
        description: trStatic('Nutrition support to beneficiaries.', 'ଲାଭାର୍ଥୀଙ୍କ ପାଇଁ ପୋଷଣ ସହାୟତା।'),
        schedule: trStatic('Daily', 'ଦୈନିକ'),
      },
      {
        service_title: trStatic('Take Home Ration (THR)', 'ଘରକୁ ନେବା ରାସନ (THR)'),
        description: trStatic('Ration for eligible groups.', 'ଯୋଗ୍ୟ ଗୋଷ୍ଠୀ ପାଇଁ ରାସନ।'),
        schedule: trStatic('Weekly', 'ସାପ୍ତାହିକ'),
      },
      {
        service_title: trStatic('Immunization Day', 'ଟୀକାକରଣ ଦିବସ'),
        description: trStatic('Vaccination session support.', 'ଟୀକାକରଣ ସେସନ ସହାୟତା।'),
        schedule: trStatic('Monthly', 'ମାସିକ'),
      },
      {
        service_title: 'VHSND',
        description: trStatic('Village health and nutrition day.', 'ଗ୍ରାମ ସ୍ୱାସ୍ଥ୍ୟ ଓ ପୋଷଣ ଦିବସ।'),
        schedule: trStatic('Monthly', 'ମାସିକ'),
      },
    ];
  }, [profile]);

  const galleryItems: GalleryItem[] = useMemo(() => {
    const fromProfile = parseArray<GalleryItem>(profile.photo_gallery);
    if (fromProfile.length) return fromProfile;
    const awcGal = parseArray<GalleryItem>(profile.awc_gallery_items as unknown);
    if (awcGal.length) return awcGal;
    return heroSlides.map((img, i) => ({ image: img, title: `Gallery ${i + 1}`, category: 'Activity' }));
  }, [heroSlides, profile]);

  const beneficiaryStats = [
    [t('awc.portfolio.beneficiary03', language), formatVal(profile.total_children_0_3 as number | null | undefined)],
    [t('awc.portfolio.beneficiary36', language), formatVal(profile.total_children_3_6 as number | null | undefined)],
    [t('awc.portfolio.beneficiaryPregnant', language), formatVal(profile.pregnant_women as number | null | undefined)],
    [t('awc.portfolio.beneficiaryLactating', language), formatVal(profile.lactating_mothers as number | null | undefined)],
    [
      t('awc.portfolio.beneficiaryTotal', language),
      formatVal(
        (profile.total_active_beneficiaries ?? profile.student_strength) as number | null | undefined,
      ),
    ],
  ] as const;

  const chartData = useMemo(
    () =>
      snpDailyStock
        .map((r) => {
          const d = dateKey(r.record_date);
          const opening = num(r.opening_balance_kg);
          const received = num(r.received_kg);
          const expenditure = num(r.exp_kg);
          return {
            d,
            dateLabel: shortDateLabel(d),
            opening,
            received,
            expenditure,
            closing: opening + received - expenditure,
          };
        })
        .sort((a, b) => a.d.localeCompare(b.d))
        .slice(-15),
    [snpDailyStock],
  );

  const snpDates = useMemo(() => snpDailyStock.map((r) => dateKey(r.record_date)).filter(Boolean), [snpDailyStock]);

  useEffect(() => {
    if (!snpDates.length) return;
    if (!snpDates.includes(monitorDate)) {
      const latest = pickLatestDate(snpDates);
      if (latest) setMonitorDate(latest);
    }
  }, [snpDates, monitorDate]);

  const daySnpRows = useMemo(
    () => snpDailyStock.filter((r) => dateKey(r.record_date) === monitorDate),
    [snpDailyStock, monitorDate],
  );

  const centreTypeLabel = pick(profile, 'center_type');
  const awwContactLabel = pick(profile, 'aww_contact_no', 'contact_number');

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
            title: t('awc.portfolio.awwWorkerTitle', language),
            messageHeading: t('awc.portfolio.awwMessageHeading', language),
          }}
        />

        <PsPersonCardsSection
          title={trStatic('Key admin contacts', 'ମୁଖ୍ୟ ପ୍ରଶାସନିକ ଯୋଗାଯୋଗ')}
          people={adminPeople}
          gridClassName="md:grid-cols-2 xl:grid-cols-4"
        />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilityCards}
          sectionTitle={trStatic('Facilities', 'ସୁବିଧା')}
          emptySlotCount={facilityCards.length ? undefined : 7}
        />

        <PsFacultySection
          faculty={helperFaculty}
          profile={psProfile}
          sectionTitle={trStatic('Anganwadi Helper (AWH)', 'ଆଙ୍ଗନୱାଡି ସହାୟିକା (AWH)')}
          subjectLabel={trStatic('Role', 'ଭୂମିକା')}
          showAttendance={false}
        />

        <section className="py-2 md:py-4">
          <h2 className={SECTION_H2}>{t('awc.portfolio.servicesTableTitle', language)}</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Service', 'ସେବା')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Description', 'ବିବରଣୀ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Schedule', 'ସମୟସୂଚୀ')}</th>
                </tr>
              </thead>
              <tbody>
                {(serviceRows.length ? serviceRows : [{} as Record<string, string>]).map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {displayText(row.service_title || row.title)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.description)}</td>
                    <td className="px-4 py-3 text-slate-700">{displayText(row.schedule || row.frequency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
          <h2 className="text-xl font-bold sm:text-2xl">{t('awc.portfolio.keyHighlightsTitle', language)}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beneficiaryStats.map(([k, v]) => (
              <div
                key={String(k)}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 p-5 shadow-md md:p-7">
          <h2 className={SECTION_H2}>{t('awc.portfolio.snpMonitoringTitle', language)}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{t('awc.portfolio.snpDailyStockDesc', language)}</p>

          <div className="mt-8 space-y-10">
            <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                  {t('portfolio.selectMonitoringDate', language)}
                </label>
                <input
                  type="date"
                  value={monitorDate}
                  onChange={(e) => setMonitorDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-2 ${
                    centreTypeLabel
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <Users size={18} className={centreTypeLabel ? 'text-emerald-500' : 'text-slate-400'} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">
                      {t('awc.portfolio.chipCentreType', language)}
                    </p>
                    <p className="text-xs font-bold leading-tight">
                      {centreTypeLabel || t('awc.portfolio.notSpecified', language)}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-2 ${
                    awwContactLabel
                      ? 'border-blue-100 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <UserCheck size={18} className={awwContactLabel ? 'text-blue-500' : 'text-slate-400'} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">
                      {t('awc.portfolio.chipAwwContact', language)}
                    </p>
                    <p className="text-xs font-bold leading-tight">
                      {awwContactLabel || t('awc.portfolio.notSpecified', language)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">{t('awc.portfolio.chartOpeningClosing', language)}</h3>
                  <p className="text-[11px] text-[#64748b]">{t('awc.portfolio.chartOpeningClosingHint', language)}</p>
                </div>
                <div className="min-h-0 flex-1">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
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
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="opening"
                          name={t('awc.portfolio.chart.opening', language)}
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="closing"
                          name={t('awc.portfolio.chart.closing', language)}
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmpty />
                  )}
                </div>
              </div>

              <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">{t('awc.portfolio.chart.receivedVsExp', language)}</h3>
                  <p className="text-[11px] text-[#64748b]">{t('awc.portfolio.chartReceivedExpHint', language)}</p>
                </div>
                <div className="min-h-0 flex-1">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
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
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                          }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar
                          dataKey="received"
                          name={t('awc.portfolio.chart.received', language)}
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                        <Bar
                          dataKey="expenditure"
                          name={t('awc.portfolio.chart.expenditure', language)}
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmpty />
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
              <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 p-5">
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">{t('awc.portfolio.snpDaySnapshotTitle', language)}</h3>
                  <p className="text-[11px] text-[#64748b]">
                    {t('awc.portfolio.snpDaySnapshotHint', language).replace('{date}', monitorDate)}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Package size={20} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {t('awc.snp.date', language)}
                      </th>
                      <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {t('awc.snp.openingBalance', language)}
                      </th>
                      <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {t('awc.snp.received', language)}
                      </th>
                      <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {t('awc.portfolio.chart.expenditure', language)}
                      </th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {t('awc.snp.closingBalance', language)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daySnpRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="bg-white/20 px-6 py-10 text-center italic text-slate-400">
                          {t('awc.portfolio.noSnpRowsForDate', language)}
                        </td>
                      </tr>
                    ) : (
                      daySnpRows.map((row, idx) => {
                        const opening = num(row.opening_balance_kg);
                        const received = num(row.received_kg);
                        const exp = num(row.exp_kg);
                        const closing = opening + received - exp;
                        return (
                          <tr key={`${dateKey(row.record_date)}-${idx}`} className="transition hover:bg-white/40">
                            <td className="px-6 py-4 font-bold text-[#334155]">{dateKey(row.record_date)}</td>
                            <td className="px-6 py-4 text-center font-semibold text-slate-600">{opening}</td>
                            <td className="px-6 py-4 text-center font-semibold text-emerald-600">+{received}</td>
                            <td className="px-6 py-4 text-center font-semibold text-rose-500">-{exp}</td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  closing < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {closing}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={contactProfile} language={lang} />
      </main>
    </div>
  );
}
