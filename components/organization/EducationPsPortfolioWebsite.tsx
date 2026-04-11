'use client';

import { Organization } from '../../services/api';
import {
  parseArray,
  type Faculty,
  type FacilityCard,
  type IntakeRow,
  type MdmDailyRecord,
  type ParentTeacherMeetingRecord,
  type Lang,
  PsHeroSection,
  PsAboutSection,
  PsAdministrationSection,
  PsFacilitiesCarouselSection,
  PsMidDayMealSection,
  PsParentTeacherMeetingSection,
  PsFacultySection,
  PsGallerySection,
  PsIntakeSection,
  PsContactSection,
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
  const isHighSchool = (org.sub_department || '').toUpperCase() === 'HS';
  const mdmDaily = parseArray<MdmDailyRecord>(profile.mdm_daily_records ?? profile.mdm_daily ?? profile.mid_day_meal_daily);
  const ptmMeetings = parseArray<ParentTeacherMeetingRecord>(
    profile.parent_teacher_meetings ?? profile.ptm_meetings ?? profile.parent_teacher_meeting_records,
  );

  const sliderImages = images.length ? images : org.cover_image_key ? [org.cover_image_key] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={profile} language={language} sliderImages={sliderImages} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection org={org} profile={profile} language={language} sliderImages={sliderImages} />
        <PsAdministrationSection profile={profile} subDepartment={org.sub_department || undefined} />
        <PsFacilitiesCarouselSection profile={profile} facilities={facilities} />
        {!isHighSchool ? <PsMidDayMealSection records={mdmDaily} /> : null}
        <PsParentTeacherMeetingSection records={ptmMeetings} />
        <PsFacultySection faculty={faculty} profile={profile} />
        <PsGallerySection gallery={gallery} />
        <PsIntakeSection intakeRows={intakeRows} profile={profile} />
        <PsContactSection org={org} profile={profile} language={language} />
      </main>
    </div>
  );
}
