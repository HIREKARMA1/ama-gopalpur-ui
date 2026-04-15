'use client';

import { useState } from 'react';
import { Clock, GraduationCap, Images, Mail, MapPin, Phone, School, Star, Users, X } from 'lucide-react';
import { Organization } from '../../services/api';
import { ImageSlider } from './ImageSlider';

export type Faculty = {
  name?: string;
  subject?: string;
  qualification?: string;
  photo?: string;
  designation?: string;
};
export type GalleryItem = { image?: string; category?: string; title?: string; description?: string };
export type IntakeRow = { class_name?: string; intake?: string | number };
export type IntakeCard = { class_name?: string; strength?: string | number; registered_this_year?: string | number; subjects?: string; image?: string };
export type MdmDailyRecord = {
  date?: string;
  register_image?: string;
  image?: string;
  total_boys?: string | number;
  total_girls?: string | number;
  total_students?: string | number;
  total_present?: string | number;
};
export type ParentTeacherMeetingRecord = {
  date?: string;
  image?: string;
  description?: string;
};
export type FacilityCardImage = { url?: string; title?: string; image?: string };
export type FacilityCard = { image?: string; title?: string; description?: string; images?: FacilityCardImage[] };
export type Lang = 'en' | 'od';

export function asString(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

/** Unicode em dash — shown when backend has no value (template / empty slots). */
export const EMPTY = '—';

/** Display string from backend, or {@link EMPTY} if missing. */
export function displayText(value: unknown): string {
  const s = asString(value);
  return s || EMPTY;
}

export function parseArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      return [];
    }
  }
  return [];
}

export function getText(profile: Record<string, unknown>, key: string, language: Lang) {
  const local = asString(profile[`${key}_${language}`]);
  if (local) return local;
  return asString(profile[`${key}_en`]) || asString(profile[key]);
}

export function stat(profile: Record<string, unknown>, key: string) {
  return asString(profile[key]) || EMPTY;
}

export function ImageCard({
  src,
  alt,
  title,
  subtitle,
  className = '',
  tall = false,
}: {
  src?: string;
  alt: string;
  title?: string;
  subtitle?: string;
  className?: string;
  tall?: boolean;
}) {
  const heightClass = tall ? 'h-56 sm:h-72' : 'h-44 sm:h-52';
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm ${className}`}>
      {src ? (
        <img src={src} alt={alt} className={`${heightClass} w-full object-cover transition duration-500 group-hover:scale-105`} />
      ) : (
        <div className={`${heightClass} flex w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100`}>
          <div className="rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-center backdrop-blur">
            <Images className="mx-auto h-5 w-5 text-slate-700" />
            <p className="mt-1 text-xs font-semibold text-slate-700">{EMPTY}</p>
          </div>
        </div>
      )}
      {(title || subtitle) && (
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-900">{displayText(title || alt)}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-600">{displayText(subtitle)}</p> : null}
        </div>
      )}
    </div>
  );
}

export function PsHeroSection({ org, profile, language, sliderImages }: { org: Organization; profile: Record<string, unknown>; language: Lang; sliderImages: string[] }) {
  const heroSlidesFromProfile = parseArray<unknown>(profile.hero_slides)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return asString(rec.image || rec.url || rec.src);
      }
      return '';
    })
    .filter(Boolean);
  const heroSlides = (heroSlidesFromProfile.length ? heroSlidesFromProfile : sliderImages).slice(0, 3);
  const primaryTagline =
    getText(profile, 'hero_primary_tagline', language) ||
    getText(profile, 'hero_tagline', language) ||
    EMPTY;
  return (
    <section className="relative overflow-hidden">
      <ImageSlider
        images={heroSlides}
        altPrefix={asString(org.name) || 'School'}
        className="h-[260px] sm:h-[520px] md:h-[560px] lg:h-[600px]"
        showArrows={false}
        autoAdvanceMs={4500}
        placeholderCount={3}
        hidePlaceholderText
      />
      {/* Fixed readability layer: keeps text clear while background slides */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-8 sm:items-center sm:justify-start sm:pt-0">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h1 className="hidden max-w-[92vw] text-2xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-md sm:[display:-webkit-box] sm:[-webkit-box-orient:vertical] sm:[-webkit-line-clamp:unset] sm:max-w-3xl sm:text-5xl sm:leading-tight sm:overflow-visible">
            {getText(profile, 'school_name', language) || org.name || EMPTY}
          </h1>
          <p className="hidden mt-2 max-w-[92vw] text-xs text-slate-100 drop-shadow sm:[display:-webkit-box] sm:[-webkit-box-orient:vertical] sm:[-webkit-line-clamp:unset] sm:mt-3 sm:max-w-2xl sm:text-lg sm:overflow-visible">
            {primaryTagline}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PsAboutSection({
  org,
  profile,
  language,
  sliderImages,
  aboutLeaderRole = 'headmaster',
  hideVisionMission = false,
  leaderLabels,
  hideExtendedLeaderBio = false,
}: {
  org: Organization;
  profile: Record<string, unknown>;
  language: Lang;
  sliderImages: string[];
  /** ARCS public site uses secretary labels while keeping the same layout as PS. */
  aboutLeaderRole?: 'headmaster' | 'secretary';
  /** When true, Vision / Mission blocks are omitted (e.g. Health portfolio). */
  hideVisionMission?: boolean;
  /** Override leader role title and message section heading (e.g. Institution Head). */
  leaderLabels?: { title: string; messageHeading: string };
  /** When true, Past/Current experience block in the leader modal is omitted. */
  hideExtendedLeaderBio?: boolean;
}) {
  const [isHeadmasterModalOpen, setIsHeadmasterModalOpen] = useState(false);
  const [isHeadmasterModalClosing, setIsHeadmasterModalClosing] = useState(false);
  const schoolName = getText(profile, 'school_name', language) || org.name || EMPTY;
  const aboutText = getText(profile, 'about_short', language) || asString(profile.description) || EMPTY;
  const headmasterMessage = getText(profile, 'headmaster_message', language) || EMPTY;
  const headmasterName = asString(profile.name_of_hm) || EMPTY;
  const headmasterTitle =
    leaderLabels?.title ??
    (aboutLeaderRole === 'secretary' ? (language === 'od' ? 'ସଚିବ' : 'Secretary') : language === 'od' ? 'ପ୍ରଧାନଶିକ୍ଷକ' : 'Headmaster');
  const leaderMessageHeading =
    leaderLabels?.messageHeading ??
    (aboutLeaderRole === 'secretary'
      ? language === 'od'
        ? 'ସଚିବଙ୍କ ବାର୍ତ୍ତା'
        : "Secretary's message"
      : language === 'od'
        ? 'ପ୍ରଧାନଶିକ୍ଷକଙ୍କ ବାର୍ତ୍ତା'
        : "Headmaster's Message");
  const qualification = asString(profile.hm_qualification) || '—';
  const experience = asString(profile.hm_experience) || '—';
  const pastExperience = getText(profile, 'hm_past_experience', language) || asString(profile.hm_past_experience_en) || EMPTY;
  const currentExperience = getText(profile, 'hm_current_experience', language) || asString(profile.hm_current_experience_en) || EMPTY;
  const headmasterContact = asString(profile.headmaster_contact) || asString(profile.contact_of_hm) || '—';
  const headmasterEmail = asString(profile.headmaster_email) || asString(profile.contact_email) || '—';
  const aboutImage = asString(profile.about_image) || sliderImages[0] || '';
  const visionText = getText(profile, 'vision_text', language) || EMPTY;
  const missionText = getText(profile, 'mission_text', language) || EMPTY;
  const closeHeadmasterModal = () => {
    setIsHeadmasterModalClosing(true);
    window.setTimeout(() => {
      setIsHeadmasterModalOpen(false);
      setIsHeadmasterModalClosing(false);
    }, 180);
  };

  return (
    <section id="about" className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {language === 'od' ? 'ବିଦ୍ୟାଳୟ ସମ୍ପର୍କରେ' : `About ${schoolName}`}
      </h2>
      <p className="mt-4 max-w-6xl text-sm leading-relaxed text-slate-600 sm:text-base">
        {aboutText}
      </p>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-xl">
            {aboutImage ? (
              <img src={aboutImage} alt="School campus" className="h-[300px] w-full object-cover sm:h-[360px] md:h-[420px]" />
            ) : (
              <div className="flex h-[300px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 sm:h-[360px] md:h-[420px]">
                <div className="text-center">
                  <Images className="mx-auto h-7 w-7 text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-slate-600">{EMPTY}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-2 border-l-2 border-slate-300 pl-4 text-sm sm:text-base">
            <p className="text-slate-800"><span className="font-semibold">Established:</span> {asString(profile.esst_year) || '—'}</p>
            <p className="text-slate-800"><span className="font-semibold">Type:</span> {getText(profile, 'school_type', language) || asString(profile.category) || '—'}</p>
            <p className="text-slate-800"><span className="font-semibold">Location:</span> {getText(profile, 'location', language) || org.address || '—'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{leaderMessageHeading}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">"{headmasterMessage}"</p>
          </div>

          <div className="flex items-start gap-4 border-b border-slate-200 pb-5">
            <button
              type="button"
              onClick={() => {
                setIsHeadmasterModalClosing(false);
                setIsHeadmasterModalOpen(true);
              }}
              className="h-36 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-40 sm:w-36"
              aria-label={aboutLeaderRole === 'secretary' ? 'Open secretary photo' : 'Open headmaster photo'}
            >
              {asString(profile.headmaster_photo) ? (
                <img
                  src={asString(profile.headmaster_photo)}
                  alt={displayText(headmasterName)}
                  className="h-full w-full object-contain object-center"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                  <Images className="h-6 w-6 text-slate-500" />
                  <span className="text-[10px] text-slate-500">{EMPTY}</span>
                </div>
              )}
            </button>
            <div>
              <p className="text-lg font-bold text-slate-900">{headmasterName}</p>
              <p className="text-sm text-slate-600">{headmasterTitle}</p>
              {aboutLeaderRole !== 'secretary' ? (
                <p className="mt-1 text-xs text-slate-500">
                  {language === 'od' ? 'ଯୋଗ୍ୟତା' : 'Qualification'}: {qualification} | {language === 'od' ? 'ଅନୁଭବ' : 'Experience'}: {experience}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                {language === 'od' ? 'ଯୋଗାଯୋଗ' : 'Contact'}: {headmasterContact}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {language === 'od' ? 'ଇମେଲ' : 'Email'}: {headmasterEmail}
              </p>
            </div>
          </div>

          {!hideVisionMission ? (
            <div className="space-y-4">
              <div className="border-l-2 border-slate-300 pl-4">
                <h4 className="text-xl font-extrabold tracking-tight text-slate-900">Vision</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{visionText}</p>
              </div>
              <div className="border-l-2 border-slate-300 pl-4">
                <h4 className="text-xl font-extrabold tracking-tight text-slate-900">Mission</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{missionText}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isHeadmasterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
          onClick={closeHeadmasterModal}
          role="button"
          tabIndex={0}
          style={{ animation: isHeadmasterModalClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeHeadmasterModal();
          }}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{ animation: isHeadmasterModalClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeHeadmasterModal}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex max-h-[min(72vh,560px)] min-h-[220px] w-full items-center justify-center bg-slate-100">
              {asString(profile.headmaster_photo) ? (
                <img
                  src={asString(profile.headmaster_photo)}
                  alt={headmasterName}
                  className="max-h-[min(72vh,560px)] w-full object-contain object-center"
                />
              ) : (
                <div className="flex min-h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 py-16">
                  <div className="text-center">
                    <Images className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="mt-2 text-sm font-medium text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-lg font-bold text-slate-900">{headmasterName}</p>
              <p className="text-sm text-slate-600">{headmasterTitle}</p>
              {aboutLeaderRole !== 'secretary' ? (
                <p className="mt-1 text-xs text-slate-500">
                  {language === 'od' ? 'ଯୋଗ୍ୟତା' : 'Qualification'}: {qualification} | {language === 'od' ? 'ଅନୁଭବ' : 'Experience'}: {experience}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                {language === 'od' ? 'ଯୋଗାଯୋଗ' : 'Contact'}: {headmasterContact}
              </p>
              <p className="mt-1 break-all text-xs text-slate-500">
                {language === 'od' ? 'ଇମେଲ' : 'Email'}: {headmasterEmail}
              </p>
              {aboutLeaderRole !== 'secretary' && !hideExtendedLeaderBio ? (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Past Experience</p>
                  <p className="text-xs leading-relaxed text-slate-700">{pastExperience}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Experience</p>
                  <p className="text-xs leading-relaxed text-slate-700">{currentExperience}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

export type PsPersonCard = {
  role: string;
  image: string;
  name: string;
  contact: string;
  email: string;
};

/** Shared administration-style person grid (PS Administration, ARCS Incharge, etc.). */
export function PsPersonCardsSection({
  title,
  people,
  gridClassName,
}: {
  title: string;
  people: PsPersonCard[];
  gridClassName: string;
}) {
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>

      <div className={`mt-6 grid gap-4 ${gridClassName}`}>
        {people.map((admin, idx) => (
          <article
            key={`${admin.role}-${idx}-${admin.name}`}
            className="flex min-h-[370px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="flex h-[260px] w-full items-center justify-center overflow-hidden bg-slate-100 sm:h-[280px]">
              {admin.image ? (
                <img src={admin.image} alt={admin.name} className="max-h-full max-w-full object-contain object-center" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <Images className="mx-auto h-7 w-7 text-slate-500" />
                    <p className="mt-2 text-xs font-medium text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{admin.role || EMPTY}</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{admin.name}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Contact:</span> {admin.contact}
                </p>
                <p className="break-all">
                  <span className="font-semibold">Email:</span> {admin.email}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PsAdministrationSection({
  profile,
  subDepartment,
}: {
  profile: Record<string, unknown>;
  subDepartment?: string;
}) {
  const isHighSchool = (subDepartment || '').toUpperCase() === 'HS';
  const admins: PsPersonCard[] = [
    {
      role: 'DEO',
      image: asString(profile.deo_image),
      name: asString(profile.deo_name) || EMPTY,
      contact: asString(profile.deo_contact) || '—',
      email: asString(profile.deo_email) || '—',
    },
    {
      role: 'BEO',
      image: asString(profile.beo_image),
      name: asString(profile.beo_name) || EMPTY,
      contact: asString(profile.beo_contact) || '—',
      email: asString(profile.beo_email) || '—',
    },
    ...(isHighSchool
      ? []
      : [
          {
            role: 'BRCC',
            image: asString(profile.brcc_image),
            name: asString(profile.brcc_name) || EMPTY,
            contact: asString(profile.brcc_contact) || '—',
            email: asString(profile.brcc_email) || '—',
          },
          {
            role: 'CRCC',
            image: asString(profile.crc_image),
            name: asString(profile.crc_name || profile.crcc_name) || EMPTY,
            contact: asString(profile.crc_contact || profile.crcc_contact) || '—',
            email: asString(profile.crc_email) || '—',
          },
        ]),
  ];

  return (
    <PsPersonCardsSection
      title="Administration"
      people={admins}
      gridClassName={`md:grid-cols-2 ${isHighSchool ? 'xl:grid-cols-2' : 'xl:grid-cols-4'}`}
    />
  );
}

export function PsHighlightsSection({ profile }: { profile: Record<string, unknown> }) {
  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-md md:p-7">
      <h2 className="text-xl font-bold sm:text-2xl">Key Highlights</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Total Students', stat(profile, 'total_students')],
          ['Total Teachers', stat(profile, 'no_of_ts')],
          ['Classrooms', stat(profile, 'no_of_rooms')],
          ['Facilities', stat(profile, 'facilities_count')],
          ['Digital Classrooms', stat(profile, 'no_of_smart_class_rooms')],
          ['Years of Service', stat(profile, 'years_of_service')],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PsHeadmasterSection({ profile, language }: { profile: Record<string, unknown>; language: Lang }) {
  return (
    <section className="py-2 md:py-4">
      <div className="grid gap-8 md:grid-cols-[360px_1fr] md:items-start">
        <div>
          <div className="overflow-hidden rounded-md bg-slate-100">
            {asString(profile.headmaster_photo) ? (
              <div className="flex max-h-[440px] min-h-[280px] w-full items-center justify-center md:min-h-[320px]">
                <img
                  src={asString(profile.headmaster_photo)}
                  alt="Headmaster"
                  className="max-h-[440px] w-full object-contain object-center"
                />
              </div>
            ) : (
              <div className="flex h-[360px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 md:h-[440px]">
                <div className="text-center">
                  <Images className="mx-auto h-7 w-7 text-slate-500" />
                  <p className="mt-2 text-sm font-medium text-slate-600">{EMPTY}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 border-l-2 border-slate-300 pl-3">
            <p className="text-lg font-bold text-slate-900">{asString(profile.name_of_hm) || '—'}</p>
            <p className="text-sm text-slate-500">Headmaster</p>
          </div>
        </div>

        <div className="pt-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Headmaster Profile</h2>
          <div className="mt-5 grid gap-y-2 text-sm sm:text-base">
            <p className="text-slate-800"><span className="font-semibold">Qualification:</span> {asString(profile.hm_qualification) || '—'}</p>
            <p className="text-slate-800"><span className="font-semibold">Experience:</span> {asString(profile.hm_experience) || '—'}</p>
          </div>

          <div className="mt-7 border-l-4 border-indigo-600 pl-5">
            <p className="text-[15px] leading-relaxed text-slate-700 sm:text-lg">
              {`"${getText(profile, 'headmaster_message', language) || EMPTY}"`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PsAcademicSection({ profile, language }: { profile: Record<string, unknown>; language: Lang }) {
  return (
    <section className="py-2 md:py-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Academic</h2>
      <div className="mt-4 space-y-3">
        {(
          [
            ['curriculum_text', 'Curriculum'],
            ['academic_calendar_text', 'Academic calendar'],
            ['class_structure_text', 'Class structure'],
            ['subjects_offered_text', 'Subjects offered'],
          ] as const
        ).map(([key, label], idx) => (
          <div key={key} className="flex gap-3 border-b border-slate-200 pb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{String(idx + 1).padStart(2, '0')}</div>
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-sm text-slate-800">{getText(profile, key, language) || EMPTY}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const EMPTY_FACILITY_SLOTS = 7;

function facilityImagesFromCard(card: FacilityCard): { url: string; title: string }[] {
  const fromArray = (Array.isArray(card.images) ? card.images : [])
    .map((it) => {
      const rec = (it || {}) as Record<string, unknown>;
      const url = asString(rec.url || rec.image);
      const title = asString(rec.title);
      return url ? { url, title } : null;
    })
    .filter(Boolean) as { url: string; title: string }[];
  if (fromArray.length) return fromArray;
  const legacy = asString(card.image);
  return legacy ? [{ url: legacy, title: '' }] : [];
}

export function PsFacilitiesCarouselSection({
  profile,
  facilities,
  sectionTitle = 'Facilities',
  emptySlotCount,
}: {
  profile: Record<string, unknown>;
  /** When provided (including `[]`), overrides `profile.facility_cards`. */
  facilities?: FacilityCard[];
  sectionTitle?: string;
  /** Placeholder card count when the facilities list is empty (default: 7). */
  emptySlotCount?: number;
}) {
  const fromProfile = parseArray<FacilityCard>(profile.facility_cards);
  const fromProps = facilities !== undefined ? facilities : fromProfile;
  const slots = emptySlotCount ?? EMPTY_FACILITY_SLOTS;
  const cards = fromProps.length ? fromProps : Array.from({ length: slots }, () => ({}) as FacilityCard);
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(cards.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [previewCard, setPreviewCard] = useState<{ card: FacilityCard; imageIndex: number } | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + cards.length) % cards.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % cards.length);
  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreviewCard(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{sectionTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous facility">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next facility">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous facility set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next facility set">›</button>
        </div>
      </div>

      {/* Mobile: one card per row/slide */}
      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {cards.map((card, idx) => (
            <article key={`facility-mobile-${idx}`} className="w-full shrink-0">
              <div>
                <div className="overflow-hidden rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewClosing(false);
                      setPreviewCard({ card, imageIndex: 0 });
                    }}
                    className="block w-full cursor-pointer"
                    aria-label={`Open ${displayText(card.title)}`}
                  >
                    {facilityImagesFromCard(card).length ? (
                      <img src={facilityImagesFromCard(card)[0].url} alt={displayText(card.title)} className="h-[220px] w-full object-cover sm:h-[240px]" />
                    ) : (
                      <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 sm:h-[240px]">
                        <div className="text-center">
                          <Images className="mx-auto h-6 w-6 text-slate-500" />
                          <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{displayText(card.title)}</h3>
                <p className="mt-2 text-sm text-slate-600">{displayText(card.description)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Desktop: three cards per row/slide */}
      <div className="mt-5 hidden overflow-hidden md:block">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}
        >
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = cards.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`facility-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((card, idx) => (
                    <div key={`${card.title || 'facility'}-${pageIdx}-${idx}`}>
                      <div className="overflow-hidden rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPreviewClosing(false);
                            setPreviewCard({ card, imageIndex: 0 });
                          }}
                          className="block w-full cursor-pointer"
                          aria-label={`Open ${displayText(card.title)}`}
                        >
                          {facilityImagesFromCard(card).length ? (
                            <img src={facilityImagesFromCard(card)[0].url} alt={displayText(card.title)} className="h-[220px] w-full object-cover sm:h-[240px]" />
                          ) : (
                            <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 sm:h-[240px]">
                              <div className="text-center">
                                <Images className="mx-auto h-6 w-6 text-slate-500" />
                                <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{displayText(card.title)}</h3>
                      <p className="mt-2 text-sm text-slate-600">{displayText(card.description)}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {previewCard && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          style={{ animation: isPreviewClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onClick={closePreview}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-lg bg-white"
            style={{ animation: isPreviewClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {facilityImagesFromCard(previewCard.card).length ? (
                <img
                  src={facilityImagesFromCard(previewCard.card)[previewCard.imageIndex].url}
                  alt={displayText(previewCard.card.title)}
                  className="max-h-[70vh] w-full object-contain bg-slate-100"
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center bg-slate-100">
                  <p className="text-sm text-slate-500">{EMPTY}</p>
                </div>
              )}
              {facilityImagesFromCard(previewCard.card).length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewCard((prev) => {
                        if (!prev) return prev;
                        const imgs = facilityImagesFromCard(prev.card);
                        const nextIdx = (prev.imageIndex - 1 + imgs.length) % imgs.length;
                        return { ...prev, imageIndex: nextIdx };
                      })
                    }
                    className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/65 text-white hover:bg-black/80"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewCard((prev) => {
                        if (!prev) return prev;
                        const imgs = facilityImagesFromCard(prev.card);
                        const nextIdx = (prev.imageIndex + 1) % imgs.length;
                        return { ...prev, imageIndex: nextIdx };
                      })
                    }
                    className="absolute right-14 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-black/65 text-white hover:bg-black/80"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/65 text-white hover:bg-black/80"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{displayText(previewCard.card.title)}</h3>
              {facilityImagesFromCard(previewCard.card).length ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {displayText(facilityImagesFromCard(previewCard.card)[previewCard.imageIndex].title)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-slate-600">{displayText(previewCard.card.description)}</p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

const EMPTY_MDM_SLOTS = 10;

export function PsMidDayMealSection({ records }: { records: MdmDailyRecord[] }) {
  const normalized = records.map((r) => {
    const date = asString(r.date);
    const image = asString(r.register_image || r.image);
    const totalBoys = r.total_boys;
    const totalGirls = r.total_girls;
    const totalStudents = r.total_students ?? r.total_present;
    return { date, image, totalBoys, totalGirls, totalStudents };
  });
  const sorted = [...normalized].sort((a, b) => {
    const ad = Date.parse(a.date || '');
    const bd = Date.parse(b.date || '');
    if (Number.isNaN(ad) && Number.isNaN(bd)) return 0;
    if (Number.isNaN(ad)) return 1;
    if (Number.isNaN(bd)) return -1;
    return bd - ad;
  });
  const list = (
    sorted.length
      ? sorted.slice(0, 10)
      : Array.from({ length: EMPTY_MDM_SLOTS }, () => ({ date: '', image: '', totalBoys: '', totalGirls: '', totalStudents: '' }))
  );

  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [previewDay, setPreviewDay] = useState<(typeof list)[number] | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);
  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreviewDay(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Mid Day Meal</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous MDM day">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next MDM day">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous MDM set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next MDM set">›</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((day, idx) => (
            <button
              key={`mdm-mobile-${idx}`}
              type="button"
              className="w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
              onClick={() => {
                setIsPreviewClosing(false);
                setPreviewDay(day);
              }}
            >
              {day.image ? (
                <img src={day.image} alt={displayText(day.date)} className="h-[220px] w-full object-cover" />
              ) : (
                <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                  <div className="text-center">
                    <Images className="mx-auto h-6 w-6 text-slate-500" />
                    <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">{displayText(day.date)}</p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-semibold">Total boys:</span>{' '}
                  {day.totalBoys != null && String(day.totalBoys).trim() ? String(day.totalBoys) : EMPTY}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-semibold">Total girls:</span>{' '}
                  {day.totalGirls != null && String(day.totalGirls).trim() ? String(day.totalGirls) : EMPTY}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-semibold">Total students:</span>{' '}
                  {day.totalStudents != null && String(day.totalStudents).trim() ? String(day.totalStudents) : EMPTY}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`mdm-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((day, idx) => (
                    <button
                      key={`mdm-${pageIdx}-${idx}`}
                      type="button"
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
                      onClick={() => {
                        setIsPreviewClosing(false);
                        setPreviewDay(day);
                      }}
                    >
                      {day.image ? (
                        <img src={day.image} alt={displayText(day.date)} className="h-[220px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                          <div className="text-center">
                            <Images className="mx-auto h-6 w-6 text-slate-500" />
                            <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-sm font-semibold text-slate-900">{displayText(day.date)}</p>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="font-semibold">Total boys:</span>{' '}
                          {day.totalBoys != null && String(day.totalBoys).trim() ? String(day.totalBoys) : EMPTY}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="font-semibold">Total girls:</span>{' '}
                          {day.totalGirls != null && String(day.totalGirls).trim() ? String(day.totalGirls) : EMPTY}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          <span className="font-semibold">Total students:</span>{' '}
                          {day.totalStudents != null && String(day.totalStudents).trim() ? String(day.totalStudents) : EMPTY}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {previewDay && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ${isPreviewClosing ? 'animate-[psModalFadeOut_180ms_ease-in_forwards]' : 'animate-[psModalFadeIn_220ms_ease-out]'
            }`}
          onClick={closePreview}
        >
          <div
            className={`w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ${isPreviewClosing ? 'animate-[psModalScaleOut_180ms_ease-in_forwards]' : 'animate-[psModalScaleIn_220ms_ease-out]'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {previewDay.image ? (
                <img src={previewDay.image} alt={displayText(previewDay.date)} className="h-[320px] w-full object-cover" />
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                  <div className="text-center">
                    <Images className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="mt-2 text-sm text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Close MDM preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-lg font-bold text-slate-900">{displayText(previewDay.date)}</p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Total boys:</span>{' '}
                {previewDay.totalBoys != null && String(previewDay.totalBoys).trim() ? String(previewDay.totalBoys) : EMPTY}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Total girls:</span>{' '}
                {previewDay.totalGirls != null && String(previewDay.totalGirls).trim() ? String(previewDay.totalGirls) : EMPTY}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Total students:</span>{' '}
                {previewDay.totalStudents != null && String(previewDay.totalStudents).trim() ? String(previewDay.totalStudents) : EMPTY}
              </p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

const EMPTY_PTM_SLOTS = 6;

export function PsParentTeacherMeetingSection({ records }: { records: ParentTeacherMeetingRecord[] }) {
  const normalized = records.map((r) => ({
    date: asString(r.date),
    image: asString(r.image),
    description: asString(r.description),
  }));
  const sorted = [...normalized].sort((a, b) => {
    const ad = Date.parse(a.date || '');
    const bd = Date.parse(b.date || '');
    if (Number.isNaN(ad) && Number.isNaN(bd)) return 0;
    if (Number.isNaN(ad)) return 1;
    if (Number.isNaN(bd)) return -1;
    return bd - ad;
  });
  const list = (sorted.length
    ? sorted.slice(0, 10)
    : Array.from({ length: EMPTY_PTM_SLOTS }, () => ({ date: '', image: '', description: '' })));

  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [previewMeeting, setPreviewMeeting] = useState<(typeof list)[number] | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);
  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreviewMeeting(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Parent Teacher Meeting</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous PTM day">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next PTM day">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous PTM set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next PTM set">›</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((item, idx) => (
            <button
              key={`ptm-mobile-${idx}`}
              type="button"
              className="w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
              onClick={() => {
                setIsPreviewClosing(false);
                setPreviewMeeting(item);
              }}
            >
              {item.image ? (
                <img src={item.image} alt={displayText(item.date)} className="h-[220px] w-full object-cover" />
              ) : (
                <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                  <div className="text-center">
                    <Images className="mx-auto h-6 w-6 text-slate-500" />
                    <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-semibold text-slate-900">{displayText(item.date)}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-700">{displayText(item.description)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`ptm-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 md:grid-cols-3">
                  {pageCards.map((item, idx) => (
                    <button
                      key={`ptm-${pageIdx}-${idx}`}
                      type="button"
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
                      onClick={() => {
                        setIsPreviewClosing(false);
                        setPreviewMeeting(item);
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={displayText(item.date)} className="h-[220px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[220px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                          <div className="text-center">
                            <Images className="mx-auto h-6 w-6 text-slate-500" />
                            <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-sm font-semibold text-slate-900">{displayText(item.date)}</p>
                        <p className="mt-1 line-clamp-3 text-sm text-slate-700">{displayText(item.description)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {previewMeeting && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ${isPreviewClosing ? 'animate-[psModalFadeOut_180ms_ease-in_forwards]' : 'animate-[psModalFadeIn_220ms_ease-out]'
            }`}
          onClick={closePreview}
        >
          <div
            className={`w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ${isPreviewClosing ? 'animate-[psModalScaleOut_180ms_ease-in_forwards]' : 'animate-[psModalScaleIn_220ms_ease-out]'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {previewMeeting.image ? (
                <img src={previewMeeting.image} alt={displayText(previewMeeting.date)} className="h-[320px] w-full object-cover" />
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                  <div className="text-center">
                    <Images className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="mt-2 text-sm text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Close PTM preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-lg font-bold text-slate-900">{displayText(previewMeeting.date)}</p>
              <p className="text-sm text-slate-700">{displayText(previewMeeting.description)}</p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

const EMPTY_FACULTY_SLOTS = 4;

function todayKeyLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function PsFacultySection({
  faculty,
  profile,
  sectionTitle = 'Faculty',
  subjectLabel = 'Subject',
  showAttendance = true,
}: {
  faculty: Faculty[];
  profile: Record<string, unknown>;
  sectionTitle?: string;
  subjectLabel?: string;
  showAttendance?: boolean;
}) {
  const list = (faculty.length ? faculty : Array.from({ length: EMPTY_FACULTY_SLOTS }, () => ({} as Faculty))).slice(0, 8);
  const desktopPageSize = 4;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [previewFaculty, setPreviewFaculty] = useState<{ faculty: Faculty; index: number } | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);

  const attendanceByDay = (() => {
    const raw = profile.faculty_attendance;
    if (!raw) return {} as Record<string, Record<string, boolean>>;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, Record<string, boolean>>) : {};
      } catch {
        return {};
      }
    }
    return typeof raw === 'object' ? (raw as Record<string, Record<string, boolean>>) : {};
  })();
  const today = todayKeyLocal();
  const isPresentToday = (index: number): boolean => Boolean(attendanceByDay[today]?.[`row_${index}`]);

  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreviewFaculty(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);
  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{sectionTitle}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous faculty">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next faculty">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous faculty set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next faculty set">›</button>
        </div>
      </div>

      {/* Mobile: 1 card slide */}
      <div className="mt-6 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((f, i) => (
            <article key={`${f.name || 'faculty-mobile'}-${i}`} className="w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => {
                  setIsPreviewClosing(false);
                  setPreviewFaculty({ faculty: f, index: i });
                }}
                aria-label={`Open ${displayText(f.name)} details`}
              >
                {asString(f.photo) ? (
                  <div className="flex h-[280px] w-full items-center justify-center bg-slate-100">
                    <img
                      src={asString(f.photo)}
                      alt={displayText(f.name)}
                      className="max-h-full max-w-full object-contain object-center"
                    />
                  </div>
                ) : (
                  <div className="flex h-[280px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                    <div className="text-center">
                      <Images className="mx-auto h-6 w-6 text-slate-500" />
                      <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                    </div>
                  </div>
                )}
              </button>
              <div className="p-4">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">{displayText(f.name)}</h3>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold">{subjectLabel}:</span> {displayText(f.subject)}
                </p>
                <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Qualification:</span> {displayText(f.qualification)}</p>
                {asString(f.designation) ? (
                  <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Designation:</span> {displayText(f.designation)}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Desktop: 4 cards per slide */}
      <div className="mt-6 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`faculty-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 lg:grid-cols-4">
                  {pageCards.map((f, i) => (
                    <article key={`${f.name || 'faculty-desktop'}-${pageIdx}-${i}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => {
                          setIsPreviewClosing(false);
                          setPreviewFaculty({ faculty: f, index: pageIdx * desktopPageSize + i });
                        }}
                        aria-label={`Open ${displayText(f.name)} details`}
                      >
                        {asString(f.photo) ? (
                          <div className="flex h-[320px] w-full items-center justify-center bg-slate-100">
                            <img
                              src={asString(f.photo)}
                              alt={displayText(f.name)}
                              className="max-h-full max-w-full object-contain object-center"
                            />
                          </div>
                        ) : (
                          <div className="flex h-[320px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                            <div className="text-center">
                              <Images className="mx-auto h-6 w-6 text-slate-500" />
                              <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="p-4">
                        <h3 className="text-lg font-bold tracking-tight text-slate-900">{displayText(f.name)}</h3>
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-semibold">{subjectLabel}:</span> {displayText(f.subject)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Qualification:</span> {displayText(f.qualification)}</p>
                        {asString(f.designation) ? (
                          <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Designation:</span> {displayText(f.designation)}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {previewFaculty && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          style={{ animation: isPreviewClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onClick={closePreview}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-lg bg-white"
            style={{ animation: isPreviewClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {asString(previewFaculty.faculty.photo) ? (
                <div className="flex max-h-[min(75vh,600px)] min-h-[200px] w-full items-center justify-center bg-slate-100">
                  <img
                    src={asString(previewFaculty.faculty.photo)}
                    alt={displayText(previewFaculty.faculty.name)}
                    className="max-h-[min(75vh,600px)] w-full object-contain object-center"
                  />
                </div>
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center bg-slate-100">
                  <p className="text-sm text-slate-500">{EMPTY}</p>
                </div>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/65 text-white hover:bg-black/80"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{displayText(previewFaculty.faculty.name)}</h3>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">{subjectLabel}:</span> {displayText(previewFaculty.faculty.subject)}
              </p>
              <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Qualification:</span> {displayText(previewFaculty.faculty.qualification)}</p>
              {asString(previewFaculty.faculty.designation) ? (
                <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Designation:</span> {displayText(previewFaculty.faculty.designation)}</p>
              ) : null}
              {showAttendance ? (
                <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Attendance ({today}): {isPresentToday(previewFaculty.index) ? 'Present' : 'Absent'}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

export function PsMediaSections({ infraImages, activityImages, gallery }: { infraImages: GalleryItem[]; activityImages: GalleryItem[]; gallery: GalleryItem[] }) {
  const infraSlots = infraImages.length ? infraImages : Array.from({ length: 6 }, () => ({} as GalleryItem));
  const activitySlots = activityImages.length ? activityImages : Array.from({ length: 4 }, () => ({} as GalleryItem));
  const gallerySlots = gallery.length ? gallery : Array.from({ length: 8 }, () => ({} as GalleryItem));
  return (
    <>
      <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-md md:p-7">
        <div className="flex items-center gap-2"><School className="h-5 w-5 text-sky-600" /><h2 className="text-xl font-bold">Infrastructure</h2></div>
        <div className="mt-4 columns-1 gap-3 sm:columns-2 lg:columns-3">
          {infraSlots.map((it, i) => (
            <div key={`${it.image || 'infra'}-${i}`} className="mb-3 break-inside-avoid">
              <ImageCard src={it.image} alt={displayText(it.title)} title={displayText(it.title)} subtitle={displayText(it.category)} tall={i % 2 === 0} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-white to-amber-50 p-5 shadow-md md:p-7">
        <div className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-600" /><h2 className="text-xl font-bold">Activities & Events</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activitySlots.map((it, i) => (
            <ImageCard key={`${it.image || 'act'}-${i}`} src={it.image} alt={displayText(it.title)} title={displayText(it.title)} subtitle={displayText(it.category)} />
          ))}
        </div>
      </section>

      <section id="gallery" className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-md md:p-7">
        <h2 className="text-xl font-bold sm:text-2xl">Photo Gallery</h2>
        <div className="mt-4 grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-4">
          {gallerySlots.map((g, i) => (
            <ImageCard key={`${g.image || 'gallery'}-${i}`} src={g.image} alt={displayText(g.title)} title={displayText(g.title)} subtitle={displayText(g.category)} className={`${i % 5 === 0 ? 'col-span-2 row-span-2' : ''} ${i % 7 === 0 ? 'row-span-2' : ''}`} />
          ))}
        </div>
      </section>
    </>
  );
}

const EMPTY_GALLERY_SLOTS = 8;

export function PsGallerySection({ gallery }: { gallery: GalleryItem[] }) {
  const items = gallery.length ? gallery : Array.from({ length: EMPTY_GALLERY_SLOTS }, () => ({} as GalleryItem));
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);
  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreview(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  return (
    <section id="gallery" className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Gallery</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-flow-dense auto-rows-[120px] grid-cols-4 gap-3 sm:auto-rows-[140px]">
        {items.map((item, idx) => (
          <button
            key={`${item.image || 'gallery'}-${idx}`}
            type="button"
            onClick={() => {
              setIsPreviewClosing(false);
              setPreview(item);
            }}
            className={`group overflow-hidden rounded-2xl text-left
              ${idx % 8 === 0 ? 'col-span-1 row-span-1' : ''}
              ${idx % 8 === 1 ? 'col-span-2 row-span-1' : ''}
              ${idx % 8 === 2 ? 'col-span-1 row-span-2' : ''}
              ${idx % 8 === 3 ? 'col-span-2 row-span-1' : ''}
              ${idx % 8 === 4 ? 'col-span-1 row-span-2' : ''}
              ${idx % 8 === 5 ? 'col-span-1 row-span-1' : ''}
              ${idx % 8 === 6 ? 'col-span-1 row-span-1' : ''}
              ${idx % 8 === 7 ? 'col-span-1 row-span-1' : ''}
            `}
            aria-label={`Open ${displayText(asString(item.title) || asString(item.category))}`}
          >
            {asString(item.image) ? (
              <img
                src={asString(item.image)}
                alt={displayText(asString(item.title) || asString(item.category))}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                <div className="text-center">
                  <Images className="mx-auto h-6 w-6 text-slate-500" />
                  <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          style={{ animation: isPreviewClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onClick={closePreview}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-lg bg-white"
            style={{ animation: isPreviewClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {asString(preview.image) ? (
                <img src={asString(preview.image)} alt={displayText(asString(preview.title) || asString(preview.category))} className="max-h-[75vh] w-full object-contain bg-slate-100" />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center bg-slate-100">
                  <p className="text-sm text-slate-500">{EMPTY}</p>
                </div>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/65 text-white hover:bg-black/80"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                {displayText(asString(preview.title) || asString(preview.category))}
              </h3>
              {asString(preview.category) ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{displayText(preview.category)}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{displayText(preview.description)}</p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

const EMPTY_INTAKE_SLOTS = 5;

export function PsIntakeSection({ intakeRows, profile }: { intakeRows: IntakeRow[]; profile?: Record<string, unknown> }) {
  const intakeCardsFromProfile = profile ? parseArray<IntakeCard>(profile.intake_cards) : [];
  const fromRows: IntakeCard[] = intakeRows.map((r) => {
    const rec = r as Record<string, unknown>;
    const regRaw = rec.registered_this_year ?? rec.registered_students_this_year;
    return {
      class_name: r.class_name,
      strength: r.intake,
      registered_this_year:
        typeof regRaw === 'number' || typeof regRaw === 'string' ? regRaw : '',
      subjects: asString(rec.subjects),
      image: asString(rec.image),
    };
  });
  const merged = intakeCardsFromProfile.length ? intakeCardsFromProfile : fromRows.length ? fromRows : [];
  const list: IntakeCard[] = merged.length ? merged : Array.from({ length: EMPTY_INTAKE_SLOTS }, () => ({} as IntakeCard));
  const desktopPageSize = 3;
  const desktopTotalPages = Math.max(1, Math.ceil(list.length / desktopPageSize));
  const [currentDesktopPage, setCurrentDesktopPage] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [previewCard, setPreviewCard] = useState<IntakeCard | null>(null);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);

  const goPrevDesktop = () => setCurrentDesktopPage((p) => (p - 1 + desktopTotalPages) % desktopTotalPages);
  const goNextDesktop = () => setCurrentDesktopPage((p) => (p + 1) % desktopTotalPages);
  const goPrevMobile = () => setCurrentMobileSlide((p) => (p - 1 + list.length) % list.length);
  const goNextMobile = () => setCurrentMobileSlide((p) => (p + 1) % list.length);
  const closePreview = () => {
    setIsPreviewClosing(true);
    window.setTimeout(() => {
      setPreviewCard(null);
      setIsPreviewClosing(false);
    }, 180);
  };

  return (
    <section className="py-2 md:py-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Class</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrevMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Previous intake">‹</button>
          <button type="button" onClick={goNextMobile} className="h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:hidden" aria-label="Next intake">›</button>
          <button type="button" onClick={goPrevDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Previous intake set">‹</button>
          <button type="button" onClick={goNextDesktop} className="hidden h-9 w-9 rounded-full bg-slate-900 text-white transition hover:bg-slate-700 md:inline-flex md:items-center md:justify-center" aria-label="Next intake set">›</button>
        </div>
      </div>

      {/* Mobile: 1 card per slide */}
      <div className="mt-6 overflow-hidden md:hidden">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMobileSlide * 100}%)` }}>
          {list.map((item, i) => (
            <button
              key={`${item.class_name || 'intake-mobile'}-${i}`}
              type="button"
              onClick={() => {
                setIsPreviewClosing(false);
                setPreviewCard(item);
              }}
              className="w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
              aria-label={`Open ${displayText(item.class_name)}`}
            >
              {asString(item.image) ? (
                <img src={asString(item.image)} alt={item.class_name || 'Classroom'} className="h-[230px] w-full object-cover" />
              ) : (
                <div className="flex h-[230px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                  <div className="text-center">
                    <Images className="mx-auto h-6 w-6 text-slate-500" />
                    <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">{displayText(item.class_name)}</h3>
                <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Strength:</span> {item.strength != null && String(item.strength).trim() ? String(item.strength) : EMPTY}</p>
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Registered this year:</span> {item.registered_this_year != null && String(item.registered_this_year).trim() ? String(item.registered_this_year) : EMPTY}</p>
                <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Subjects:</span> {displayText(item.subjects)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: 3 cards per slide */}
      <div className="mt-6 hidden overflow-hidden md:block">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentDesktopPage * 100}%)` }}>
          {Array.from({ length: desktopTotalPages }).map((_, pageIdx) => {
            const pageCards = list.slice(pageIdx * desktopPageSize, pageIdx * desktopPageSize + desktopPageSize);
            return (
              <article key={`intake-page-${pageIdx}`} className="w-full shrink-0">
                <div className="grid gap-5 lg:grid-cols-3">
                  {pageCards.map((item, i) => (
                    <button
                      key={`${item.class_name || 'intake-desktop'}-${pageIdx}-${i}`}
                      type="button"
                      onClick={() => {
                        setIsPreviewClosing(false);
                        setPreviewCard(item);
                      }}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
                      aria-label={`Open ${displayText(item.class_name)}`}
                    >
                      {asString(item.image) ? (
                        <img src={asString(item.image)} alt={item.class_name || 'Classroom'} className="h-[250px] w-full object-cover" />
                      ) : (
                        <div className="flex h-[250px] w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
                          <div className="text-center">
                            <Images className="mx-auto h-6 w-6 text-slate-500" />
                            <p className="mt-2 text-xs text-slate-600">{EMPTY}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-xl font-bold tracking-tight text-slate-900">{displayText(item.class_name)}</h3>
                        <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Strength:</span> {item.strength != null && String(item.strength).trim() ? String(item.strength) : EMPTY}</p>
                        <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Registered this year:</span> {item.registered_this_year != null && String(item.registered_this_year).trim() ? String(item.registered_this_year) : EMPTY}</p>
                        <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Subjects:</span> {displayText(item.subjects)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {previewCard && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          style={{ animation: isPreviewClosing ? 'psModalFadeOut 180ms ease-in forwards' : 'psModalFadeIn 180ms ease-out' }}
          onClick={closePreview}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-lg bg-white"
            style={{ animation: isPreviewClosing ? 'psModalScaleOut 180ms ease-in forwards' : 'psModalScaleIn 220ms ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {asString(previewCard.image) ? (
                <img src={asString(previewCard.image)} alt={previewCard.class_name || 'Classroom'} className="max-h-[70vh] w-full object-contain bg-slate-100" />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center bg-slate-100">
                  <p className="text-sm text-slate-500">{EMPTY}</p>
                </div>
              )}
              <button
                type="button"
                onClick={closePreview}
                className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/65 text-white hover:bg-black/80"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{displayText(previewCard.class_name)}</h3>
              <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Strength:</span> {previewCard.strength != null && String(previewCard.strength).trim() ? String(previewCard.strength) : EMPTY}</p>
              <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Registered this year:</span> {previewCard.registered_this_year != null && String(previewCard.registered_this_year).trim() ? String(previewCard.registered_this_year) : EMPTY}</p>
              <p className="mt-1 text-sm text-slate-600"><span className="font-semibold">Subjects:</span> {displayText(previewCard.subjects)}</p>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes psModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psModalScaleIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes psModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes psModalScaleOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
        }
      `}</style>
    </section>
  );
}

export function PsContactSection({ org, profile, language }: { org: Organization; profile: Record<string, unknown>; language: Lang }) {
  const address = getText(profile, 'contact_address', language) || asString(profile.contact_address_od) || org.address || EMPTY;
  const phone = asString(profile.contact_phone) || asString(profile.contact_of_hm) || EMPTY;
  const emergencyPhone =
    asString(profile.health_emergency_phone) || asString(profile.emergency_phone) || '';
  const email = asString(profile.contact_email) || EMPTY;
  const officeHours = getText(profile, 'office_hours', language) || EMPTY;
  const hasMap = org.latitude != null && org.longitude != null;
  const mapSrc = hasMap
    ? `https://maps.google.com/maps?q=${org.latitude},${org.longitude}&z=15&output=embed`
    : '';

  return (
    <section className="py-3 md:py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Contact</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <article className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Address
            </div>
            <p className="mt-2 text-base leading-relaxed text-slate-800">{address}</p>
          </article>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Phone className="h-4 w-4 text-indigo-600" />
                {emergencyPhone ? 'Helpdesk phone' : 'Phone'}
              </div>
              <p className="mt-2 text-base text-slate-800">{phone}</p>
            </article>

            {emergencyPhone ? (
              <article className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Phone className="h-4 w-4 text-rose-600" />
                  Emergency phone
                </div>
                <p className="mt-2 text-base text-slate-800">{emergencyPhone}</p>
              </article>
            ) : null}

            <article className={`border-b border-slate-200 pb-5 ${emergencyPhone ? 'sm:col-span-2' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Mail className="h-4 w-4 text-indigo-600" />
                Email
              </div>
              <p className="mt-2 break-all text-base text-slate-800">{email}</p>
            </article>
          </div>

          <article className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Clock className="h-4 w-4 text-indigo-600" />
              Office Hours
            </div>
            <p className="mt-2 text-base text-slate-800">{officeHours}</p>
          </article>
        </div>

        <article>
          <div className="flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <MapPin className="h-4 w-4" />
            Location Map
          </div>
          <div className="h-[320px] overflow-hidden rounded-2xl">
            {hasMap ? (
              <iframe
                title="School map"
                src={mapSrc}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <MapPin className="h-6 w-6 text-slate-400" />
                <p className="mt-3 text-3xl font-light text-slate-400">{EMPTY}</p>
              </div>
            )}
          </div>
          {hasMap && <p className="pt-2 text-xs text-slate-600">{`Lat: ${org.latitude} · Lng: ${org.longitude}`}</p>}
        </article>
      </div>
    </section>
  );
}
