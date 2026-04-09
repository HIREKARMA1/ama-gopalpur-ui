'use client';

import { Organization } from '../../services/api';
import {
  parseArray,
  type Faculty,
  type FacilityCard,
  type IntakeRow,
  type Testimonial,
  type Lang,
  PsHeroSection,
  PsAboutSection,
  PsAdministrationSection,
  PsFacilitiesCarouselSection,
  PsFacultySection,
  PsGallerySection,
  PsIntakeSection,
  PsTestimonialsSection,
  PsFaqSection,
  PsContactSection,
  PsOptionalExtrasSection,
} from './EducationPsSections';

type PsPortfolioProps = {
  org: Organization;
  profile: Record<string, unknown>;
  images?: string[];
  language?: Lang;
};

export function EducationPsPortfolioWebsite({ org, profile, images = [], language = 'en' }: PsPortfolioProps) {
  const faculty = parseArray<Faculty>(profile.faculty_cards);
  const facilities = parseArray<FacilityCard>(profile.facility_cards);
  const gallery = parseArray<{ image?: string; category?: string; title?: string; description?: string }>(profile.photo_gallery);
  const intakeRows = parseArray<IntakeRow>(profile.student_intake_rows);
  const testimonials = parseArray<Testimonial>(profile.testimonials);

  const sliderImages = images.length ? images : org.cover_image_key ? [org.cover_image_key] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={profile} language={language} sliderImages={sliderImages} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection org={org} profile={profile} language={language} sliderImages={sliderImages} />
        <PsAdministrationSection profile={profile} />
        <PsFacilitiesCarouselSection profile={profile} facilities={facilities} />
        <PsFacultySection faculty={faculty} />
        <PsGallerySection gallery={gallery} />
        <PsIntakeSection intakeRows={intakeRows} profile={profile} />
        <PsTestimonialsSection testimonials={testimonials} />
        <PsFaqSection profile={profile} />
        <PsOptionalExtrasSection profile={profile} language={language} />
        <PsContactSection org={org} profile={profile} language={language} />
      </main>
    </div>
  );
}
