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

  const totalOpd = (healthProfile.total_opd as number | undefined) ?? null;
  const totalIpd = (healthProfile.total_ipd as number | undefined) ?? null;
  const beds = facilityMaster?.num_beds ?? infra?.beds_total ?? null;
  const icuBeds = infra?.icu_beds ?? null;

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
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-6 shadow-sm sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
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
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-700">
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

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
            >
              <p className="text-2xl font-bold text-slate-900">{formatVal(value)}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Details */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Facility profile */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {t('health.facilityProfileTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('health.facilityProfileSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Facility type
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.facility_type)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">District</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.district)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Block</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.block)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Village</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.village)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Established year
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.established_year)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Registration no.
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.registration_number)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Contact phone
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.contact_phone)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">Email</td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.email)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Operating hours
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.operating_hours)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                      Facility status
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(facilityMaster?.facility_status)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {t('health.infraTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('health.infraSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Total beds</td>
                    <td className="px-4 py-2 text-slate-900">{formatVal(infra?.beds_total)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">ICU beds</td>
                    <td className="px-4 py-2 text-slate-900">{formatVal(infra?.icu_beds)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Operation theatre
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {formatVal(infra?.operation_theatre)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Lab available</td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.lab_available ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Pharmacy available
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.pharmacy_available ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">
                      Ambulance available
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.ambulance_available ? 'Yes' : 'No'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="w-1/2 px-4 py-2 font-medium text-slate-600">Blood bank</td>
                    <td className="px-4 py-2 text-slate-900">
                      {infra?.blood_bank ? 'Yes' : 'No'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Staff table full width */}
        {staff.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Key staff
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Medical officers, nurses and support staff.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Role</th>
                    <th className="px-4 py-2 text-left font-semibold">Qualification</th>
                    <th className="px-4 py-2 text-left font-semibold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
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

