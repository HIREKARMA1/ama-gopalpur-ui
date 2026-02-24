'use client';

import {
  Organization,
  HealthFacilityMaster,
  HealthInfrastructure,
  HealthStaff,
} from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getHealthProfileLabel, HEALTH_PROFILE_KEYS } from '../../lib/profileLabels';

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

export interface HealthPortfolioDashboardProps {
  org: Organization;
  facilityMaster: HealthFacilityMaster | null;
  infra: HealthInfrastructure | null;
  healthProfile: Record<string, unknown>;
  staff: HealthStaff[];
  departmentName?: string | null;
  images?: string[];
}

export function HealthPortfolioDashboard({
  org,
  facilityMaster,
  infra,
  healthProfile,
  staff,
  departmentName,
  images = [],
}: HealthPortfolioDashboardProps) {
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

  // OPD / IPD: only show when explicitly provided (do not approximate with staff counts)
  const totalOpd = (healthProfile.total_opd as number | string | undefined) ?? null;
  const totalIpd = (healthProfile.total_ipd as number | string | undefined) ?? null;
  const beds =
    healthProfile.no_of_bed ??
    facilityMaster?.num_beds ??
    infra?.beds_total ??
    null;
  const icuBeds =
    healthProfile.no_of_icu ?? infra?.icu_beds ?? null;

  const stats = [
    { label: t('health.stat.opd', language), value: totalOpd },
    { label: t('health.stat.ipd', language), value: totalIpd },
    { label: t('health.stat.beds', language), value: beds },
    { label: t('health.stat.icuBeds', language), value: icuBeds },
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
                {t('health.badge', language)}
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
            {facilityMaster?.facility_type && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-500/10 px-3 py-2 text-xs text-slate-600 shadow-sm">
                <div className="font-semibold text-amber-800/90">
                  {t('health.facilityProfileTitle', language)}
                </div>
                <div className="mt-0.5 text-sm text-slate-900">
                  {facilityMaster.facility_type}
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

      {/* Profile fields – only keys that exist in CSV/DB */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(healthProfile || {})
            .filter(([, v]) => v != null && String(v).trim() !== '')
            .sort(([aKey], [bKey]) => {
              const ia = HEALTH_PROFILE_KEYS.indexOf(aKey);
              const ib = HEALTH_PROFILE_KEYS.indexOf(bKey);
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
                    {t('health.facilityProfileTitle', language)}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {t('health.facilityProfileSubtitle', language)}
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
                            {getHealthProfileLabel(key)}
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

        {/* Staff table full width – rose tint */}
        {staff.length > 0 && (
          <div className="mt-6 rounded-xl border border-rose-200/80 bg-rose-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-rose-200/60 bg-rose-500/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-800">
                Key staff
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Medical officers, nurses and support staff.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-rose-500/10">
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Role</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Qualification</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-2">{formatVal(s.name)}</td>
                      <td className="px-4 py-2">{formatVal(s.role)}</td>
                      <td className="px-4 py-2">{formatVal(s.qualification)}</td>
                      <td className="px-4 py-2">{formatVal(s.contact)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

