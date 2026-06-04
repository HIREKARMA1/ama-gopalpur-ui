'use client';

import { ExternalLink } from 'lucide-react';
import { asList, asString } from '../EducationPsSections';

type TrainingPlacementSectionProps = {
  profile: Record<string, unknown>;
  isIti?: boolean;
  /** Resolved placement-cell URL (engineering colleges only). */
  placementRecordsUrl?: string | null;
};

export function TrainingPlacementSection({
  profile,
  isIti = false,
  placementRecordsUrl = null,
}: TrainingPlacementSectionProps) {
  const officerName = asString(profile.placement_officer_name);
  const officerPhoto = asString(profile.placement_officer_photo);
  const officerQualification = asString(profile.placement_officer_qualification);
  const officerContact = asString(profile.placement_officer_contact);
  const officerEmail = asString(profile.placement_officer_email);
  const officerExpFrom = asString(profile.placement_officer_experience_from);
  const officerExpTo = asString(profile.placement_officer_experience_to);
  const placementPercentage = asString(profile.placement_percentage_last_year || profile.placement_percentage);
  const highestPackage = asString(profile.highest_package_lpa);
  const placementPartners = asList(profile.placement_partners);
  const sectionTitle = isIti ? 'Apprenticeship and Placement' : 'Training and Placement';

  return (
    <section className="py-2 md:py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{sectionTitle}</h2>
        {placementRecordsUrl ? (
          <a
            href={placementRecordsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            View Placement Records
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        ) : null}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {officerPhoto ? (
            <div className="flex h-56 w-full items-center justify-center bg-slate-100">
              <img src={officerPhoto} alt={officerName || 'Placement officer'} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
              <p className="text-sm text-slate-500">-</p>
            </div>
          )}
          <div className="space-y-1.5 p-4 text-sm text-slate-700">
            <p><span className="font-semibold">Name:</span> {officerName || '-'}</p>
            <p><span className="font-semibold">Designation:</span> Placement Officer</p>
            <p><span className="font-semibold">Qualification:</span> {officerQualification || '-'}</p>
            <p><span className="font-semibold">Contact:</span> {officerContact || '-'}</p>
            <p><span className="font-semibold">Email:</span> {officerEmail || '-'}</p>
            <p><span className="font-semibold">Experience:</span> {officerExpFrom || '-'} to {officerExpTo || '-'}</p>
          </div>
        </article>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Placement Percentage (Last Year)</p>
              <p className="mt-2 text-4xl font-extrabold leading-none text-slate-900">{placementPercentage || '-'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Highest Package (LPA)</p>
              <p className="mt-2 text-4xl font-extrabold leading-none text-slate-900">{highestPackage || '-'}</p>
            </div>
          </div>
          {placementPartners.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Placement Partners</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {placementPartners.map((partner) => (
                  <span key={partner} className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
