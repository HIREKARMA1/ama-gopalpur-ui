'use client';
import { useMemo, useState } from 'react';
import { Organization, CenterProfile, SnpDailyStock } from '../../services/api';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const SNP_ROWS_PER_PAGE = 10;

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
  /** SNP (Supplementary Nutrition Programme) daily stock – date-wise. */
  snpDailyStock?: SnpDailyStock[];
}

function snpKg(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v} Kg`;
}

export function AwcPortfolioDashboard({
  org,
  awcProfile,
  departmentName,
  images = [],
  snpDailyStock = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [snpDateFilter, setSnpDateFilter] = useState('');
  const [snpPage, setSnpPage] = useState(1);

  const snpFiltered = useMemo(() => {
    if (!snpDailyStock.length) return [];
    if (!snpDateFilter.trim()) return snpDailyStock;
    return snpDailyStock.filter((row) => {
      const d = row.record_date;
      if (!d) return false;
      const rowDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return rowDate === snpDateFilter;
    });
  }, [snpDailyStock, snpDateFilter]);

  const snpTotalRows = snpFiltered.length;
  const snpTotalPages = Math.max(1, Math.ceil(snpTotalRows / SNP_ROWS_PER_PAGE));
  const snpPageClamped = Math.min(Math.max(1, snpPage), snpTotalPages);
  const snpStart = (snpPageClamped - 1) * SNP_ROWS_PER_PAGE;
  const snpPaginated = snpFiltered.slice(snpStart, snpStart + SNP_ROWS_PER_PAGE);
  const snpShowStart = snpTotalRows === 0 ? 0 : snpStart + 1;
  const snpShowEnd = Math.min(snpStart + SNP_ROWS_PER_PAGE, snpTotalRows);

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
      <header className="border-b border-slate-200/80 bg-white/80 px-4 pb-4 pt-6 shadow-sm backdrop-blur-sm sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
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
              <div className="rounded-xl border border-amber-200/80 bg-amber-500/10 px-3 py-2 text-xs text-slate-600 shadow-sm">
                <div className="font-semibold text-amber-800/90">Centre code</div>
                <div className="mt-0.5 text-sm font-mono text-slate-900">
                  {awcProfile.center_code}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats cards – each with a distinct transparent tint */}
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

      {/* Portfolio details: grouped tables with distinct transparent sections */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Centre profile – teal tint */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-teal-200/60 bg-teal-500/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                {t('awc.centreProfileTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {t('awc.centreProfileSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  {PROFILE_ROWS.map(({ attribute, key }) => {
                    const value = getValue(org, awcProfile, key);
                    return (
                      <tr key={key} className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
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

          {/* Staff & contact – indigo tint */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-indigo-200/60 bg-indigo-500/10 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-800">
                {t('awc.staffContactTitle', language)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {t('awc.staffContactSubtitle', language)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <tbody>
                  {CONTACT_ROWS.map(({ attribute, key }) => {
                    const value = getValue(org, awcProfile, key);
                    return (
                      <tr key={key} className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
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

        {/* SNP (Supplementary Nutrition Programme) – daily stock date-wise */}
        {snpDailyStock.length > 0 && (
          <div className="mt-8 rounded-xl border border-amber-200/80 bg-amber-500/5 shadow-sm overflow-hidden">
            <div className="border-b border-amber-200/60 bg-amber-500/10 px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                    {t('awc.snp.title', language)}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {t('awc.snp.subtitle', language)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-slate-700">
                    {t('awc.snp.filterByDate', language)}
                  </label>
                  <input
                    type="date"
                    value={snpDateFilter}
                    onChange={(e) => {
                      setSnpDateFilter(e.target.value);
                      setSnpPage(1);
                    }}
                    className="rounded-md border border-amber-300 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm"
                  />
                  {snpDateFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setSnpDateFilter('');
                        setSnpPage(1);
                      }}
                      className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                    >
                      {t('awc.snp.allDates', language)}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-amber-500/10">
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.slNo', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.date', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.openingBalance', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.received', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.totalStock', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.exp', language)}</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.bal', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {snpPaginated.map((row, index) => {
                    const slNo = snpStart + index + 1;
                    const opening = row.opening_balance_kg ?? 0;
                    const received = row.received_kg ?? 0;
                    const exp = row.exp_kg ?? 0;
                    const totalStock = opening + received;
                    const bal = totalStock - exp;
                    const dateStr = row.record_date ? new Date(row.record_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
                    return (
                      <tr key={row.id} className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
                        <td className="px-4 py-2 text-center font-medium text-slate-700">{slNo}</td>
                        <td className="px-4 py-2 text-center font-medium text-slate-700">{dateStr}</td>
                        <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.opening_balance_kg)}</td>
                        <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.received_kg)}</td>
                        <td className="px-4 py-2 text-center text-slate-900">{snpKg(totalStock)}</td>
                        <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.exp_kg)}</td>
                        <td className="px-4 py-2 text-center text-slate-900">{snpKg(bal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 bg-amber-500/5 px-4 py-2">
              <p className="text-xs text-slate-600">
                {t('awc.snp.showingRows', language)
                  .replace('%1', String(snpShowStart))
                  .replace('%2', String(snpShowEnd))
                  .replace('%3', String(snpTotalRows))}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={snpPageClamped <= 1}
                  onClick={() => setSnpPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('awc.snp.prev', language)}
                </button>
                <span className="px-2 text-xs text-slate-600">
                  {snpPageClamped} / {snpTotalPages}
                </span>
                <button
                  type="button"
                  disabled={snpPageClamped >= snpTotalPages}
                  onClick={() => setSnpPage((p) => Math.min(snpTotalPages, p + 1))}
                  className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('awc.snp.next', language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
