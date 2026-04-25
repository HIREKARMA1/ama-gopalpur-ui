'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { Organization } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getMinorIrrigationProfileLabel } from '../../lib/profileLabels';
import {
  PsHeroSection,
  PsAboutSection,
  PsPersonCardsSection,
  PsFacilitiesCarouselSection,
  PsFacultySection,
  PsGallerySection,
  PsContactSection,
  parseArray,
  asString,
  displayText,
  EMPTY,
  type FacilityCard,
  type Faculty,
  type GalleryItem,
  type Lang,
  type PsPersonCard,
} from './EducationPsSections';

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v == null || String(v).trim() === '') return EMPTY;
  return String(v);
}

function parseArrayJson<T>(raw: unknown): T[] {
  return parseArray<T>(raw);
}

const snakeFromHeader = (label: string): string =>
  label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');

const KEY_CATCHMENT = snakeFromHeader('CATCHMENT AREA (IN SQ KM.)');
const KEY_AYACUT = snakeFromHeader('COMMAND AREA / AYACUT (HA.)');
const KEY_STORAGE = snakeFromHeader('STORAGE CAPACITY (HAM.)');
const KEY_WATER_SPREAD = snakeFromHeader('WATER SPREAD AREA (HA.)');
const KEY_CANAL_LEN = snakeFromHeader('CANAL/ DISTRIBUTORY LENGTH (KM)');
const KEY_DESIGN_DISCHARGE = snakeFromHeader('DESIGN DISCHARGE (CUSECS)');
const KEY_INFLOW_SOURCE = snakeFromHeader('INFLOW SOURCE (RIVER/RAIN/STREAM/ CANAL)');
const KEY_YEAR_COMMISSIONING = snakeFromHeader('YEAR OF COMMISSIONING');
const KEY_PHYSICAL_CONDITION = snakeFromHeader('CURRENT PHYSICAL CONDITION (GOOD/REPAIR NEEDED/CRITICAL)');
const KEY_FUNCTIONALITY = snakeFromHeader('FUNCTIONALITY STATUS (FUNCTIONAL/PARTIAL/NON-FUNCTIONAL)');
const KEY_MANAGED_BY = snakeFromHeader('MANAGED BY (PANI PANCHAYAT/DEPT/WUA)');
const KEY_LAST_MAINTENANCE = snakeFromHeader('LAST MAINTENANCE/DESILTING YEAR');
const KEY_WATER_AVAILABILITY = snakeFromHeader('WATER AVAILABILITY (MONTHS/YEAR)');
const KEY_FUNDING_SCHEME = snakeFromHeader('FUNDING SCHEME (MGNREGS/STATE/CENTRAL)');
const KEY_REMARKS = snakeFromHeader('REMARKS/HISTORICAL BACKGROUND');

export interface MinorIrrigationPortfolioWebsiteProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function MinorIrrigationPortfolioWebsite({
  org,
  profile,
  departmentName,
  images = [],
}: MinorIrrigationPortfolioWebsiteProps) {
  const { language } = useLanguage();
  const tr = (en: string, or: string) => (language === 'or' ? or : en);
  const lang = language as Lang;
  const [detailTab, setDetailTab] = useState<'overview' | 'technical' | 'operations' | 'finance'>('overview');

  const heroSlides = useMemo(() => {
    const fromForm = [asString(profile.minor_hero_1), asString(profile.minor_hero_2), asString(profile.minor_hero_3)].filter(
      Boolean,
    );
    const gallerySlides = parseArrayJson<string>(profile.gallery_images).filter(Boolean);
    const fallback = [...gallerySlides, ...images].filter(Boolean).slice(0, 3);
    return (fromForm.length ? fromForm : fallback).slice(0, 3);
  }, [profile.minor_hero_1, profile.minor_hero_2, profile.minor_hero_3, profile.gallery_images, images]);

  const locationFallback = useMemo(
    () => [asString(profile.block_ulb), asString(profile.gp_ward), asString(profile.village_locality)].filter(Boolean).join(', '),
    [profile.block_ulb, profile.gp_ward, profile.village_locality],
  );

  const psProfile = useMemo((): Record<string, unknown> => {
    const tag =
      asString(profile.minor_hero_primary_tagline) ||
      asString(profile.minor_hero_tagline) ||
      asString(profile.category_type) ||
      asString(profile.category) ||
      (org.type ? org.type.replace(/_/g, ' ') : '');

    return {
      ...profile,
      school_name_en: asString(profile.minor_display_name) || asString(profile.name_of_m_i_p) || asString(profile.work_name) || org.name || '',
      hero_primary_tagline_en: tag,
      about_short_en: asString(profile.minor_about_short) || asString(profile.description) || asString(profile.remarks) || '',
      about_image: asString(profile.minor_campus_image),
      esst_year: asString(profile.minor_established_year) || asString(profile.established_year) || asString(profile.year_of_commissioning) || '',
      school_type_en:
        asString(profile.minor_facility_type) ||
        asString(profile.category_type) ||
        asString(profile.category) ||
        tr('Irrigation Project', 'ସେଚନ ପ୍ରକଳ୍ପ'),
      location_en: asString(profile.minor_location_line) || locationFallback || asString(profile.location) || '',
      headmaster_message_en: asString(profile.minor_inst_head_message),
      name_of_hm: asString(profile.minor_inst_head_name),
      headmaster_photo: asString(profile.minor_inst_head_photo),
      hm_qualification: asString(profile.minor_inst_head_qualification),
      hm_experience: asString(profile.minor_inst_head_experience),
      headmaster_contact: asString(profile.minor_inst_head_contact),
      headmaster_email: asString(profile.minor_inst_head_email),
      vision_text_en: '',
      mission_text_en: '',
      faculty_attendance: {},
      contact_address_en: asString(profile.minor_full_address) || org.address || locationFallback || EMPTY,
      contact_phone: asString(profile.minor_helpdesk_phone) || EMPTY,
      health_emergency_phone: asString(profile.minor_emergency_phone) || '',
      contact_email: asString(profile.minor_public_email) || asString(profile.minor_contact_email) || EMPTY,
      office_hours_en: asString(profile.minor_office_hours),
    };
  }, [profile, org.name, org.type, org.address, locationFallback]);

  const keyAdminPeople: PsPersonCard[] = useMemo(() => {
    const rows = parseArrayJson<Record<string, string>>((profile.minor_key_admin_cards ?? profile.minor_key_admin_cards_json) as unknown);
    const defaults = [tr('Project in-charge', 'ପ୍ରକଳ୍ପ ଇଂଚାର୍ଜ'), tr('Engineer / Technical officer', 'ଇଞ୍ଜିନିୟର / ପ୍ରାୟୋଗିକ ଅଧିକାରୀ')] as const;
    const cards = rows.map((r, i) => ({
      role: String(r.role || '').trim() || (i < defaults.length ? defaults[i] : tr('Key contact', 'ମୁଖ୍ୟ ଯୋଗାଯୋଗ')),
      image: asString(r.image),
      name: asString(r.name) || EMPTY,
      contact: asString(r.contact) || '—',
      email: asString(r.email) || '—',
    }));
    if (cards.length === 0) return [{ role: defaults[0], image: '', name: EMPTY, contact: '—', email: '—' }, { role: defaults[1], image: '', name: EMPTY, contact: '—', email: '—' }];
    return cards;
  }, [profile.minor_key_admin_cards, profile.minor_key_admin_cards_json]);

  const facilityCards: FacilityCard[] = useMemo(
    () => parseArrayJson<FacilityCard>((profile.minor_facility_cards ?? profile.minor_facility_cards_json) as unknown),
    [profile.minor_facility_cards, profile.minor_facility_cards_json],
  );
  const teamCards: Faculty[] = useMemo(
    () => parseArrayJson<Faculty>((profile.minor_faculty_cards ?? profile.minor_faculty_cards_json) as unknown),
    [profile.minor_faculty_cards, profile.minor_faculty_cards_json],
  );
  const staffRows = useMemo(
    () => parseArrayJson<Record<string, string>>((profile.minor_staff_rows ?? profile.minor_staff_rows_json) as unknown),
    [profile.minor_staff_rows, profile.minor_staff_rows_json],
  );

  const galleryItems: GalleryItem[] = useMemo(() => {
    const raw = parseArrayJson<unknown>(profile.gallery_images);
    return raw
      .map((it) => {
        if (typeof it === 'string') {
          const image = it.trim();
          return image ? { image, category: '', title: '', description: '' } : null;
        }
        if (!it || typeof it !== 'object') return null;
        const rec = it as Record<string, unknown>;
        const image = asString(rec.url ?? rec.image);
        return image
          ? { image, category: asString(rec.category), title: asString(rec.title), description: asString(rec.description) }
          : null;
      })
      .filter(Boolean) as GalleryItem[];
  }, [profile.gallery_images]);

  const rec = profile as Record<string, unknown>;
  const catchment = rec.catchment_area_sq_km ?? rec.catchment_area ?? rec['catchment_area_in_sq_km.'];
  const ayacut = rec.total_ayacut_acres ?? rec.total_ayacut ?? rec['command_area_ayacut_ha.'];
  const storage = rec.storage_capacity_mcum ?? rec.storage_capacity ?? rec['storage_capacity_ham.'];
  const getFirst = (...keys: string[]) => {
    for (const key of keys) {
      const val = rec[key];
      if (val != null && String(val).trim() !== '') return val;
    }
    return null;
  };
  const detailData = useMemo(
    () => ({
      overview: [
        ['type_of_irrigation_flowliftsolar', getFirst('type_of_irrigation_flowliftsolar', 'type_of_irrigation')],
        ['managed_by', getFirst('managed_by', KEY_MANAGED_BY)],
        ['current_physical_condition', getFirst('condition', 'current_physical_condition', KEY_PHYSICAL_CONDITION)],
        ['functionality_status', getFirst('functionality', 'functionality_status', KEY_FUNCTIONALITY)],
        ['year_of_commissioning', getFirst('year_of_commissioning', KEY_YEAR_COMMISSIONING)],
      ] as const,
      technical: [
        ['water_spread_area_ha', getFirst('water_spread_area_ha', KEY_WATER_SPREAD)],
        ['canal_distributory_length_km', getFirst('canal_distributory_length_km', KEY_CANAL_LEN)],
        ['design_discharge_cusecs', getFirst('design_discharge_cusecs', KEY_DESIGN_DISCHARGE)],
        ['inflow_source', getFirst('inflow_source', KEY_INFLOW_SOURCE)],
      ] as const,
      operations: [
        ['last_maintenance', getFirst('last_maintenance', KEY_LAST_MAINTENANCE)],
        ['water_availability_months_year', getFirst('water_availability_months_year', KEY_WATER_AVAILABILITY)],
      ] as const,
      finance: [
        ['beneficiary_farmers_count', getFirst('beneficiary_farmers_count')],
        ['beneficiary_households', getFirst('beneficiary_households', 'beneficiary_sc_st_count')],
        ['funding_scheme', getFirst('funding_scheme', KEY_FUNDING_SCHEME)],
        ['remarks', getFirst('remarks', KEY_REMARKS)],
      ] as const,
    }),
    [rec],
  );
  const activeRows = detailData[detailTab].filter(([, v]) => v != null && String(v).trim() !== '');

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
            title: lang === 'od' ? 'ପ୍ରକଳ୍ପ ମୁଖ୍ୟ' : 'Project In-charge',
            messageHeading: lang === 'od' ? 'ପ୍ରକଳ୍ପ ମୁଖ୍ୟଙ୍କ ବାର୍ତ୍ତା' : "Project in-charge's message",
          }}
        />

        <PsPersonCardsSection
          title={tr('Key admin contacts', 'ମୁଖ୍ୟ ପ୍ରଶାସନିକ ଯୋଗାଯୋଗ')}
          people={keyAdminPeople}
          gridClassName="md:grid-cols-2 xl:grid-cols-4"
        />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilityCards}
          sectionTitle={tr('Facilities', 'ସୁବିଧା')}
          emptySlotCount={facilityCards.length ? undefined : 7}
        />

        <PsFacultySection
          faculty={teamCards}
          profile={psProfile}
          sectionTitle={tr('Engineers & operations team', 'ଇଞ୍ଜିନିୟର ଓ ପରିଚାଳନା ଟିମ୍')}
          subjectLabel={tr('Department / Specialization', 'ବିଭାଗ / ବିଶେଷତା')}
          showAttendance={false}
        />

        <section className="py-2 md:py-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{tr('TS & NTS staff', 'TS ଏବଂ NTS କର୍ମଚାରୀ')}</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Staff name', 'କର୍ମଚାରୀ ନାମ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Category', 'ଶ୍ରେଣୀ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Role / Designation', 'ଭୂମିକା / ପଦବୀ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Department', 'ବିଭାଗ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Contact', 'ଯୋଗାଯୋଗ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">{tr('Email', 'ଇମେଲ୍')}</th>
                </tr>
              </thead>
              <tbody>
                {(staffRows.length ? staffRows : [{} as Record<string, string>]).map((row, idx) => (
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
          <h2 className="text-xl font-bold sm:text-2xl">{tr('Key highlights', 'ମୁଖ୍ୟ ହାଇଲାଇଟ୍')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t('minor.stat.catchment', language), formatVal(catchment)],
              [t('minor.stat.ayacut', language), formatVal(ayacut)],
              [t('minor.stat.storage', language), formatVal(storage)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">{tr('Project details', 'ପ୍ରକଳ୍ପ ବିବରଣୀ')}</h2>
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              {(['overview', 'technical', 'operations', 'finance'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDetailTab(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    detailTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t(`minor.tab.${tab}`, language)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(activeRows.length ? activeRows : [['empty', EMPTY] as const]).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {k === 'empty' ? '—' : getMinorIrrigationProfileLabel(k, language)}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">{formatVal(v)}</p>
              </div>
            ))}
          </div>
        </section>

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={psProfile} language={lang} />
      </main>
    </div>
  );
}

