'use client';

import { useMemo, type ReactNode } from 'react';
import type {
  Organization,
  HealthDailyAttendance,
  HealthDailyMedicineStock,
  HealthPatientService,
  HealthDailyExtraData,
} from '../../services/api';
import { HealthPortfolioMonitoringSection } from './HealthPortfolioMonitoring';
import {
  PsHeroSection,
  PsAboutSection,
  PsPersonCardsSection,
  PsFacilitiesCarouselSection,
  PsFacultySection,
  PsGallerySection,
  PsContactSection,
  parseArray,
  type GalleryItem,
  type Faculty,
  type FacilityCard,
  type Lang,
  type PsPersonCard,
  asString,
  displayText,
  EMPTY,
} from './EducationPsSections';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

export interface HealthPortfolioWebsiteProps {
  org: Organization;
  facilityMaster?: unknown;
  infra?: unknown;
  healthProfile: Record<string, unknown>;
  staff?: unknown;
  equipment?: unknown;
  immunisation?: unknown;
  medicines?: unknown;
  schemes?: unknown;
  monthly?: unknown;
  /** Daily monitoring rows (same APIs as dept admin health monitoring). */
  dailyAttendance?: HealthDailyAttendance[];
  dailyMedicineStock?: HealthDailyMedicineStock[];
  patientServices?: HealthPatientService[];
  dailyExtraData?: HealthDailyExtraData[];
  departmentName?: string | null;
  images?: string[];
}

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';

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

const parseNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function parseAttendanceMap(raw: unknown): Record<string, Record<string, boolean>> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      return p && typeof p === 'object' ? (p as Record<string, Record<string, boolean>>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, Record<string, boolean>>;
  return {};
}

const KEY_ADMIN_FIXED_LABELS = ['Matron / Nursing in-charge', 'Pharmacist in-charge'] as const;

/** Matches admin form: old 4-slot rows without `role` dropped MOIC/BPHO entries. */
function normalizeHealthKeyAdminRows(raw: Record<string, string>[]): Record<string, string>[] {
  const hasAnyRole = raw.some((r) => String(r.role || '').trim() !== '');
  if (raw.length >= 4 && !hasAnyRole) {
    return [raw[2] || {}, raw[3] || {}, ...raw.slice(4)];
  }
  if (raw.length === 0) return [{}, {}];
  if (raw.length === 1) return [raw[0] || {}, {}];
  return [...raw];
}

const STAFF_SUM_KEYS = [
  'no_of_ts',
  'no_of_nts',
  'no_of_mo',
  'no_of_pharmacist',
  'no_of_anm',
  'no_of_health_worker',
  'no_of_pathology',
  'no_of_clerk',
  'no_of_sweeper',
  'no_of_nw',
] as const;

export function HealthPortfolioWebsite({
  org,
  healthProfile,
  departmentName: _departmentName,
  dailyAttendance = [],
  dailyMedicineStock = [],
  patientServices = [],
  dailyExtraData = [],
}: HealthPortfolioWebsiteProps) {
  const { language } = useLanguage();
  const trStatic = (en: string, or: string) => (language === 'or' ? or : en);
  const lang = language as Lang;

  const heroSlides = useMemo(() => {
    return [healthProfile.health_hero_1, healthProfile.health_hero_2, healthProfile.health_hero_3]
      .map((x) => String(x || '').trim())
      .filter(Boolean);
  }, [healthProfile.health_hero_1, healthProfile.health_hero_2, healthProfile.health_hero_3]);

  const locationFallback = [
    asString(healthProfile.block_ulb),
    asString(healthProfile.gp_ward),
    asString(healthProfile.village),
  ]
    .filter(Boolean)
    .join(', ');

  const psProfile = useMemo((): Record<string, unknown> => {
    const tag =
      asString(healthProfile.health_hero_tagline) ||
      asString(healthProfile.health_tagline) ||
      asString(healthProfile.category) ||
      (org.type ? org.type.replace(/_/g, ' ') : '');
    const docAtt = parseAttendanceMap(healthProfile.health_doctor_attendance);
    return {
      ...healthProfile,
      school_name_en: asString(healthProfile.health_display_name) || org.name || '',
      hero_primary_tagline_en: tag,
      about_short_en: asString(healthProfile.health_about) || asString(healthProfile.description),
      about_image: asString(healthProfile.health_campus_image),
      esst_year: asString(healthProfile.health_established_year),
      school_type_en: asString(healthProfile.health_facility_type) || 'Health Care Center',
      location_en:
        asString(healthProfile.health_location_line) || locationFallback || asString(healthProfile.full_address) || '',
      headmaster_message_en: asString(healthProfile.health_inst_head_message),
      name_of_hm: asString(healthProfile.health_inst_head_name) || asString(healthProfile.inst_head_name),
      hm_designation: asString(healthProfile.health_inst_head_designation),
      headmaster_photo: asString(healthProfile.health_inst_head_photo),
      hm_qualification: asString(healthProfile.health_inst_head_qualification),
      hm_experience: asString(healthProfile.health_inst_head_experience),
      headmaster_contact:
        asString(healthProfile.health_inst_head_contact) || asString(healthProfile.inst_head_contact),
      headmaster_email: asString(healthProfile.health_inst_head_email),
      vision_text_en: '',
      mission_text_en: '',
      faculty_attendance: docAtt,
    };
  }, [healthProfile, org.name, org.type, locationFallback]);

  const keyAdminPeople: PsPersonCard[] = useMemo(() => {
    const rows = normalizeHealthKeyAdminRows(parseArray<Record<string, string>>(healthProfile.health_key_admin_cards));
    const cards: PsPersonCard[] = rows.map((r, i) => ({
      role:
        String(r.role || '').trim() ||
        (i < KEY_ADMIN_FIXED_LABELS.length ? KEY_ADMIN_FIXED_LABELS[i] : 'Key contact'),
      image: asString(r.image),
      name: asString(r.name) || EMPTY,
      contact: asString(r.contact) || '—',
      email: asString(r.email) || '—',
    }));
    return cards.filter((p) => {
      if (p.image) return true;
      if (p.name && p.name !== EMPTY) return true;
      if (p.contact && p.contact !== '—') return true;
      if (p.email && p.email !== '—') return true;
      return false;
    });
  }, [healthProfile.health_key_admin_cards]);

  const facilityCards: FacilityCard[] = useMemo(
    () => parseArray<FacilityCard>(healthProfile.health_health_facility_cards),
    [healthProfile.health_health_facility_cards],
  );

  const doctorFaculty: Faculty[] = useMemo(() => {
    const cards = parseArray<Record<string, string>>(healthProfile.health_doctor_cards);
    return cards.map((d) => ({
      photo: asString(d.photo),
      name: asString(d.name),
      subject: asString(d.department || d.specialization || d.department_specialization),
      qualification: asString(d.qualification),
      designation: asString(d.designation),
    }));
  }, [healthProfile.health_doctor_cards]);

  const tsNtsRows = useMemo(
    () => parseArray<Record<string, string>>(healthProfile.health_ts_nts_staff_rows),
    [healthProfile.health_ts_nts_staff_rows],
  );

  const galleryItems = parseArray<GalleryItem>(healthProfile.health_photo_gallery);

  const contactProfile = useMemo(
    () => ({
      ...healthProfile,
      contact_address_en: asString(healthProfile.health_full_address),
      contact_phone: asString(healthProfile.health_helpdesk_phone),
      health_emergency_phone: asString(healthProfile.health_emergency_phone),
      contact_email:
        asString(healthProfile.health_public_email) || asString(healthProfile.health_contact_email),
      office_hours_en: asString(healthProfile.health_office_hours),
    }),
    [healthProfile],
  );

  const doctorAttendanceEnabled = useMemo(
    () => Object.keys(parseAttendanceMap(healthProfile.health_doctor_attendance)).length > 0,
    [healthProfile.health_doctor_attendance],
  );

  const beds = healthProfile.no_of_bed;
  const icuBeds = healthProfile.no_of_icu;

  const totalStaffSum = useMemo(
    () => STAFF_SUM_KEYS.reduce((acc, k) => acc + parseNum(healthProfile[k]), 0),
    [healthProfile],
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
            title: lang === 'od' ? 'ପ୍ରତିଷ୍ଠାନ ମୁଖ୍ୟ' : 'Institution Head',
            messageHeading:
              lang === 'od' ? 'ପ୍ରତିଷ୍ଠାନ ମୁଖ୍ୟଙ୍କ ବାର୍ତ୍ତା' : "Institution head's message",
          }}
        />

        <PsPersonCardsSection
          title={trStatic('Key admin contacts', 'ମୁଖ୍ୟ ପ୍ରଶାସନିକ ଯୋଗାଯୋଗ')}
          people={keyAdminPeople}
          gridClassName="md:grid-cols-2 xl:grid-cols-4"
        />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilityCards}
          sectionTitle={trStatic('Facilities', 'ସୁବିଧା')}
          emptySlotCount={facilityCards.length ? undefined : 7}
        />

        <PsFacultySection
          faculty={doctorFaculty}
          profile={psProfile}
          sectionTitle={trStatic('Doctors', 'ଡାକ୍ତରମାନେ')}
          subjectLabel={trStatic('Department / Specialization', 'ବିଭାଗ / ବିଶେଷତା')}
          showAttendance={doctorAttendanceEnabled}
          emptyStateMessage={t('health.portfolio.noDoctorsAvailable', language)}
        />

        <section className="py-2 md:py-4">
          <h2 className={SECTION_H2}>{trStatic('TS & NTS staff', 'TS ଏବଂ NTS କର୍ମଚାରୀ')}</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Staff name', 'କର୍ମଚାରୀ ନାମ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Category', 'ଶ୍ରେଣୀ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Role / Designation', 'ଭୂମିକା / ପଦବୀ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Department', 'ବିଭାଗ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Contact', 'ଯୋଗାଯୋଗ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Email', 'ଇମେଲ୍')}</th>
                </tr>
              </thead>
              <tbody>
                {(tsNtsRows.length ? tsNtsRows : [{} as Record<string, string>]).map((row, idx) => (
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
          <h2 className="text-xl font-bold sm:text-2xl">{trStatic('Key highlights', 'ମୁଖ୍ୟ ହାଇଲାଇଟ୍')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t('health.stat.beds', language), formatVal(beds as string | number | null | undefined)],
              [t('health.portfolio.totalStaff', language), String(totalStaffSum)],
              [t('health.stat.icuBeds', language), formatVal(icuBeds as string | number | null | undefined)],
            ].map(([k, v]) => (
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

        <HealthPortfolioMonitoringSection
          dailyAttendance={dailyAttendance}
          dailyMedicineStock={dailyMedicineStock}
          patientServices={patientServices}
          dailyExtraData={dailyExtraData}
        />

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={contactProfile} language={lang} />
      </main>
    </div>
  );
}
