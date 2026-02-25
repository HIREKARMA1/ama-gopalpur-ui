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
  const prettySubDepartment =
    org.sub_department === 'ENGINEERING_COLLEGE'
      ? 'ENGINEERING COLLEGE'
      : org.sub_department === 'DIPLOMA_COLLEGE'
      ? 'DIPLOMA COLLEGE'
      : org.sub_department === 'UNIVERSITY'
      ? 'UNIVERSITY'
      : org.sub_department === 'ITI'
      ? 'ITI'
      : org.sub_department === 'SCHOOL'
      ? 'SCHOOL'
      : null;

  const departmentBadgeText =
    [departmentName?.toUpperCase(), prettySubDepartment]?.filter(Boolean).join(' - ') ||
    t('edu.badge', language);
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

  type Stat = { label: string; value: number | string | null; sourceKey?: string };

  let stats: Stat[];

  if (org.sub_department === 'ENGINEERING_COLLEGE') {
    const btechBranches = toNumber((educationProfile as any)['b.tech_branches_count']);
    const mtechProgrammes = toNumber((educationProfile as any)['m.tech_programmes_count']);
    const highestPackageLpa =
      (educationProfile as any).highest_package_lpa ??
      (educationProfile as any)['highest_package_lpa'] ??
      null;
    const placementPercent = (educationProfile as any)['placement_percentage_last_year'] ?? null;

    stats = [
      { label: 'B.Tech branches', value: btechBranches, sourceKey: 'b.tech_branches_count' },
      { label: 'M.Tech programmes', value: mtechProgrammes, sourceKey: 'm.tech_programmes_count' },
      { label: 'Highest Package (LPA)', value: highestPackageLpa, sourceKey: 'highest_package_lpa' },
      { label: 'Placement % (last year)', value: placementPercent, sourceKey: 'placement_percentage_last_year' },
    ];
  } else if (org.sub_department === 'UNIVERSITY') {
    const naacGrade =
      (educationProfile as any).naac_grade ??
      (educationProfile as any).naac ??
      null;
    const placementPct =
      (educationProfile as any)['placement_percent_last_year'] ??
      (educationProfile as any).placement_percentage_last_year ??
      (educationProfile as any)['placement_%_last_year'] ??
      null;
    const totalDepts = toNumber((educationProfile as any).total_departments);
    const totalAffiliated = toNumber((educationProfile as any).total_affiliated_colleges);

    stats = [
      { label: 'NAAC Grade', value: naacGrade, sourceKey: 'naac_grade' },
      { label: 'Placement % (last year)', value: placementPct, sourceKey: 'placement_percent_last_year' },
      { label: 'Total Departments', value: totalDepts, sourceKey: 'total_departments' },
      { label: 'Total Affiliated Colleges', value: totalAffiliated, sourceKey: 'total_affiliated_colleges' },
    ];
  } else if (org.sub_department === 'ITI') {
    const totalSeatsAllTrades = toNumber((educationProfile as any).total_seats_all_trades);
    const totalInstructors = toNumber((educationProfile as any).total_instructors);
    const placementPctIti =
      (educationProfile as any).placement_percentage_last_year ??
      (educationProfile as any)['placement_percentage_last_year'] ??
      null;
    const highestSalaryMonthly =
      toNumber((educationProfile as any).highest_salary_monthly_rs) ??
      toNumber((educationProfile as any)['highest_salary_monthly_rs']);

    stats = [
      { label: 'Total Seats (all trades)', value: totalSeatsAllTrades, sourceKey: 'total_seats_all_trades' },
      { label: 'Total Instructors', value: totalInstructors, sourceKey: 'total_instructors' },
      { label: 'Placement % (last year)', value: placementPctIti, sourceKey: 'placement_percentage_last_year' },
      { label: 'Highest Salary (monthly Rs)', value: highestSalaryMonthly, sourceKey: 'highest_salary_monthly_rs' },
    ];
  } else {
    stats = [
      { label: t('edu.stat.students', language), value: totalStudents, sourceKey: 'total_students' },
      { label: t('edu.stat.teachers', language), value: totalTeachers, sourceKey: 'total_teachers' },
      { label: t('edu.stat.classrooms', language), value: classrooms, sourceKey: 'no_of_rooms' },
      { label: t('edu.stat.smartClassrooms', language), value: smartClassrooms, sourceKey: 'no_of_smart_class_rooms' },
    ];
  }

  // Build final stats: only real data, and if any of the preferred metrics are missing,
  // fill remaining slots with other numeric attributes from the profile.
  const hasValue = (v: number | string | null) =>
    v != null && v !== '' && String(v).trim() !== '';

  let finalStats: Stat[] = stats.filter((s) => hasValue(s.value));

  if (finalStats.length < 4) {
    const numericEntries = Object.entries(educationProfile || {}).filter(([key, v]) => {
      if (key === 'latitude' || key === 'longitude') return false;
      return toNumber(v) != null;
    });

    for (const [key, v] of numericEntries) {
      if (finalStats.length >= 4) break;
      if (finalStats.some((s) => s.sourceKey === key)) continue;
      const num = toNumber(v);
      if (num == null) continue;
      finalStats.push({
        label: getEducationProfileLabel(key),
        value: num,
        sourceKey: key,
      });
    }
  }

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
                {departmentBadgeText}
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

      {/* Stats – show up to four cards, always backed by real data */}
      {finalStats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {finalStats.map(({ label, value }, i) => {
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
      )}

      {/* Details – show only Education CSV / OrganizationProfile.data fields */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
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

