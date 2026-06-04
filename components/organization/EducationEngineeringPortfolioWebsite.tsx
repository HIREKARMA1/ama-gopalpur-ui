'use client';

import { useState } from 'react';
import { Organization, type DepartmentSummaryContent } from '../../services/api';
import { isDegreeCollegeLike } from '../../lib/educationSubDepartments';
import {
  resolvePlacementRecordsUrl,
  showEngineeringPlacementRecordsLink,
} from '../../lib/placementConfig';
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

type EngineeringPortfolioProps = {
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
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visible.map((item) => (
          <div key={`${title}-${item.label}`} className="rounded-2xl border border-slate-200 bg-white p-4">
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
          <span key={`${title}-${item}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function EngineeringFacultySection({ cards, isIti = false }: { cards: Record<string, unknown>[]; isIti?: boolean }) {
  if (!cards.length) return null;
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(cards.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + cards.length) % cards.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % cards.length);

  const renderFacultyCard = (card: Record<string, unknown>, idx: number) => (
    <article key={`faculty-card-${idx}`} className="mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {asString(card.photo || card.image) ? (
        <div className="flex h-52 w-full items-center justify-center bg-slate-100">
          <img
            src={asString(card.photo || card.image)}
            alt={asString(card.name) || 'Faculty'}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
          <p className="text-sm text-slate-500">-</p>
        </div>
      )}
      <div className="space-y-1.5 p-3 text-sm text-slate-700">
        <p><span className="font-semibold">Name:</span> {asString(card.name) || '-'}</p>
        <p><span className="font-semibold">Department:</span> {asString(card.subject) || '-'}</p>
        <p><span className="font-semibold">Designation:</span> {asString(card.designation) || '-'}</p>
        <p><span className="font-semibold">Qualification:</span> {asString(card.qualification) || '-'}</p>
        <p><span className="font-semibold">Contact:</span> {asString(card.contact) || '-'}</p>
        <p><span className="font-semibold">Email:</span> {asString(card.email) || '-'}</p>
        <p>
          <span className="font-semibold">Experience:</span> {asString(card.experience_from) || '-'} to {String(card.experience_currently_working || '').toLowerCase() === 'true' ? 'Present' : (asString(card.experience_to) || '-')}
        </p>
      </div>
    </article>
  );

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {isIti ? 'Technical and Administrative Staff' : 'Faculty Overview'}
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous faculty">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next faculty">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous faculty set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next faculty set">›</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {cards.map((card, idx) => (
            <div key={`faculty-mobile-${idx}`} className="w-full shrink-0">
              {renderFacultyCard(card, idx)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = cards.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`faculty-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((card, idx) => renderFacultyCard(card, pageIdx * desktopPageSize + idx))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DepartmentProgrammeSection({ cards, isIti = false }: { cards: Record<string, unknown>[]; isIti?: boolean }) {
  const rows = cards.filter((row) => {
    const dept = asString(row.department_name || row.trade_name || row.name);
    const shift1 = asString(row.shift_intake_capacity_1st);
    const shift2 = asString(row.shift_intake_capacity_2nd);
    const shift3 = asString(row.shift_intake_capacity_3rd);
    const totalUnits = asString(row.total_no_of_units);
    const bachelors = asString(row.bachelors_programmes || row.btech_branch_intake);
    const masters = asString(row.masters_programmes || row.mtech_branch_intake);
    const phd = asString(row.phd_programmes || row.phd);
    const description = asString(row.description);
    const image = asString(row.image || row.photo);
    if (isIti) return dept || shift1 || shift2 || shift3 || totalUnits || description || image;
    return dept || bachelors || masters || phd || description || image;
  });
  if (!rows.length) return null;
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(rows.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + rows.length) % rows.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % rows.length);

  const renderDepartmentCard = (row: Record<string, unknown>, idx: number) => (
    <article key={`dept-card-${idx}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {asString(row.image || row.photo) ? (
        <img src={asString(row.image || row.photo)} alt={asString(row.department_name || row.name) || 'Department'} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
          <p className="text-sm text-slate-500">-</p>
        </div>
      )}
      <div className="space-y-2 p-3 text-sm text-slate-700">
        <p className="text-base font-bold text-slate-900">{asString(row.department_name || row.trade_name || row.name) || '-'}</p>
        {isIti ? (
          <>
            <p><span className="font-semibold">Trade:</span> {asString(row.department_name || row.trade_name || row.name) || '-'}</p>
            <p><span className="font-semibold">Shift Intake Capacity (1st):</span> {asString(row.shift_intake_capacity_1st) || '-'}</p>
            <p><span className="font-semibold">Shift Intake Capacity (2nd):</span> {asString(row.shift_intake_capacity_2nd) || '-'}</p>
            <p><span className="font-semibold">Shift Intake Capacity (3rd):</span> {asString(row.shift_intake_capacity_3rd) || '-'}</p>
            <p><span className="font-semibold">Total No. of Units:</span> {asString(row.total_no_of_units) || '-'}</p>
          </>
        ) : (
          <>
            <p><span className="font-semibold">Bachelors:</span> {asString(row.bachelors_programmes || row.btech_branch_intake) || '-'}</p>
            <p><span className="font-semibold">Masters:</span> {asString(row.masters_programmes || row.mtech_branch_intake) || '-'}</p>
            <p><span className="font-semibold">PhD:</span> {asString(row.phd_programmes || row.phd) || '-'}</p>
          </>
        )}
      </div>
    </article>
  );

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {isIti ? 'Trades and Programmes' : 'Departments and Programmes'}
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous department">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next department">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous department set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next department set">›</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {rows.map((row, idx) => (
            <div key={`dept-mobile-${idx}`} className="w-full shrink-0">
              {renderDepartmentCard(row, idx)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = rows.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`dept-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((row, idx) => renderDepartmentCard(row, pageIdx * desktopPageSize + idx))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function EducationEngineeringPortfolioWebsite({
  org,
  profile,
  images = [],
  language = 'en',
  departmentSummary = null,
}: EngineeringPortfolioProps) {
  const subDepartment = (org.sub_department || '').toUpperCase();
  const placementRecordsUrl = showEngineeringPlacementRecordsLink(subDepartment)
    ? resolvePlacementRecordsUrl(profile, subDepartment, departmentSummary)
    : null;
  const isIti = subDepartment === 'ITI';
  const isUniversity = subDepartment === 'UNIVERSITY';
  const isDegreeCollege = isDegreeCollegeLike(subDepartment);
  const institutionLabel = isUniversity
    ? 'University'
    : isDegreeCollege
      ? 'College'
      : isIti
        ? 'Industrial Training Institute'
        : 'Engineering College';
  const headRole = isUniversity ? 'Vice Chancellor' : 'Principal';
  const heroSlides = [profile.hero_slide_1, profile.hero_slide_2, profile.hero_slide_3]
    .map((it) => asString(it))
    .filter(Boolean);
  const sliderImages = heroSlides.length ? heroSlides : images.length ? images : org.cover_image_key ? [org.cover_image_key] : [];
  const facilities = parseArray<FacilityCard>(profile.facility_cards);
  const departmentProgrammeCards = parseArray<Record<string, unknown>>(profile.department_programme_cards);
  const studentLifeCards = parseArray<FacilityCard>(profile.student_life_cards);
  const gallery = parseArray<GalleryItem>(profile.photo_gallery);
  const facultyCards = parseArray<Record<string, unknown>>(profile.faculty_cards);
  const adminCards = parseArray<Record<string, unknown>>(profile.engineering_admin_cards);
  const departments = asList(profile.departments);
  const deans = asList(profile.name_of_deans_pic_fic_oic_registrar);
  const mergedAboutProfile: Record<string, unknown> = {
    ...profile,
    school_name: profile.name_of_college || org.name,
    esst_year: profile.established_year || profile.esst_year,
    school_type_en: profile.college_type || profile.school_type_en,
    location_en:
      [profile.block_ulb, profile.gp_ward, profile.village]
        .map((v) => asString(v))
        .filter(Boolean)
        .join(', ') || org.address || '',
  };

  const principalCard = {
    role: headRole,
    image: asString(profile.headmaster_photo || profile.principal_photo),
    name: asString(profile.principal_name || profile.name_of_hm),
    subject: '',
    contact: asString(profile.principal_contact || profile.headmaster_contact || profile.contact_of_hm),
    email: asString(profile.principal_email || profile.headmaster_email || profile.college_email),
  };
  const additionalAdminCards = adminCards.map((row) => ({
    role: asString(row.designation || row.role),
    image: asString(row.image || row.photo),
    name: asString(row.name),
    subject: asString(row.department_affiliation),
    contact: asString(row.contact),
    email: asString(row.email),
  }));
  const adminPeople = [principalCard, ...additionalAdminCards].filter((p) => p.name || p.image || p.contact || p.email);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={profile} language={language} sliderImages={sliderImages} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={org}
          profile={mergedAboutProfile}
          language={language}
          sliderImages={sliderImages}
          aboutTitleOverride={`About ${asString(profile.name_of_college) || org.name || institutionLabel}`}
          leaderLabels={{ title: headRole, messageHeading: `${headRole}'s Message` }}
          hideExtendedLeaderBio
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

        <DepartmentProgrammeSection cards={departmentProgrammeCards} isIti={isIti} />

        <PsFacilitiesCarouselSection profile={profile} facilities={facilities} sectionTitle="Campus Facilities" />

        {!departmentProgrammeCards.length ? <PillListSection title={isIti ? 'Trades and Programmes' : 'Departments and Programmes'} values={departments} /> : null}

        <EngineeringFacultySection cards={facultyCards} isIti={isIti} />

        <DetailSection
          title="Research, Innovation, and MoUs"
          items={[
            { label: 'Research projects count', value: profile.research_projects_count },
            { label: 'Patents count', value: profile.patents_count },
            { label: 'MoU count', value: profile.mou_count },
            { label: 'Incubation centre', value: yesNo(profile.incubation_centre) },
            { label: 'Innovation and startup facility', value: yesNo(profile.innovation_and_startup_fascility) },
            { label: 'Centre of excellence', value: profile.centre_of_excellence_comma_separated || profile.centre_of_excellence },
          ]}
        />

        {!isDegreeCollege ? (
          <TrainingPlacementSection
            profile={profile}
            isIti={isIti}
            placementRecordsUrl={placementRecordsUrl}
          />
        ) : null}

        {studentLifeCards.length ? (
          <PsFacilitiesCarouselSection
            profile={profile}
            facilities={studentLifeCards}
            sectionTitle="Clubs, Activities, and Student Life"
          />
        ) : (
          <DetailSection
            title="Clubs, Activities, and Student Life"
            items={[
              { label: 'NSS', value: yesNo(profile.nss) },
              { label: 'NCC', value: yesNo(profile.ncc) },
              { label: 'Cultural clubs', value: yesNo(profile.cultural_clubs) },
              { label: 'Sports and athletics', value: yesNo(profile.sports_and_athletics_fascility) },
              { label: 'Robotics club', value: yesNo(profile.robotics_club) },
              { label: 'E-magazine', value: yesNo(profile.e_magazine) },
              { label: 'Deans/PIC/FIC/OIC/Registrar', value: deans.join(', ') },
            ]}
          />
        )}

        <PsGallerySection gallery={gallery} />
        <PsContactSection org={org} profile={profile} language={language} />
      </main>
    </div>
  );
}
