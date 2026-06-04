'use client';

import { useState } from 'react';
import { Organization, type DepartmentSummaryContent } from '../../services/api';
import { resolvePlacementRecordsUrl } from '../../lib/placementConfig';
import { TrainingPlacementSection } from './education/TrainingPlacementSection';
import {
  asList,
  asString,
  parseArray,
  type FacilityCard,
  type GalleryItem,
  type Lang,
  PsAboutSection,
  PsContactSection,
  PsFacilitiesCarouselSection,
  PsGallerySection,
  PsHeroSection,
  PsPersonCardsSection,
} from './EducationPsSections';

type Props = {
  org: Organization;
  profile: Record<string, unknown>;
  images?: string[];
  language?: Lang;
  departmentSummary?: DepartmentSummaryContent | null;
};

function yesNo(v: unknown) {
  const raw = asString(v).toLowerCase();
  if (!raw) return '';
  if (['yes', 'y', 'true', '1'].includes(raw)) return 'Yes';
  if (['no', 'n', 'false', '0'].includes(raw)) return 'No';
  return asString(v);
}

function DetailSection({ title, items }: { title: string; items: Array<{ label: string; value: unknown }> }) {
  const visible = items.filter((item) => asString(item.value));
  if (!visible.length) return null;
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <div key={`${title}-${item.label}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-sm text-slate-800 sm:text-base">{asString(item.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PillListSection({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {values.map((item) => (
          <span key={`${title}-${item}`} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-900">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function DiplomaProgrammeSection({ cards }: { cards: Record<string, unknown>[] }) {
  if (!cards.length) return null;
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Diploma Programmes</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((row, idx) => (
          <article key={`prog-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {asString(row.image || row.photo) ? (
              <div className="flex h-40 items-center justify-center bg-slate-100">
                <img src={asString(row.image || row.photo)} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="p-4">
              <h3 className="text-lg font-bold text-slate-900">
                {asString(row.branch_name || row.department_name || row.trade_name || row.name) || 'Programme'}
              </h3>
              {asString(row.program_duration || row.duration_years) ? (
                <p className="mt-1 text-sm text-slate-600">
                  Duration: {asString(row.program_duration || row.duration_years)} year(s)
                </p>
              ) : null}
              {asString(row.sanctioned_intake || row.intake) ? (
                <p className="text-sm text-slate-600">Intake: {asString(row.sanctioned_intake || row.intake)}</p>
              ) : null}
              {asString(row.description) ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{asString(row.description)}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DiplomaFacultySection({ cards }: { cards: Record<string, unknown>[] }) {
  if (!cards.length) return null;
  const [slide, setSlide] = useState(0);
  const pageSize = 3;
  const pages = Math.max(1, Math.ceil(cards.length / pageSize));

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Faculty</h2>
        {pages > 1 ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setSlide((p) => (p - 1 + pages) % pages)} className="h-9 w-9 rounded-full bg-slate-900 text-white">‹</button>
            <button type="button" onClick={() => setSlide((p) => (p + 1) % pages)} className="h-9 w-9 rounded-full bg-slate-900 text-white">›</button>
          </div>
        ) : null}
      </div>
      <div className="mt-5 hidden gap-5 md:grid md:grid-cols-3">
        {cards.slice(slide * pageSize, slide * pageSize + pageSize).map((card, idx) => (
          <article key={`fac-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {asString(card.photo || card.image) ? (
              <div className="flex h-48 items-center justify-center bg-slate-100">
                <img src={asString(card.photo || card.image)} alt="" className="h-full w-full object-contain" />
              </div>
            ) : null}
            <div className="space-y-1 p-3 text-sm text-slate-700">
              <p><span className="font-semibold">Name:</span> {asString(card.name) || '—'}</p>
              <p><span className="font-semibold">Department:</span> {asString(card.subject) || '—'}</p>
              <p><span className="font-semibold">Designation:</span> {asString(card.designation) || '—'}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 md:hidden">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {asString(cards[slide]?.photo) ? (
            <img src={asString(cards[slide]?.photo)} alt="" className="h-52 w-full object-contain bg-slate-100" />
          ) : null}
          <div className="p-3 text-sm text-slate-700">
            <p className="font-bold">{asString(cards[slide]?.name)}</p>
            <p>{asString(cards[slide]?.subject)}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function NoticeBoardSection({ items }: { items: Record<string, unknown>[] }) {
  if (!items.length) return null;
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Notice Board</h2>
      <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {items.slice(0, 12).map((item, idx) => (
          <li key={`notice-${idx}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
            <span className="font-medium text-slate-900">{asString(item.title) || 'Notice'}</span>
            {asString(item.date) ? <span className="text-xs text-slate-500">{asString(item.date)}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EducationDiplomaPortfolioWebsite({
  org,
  profile,
  images = [],
  language = 'en',
  departmentSummary = null,
}: Props) {
  const collegeName = asString(profile.college_name || profile.name_of_college) || org.name;
  const placementRecordsUrl = resolvePlacementRecordsUrl(profile, 'DIPLOMA_COLLEGE', departmentSummary);

  const heroSlides = [profile.hero_slide_1, profile.hero_slide_2, profile.hero_slide_3]
    .map((it) => asString(it))
    .filter(Boolean);
  const sliderImages = heroSlides.length ? heroSlides : images.length ? images : org.cover_image_key ? [org.cover_image_key] : [];

  const facilities = parseArray<FacilityCard>(profile.facility_cards);
  const programmeCards = parseArray<Record<string, unknown>>(profile.department_programme_cards);
  const studentLifeCards = parseArray<FacilityCard>(profile.student_life_cards);
  const gallery = parseArray<GalleryItem>(profile.photo_gallery);
  const facultyCards = parseArray<Record<string, unknown>>(profile.faculty_cards);
  const adminCards = parseArray<Record<string, unknown>>(profile.diploma_admin_cards);
  const notices = parseArray<Record<string, unknown>>(profile.notice_board);

  const diplomaProgrammes = asList(
    profile.diploma_programmes_list_branch_wise || profile.diploma_programmes,
  );
  const values = asList(profile.values_text_en || profile.values);

  const mergedAboutProfile: Record<string, unknown> = {
    ...profile,
    school_name: collegeName,
    esst_year: profile.established_year || profile.esst_year,
    school_type_en: profile.institution_type_polytechnic_iti_other || profile.college_type || profile.school_type_en,
    location_en:
      [profile.block_ulb, profile.gp_ward, profile.village_locality || profile.village]
        .map((v) => asString(v))
        .filter(Boolean)
        .join(', ') || org.address || '',
    about_short_en: profile.welcome_text_en || profile.about_short_en || profile.remarks_description,
  };

  const principalCard = {
    role: 'Principal',
    image: asString(profile.headmaster_photo || profile.principal_photo),
    name: asString(profile.principal_head_name || profile.principal_name || profile.name_of_hm),
    subject: '',
    contact: asString(profile.principal_contact || profile.headmaster_contact),
    email: asString(profile.principal_email || profile.headmaster_email || profile.college_email),
  };
  const adminPeople = [
    principalCard,
    ...adminCards.map((row) => ({
      role: asString(row.designation || row.role) || 'Leadership',
      image: asString(row.image || row.photo),
      name: asString(row.name),
      subject: asString(row.department_affiliation),
      contact: asString(row.contact),
      email: asString(row.email),
    })),
  ].filter((p) => p.name || p.image || p.contact || p.email);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={profile} language={language} sliderImages={sliderImages} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={org}
          profile={mergedAboutProfile}
          language={language}
          sliderImages={sliderImages}
          aboutTitleOverride={`About ${collegeName}`}
          leaderLabels={{ title: 'Principal', messageHeading: "Principal's Message" }}
          hideExtendedLeaderBio
        />

        {values.length ? <PillListSection title="Our Values" values={values} /> : null}

        <DetailSection
          title="Institute Profile"
          items={[
            { label: 'Ownership', value: profile.ownership_govt_private_aided },
            { label: 'Institution type', value: profile.institution_type_polytechnic_iti_other },
            { label: 'Approval authority', value: profile.approval_authority_aicte_ncvt_state_council },
            { label: 'Affiliating body', value: profile.affiliating_body_e_g_scte_vt },
            { label: 'Established', value: profile.established_year },
            { label: 'Website', value: profile.website },
          ]}
        />

        {adminPeople.length ? (
          <PsPersonCardsSection
            title="Leadership and Administration"
            people={adminPeople.map((person) => ({
              ...person,
              role: person.subject ? `${person.role} · ${person.subject}` : person.role,
            }))}
            gridClassName="md:grid-cols-2 xl:grid-cols-3"
          />
        ) : null}

        <DiplomaProgrammeSection cards={programmeCards} />
        {!programmeCards.length && diplomaProgrammes.length ? (
          <PillListSection title="Diploma Programmes" values={diplomaProgrammes} />
        ) : null}

        <DetailSection
          title="Our Intake & Enrolment"
          items={[
            { label: 'Total diploma programmes', value: profile.total_diploma_programmes_count },
            { label: 'Programme duration (years)', value: profile.program_duration_years },
            { label: 'Total sanctioned intake', value: profile.total_sanctioned_intake_all_years },
            { label: 'Students enrolled (1st year)', value: profile.students_enrolled_1st_year },
            { label: 'Students enrolled (2nd year)', value: profile.students_enrolled_2nd_year },
            { label: 'Students enrolled (3rd year)', value: profile.students_enrolled_3rd_year },
            { label: 'Total student enrolment', value: profile.total_student_enrolment_all_years },
          ]}
        />

        <PsFacilitiesCarouselSection profile={profile} facilities={facilities} sectionTitle="Campus Facilities" />

        <DiplomaFacultySection cards={facultyCards} />

        <DetailSection
          title="Industry Connect & Training"
          items={[
            { label: 'Training & placement cell', value: yesNo(profile.training_placement_cell_yes_no) },
            { label: 'Industrial visits per year', value: profile.industrial_visits_per_year },
            { label: 'Internship mandatory', value: yesNo(profile.industrial_training_internship_mandatory_yes_no) },
            { label: 'Industry partners / MoUs', value: profile.notable_industry_partners_mous },
            { label: 'Companies visited (last year)', value: profile.companies_visited_last_year },
          ]}
        />

        <TrainingPlacementSection profile={profile} placementRecordsUrl={placementRecordsUrl} />

        {studentLifeCards.length ? (
          <PsFacilitiesCarouselSection
            profile={profile}
            facilities={studentLifeCards}
            sectionTitle="Student Corner & Campus Life"
          />
        ) : (
          <DetailSection
            title="Student Corner & Campus Life"
            items={[
              { label: 'NSS / NCC / Clubs', value: profile.nss_ncc_clubs_list },
              { label: 'Anti-ragging cell', value: yesNo(profile.anti_ragging_cell_yes_no) },
              { label: 'Grievance cell', value: yesNo(profile.grievance_cell_yes_no) },
              { label: 'Hostel', value: yesNo(profile.hostel_yes_no) },
              { label: 'Transport', value: yesNo(profile.transport_college_bus_yes_no) },
            ]}
          />
        )}

        <NoticeBoardSection items={notices} />
        <PsGallerySection gallery={gallery} />
        <PsContactSection org={org} profile={profile} language={language} />
      </main>
    </div>
  );
}
