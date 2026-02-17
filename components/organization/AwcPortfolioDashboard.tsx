'use client';
import { Organization, CenterProfile } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

// Logical groups for portfolio tables – strictly from ICDS CSV
const PROFILE_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Block / ULB', key: 'block_name' },
  { attribute: 'GP / Ward', key: 'gram_panchayat' },
  { attribute: 'Village', key: 'village_ward' },
  { attribute: 'Name of AWC', key: 'org.name' },
  { attribute: 'AWC ID', key: 'center_code' },
  { attribute: 'Building status', key: 'building_type' },
  { attribute: 'Latitude', key: 'org.latitude' },
  { attribute: 'Longitude', key: 'org.longitude' },
  { attribute: 'Description', key: 'description' },
];

const BENEFICIARY_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Student strength', key: 'student_strength' },
];

const CONTACT_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Centre contact', key: 'contact_number' },
  { attribute: 'CPDO name', key: 'cpdo_name' },
  { attribute: 'CPDO contact no', key: 'cpdo_contact_no' },
  { attribute: 'Supervisor name', key: 'supervisor_name' },
  { attribute: 'Supervisor contact', key: 'supervisor_contact_name' },
  { attribute: 'AWW name', key: 'worker_name' },
  { attribute: 'AWW contact no', key: 'aww_contact_no' },
  { attribute: 'AWH name', key: 'helper_name' },
  { attribute: 'AWH contact no', key: 'awh_contact_no' },
];

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

function getValue(org: Organization | null, profile: CenterProfile | null, key: string): string | number | null | undefined {
  if (key.startsWith('org.')) {
    const k = key.slice(4) as keyof Organization;
    return org ? (org[k] as string | number | null | undefined) : undefined;
  }
  return profile ? (profile[key as keyof CenterProfile] as string | number | null | undefined) : undefined;
}

export interface AwcPortfolioDashboardProps {
  org: Organization;
  awcProfile: CenterProfile | null;
  departmentName?: string | null;
  /** Gallery image URLs (admin can add later). */
  images?: string[];
}

export function AwcPortfolioDashboard({
  org,
  awcProfile,
  departmentName,
  images = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const locationLine = [org.address, org.latitude != null && org.longitude != null ? `${org.latitude.toFixed(5)}, ${org.longitude.toFixed(5)}` : null]
    .filter(Boolean)
    .join(' · ') || null;

  const stats = [
    { label: t('awc.stat.studentStrength', language), value: getValue(org, awcProfile, 'student_strength') },
    { label: t('awc.stat.cpdoName', language), value: getValue(org, awcProfile, 'cpdo_name') },
    { label: t('awc.stat.supervisorName', language), value: getValue(org, awcProfile, 'supervisor_name') },
    { label: t('awc.stat.awwName', language), value: getValue(org, awcProfile, 'worker_name') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero: image slider */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="rounded-none" />
      </section>

      {/* Header: title + meta */}
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-6 shadow-sm sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                {t('awc.badge', language)}
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
            {awcProfile?.center_code && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-700">Centre code</div>
                <div className="mt-0.5 text-sm font-mono text-slate-900">
                  {awcProfile.center_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats cards */}
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

      {/* Portfolio details: grouped tables */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {t('awc.centreProfileTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('awc.centreProfileSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  {PROFILE_ROWS.map(({ attribute, key }) => {
                    const value = getValue(org, awcProfile, key);
                    return (
                      <tr key={key} className="border-b border-slate-100 last:border-0">
                        <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                          {attribute}
                        </td>
                        <td className="px-4 py-2 text-slate-900">
                          {formatVal(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact & staff table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {t('awc.staffContactTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('awc.staffContactSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  {CONTACT_ROWS.map(({ attribute, key }) => {
                    const value = getValue(org, awcProfile, key);
                    return (
                      <tr key={key} className="border-b border-slate-100 last:border-0">
                        <td className="w-1/3 px-4 py-2 font-medium text-slate-600">
                          {attribute}
                        </td>
                        <td className="px-4 py-2 text-slate-900">
                          {formatVal(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
