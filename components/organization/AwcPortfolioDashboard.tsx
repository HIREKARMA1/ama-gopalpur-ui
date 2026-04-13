'use client';

import { useMemo, type ReactNode } from 'react';
import type { CenterProfile, Organization, SnpDailyStock } from '../../services/api';
import {
  PsAboutSection,
  PsContactSection,
  PsFacilitiesCarouselSection,
  PsGallerySection,
  PsHeroSection,
  PsPersonCardsSection,
  asString,
  displayText,
  parseArray,
  type FacilityCard,
  type GalleryItem,
  type Lang,
  type PsPersonCard,
} from './EducationPsSections';
import { useLanguage } from '../i18n/LanguageContext';

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
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
  images = [],
  snpDailyStock = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const lang = language as Lang;
  const profile = (awcProfile ?? {}) as Record<string, unknown>;

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
    return fromProfile.length ? fromProfile : images;
  }, [images, profile.hero_slides]);

  const psProfile = useMemo((): Record<string, unknown> => {
    const block = asString(profile.block_name);
    const gp = asString(profile.gram_panchayat);
    const village = asString(profile.village_ward);
    const locationFallback = [block, gp, village].filter(Boolean).join(', ');

    return {
      ...profile,
      school_name_en: org.name || '',
      hero_primary_tagline_en: asString(profile.center_type) || 'Anganwadi Centre',
      about_short_en: asString(profile.description),
      about_image: asString(profile.about_image) || heroSlides[0] || '',
      esst_year: asString(profile.establishment_year),
      school_type_en: asString(profile.center_type) || 'AWC',
      location_en: locationFallback || asString(profile.full_address) || '',
      headmaster_message_en: asString(profile.center_message),
      name_of_hm: asString(profile.worker_name),
      headmaster_photo: asString(profile.worker_photo),
      hm_qualification: asString(profile.worker_qualification),
      hm_experience: asString(profile.worker_experience),
      headmaster_contact: asString(profile.contact_number),
      headmaster_email: asString(profile.contact_email),
      contact_address_en: asString(profile.full_address),
      contact_phone: asString(profile.contact_number),
      contact_email: asString(profile.contact_email),
      office_hours_en: asString(profile.office_hours),
    };
  }, [heroSlides, org.name, profile]);

  const adminPeople: PsPersonCard[] = useMemo(() => {
    const cardsFromProfile = parseArray<Record<string, unknown>>(profile.admin_cards);
    if (cardsFromProfile.length) {
      return cardsFromProfile.map((p) => ({
        role: asString(p.role) || 'Key contact',
        image: asString(p.image),
        name: asString(p.name) || '—',
        contact: asString(p.contact) || '—',
        email: asString(p.email) || '—',
      }));
    }

    return [
      {
        role: 'CPDO',
        image: asString(profile.cpdo_photo),
        name: asString(profile.cpdo_name) || '—',
        contact: asString(profile.cpdo_contact_no) || '—',
        email: asString(profile.cpdo_email) || '—',
      },
      {
        role: 'Supervisor',
        image: asString(profile.supervisor_photo),
        name: asString(profile.supervisor_name) || '—',
        contact: asString(profile.supervisor_contact_name) || '—',
        email: asString(profile.supervisor_email) || '—',
      },
      {
        role: 'AWW',
        image: asString(profile.worker_photo),
        name: asString(profile.worker_name) || '—',
        contact: asString(profile.aww_contact_no) || asString(profile.contact_number) || '—',
        email: asString(profile.worker_email) || '—',
      },
      {
        role: 'AWH',
        image: asString(profile.helper_photo),
        name: asString(profile.helper_name) || '—',
        contact: asString(profile.awh_contact_no) || '—',
        email: asString(profile.helper_email) || '—',
      },
    ];
  }, [profile]);

  const facilityCards: FacilityCard[] = useMemo(() => {
    const fromProfile = parseArray<FacilityCard>(profile.facility_cards);
    if (fromProfile.length) return fromProfile;

    return [
      { title: 'Building type', description: formatVal(profile.building_type as string | null | undefined) },
      { title: 'Scheme', description: formatVal(profile.scheme as string | null | undefined) },
      { title: 'Sector', description: formatVal(profile.sector as string | null | undefined) },
      { title: 'District', description: formatVal(profile.district as string | null | undefined) },
      { title: 'Block', description: formatVal(profile.block_name as string | null | undefined) },
      { title: 'Village / Ward', description: formatVal(profile.village_ward as string | null | undefined) },
    ];
  }, [profile]);

  const galleryItems: GalleryItem[] = useMemo(() => {
    const fromProfile = parseArray<GalleryItem>(profile.photo_gallery);
    if (fromProfile.length) return fromProfile;
    return images.map((img, i) => ({ image: img, title: `Gallery ${i + 1}` }));
  }, [images, profile.photo_gallery]);

  const stockRows = useMemo(
    () =>
      [...snpDailyStock].sort(
        (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime(),
      ),
    [snpDailyStock],
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
          hideExtendedLeaderBio
          hideVisionMission
          leaderLabels={{
            title: 'AWW',
            messageHeading: "Worker's message",
          }}
        />

        <PsPersonCardsSection
          title="Key admin contacts"
          people={adminPeople}
          gridClassName="md:grid-cols-2 xl:grid-cols-4"
        />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={facilityCards}
          sectionTitle="Facilities"
          emptySlotCount={facilityCards.length ? undefined : 6}
        />

        <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
          <h2 className="text-xl font-bold sm:text-2xl">Key highlights</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Children 0-3', formatVal(profile.total_children_0_3 as number | null | undefined)],
              ['Children 3-6', formatVal(profile.total_children_3_6 as number | null | undefined)],
              ['Pregnant women', formatVal(profile.pregnant_women as number | null | undefined)],
              ['Lactating mothers', formatVal(profile.lactating_mothers as number | null | undefined)],
              [
                'Total active beneficiaries',
                formatVal(profile.total_active_beneficiaries as number | null | undefined),
              ],
              ['Student strength', formatVal(profile.student_strength as number | null | undefined)],
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

        <section className="py-2 md:py-4">
          <h2 className={SECTION_H2}>SNP daily stock</h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Opening (kg)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Received (kg)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">Expenditure (kg)</th>
                </tr>
              </thead>
              <tbody>
                {(stockRows.length ? stockRows : [{ id: 0 } as SnpDailyStock]).map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {displayText((row as SnpDailyStock).record_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatVal((row as SnpDailyStock).opening_balance_kg)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatVal((row as SnpDailyStock).received_kg)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatVal((row as SnpDailyStock).exp_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
        </section>

        <PsGallerySection gallery={galleryItems} />
        <PsContactSection org={org} profile={psProfile} language={lang} />
      </main>
    </div>
  );
}
