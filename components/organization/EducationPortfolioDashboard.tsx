'use client';

import { Organization, EducationSchoolMaster, EducationInfrastructure } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { ImageSlider } from './ImageSlider';
import { getEducationProfileLabel, EDUCATION_PROFILE_KEYS } from '../../lib/profileLabels';

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

  const toNumber = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Total students = sum of class-wise counts when available; otherwise use any total_* fields
  const classKeys = [
    'class_i',
    'class_ii',
    'class_iii',
    'class_iv',
    'class_v',
    'class_vi',
    'class_vii',
    'class_viii',
    'class_ix',
    'class_x',
  ] as const;

  const summedByClass = classKeys.reduce<number | null>((acc, key) => {
    const v = toNumber((educationProfile as any)[key]);
    if (v == null) return acc;
    return (acc ?? 0) + v;
  }, null);

  const totalStudents =
    summedByClass ??
    toNumber((educationProfile as any).students_enrolled) ??
    toNumber((educationProfile as any).total_students);

  const totalTeachers =
    toNumber((educationProfile as any).no_of_ts) ??
    toNumber((educationProfile as any).total_teachers);

  // Classrooms and smart classrooms from CSV profile (no_of_rooms / no_of_smart_class_rooms)
  const classrooms =
    toNumber((educationProfile as any).no_of_rooms) ?? infra?.classrooms ?? null;
  const smartClassrooms =
    toNumber((educationProfile as any).no_of_smart_class_rooms) ??
    infra?.smart_classrooms ??
    null;

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
        <div className="mx-auto max-w-[1920px]">
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
      <section className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 lg:px-10">
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

      {/* Details – show only Education CSV / OrganizationProfile.data fields */}
      <section className="mx-auto max-w-[1920px] px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(educationProfile || {})
            .filter(([, v]) => v != null && String(v).trim() !== '')
            .sort(([aKey], [bKey]) => {
              const ia = EDUCATION_PROFILE_KEYS.indexOf(aKey);
              const ib = EDUCATION_PROFILE_KEYS.indexOf(bKey);
              if (ia === -1 && ib === -1) return aKey.localeCompare(bKey);
              if (ia === -1) return 1;
              if (ib === -1) return -1;
              return ia - ib;
            })
            .reduce<[Array<[string, unknown]>, Array<[string, unknown]>]>(
              (cols, entry, idx) => {
                cols[idx % 2].push(entry);
                return cols;
              },
              [[], []],
            )
            .map((colEntries, colIdx) => (
              <div
                key={colIdx}
                className="rounded-xl border border-teal-200/80 bg-teal-500/5 shadow-sm overflow-hidden"
              >
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
                      {colEntries.map(([key, value]) => (
                        <tr
                          key={key}
                          className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors"
                        >
                          <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                            {getEducationProfileLabel(key)}
                          </td>
                          <td className="px-4 py-2 text-slate-900">
                            {formatVal(value as string | number | null | undefined)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

