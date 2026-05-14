'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  FileText,
  IndianRupee,
  LayoutGrid,
  MapPinned,
  XCircle,
} from 'lucide-react';
import { revenueLandApi, type Organization } from '../../services/api';
import {
  PsHeroSection,
  PsAboutSection,
  PsPersonCardsSection,
  PsFacultySection,
  PsGallerySection,
  PsContactSection,
  parseArray,
  type GalleryItem,
  type Faculty,
  type Lang,
  type PsPersonCard,
  asString,
  displayText,
  EMPTY,
} from './EducationPsSections';
import { useLanguage } from '../i18n/LanguageContext';
import { PaginatedHorizontalTable } from '../common/PaginatedHorizontalTable';
import {
  buildRevenueGovtLandColumns,
  compareParcelRowsByColumn,
  getParcelFieldRaw,
  parcelRowSearchHaystack,
  type RevenueGovtLandRow,
} from '../../lib/revenueGovtLandTable';
export interface TahasilPortfolioWebsiteProps {
  org: Organization;
  profile: Record<string, unknown>;
  /** When set, parcel rows are loaded in pages of 25 from the API (recommended for public Tahasil). */
  lazyParcelsForTahasilOrgId?: number | null;
  /** Optional pre-built rows (e.g. admin preview); ignored when {@link lazyParcelsForTahasilOrgId} is set. */
  parcelRows?: RevenueGovtLandRow[];
}

const SECTION_H2 = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/** Prefer readable numbers (e.g. 3.00E+05 → 3,00,000); keep narrative / currency strings as-is. */
function formatHighlightDisplay(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (Number.isInteger(raw) && Math.abs(raw) < 1e15) {
      return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(raw);
    }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 6 }).format(raw);
  }
  const s = String(raw).trim();
  if (!s || /^#+$/.test(s)) return '';
  const compact = s.replace(/,/g, '').replace(/\s/g, '');
  if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(compact)) {
    const n = Number(compact);
    if (Number.isFinite(n)) {
      return Number.isInteger(n) && Math.abs(n) < 1e15
        ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
        : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 6 }).format(n);
    }
  }
  return s;
}

function parseCount(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  const compact = s.replace(/,/g, '').replace(/\s/g, '');
  if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(compact)) {
    const n = Number(compact);
    return Number.isFinite(n) ? n : null;
  }
  const lead = s.match(/[\d,]+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
  if (!lead) return null;
  const n = Number(lead[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseRorParts(raw: unknown): { value: string; sub?: string } {
  const s = asString(raw);
  if (!s) return { value: '' };
  const m = s.match(/^([\d,.\s]+)\s*(.*)$/);
  if (m && m[1]) {
    const numPart = m[1].replace(/\s/g, '');
    const value = formatHighlightDisplay(numPart);
    let rest = m[2]?.trim();
    if (rest.startsWith('(') && rest.endsWith(')')) rest = rest.slice(1, -1).trim();
    return { value: value || numPart, sub: rest || undefined };
  }
  return { value: formatHighlightDisplay(raw) };
}

function splitRevenueFooter(raw: unknown): { main: string; sub?: string } {
  const s = asString(raw);
  if (!s) return { main: '' };
  const idx = s.lastIndexOf('(');
  if (idx > 0 && s.endsWith(')')) {
    const inner = s.slice(idx + 1, -1).trim();
    const main = s.slice(0, idx).trim();
    if (inner && main) return { main, sub: inner };
  }
  return { main: s };
}

function formatRupeeDisplay(s: string): string {
  const t = s.trim();
  if (!t) return t;
  if (/^rs\.?\s*/i.test(t)) return `₹ ${t.replace(/^rs\.?\s*/i, '').trim()}`;
  if (t.startsWith('₹')) return t;
  return t;
}

function parsePercentNumber(raw: unknown): number | null {
  const s = formatHighlightDisplay(raw).replace(/%/g, '').trim();
  const n = Number(s.replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

function yesNoActive(raw: unknown): boolean | null {
  const s = asString(raw).toUpperCase();
  if (!s) return null;
  if (s === 'YES' || s === 'Y' || s === 'TRUE' || s === '1') return true;
  if (s === 'NO' || s === 'N' || s === 'FALSE' || s === '0') return false;
  return null;
}

function landIconForKey(key: string): LucideIcon {
  if (key.includes('plot')) return LayoutGrid;
  if (key.includes('khata')) return FileText;
  if (key.includes('ror')) return FileCheck;
  if (key.includes('acre') || key.includes('hectare')) return MapPinned;
  return LayoutGrid;
}

type HighlightDef = { key: string; labelEn: string; labelOr: string };

const HIGHLIGHT_GROUPS: { id: string; titleEn: string; titleOr: string; defs: HighlightDef[] }[] = [
  {
    id: 'land',
    titleEn: 'Land & land records',
    titleOr: 'ଜମି ଓ ଭୂମି ରେକର୍ଡ',
    defs: [
      { key: 'total_government_land_acres', labelEn: 'Government land (acres)', labelOr: 'ସରକାରୀ ଜମି (ଏକର)' },
      { key: 'total_government_land_hectares', labelEn: 'Government land (hectares)', labelOr: 'ସରକାରୀ ଜମି (ହେକ୍ଟର)' },
      { key: 'total_plot_records', labelEn: 'Plot records', labelOr: 'ପ୍ଲଟ୍ ରେକର୍ଡ' },
      { key: 'total_khata_records', labelEn: 'Khata records', labelOr: 'ଖାତା ରେକର୍ଡ' },
      { key: 'total_ror_issued', labelEn: 'ROR issued', labelOr: 'ROR ଜାରି' },
      { key: 'tahasil_govt_parcel_count', labelEn: 'Government land parcels', labelOr: 'ସରକାରୀ ଜମି ପାର୍ସେଲ୍' },
    ],
  },
  {
    id: 'mutations',
    titleEn: 'Mutations',
    titleOr: 'ମ୍ୟୁଟେସନ୍',
    defs: [
      {
        key: 'mutation_applications_received_yearly',
        labelEn: 'Applications received',
        labelOr: 'ଆବେଦନ ଗ୍ରହଣ',
      },
      { key: 'mutation_approved', labelEn: 'Approved', labelOr: 'ଅନୁମୋଦିତ' },
      { key: 'mutation_pending', labelEn: 'Pending', labelOr: 'ବିଚାରାଧୀନ' },
      { key: 'mutation_rejected', labelEn: 'Rejected', labelOr: 'ପ୍ରତ୍ୟାଖ୍ୟାତ' },
      { key: 'avg_mutation_processing_days', labelEn: 'Processing time', labelOr: 'ପ୍ରକ୍ରିୟା ସମୟ' },
    ],
  },
  {
    id: 'revenue',
    titleEn: 'Revenue',
    titleOr: 'ରାଜସ୍ୱ',
    defs: [
      { key: 'total_annual_revenue', labelEn: 'Annual revenue', labelOr: 'ବାର୍ଷିକ ରାଜସ୍ୱ' },
      { key: 'land_revenue_collection', labelEn: 'Land revenue collected', labelOr: 'ଭୂମି ରାଜସ୍ୱ ସଂଗ୍ରହ' },
    ],
  },
  {
    id: 'digital',
    titleEn: 'Digital & services',
    titleOr: 'ଡିଜିଟାଲ୍ ଓ ସେବା',
    defs: [
      { key: 'digital_records_percentage', labelEn: 'Digital records', labelOr: 'ଡିଜିଟାଲ୍ ରେକର୍ଡ' },
      { key: 'internet_available', labelEn: 'Internet', labelOr: 'ଇଣ୍ଟରନେଟ୍' },
      { key: 'online_services_available', labelEn: 'Online services', labelOr: 'ଅନଲାଇନ୍ ସେବା' },
    ],
  },
];

type HighlightsDashboardData = {
  landCards: { key: string; label: string; value: string; sub?: string; icon: LucideIcon }[];
  mutations: {
    received: number | null;
    approved: number | null;
    pending: number | null;
    rejected: number | null;
    ratePct: number | null;
  } | null;
  revenue: {
    annual: { main: string; sub?: string } | null;
    land: { main: string; sub?: string } | null;
  } | null;
  digital: {
    pctDisplay: string;
    pctNum: number | null;
    internet: boolean | null;
    online: boolean | null;
  } | null;
};

function SectionHeading({ Icon, children }: { Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      {children}
    </h3>
  );
}

function TahasilHighlightsDashboard({
  data,
  tr,
}: {
  data: HighlightsDashboardData;
  tr: (en: string, or: string) => string;
}) {
  const fmtInt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="mt-4 space-y-10 text-slate-800">
      {data.landCards.length > 0 ? (
        <div>
          <SectionHeading Icon={MapPinned}>{tr('Land & land records', 'ଜମି ଓ ଭୂମି ରେକର୍ଡ')}</SectionHeading>
          <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.landCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.key} className="min-w-0">
                  <div className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">{c.label}</p>
                      <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
                        {c.value}
                      </p>
                      {c.sub ? <p className="mt-1 text-xs leading-snug text-slate-600">{c.sub}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {data.mutations ? (
        <div>
          <SectionHeading Icon={ArrowLeftRight}>{tr('Mutations', 'ମ୍ୟୁଟେସନ୍')}</SectionHeading>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div>
                <p className="text-xs font-medium text-slate-500">{tr('Applications received', 'ଆବେଦନ ଗ୍ରହଣ')}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                  {data.mutations.received != null && data.mutations.received > 0
                    ? fmtInt(data.mutations.received)
                    : '—'}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium text-slate-500">{tr('Approval rate', 'ଅନୁମୋଦନ ହାର')}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                  {data.mutations.ratePct != null ? `${data.mutations.ratePct}%` : '—'}
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-600"
                style={{ width: `${Math.min(100, Math.max(0, data.mutations.ratePct ?? 0))}%` }}
                role="progressbar"
                aria-valuenow={data.mutations.ratePct ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-5 w-5 text-slate-500" aria-hidden />
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {tr('Approved', 'ଅନୁମୋଦିତ')}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {data.mutations.approved != null ? fmtInt(data.mutations.approved) : '—'}
                </p>
              </div>
              <div>
                <Clock className="mx-auto h-5 w-5 text-slate-500" aria-hidden />
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {tr('Pending', 'ବିଚାରାଧୀନ')}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {data.mutations.pending != null ? fmtInt(data.mutations.pending) : '—'}
                </p>
              </div>
              <div>
                <XCircle className="mx-auto h-5 w-5 text-slate-500" aria-hidden />
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {tr('Rejected', 'ପ୍ରତ୍ୟାଖ୍ୟାତ')}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {data.mutations.rejected != null ? fmtInt(data.mutations.rejected) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {data.revenue ? (
        <div>
          <SectionHeading Icon={IndianRupee}>{tr('Revenue', 'ରାଜସ୍ୱ')}</SectionHeading>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {data.revenue.annual ? (
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{tr('Annual revenue', 'ବାର୍ଷିକ ରାଜସ୍ୱ')}</p>
                <p className="mt-1 break-words text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                  {data.revenue.annual.main}
                </p>
                {data.revenue.annual.sub ? (
                  <p className="mt-1.5 text-xs text-slate-600">{data.revenue.annual.sub}</p>
                ) : null}
              </div>
            ) : null}
            {data.revenue.land ? (
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">{tr('Land revenue collected', 'ଭୂମି ରାଜସ୍ୱ ସଂଗ୍ରହ')}</p>
                <p className="mt-1 break-words text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                  {data.revenue.land.main}
                </p>
                {data.revenue.land.sub ? (
                  <p className="mt-1.5 text-xs text-slate-600">{data.revenue.land.sub}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {data.digital ? (
        <div>
          <SectionHeading Icon={Database}>{tr('Digital & services', 'ଡିଜିଟାଲ୍ ଓ ସେବା')}</SectionHeading>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{tr('Digital records', 'ଡିଜିଟାଲ୍ ରେକର୍ଡ')}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-600"
                  style={{ width: `${data.digital.pctNum ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{data.digital.pctDisplay || '—'}</p>
              {data.digital.pctNum != null && data.digital.pctNum >= 99 ? (
                <p className="mt-1 text-xs font-medium text-slate-600">{tr('Fully digitised', 'ସମ୍ପୂର୍ଣ୍ଣ ଡିଜିଟାଲ୍')}</p>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{tr('Internet', 'ଇଣ୍ଟରନେଟ୍')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {data.digital.internet === true
                  ? tr('Active', 'ସକ୍ରିୟ')
                  : data.digital.internet === false
                    ? tr('Inactive', 'ନିଷ୍କ୍ରିୟ')
                    : '—'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{tr('Online services', 'ଅନଲାଇନ୍ ସେବା')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {data.digital.online === true
                  ? tr('Available', 'ଉପଲବ୍ଧ')
                  : data.digital.online === false
                    ? tr('Not available', 'ଉପଲବ୍ଧ ନୁହେଁ')
                    : '—'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TahasilPortfolioWebsite({
  org,
  profile,
  parcelRows = [],
  lazyParcelsForTahasilOrgId = null,
}: TahasilPortfolioWebsiteProps) {
  const { language } = useLanguage();
  const trStatic = (en: string, or: string) => (language === 'or' ? or : en);
  const lang = language as Lang;

  const heroSlides = useMemo(() => {
    return [profile.tahasil_hero_1, profile.tahasil_hero_2, profile.tahasil_hero_3]
      .map((x) => String(x || '').trim())
      .filter(Boolean);
  }, [profile.tahasil_hero_1, profile.tahasil_hero_2, profile.tahasil_hero_3]);

  const displayName =
    asString(profile.tahasil_display_name) ||
    asString(profile.tahsil_name) ||
    asString(profile.tahsildar_name) ||
    org.name ||
    '';

  const locationLine = [
    asString(profile.tahasil_district),
    asString(profile.sub_division),
    asString(profile.block),
  ]
    .filter(Boolean)
    .join(' · ');

  const psProfile = useMemo((): Record<string, unknown> => {
    const tag =
      asString(profile.tahasil_hero_tagline) ||
      asString(profile.description) ||
      (org.type ? org.type.replace(/_/g, ' ') : '');
    const isOd = language === 'or';
    return {
      ...profile,
      school_name_en: displayName,
      hero_primary_tagline_en: tag,
      about_short_en:
        asString(profile.tahasil_about_text) ||
        asString(profile.description) ||
        '',
      about_image: asString(profile.tahasil_office_image),
      esst_year: asString(profile.established_year),
      school_type_en: isOd ? 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ' : 'Tahasil office',
      location_en: locationLine || asString(org.address) || '',
      headmaster_message_en: asString(profile.tahasil_head_message),
      name_of_hm: asString(profile.tahasil_head_name) || asString(profile.tahsildar_name),
      hm_designation: asString(profile.tahasil_head_designation) || (isOd ? 'ତହସିଲଦାର' : 'Tahsildar'),
      headmaster_photo: asString(profile.tahasil_head_photo),
      hm_qualification: asString(profile.tahasil_head_qualification),
      hm_experience: asString(profile.tahasil_head_experience),
      headmaster_contact: asString(profile.tahasil_head_contact) || asString(profile.contact_number),
      headmaster_email: asString(profile.tahasil_head_email) || asString(profile.email_id),
      vision_text_en: '',
      mission_text_en: '',
    };
  }, [profile, org.name, org.type, org.address, displayName, locationLine, language]);

  const keyContacts: PsPersonCard[] = useMemo(() => {
    const rows = parseArray<Record<string, string>>(profile.tahasil_key_contact_cards);
    const defRole = language === 'or' ? 'ଯୋଗାଯୋଗ' : 'Contact';
    return rows
      .map((r) => ({
        role: String(r.role || '').trim() || defRole,
        image: asString(r.photo || r.image),
        name: asString(r.name) || EMPTY,
        contact: asString(r.phone || r.contact) || '—',
        email: asString(r.email) || '—',
      }))
      .filter((p) => p.image || (p.name && p.name !== EMPTY) || p.contact !== '—' || p.email !== '—');
  }, [profile.tahasil_key_contact_cards, language]);

  const riFaculty: Faculty[] = useMemo(() => {
    const rows = parseArray<Record<string, string>>(profile.tahasil_ri_circle_cards);
    const riLabel = language === 'or' ? 'ରାଜସ୍ୱ ଇନସ୍ପେକ୍ଟର' : 'Revenue Inspector';
    return rows.map((r) => ({
      photo: asString(r.ri_photo || r.photo),
      name: asString(r.ri_name || r.name),
      subject: [asString(r.circle_name), asString(r.area_covered)].filter(Boolean).join(' — ') || EMPTY,
      qualification: asString(r.area_covered),
      designation: riLabel,
      contact: asString(r.ri_phone || r.contact),
      email: asString(r.email),
    }));
  }, [profile.tahasil_ri_circle_cards, language]);

  const galleryItems: GalleryItem[] = useMemo(() => {
    const raw = parseArray<GalleryItem>(profile.tahasil_photo_gallery);
    return raw.slice(0, 8);
  }, [profile.tahasil_photo_gallery]);

  const monitoringRows = useMemo(
    () => parseArray<Record<string, string>>(profile.tahasil_monitoring_rows),
    [profile.tahasil_monitoring_rows],
  );

  const contactProfile = useMemo(
    () => ({
      ...profile,
      contact_address_en:
        asString(profile.tahasil_full_address) ||
        asString(profile.tahasil_full_office_address) ||
        asString(org.address) ||
        '',
      contact_phone: asString(profile.tahasil_helpdesk_phone) || asString(profile.contact_number),
      contact_email: asString(profile.tahasil_public_email) || asString(profile.email_id),
      office_hours_en: asString(profile.tahasil_public_office_hours) || asString(profile.tahasil_office_hours),
      contact_website_url: asString(profile.tahasil_website_url),
      contact_land_records_url: asString(profile.tahasil_bhulekh_url),
    }),
    [profile, org.address],
  );

  const highlightsDashboard = useMemo((): HighlightsDashboardData | null => {
    const isOd = language === 'or';
    const landGroup = HIGHLIGHT_GROUPS.find((g) => g.id === 'land')!;
    const landCards: HighlightsDashboardData['landCards'] = [];
    for (const def of landGroup.defs) {
      const raw = profile[def.key];
      if (def.key === 'total_ror_issued') {
        const p = parseRorParts(raw);
        if (!p.value) continue;
        landCards.push({
          key: def.key,
          label: isOd ? def.labelOr : def.labelEn,
          value: p.value,
          sub: p.sub,
          icon: landIconForKey(def.key),
        });
        continue;
      }
      const s = formatHighlightDisplay(raw);
      if (!s) continue;
      landCards.push({
        key: def.key,
        label: isOd ? def.labelOr : def.labelEn,
        value: s,
        icon: landIconForKey(def.key),
      });
    }
    const unit = asString(profile.tahasil_govt_parcel_area_unit);
    const areaVal = asString(profile.tahasil_govt_parcel_area_value);
    if (unit && areaVal) {
      landCards.push({
        key: 'parcel_area',
        label: isOd ? 'ପାର୍ସେଲ୍ ମୋଟ କ୍ଷେତ୍ରଫଳ' : 'Total parcel area',
        value: `${formatHighlightDisplay(areaVal)} ${unit}`.trim(),
        icon: MapPinned,
      });
    }

    const received = parseCount(profile.mutation_applications_received_yearly);
    const approved = parseCount(profile.mutation_approved);
    const pending = parseCount(profile.mutation_pending);
    const rejected = parseCount(profile.mutation_rejected);

    let ratePct: number | null = null;
    if (received != null && received > 0 && approved != null) {
      ratePct = Math.min(100, Math.round((approved / received) * 1000) / 10);
    }

    const hasMutations =
      (received != null && received > 0) ||
      (approved != null && approved > 0) ||
      (pending != null && pending > 0) ||
      (rejected != null && rejected > 0);

    const mutations = hasMutations ? { received, approved, pending, rejected, ratePct } : null;

    const annualStr = asString(profile.total_annual_revenue).trim();
    const landRevStr = asString(profile.land_revenue_collection).trim();
    const annualParts = annualStr ? splitRevenueFooter(annualStr) : { main: '' };
    const landParts = landRevStr ? splitRevenueFooter(landRevStr) : { main: '' };
    const revenueAnnual =
      annualParts.main.trim().length > 0
        ? { main: formatRupeeDisplay(annualParts.main.trim()), sub: annualParts.sub }
        : null;
    const revenueLand =
      landParts.main.trim().length > 0
        ? { main: formatRupeeDisplay(landParts.main.trim()), sub: landParts.sub }
        : null;
    const revenue = revenueAnnual || revenueLand ? { annual: revenueAnnual, land: revenueLand } : null;

    const pctRaw = profile.digital_records_percentage;
    const pctDisplay =
      pctRaw != null && String(pctRaw).trim() !== '' ? formatHighlightDisplay(pctRaw) : '';
    const pctNum = parsePercentNumber(pctRaw);
    const internet = yesNoActive(profile.internet_available);
    const online = yesNoActive(profile.online_services_available);
    const digital =
      pctDisplay || internet != null || online != null
        ? { pctDisplay, pctNum, internet, online }
        : null;

    if (!landCards.length && !mutations && !revenue && !digital) return null;

    return { landCards, mutations, revenue, digital };
  }, [profile, language]);

  const parcelColumns = useMemo(() => buildRevenueGovtLandColumns(language === 'or'), [language]);
  const parcelColumnKeys = useMemo(() => parcelColumns.map((c) => c.key), [parcelColumns]);

  const PARCEL_PAGE_SIZE = 25;
  const useLazyParcels =
    lazyParcelsForTahasilOrgId != null &&
    Number.isFinite(lazyParcelsForTahasilOrgId) &&
    lazyParcelsForTahasilOrgId > 0;

  const [lazyParcelRows, setLazyParcelRows] = useState<RevenueGovtLandRow[]>([]);
  const [lazyTotal, setLazyTotal] = useState(0);
  const [lazyPageIndex, setLazyPageIndex] = useState(0);
  const [lazyLoading, setLazyLoading] = useState(false);
  const [lazyError, setLazyError] = useState<string | null>(null);

  const [lazyFacetRi, setLazyFacetRi] = useState<string[]>([]);
  const [lazyFacetMouza, setLazyFacetMouza] = useState<string[]>([]);
  const [lazyFacetCategory, setLazyFacetCategory] = useState<string[]>([]);
  const [lazyFacetKisam, setLazyFacetKisam] = useState<string[]>([]);
  const [lazyFacetsLoading, setLazyFacetsLoading] = useState(false);

  const [draftLazyRi, setDraftLazyRi] = useState('');
  const [draftLazyMouza, setDraftLazyMouza] = useState('');
  const [draftLazyCategory, setDraftLazyCategory] = useState('');
  const [draftLazyKisam, setDraftLazyKisam] = useState('');

  const [appliedLazyRi, setAppliedLazyRi] = useState('');
  const [appliedLazyMouza, setAppliedLazyMouza] = useState('');
  const [appliedLazyCategory, setAppliedLazyCategory] = useState('');
  const [appliedLazyKisam, setAppliedLazyKisam] = useState('');

  useEffect(() => {
    if (!useLazyParcels) return;
    setLazyPageIndex(0);
    setDraftLazyRi('');
    setDraftLazyMouza('');
    setDraftLazyCategory('');
    setDraftLazyKisam('');
    setAppliedLazyRi('');
    setAppliedLazyMouza('');
    setAppliedLazyCategory('');
    setAppliedLazyKisam('');
    setLazyFacetRi([]);
    setLazyFacetMouza([]);
    setLazyFacetCategory([]);
    setLazyFacetKisam([]);
  }, [useLazyParcels, lazyParcelsForTahasilOrgId]);

  useEffect(() => {
    if (!useLazyParcels || lazyParcelsForTahasilOrgId == null) return;
    let cancelled = false;
    (async () => {
      setLazyFacetsLoading(true);
      try {
        const f = await revenueLandApi.listTahasilParcelFilterFacets(lazyParcelsForTahasilOrgId, {
          ri_circle: draftLazyRi || undefined,
          mouza: draftLazyMouza || undefined,
          category: draftLazyCategory || undefined,
        });
        if (!cancelled) {
          setLazyFacetRi(f.ri_circles ?? []);
          setLazyFacetMouza(f.mouzas ?? []);
          setLazyFacetCategory(f.categories ?? []);
          setLazyFacetKisam(f.kisams ?? []);
        }
      } catch {
        if (!cancelled) {
          setLazyFacetRi([]);
          setLazyFacetMouza([]);
          setLazyFacetCategory([]);
          setLazyFacetKisam([]);
        }
      } finally {
        if (!cancelled) setLazyFacetsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    useLazyParcels,
    lazyParcelsForTahasilOrgId,
    draftLazyRi,
    draftLazyMouza,
    draftLazyCategory,
  ]);

  useEffect(() => {
    if (!useLazyParcels || lazyParcelsForTahasilOrgId == null) return;
    let cancelled = false;
    (async () => {
      setLazyLoading(true);
      setLazyError(null);
      try {
        const skip = lazyPageIndex * PARCEL_PAGE_SIZE;
        const { items, total } = await revenueLandApi.listParcelsForTahasilOfficePaged(
          lazyParcelsForTahasilOrgId,
          {
            skip,
            limit: PARCEL_PAGE_SIZE,
            ri_circle: appliedLazyRi || undefined,
            mouza: appliedLazyMouza || undefined,
            category: appliedLazyCategory || undefined,
            kisam: appliedLazyKisam || undefined,
          },
        );
        const profiles = await Promise.all(
          items.map((po) => revenueLandApi.getProfile(po.id).catch(() => ({}))),
        );
        const rows: RevenueGovtLandRow[] = items.map((po, idx) => ({
          org: po,
          profile:
            profiles[idx] && typeof profiles[idx] === 'object'
              ? (profiles[idx] as Record<string, unknown>)
              : {},
        }));
        if (!cancelled) {
          setLazyParcelRows(rows);
          setLazyTotal(total);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLazyError(e instanceof Error ? e.message : 'Failed to load parcels');
          setLazyParcelRows([]);
          setLazyTotal(0);
        }
      } finally {
        if (!cancelled) setLazyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    useLazyParcels,
    lazyParcelsForTahasilOrgId,
    lazyPageIndex,
    appliedLazyRi,
    appliedLazyMouza,
    appliedLazyCategory,
    appliedLazyKisam,
  ]);

  const [parcelSearch, setParcelSearch] = useState('');
  const [parcelFilterKey, setParcelFilterKey] = useState('');
  const [parcelFilterValue, setParcelFilterValue] = useState('');
  const [parcelSort, setParcelSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const processedParcelRows = useMemo(() => {
    if (useLazyParcels) return [...lazyParcelRows];
    let rows = [...parcelRows];
    const q = parcelSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => parcelRowSearchHaystack(r, parcelColumnKeys).includes(q));
    }
    const fk = parcelFilterKey.trim();
    const fv = parcelFilterValue.trim().toLowerCase();
    if (fk && fv) {
      rows = rows.filter((r) => getParcelFieldRaw(r, fk).toLowerCase().includes(fv));
    }
    if (parcelSort) {
      rows.sort((a, b) => compareParcelRowsByColumn(a, b, parcelSort.key, parcelSort.dir));
    }
    return rows;
  }, [
    useLazyParcels,
    lazyParcelRows,
    parcelRows,
    parcelSearch,
    parcelFilterKey,
    parcelFilterValue,
    parcelSort,
    parcelColumnKeys,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={psProfile} language={lang} sliderImages={heroSlides} />

      <main className="mx-auto max-w-[min(100%,1536px)] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={org}
          profile={psProfile}
          language={lang}
          sliderImages={heroSlides}
          hideVisionMission
          hideExtendedLeaderBio
          aboutTitleOverride={
            lang === 'od' ? `${displayName} ବିଷୟରେ` : `About this Tahasil — ${displayName}`
          }
          leaderLabels={{
            title: lang === 'od' ? 'ତହସିଲଦାର' : 'Tahsildar (office head)',
            messageHeading: lang === 'od' ? 'ସ୍ୱାଗତ ବାର୍ତ୍ତା' : 'Welcome message',
          }}
        />

        <PsPersonCardsSection
          title={trStatic('Key contacts', 'ମୁଖ୍ୟ ଯୋଗାଯୋଗ')}
          people={keyContacts}
          gridClassName="md:grid-cols-2 xl:grid-cols-4"
        />

        <PsFacultySection
          faculty={riFaculty}
          profile={psProfile}
          sectionTitle={trStatic('Revenue circles & Revenue Inspectors', 'ରାଜସ୍ୱ ସର୍କଲ ଓ ଆର୍.ଆଇ.')}
          subjectLabel={trStatic('Circle & area', 'ସର୍କଲ ଓ ଅଞ୍ଚଳ')}
          showAttendance={false}
          emptyStateMessage={trStatic('No revenue circles added yet.', 'କୌଣସି ରାଜସ୍ୱ ସର୍କଲ ଯୋଡାଯାଇନାହିଁ।')}
        />

        {highlightsDashboard ? (
          <section className="py-2 md:py-4">
            <h2 className={SECTION_H2}>{trStatic('Key highlights', 'ମୁଖ୍ୟ ହାଇଲାଇଟ୍')}</h2>
            <TahasilHighlightsDashboard data={highlightsDashboard} tr={trStatic} />
          </section>
        ) : null}

        {monitoringRows.some((r) =>
          [r.record_date, r.indicator_name, r.count_or_amount, r.unit, r.notes].some((x) => asString(x)),
        ) ? (
          <section className="py-2 md:py-4">
            <h2 className={SECTION_H2}>{trStatic('Operations & monitoring (Last FY)', 'ପରିଚାଳନା ଓ ନିରୀକ୍ଷଣ')}</h2>
            {tableShell(
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      {trStatic('Record date', 'ରେକର୍ଡ ତାରିଖ')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      {trStatic('Indicator', 'ସୂଚକ')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      {trStatic('Count / amount', 'ଗଣନା / ପରିମାଣ')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Unit', 'ଏକକ')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">{trStatic('Notes', 'ଟିପ୍ପଣୀ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringRows.map((row, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-800">{displayText(row.record_date)}</td>
                      <td className="px-4 py-3 text-slate-800">{displayText(row.indicator_name)}</td>
                      <td className="px-4 py-3 text-slate-800">{displayText(row.count_or_amount)}</td>
                      <td className="px-4 py-3 text-slate-800">{displayText(row.unit)}</td>
                      <td className="px-4 py-3 text-slate-600">{displayText(row.notes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>,
            )}
          </section>
        ) : null}

        <PsGallerySection gallery={galleryItems} />

        <PsContactSection org={org} profile={contactProfile} language={lang} />

        {useLazyParcels || parcelRows.length > 0 ? (
          <section className="py-2 md:py-4">
            <h2 className={SECTION_H2}>{trStatic('Government land parcels', 'ସରକାରୀ ଜମି ପାର୍ସେଲ୍')}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {trStatic(
                'Parcels linked to this Tahasil office.',
                'ଏହି ତହସିଲ କାର୍ଯ୍ୟାଳୟ ସହ ଯୋଡାଯାଇଥିବା ପାର୍ସେଲ୍।',
              )}
            </p>
            {useLazyParcels ? (
              <p className="mt-2 max-w-3xl text-[11px] text-slate-500">
                {trStatic(
                  'Parcels load in pages of 25 from the server. Use RI circle → Mouza → Category → Kisam, then Apply filter. Use Next for more rows. Header sorting is available when the full list is loaded locally (small lists).',
                  'ପାର୍ସେଲ୍ ସର୍ଭରରୁ ୨୫ କୁ ପୃଷ୍ଠା ଭାବେ ଲୋଡ୍ ହୁଏ। ଆର୍.ଆଇ. → ମୌଜା → ବର୍ଗ → କିସମ୍ ଚୟନ କରି ଫିଲ୍ଟର୍ ଲାଗୁ କରନ୍ତୁ। ଅଧିକ ପାଇଁ Next। ସମ୍ପୂର୍ଣ୍ଣ ତାଲିକା ଲୋକାଲ୍ ଥିଲେ ଶୀର୍ଷକ ସଜାଡ଼ ଉପଲବ୍ଧ।',
                )}
              </p>
            ) : null}
            {useLazyParcels ? (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('RI circle', 'ଆର୍.ଆଇ. ସର୍କଲ୍')}
                    </span>
                    <select
                      value={draftLazyRi}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraftLazyRi(v);
                        setDraftLazyMouza('');
                        setDraftLazyCategory('');
                        setDraftLazyKisam('');
                      }}
                      disabled={lazyFacetsLoading && lazyFacetRi.length === 0}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:cursor-wait disabled:opacity-70"
                    >
                      <option value="">{trStatic('Select…', 'ଚୟନ…')}</option>
                      {lazyFacetRi.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Mouza / village', 'ମୌଜା / ଗ୍ରାମ')}
                    </span>
                    <select
                      value={draftLazyMouza}
                      onChange={(e) => {
                        setDraftLazyMouza(e.target.value);
                        setDraftLazyCategory('');
                        setDraftLazyKisam('');
                      }}
                      disabled={!draftLazyRi}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">{trStatic('Select RI first', 'ପ୍ରଥମେ ଆର୍.ଆଇ. ଚୟନ')}</option>
                      {lazyFacetMouza.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Category', 'ବର୍ଗ')}
                    </span>
                    <select
                      value={draftLazyCategory}
                      onChange={(e) => {
                        setDraftLazyCategory(e.target.value);
                        setDraftLazyKisam('');
                      }}
                      disabled={!draftLazyRi || !draftLazyMouza}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">{trStatic('Select Mouza first', 'ପ୍ରଥମେ ମୌଜା ଚୟନ')}</option>
                      {lazyFacetCategory.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Kisam', 'କିସମ୍')}
                    </span>
                    <select
                      value={draftLazyKisam}
                      onChange={(e) => setDraftLazyKisam(e.target.value)}
                      disabled={!draftLazyRi || !draftLazyMouza || !draftLazyCategory}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">{trStatic('Select Category first', 'ପ୍ରଥମେ ବର୍ଗ ଚୟନ')}</option>
                      {lazyFacetKisam.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    onClick={() => {
                      setAppliedLazyRi(draftLazyRi);
                      setAppliedLazyMouza(draftLazyMouza);
                      setAppliedLazyCategory(draftLazyCategory);
                      setAppliedLazyKisam(draftLazyKisam);
                      setLazyPageIndex(0);
                    }}
                  >
                    {trStatic('Apply filter', 'ଫିଲ୍ଟର୍ ଲାଗୁ')}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setDraftLazyRi('');
                      setDraftLazyMouza('');
                      setDraftLazyCategory('');
                      setDraftLazyKisam('');
                      setAppliedLazyRi('');
                      setAppliedLazyMouza('');
                      setAppliedLazyCategory('');
                      setAppliedLazyKisam('');
                      setLazyPageIndex(0);
                    }}
                  >
                    {trStatic('Clear', 'ଖାଲି କରନ୍ତୁ')}
                  </button>
                  {lazyFacetsLoading ? (
                    <span className="text-xs text-slate-500">
                      {trStatic('Loading options…', 'ବିକଳ୍ପ ଲୋଡ୍…')}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {!useLazyParcels ? (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_12rem_1fr_auto] lg:items-end">
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Search', 'ଖୋଜ')}
                    </span>
                    <input
                      type="search"
                      value={parcelSearch}
                      onChange={(e) => setParcelSearch(e.target.value)}
                      placeholder={trStatic(
                        'Search parcel name and all columns…',
                        'ପାର୍ସେଲ୍ ନାମ ଓ ସମସ୍ତ କଲମ୍ ଖୋଜନ୍ତୁ…',
                      )}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                    />
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Filter by', 'ଫିଲ୍ଟର୍')}
                    </span>
                    <select
                      value={parcelFilterKey}
                      onChange={(e) => setParcelFilterKey(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400"
                    >
                      <option value="">{trStatic('Column…', 'କଲମ୍…')}</option>
                      <option value="name">{trStatic('Parcel name', 'ପାର୍ସେଲ୍ ନାମ')}</option>
                      {parcelColumns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.header}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {trStatic('Contains', 'ଧାରଣ କରେ')}
                    </span>
                    <input
                      type="text"
                      value={parcelFilterValue}
                      onChange={(e) => setParcelFilterValue(e.target.value)}
                      disabled={!parcelFilterKey}
                      placeholder={trStatic('Text to match…', 'ମେଳ ଖାଉଥିବା ଟେକ୍ସଟ୍…')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:pb-0.5">
                    <button
                      type="button"
                      disabled={
                        !parcelSearch.trim() &&
                        !(parcelFilterKey && parcelFilterValue.trim()) &&
                        !parcelSort
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        setParcelSearch('');
                        setParcelFilterKey('');
                        setParcelFilterValue('');
                        setParcelSort(null);
                      }}
                    >
                      {trStatic('Clear', 'ଖାଲି କରନ୍ତୁ')}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  {trStatic(
                    'Column headers sort the table. Search matches any field; filter narrows by one column.',
                    'କଲମ୍ ଶୀର୍ଷକ ଦ୍ୱାରା ସଜାଡ଼। ଖୋଜ ସବୁ କ୍ଷେତ୍ରରେ ମେଳ ଖୋଜେ; ଫିଲ୍ଟର୍ ଗୋଟିଏ କଲମ୍ ଅନୁସାରେ ସଙ୍କୋଚିତ କରେ।',
                  )}
                </p>
              </div>
            ) : null}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <PaginatedHorizontalTable<RevenueGovtLandRow>
                columns={parcelColumns}
                rows={processedParcelRows}
                pageSize={useLazyParcels ? PARCEL_PAGE_SIZE : 20}
                embedInCard={false}
                comfortable
                serverPagination={
                  useLazyParcels
                    ? {
                        total: lazyTotal,
                        pageIndex: lazyPageIndex,
                        onPageChange: setLazyPageIndex,
                        loading: lazyLoading,
                      }
                    : undefined
                }
                sortKey={useLazyParcels ? null : parcelSort?.key ?? null}
                sortDir={parcelSort?.dir ?? 'asc'}
                onSortColumn={
                  useLazyParcels
                    ? undefined
                    : (key) =>
                        setParcelSort((prev) =>
                          !prev || prev.key !== key
                            ? { key, dir: 'asc' }
                            : { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' },
                        )
                }
                emptyText={
                  useLazyParcels && lazyError
                    ? lazyError
                    : useLazyParcels && lazyLoading && processedParcelRows.length === 0
                      ? trStatic('Loading parcels…', 'ପାର୍ସେଲ୍ ଲୋଡ୍ ହେଉଛି…')
                      : useLazyParcels && !lazyLoading && lazyTotal === 0
                        ? trStatic(
                            'No land parcels are linked to this Tahasil yet.',
                            'ଏ ତହସିଲ ସହ ଏ ପର୍ଯ୍ୟନ୍ତ କୌଣସି ଜମି ପାର୍ସେଲ୍ ଯୋଡାଯାଇନାହିଁ।',
                          )
                        : !useLazyParcels && parcelRows.length > 0 && processedParcelRows.length === 0
                          ? trStatic(
                              'No parcels match your search or filters.',
                              'ଖୋଜ କିମ୍ବା ଫିଲ୍ଟର୍ ସହ କୌଣସି ପାର୍ସେଲ୍ ମେଳ ଖାଉନାହିଁ।',
                            )
                          : undefined
                }
                getRowId={(r) => r.org.id}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
