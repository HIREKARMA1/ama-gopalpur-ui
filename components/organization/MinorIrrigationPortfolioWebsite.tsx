'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Organization } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getMinorIrrigationProfileLabel } from '../../lib/profileLabels';
import { PsHeroSection, PsAboutSection, PsPersonCardsSection, PsFacilitiesCarouselSection, PsFacultySection, PsGallerySection, PsContactSection, parseArray, asString, displayText, EMPTY } from './EducationPsSections';
import type { FacilityCard, Faculty, GalleryItem, PsPersonCard, Lang } from './EducationPsSections';
import {
  Droplets,
  MapPin,
  Hash,
  Home,
  Tag,
  Wrench,
  FileText,
  Activity,
  Gauge,
  Database,
  Layers,
  ArrowLeftRight,
  Ruler,
  Settings,
  CalendarClock,
  Radar,
  Trees,
  IndianRupee,
  Users,
} from 'lucide-react';

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';

function tableShell(children: ReactNode) {
  return <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto">{children}</div></div>;
}

function formatVal(v: unknown): string {
  if (v == null || String(v).trim() === '') return EMPTY;
  return String(v);
}

function parseArrayJson<T>(raw: unknown): T[] {
  return parseArray<T>(raw);
}

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
  const lang = language as Lang;

  const heroSlides = useMemo(() => {
    const fromForm = [asString(profile.minor_hero_1), asString(profile.minor_hero_2), asString(profile.minor_hero_3)].filter(
      Boolean,
    );
    const gallerySlides = parseArrayJson<string>(profile.gallery_images).filter(Boolean);
    const fallback = [...gallerySlides, ...images].filter(Boolean).slice(0, 3);
    return (fromForm.length ? fromForm : fallback).slice(0, 3);
  }, [profile.minor_hero_1, profile.minor_hero_2, profile.minor_hero_3, profile.gallery_images, images]);

  const locationFallback = useMemo(() => {
    return [asString(profile.block_ulb), asString(profile.gp_ward), asString(profile.village_locality)].filter(Boolean).join(', ');
  }, [profile]);

  const psProfile = useMemo(() => {
    const tag =
      asString(profile.minor_hero_primary_tagline) ||
      asString(profile.minor_hero_tagline) ||
      asString(profile.category_type) ||
      (org.type ? org.type.replace(/_/g, ' ') : '');

    return {
      ...profile,
      school_name_en: asString(profile.minor_display_name) || asString(profile.name_of_m_i_p) || org.name || '',
      hero_primary_tagline_en: tag,
      about_short_en:
        asString(profile.minor_about_short) ||
        asString(profile.about_short) ||
        asString(profile.description) ||
        asString(profile.remarks) ||
        '',
      about_image: asString(profile.minor_campus_image),
      esst_year:
        asString(profile.minor_established_year) ||
        asString(profile.established_year) ||
        asString(profile.year_of_commissioning) ||
        '',
      school_type_en: asString(profile.minor_facility_type) || asString(profile.category_type) || 'Minor Irrigation Project',
      location_en: asString(profile.minor_location_line) || locationFallback || asString(profile.location) || '',

      headmaster_message_en: asString(profile.minor_inst_head_message),
      name_of_hm: asString(profile.minor_inst_head_name),
      headmaster_photo: asString(profile.minor_inst_head_photo),
      hm_qualification: asString(profile.minor_inst_head_qualification),
      hm_experience: asString(profile.minor_inst_head_experience),
      headmaster_contact: asString(profile.minor_inst_head_contact),
      headmaster_email: asString(profile.minor_inst_head_email),

      // Ps components expect these keys for contact + optional sections
      vision_text_en: '',
      mission_text_en: '',
      faculty_attendance: {},
      contact_address_en: asString(profile.minor_full_address) || org.address || locationFallback || EMPTY,
      contact_phone: asString(profile.minor_helpdesk_phone) || EMPTY,
      health_emergency_phone: asString(profile.minor_emergency_phone) || '',
      contact_email: asString(profile.minor_public_email) || asString(profile.minor_contact_email) || EMPTY,
      office_hours_en: asString(profile.minor_office_hours),
    } as Record<string, unknown>;
  }, [profile, org.name, org.type, org.address, locationFallback]);

  const KEY_ADMIN_FIXED_LABELS = ['Project in-charge', 'Engineer / Technical officer'] as const;
  const keyAdminPeople: PsPersonCard[] = useMemo(() => {
    const rows = parseArrayJson<Record<string, string>>(
      (profile.minor_key_admin_cards ?? profile.minor_key_admin_cards_json) as unknown,
    );
    const mapped: PsPersonCard[] = rows.map((r, i) => ({
      role: String(r.role || '').trim() || (i < KEY_ADMIN_FIXED_LABELS.length ? KEY_ADMIN_FIXED_LABELS[i] : 'Key contact'),
      image: asString(r.image),
      name: asString(r.name) || EMPTY,
      contact: asString(r.contact) || '—',
      email: asString(r.email) || '—',
    }));

    // If admin hasn't filled cards yet, show a visually consistent empty grid.
    if (mapped.length === 0) {
      return Array.from({ length: 4 }, (_, i) => ({
        role: i < KEY_ADMIN_FIXED_LABELS.length ? KEY_ADMIN_FIXED_LABELS[i] : 'Key contact',
        image: '',
        name: EMPTY,
        contact: '—',
        email: '—',
      }));
    }
    return mapped;
  }, [profile.minor_key_admin_cards, profile.minor_key_admin_cards_json]);

  const facilityCards: FacilityCard[] = useMemo(
    () => parseArrayJson<FacilityCard>((profile.minor_facility_cards ?? profile.minor_facility_cards_json) as unknown),
    [profile.minor_facility_cards, profile.minor_facility_cards_json],
  );
  const teamCards: Faculty[] = useMemo(
    () => parseArrayJson<Faculty>((profile.minor_faculty_cards ?? profile.minor_faculty_cards_json) as unknown),
    [profile.minor_faculty_cards, profile.minor_faculty_cards_json],
  );

  const galleryItems: GalleryItem[] = useMemo(() => {
    const raw = parseArrayJson<unknown>(profile.gallery_images);
    const normalized: GalleryItem[] = raw
      .map((it) => {
        if (typeof it === 'string') {
          const url = it.trim();
          if (!url) return null;
          return { image: url, category: '', title: '', description: '' };
        }
        if (it && typeof it === 'object') {
          const rec = it as Record<string, unknown>;
          const url = asString(rec.url ?? rec.image);
          if (!url) return null;
          return {
            image: url,
            category: asString(rec.category),
            title: asString(rec.title),
            description: asString(rec.description),
          };
        }
        return null;
      })
      .filter(Boolean) as GalleryItem[];
    return normalized;
  }, [profile.gallery_images]);

  const catchment = profile?.catchment_area_sq_km ?? profile?.catchment_area ?? null;
  const ayacut = profile?.total_ayacut_acres ?? profile?.total_ayacut ?? null;
  const storage = profile?.storage_capacity_mcum ?? profile?.storage_capacity ?? null;

  const highlightItems = useMemo(() => {
    const block = profile?.block_ulb ?? profile?.block ?? null;
    const gp = profile?.gp_ward ?? profile?.gp ?? null;
    const village = profile?.village_locality ?? profile?.village ?? null;
    const mipId = profile?.mip_id ?? null;
    const name = profile?.name_of_m_i_p ?? org.name;
    const type = profile?.category_type ?? profile?.category ?? profile?.type ?? profile?.categorytype ?? null;
    const managedBy = profile?.managed_by ?? null;
    const condition = profile?.condition ?? null;
    const functionality = profile?.functionality ?? null;
    const lastMaintenance = profile?.last_maintenance ?? null;

    return [
      { label: t('minor.field.department', lang), val: departmentName, icon: Tag, color: 'violet' },
      { label: getMinorIrrigationProfileLabel('block_ulb', lang), val: block, icon: MapPin, color: 'emerald' },
      { label: getMinorIrrigationProfileLabel('gp_ward', lang), val: gp, icon: Home, color: 'amber' },
      { label: getMinorIrrigationProfileLabel('village_locality', lang), val: village, icon: Home, color: 'sky' },
      { label: getMinorIrrigationProfileLabel('mip_id', lang), val: mipId, icon: Hash, color: 'slate' },
      { label: getMinorIrrigationProfileLabel('name_of_m_i_p', lang), val: name, icon: Droplets, color: 'blue' },
      { label: getMinorIrrigationProfileLabel('category_type', lang), val: type, icon: Tag, color: 'indigo' },
      { label: getMinorIrrigationProfileLabel('managed_by', lang), val: managedBy, icon: Wrench, color: 'teal' },
      { label: getMinorIrrigationProfileLabel('condition', lang), val: condition, icon: Activity, color: 'rose' },
      { label: getMinorIrrigationProfileLabel('functionality', lang), val: functionality, icon: Activity, color: 'pink' },
      { label: getMinorIrrigationProfileLabel('last_maintenance', lang), val: lastMaintenance, icon: FileText, color: 'slate' },
    ] as const;
  }, [profile, org.name, departmentName, lang]);

  const grouped = useMemo(() => {
    const entries = Object.entries(profile || {}).filter(([_, v]) => v != null && String(v).trim() !== '');
    const byKey = new Map(entries);

    const keys = (list: string[]) => list.filter((k) => byKey.has(k)).map((k) => [k, byKey.get(k)] as const);
    const consumed = new Set<string>();
    const take = (list: string[]) => {
      const out = keys(list);
      out.forEach(([k]) => consumed.add(k));
      return out;
    };

    const TECH_KEYS = [
      'category_type',
      'spillway_type',
      'spillway_width_ft',
      'no_of_sluices',
      'sluice_type',
      'storage_capacity_mcum',
      'mwl_ft',
      'frl_ft',
      'tbl_ft',
      'location_precision_meter',
      'catchment_area_sq_km',
      'command_area_kharif_acres',
      'command_area_rabi_acres',
      'total_ayacut_acres',
    ];
    const OPS_KEYS = [
      'condition',
      'functionality',
      'managed_by',
      'last_maintenance',
      'sensors_installed',
      'last_geotagged_date',
      'forest_clearance_y_n',
      'remarks',
    ];
    const FIN_KEYS = ['beneficiary_farmers_count', 'beneficiary_sc_st_count', 'sanctioned_amt_lakhs', 'expenditure_lakhs'];

    const OVERVIEW_KEYS = ['block_ulb', 'gp_ward', 'village_locality', 'mip_id', 'name_of_m_i_p', 'category_type'];

    const overview = take(OVERVIEW_KEYS);
    const technical = take(TECH_KEYS);
    const operations = take(OPS_KEYS);
    const finance = take(FIN_KEYS);

    return { overview, technical, operations, finance };
  }, [profile]);

  const renderGrid = (entries: readonly (readonly [string, unknown])[], emptyText: string) => {
    if (!entries || entries.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;

    const COLOR_MAP = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      violet: 'bg-violet-50 text-violet-600 border-violet-100',
      slate: 'bg-slate-100 text-slate-600 border-slate-200',
      teal: 'bg-teal-50 text-teal-600 border-teal-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
      pink: 'bg-pink-50 text-pink-600 border-pink-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      sky: 'bg-sky-50 text-sky-600 border-sky-100',
    } as const;

    const iconConfig: Record<string, { icon: any; color: keyof typeof COLOR_MAP }> = {
      storage_capacity_mcum: { icon: Database, color: 'indigo' },
      mwl_ft: { icon: Layers, color: 'blue' },
      frl_ft: { icon: Layers, color: 'violet' },
      tbl_ft: { icon: Layers, color: 'slate' },
      spillway_type: { icon: Settings, color: 'amber' },
      spillway_width_ft: { icon: Ruler, color: 'amber' },
      no_of_sluices: { icon: Hash, color: 'slate' },
      sluice_type: { icon: Settings, color: 'teal' },
      catchment_area_sq_km: { icon: Droplets, color: 'sky' },
      command_area_kharif_acres: { icon: ArrowLeftRight, color: 'emerald' },
      command_area_rabi_acres: { icon: ArrowLeftRight, color: 'green' },
      total_ayacut_acres: { icon: Gauge, color: 'emerald' },
      location_precision_meter: { icon: Radar, color: 'slate' },
      category_type: { icon: Tag, color: 'indigo' },

      // Operations
      condition: { icon: Activity, color: 'rose' },
      functionality: { icon: Activity, color: 'pink' },
      managed_by: { icon: Wrench, color: 'teal' },
      last_maintenance: { icon: CalendarClock, color: 'slate' },
      sensors_installed: { icon: Radar, color: 'indigo' },
      last_geotagged_date: { icon: CalendarClock, color: 'violet' },
      forest_clearance_y_n: { icon: Trees, color: 'emerald' },
      remarks: { icon: FileText, color: 'slate' },

      // Finance
      beneficiary_farmers_count: { icon: Users, color: 'emerald' },
      beneficiary_sc_st_count: { icon: Users, color: 'amber' },
      sanctioned_amt_lakhs: { icon: IndianRupee, color: 'indigo' },
      expenditure_lakhs: { icon: IndianRupee, color: 'rose' },
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {entries.map(([key, value]) => {
          const item = iconConfig[key] || { icon: FileText, color: 'slate' as const };
          const Icon = item.icon;
          const cls = COLOR_MAP[item.color] ?? COLOR_MAP.slate;

          return (
            <div key={key} className="flex gap-4 items-center">
              <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
                <div className={cls}>
                  <Icon size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                  {getMinorIrrigationProfileLabel(key, lang)}
                </p>
                <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(value)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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

        <PsPersonCardsSection title="Key admin contacts" people={keyAdminPeople} gridClassName="md:grid-cols-2 xl:grid-cols-4" />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilityCards}
          sectionTitle="Facilities"
          emptySlotCount={facilityCards.length ? undefined : 7}
        />

        <PsFacultySection
          faculty={teamCards}
          profile={psProfile}
          sectionTitle="Engineers & operations team"
          subjectLabel="Department / Specialization"
          showAttendance={false}
        />

        <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
          <h2 className="text-xl font-bold sm:text-2xl">Key highlights</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [t('minor.stat.catchment', lang), formatVal(catchment)],
              [t('minor.stat.ayacut', lang), formatVal(ayacut)],
              [t('minor.stat.storage', lang), formatVal(storage)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 p-5 shadow-md md:p-7">
          <h2 className={SECTION_H2}>Project details</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Technical, operations, and finance information in a cleaner sectioned layout.
          </p>

          <div className="mt-7 space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('minor.tab.technical', lang)}
              </h3>
              <div className="mt-4">{renderGrid(grouped.technical, 'No technical fields found.')}</div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('minor.tab.operations', lang)}
              </h3>
              <div className="mt-4">{renderGrid(grouped.operations, 'No operations fields found.')}</div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('minor.tab.finance', lang)}
              </h3>
              <div className="mt-4">{renderGrid(grouped.finance, 'No finance/beneficiary fields found.')}</div>
            </div>
          </div>
        </section>

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={psProfile} language={lang} />
      </main>
    </div>
  );
}

