'use client';

import { Organization, EducationSchoolMaster, EducationInfrastructure } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { ImageSlider } from './ImageSlider';

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

export interface EducationPortfolioDashboardProps {
  org: Organization;
  schoolMaster: EducationSchoolMaster | null;
  infra: EducationInfrastructure | null;
  /** Raw profile from CSV-based API (educationApi.getProfile) */
  educationProfile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function EducationPortfolioDashboard({
  org,
  schoolMaster,
  infra,
  educationProfile,
  departmentName,
  images = [],
}: EducationPortfolioDashboardProps) {
  const { language } = useLanguage();
  const locationLine =
    [
      org.address,
      org.latitude != null && org.longitude != null
        ? `${org.latitude.toFixed(5)}, ${org.longitude.toFixed(5)}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || null;

  const totalStudents =
    (educationProfile.students_enrolled as number | undefined) ??
    (educationProfile.total_students as number | undefined) ??
    null;
  const totalTeachers =
    (educationProfile.no_of_ts as number | undefined) ??
    (educationProfile.total_teachers as number | undefined) ??
    null;
  const classrooms = infra?.classrooms ?? null;
  const smartClassrooms = infra?.smart_classrooms ?? null;

  const stats = [
    { label: t('edu.stat.students', language), value: totalStudents },
    { label: t('edu.stat.teachers', language), value: totalTeachers },
    { label: t('edu.stat.classrooms', language), value: classrooms },
    { label: t('edu.stat.smartClassrooms', language), value: smartClassrooms },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero: image slider */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="rounded-none" />
      </section>

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 px-4 pb-4 pt-6 shadow-sm backdrop-blur-sm sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                {t('edu.badge', language)}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {org.name}
              </h1>
              {departmentName && (
                <p className="mt-1 text-sm text-slate-600">{departmentName}</p>
              )}
              {locationLine && (
                <p className="mt-0.5 text-xs text-slate-500">{locationLine}</p>
              )}
            </div>
            {schoolMaster?.udise_code && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-500/10 px-3 py-2 text-xs text-slate-600 shadow-sm">
                <div className="font-semibold text-amber-800/90">UDISE code</div>
                <div className="mt-0.5 text-sm font-mono text-slate-900">
                  {schoolMaster.udise_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats – each card with a distinct transparent tint */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value }, i) => {
            const tints = [
              'border-amber-200/80 bg-amber-500/10 hover:bg-amber-500/15',
              'border-emerald-200/80 bg-emerald-500/10 hover:bg-emerald-500/15',
              'border-sky-200/80 bg-sky-500/10 hover:bg-sky-500/15',
              'border-violet-200/80 bg-violet-500/10 hover:bg-violet-500/15',
            ];
            return (
              <div
                key={label}
                className={`rounded-xl border p-4 shadow-sm transition ${tints[i % tints.length]}`}
              >
                <p className="text-2xl font-bold text-slate-900">{formatVal(value)}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Details – distinct transparent sections */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* School profile – teal tint */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-teal-200/60 bg-teal-500/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                {t('edu.schoolProfileTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {t('edu.schoolProfileSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">School type</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.school_type)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Board</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.board)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Medium</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.medium)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Management</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.management_type)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">District</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.district)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Block</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.block)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Village</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.village)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Established year
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.established_year)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Status</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(schoolMaster?.school_status)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure – indigo tint */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-indigo-200/60 bg-indigo-500/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-800">
                {t('edu.infraTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {t('edu.infraSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Classrooms</td>
                    <td className="px-4 py-2 text-slate-900">{formatVal(infra?.classrooms)}</td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Smart classrooms
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.smart_classrooms)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Science labs</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.labs_science)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Computer labs</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.labs_computer)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Library books
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.library_books)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Toilets (boys)
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.toilets_boys)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Toilets (girls)
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.toilets_girls)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Sports ground
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.sports_ground ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Drinking water
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.drinking_water ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Electricity
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.electricity ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Internet</td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.internet ? 'Yes' : 'No'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

