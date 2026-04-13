'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';
import { CharCount } from './ArcsPortfolioAdminForm';

/** UI limits aligned with `center_profiles` String lengths; Text/JSON fields get practical caps. */
export const AWC_PORTFOLIO_FIELD_LIMITS = {
  awc_name: 255,
  awc_id: 64,
  building_status: 64,
  center_type: 32,
  scheme: 64,
  establishment_year: 10,
  sector: 128,
  lgd_code: 64,
  hero_slides_json: 24000,
  description: 2500,
  center_message: 1500,
  worker_experience: 800,
  about_image: 512,
  ulb_block: 128,
  gp_name: 128,
  ward_village: 128,
  district: 128,
  latitude: 20,
  longitude: 20,
  full_address: 2000,
  landmark: 256,
  rural_urban: 32,
  assembly_constituency: 128,
  lok_sabha_constituency: 128,
  accessibility_notes: 1500,
  contact_number: 32,
  contact_email: 254,
  office_hours: 200,
  worker_qualification: 128,
  worker_experience_years: 4,
  cpdo_name: 128,
  cpdo_contact_no: 32,
  supervisor_name: 128,
  supervisor_contact_name: 32,
  staff_email: 254,
  photo_url: 512,
  aww_name: 128,
  aww_contact_no: 32,
  awh_name: 128,
  awh_contact_no: 32,
  student_strength: 10,
  beneficiary_count: 12,
  total_area_sqft: 16,
  num_rooms: 8,
  drinking_water_source: 128,
  opening_time: 16,
  closing_time: 16,
  days_of_operation: 128,
  admin_cards_json: 32000,
  facility_cards_json: 32000,
  photo_gallery_json: 32000,
  /** Same caps as Health portfolio gallery (public PsGallerySection). */
  gallery_category: 80,
  gallery_title: 100,
  gallery_description: 200,
  /** Facility carousel cards (same caps as Health portfolio). */
  facility_title: 100,
  facility_description: 600,
} as const;

function SectionBox({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

export type AwcFacilityRecordFields = {
  ulb_block: string;
  gp_name: string;
  ward_village: string;
  sector: string;
  awc_name: string;
  awc_id: string;
  building_status: string;
  latitude: string;
  longitude: string;
  lgd_code: string;
  student_strength: string;
  cpdo_name: string;
  cpdo_contact_no: string;
  supervisor_name: string;
  supervisor_contact_name: string;
  aww_name: string;
  aww_contact_no: string;
  awh_name: string;
  awh_contact_no: string;
  description: string;
};

/** All editable center profile fields (minister + DB + public portfolio). */
export type AwcProfileExtrasFields = {
  center_type: string;
  scheme: string;
  establishment_year: string;
  district: string;
  full_address: string;
  landmark: string;
  rural_urban: string;
  assembly_constituency: string;
  lok_sabha_constituency: string;
  accessibility_notes: string;
  total_area_sqft: string;
  num_rooms: string;
  kitchen_avail: string;
  toilet_avail: string;
  toilet_child_friendly: string;
  drinking_water_source: string;
  electricity_avail: string;
  play_area_avail: string;
  storage_avail: string;
  digital_devices_avail: string;
  contact_number: string;
  worker_qualification: string;
  worker_experience_years: string;
  total_children_0_3: string;
  total_children_3_6: string;
  pregnant_women: string;
  lactating_mothers: string;
  adolescent_girls: string;
  total_active_beneficiaries: string;
  opening_time: string;
  closing_time: string;
  days_of_operation: string;
  /** Public portfolio (AwcPortfolioDashboard) */
  hero_slides_json: string;
  about_image: string;
  center_message: string;
  contact_email: string;
  office_hours: string;
  cpdo_photo: string;
  supervisor_photo: string;
  worker_photo: string;
  helper_photo: string;
  cpdo_email: string;
  supervisor_email: string;
  worker_email: string;
  helper_email: string;
  worker_experience: string;
  admin_cards_json: string;
  facility_cards_json: string;
  photo_gallery_json: string;
};

export function jsonFieldToString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '';
  }
}

function parseJsonArrayField(raw: string): unknown[] | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    const p = JSON.parse(t) as unknown;
    return Array.isArray(p) ? p : undefined;
  } catch {
    return undefined;
  }
}

/** Read slide URL at index (string or `{ image }` object) — mirrors Health’s three hero fields. */
function heroSlideUrlAt(raw: string, index: number): string {
  const arr = parseJsonArrayField(raw);
  if (!arr || arr[index] == null) return '';
  const item = arr[index];
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    const o = item as Record<string, unknown>;
    return String(o.image || o.url || o.src || '');
  }
  return '';
}

/** Set slide at index; trims trailing empty entries; empty string clears that slot. */
function patchHeroSlideAt(raw: string, index: number, url: string): string {
  const prev = parseJsonArrayField(raw)?.slice() ?? [];
  while (prev.length <= index) prev.push('');
  const trimmed = url.trim();
  prev[index] = trimmed || '';
  while (prev.length > 0 && prev[prev.length - 1] === '') prev.pop();
  if (prev.length === 0) return '';
  return JSON.stringify(prev, null, 2);
}

type AwcGalleryRow = { image: string; category: string; title: string; description: string };

/** Parse `photo_gallery` JSON into editable rows (Health gallery parity). */
function parseAwcGalleryRows(raw: string): AwcGalleryRow[] {
  const t = raw.trim();
  if (!t) return [];
  try {
    const parsed = JSON.parse(t) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item): AwcGalleryRow => {
      if (typeof item === 'string') return { image: item, category: '', title: '', description: '' };
      if (typeof item === 'object' && item !== null) {
        const o = item as Record<string, unknown>;
        return {
          image: String(o.image || o.url || ''),
          category: String(o.category ?? ''),
          title: String(o.title ?? ''),
          description: String(o.description ?? ''),
        };
      }
      return { image: '', category: '', title: '', description: '' };
    });
  } catch {
    return [];
  }
}

function awcGalleryRowsToJson(rows: AwcGalleryRow[]): string {
  if (rows.length === 0) return '';
  return JSON.stringify(rows);
}

/** Facility carousel rows (Health `health_health_facility_cards` parity). */
function parseAwcFacilityRows(raw: string): Record<string, unknown>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function awcFacilityRowsToJson(rows: Record<string, unknown>[]): string {
  return rows.length === 0 ? '' : JSON.stringify(rows);
}

/** Parse `images_json` string into `images` for API (same as Health). */
function normalizeAwcFacilityCardsForSave(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const next = { ...row };
    const ij = next.images_json;
    if (typeof ij === 'string' && ij.trim()) {
      try {
        const p = JSON.parse(ij) as unknown;
        if (Array.isArray(p)) next.images = p;
      } catch {
        /* keep */
      }
      delete next.images_json;
    }
    return next;
  });
}

export function emptyAwcProfileExtras(): AwcProfileExtrasFields {
  return {
    center_type: '',
    scheme: '',
    establishment_year: '',
    district: '',
    full_address: '',
    landmark: '',
    rural_urban: '',
    assembly_constituency: '',
    lok_sabha_constituency: '',
    accessibility_notes: '',
    total_area_sqft: '',
    num_rooms: '',
    kitchen_avail: '',
    toilet_avail: '',
    toilet_child_friendly: '',
    drinking_water_source: '',
    electricity_avail: '',
    play_area_avail: '',
    storage_avail: '',
    digital_devices_avail: '',
    contact_number: '',
    worker_qualification: '',
    worker_experience_years: '',
    total_children_0_3: '',
    total_children_3_6: '',
    pregnant_women: '',
    lactating_mothers: '',
    adolescent_girls: '',
    total_active_beneficiaries: '',
    opening_time: '',
    closing_time: '',
    days_of_operation: '',
    hero_slides_json: '',
    about_image: '',
    center_message: '',
    contact_email: '',
    office_hours: '',
    cpdo_photo: '',
    supervisor_photo: '',
    worker_photo: '',
    helper_photo: '',
    cpdo_email: '',
    supervisor_email: '',
    worker_email: '',
    helper_email: '',
    worker_experience: '',
    admin_cards_json: '',
    facility_cards_json: '',
    photo_gallery_json: '',
  };
}

const PORTFOLIO_STRING_KEYS = [
  'about_image',
  'center_message',
  'contact_email',
  'office_hours',
  'cpdo_photo',
  'supervisor_photo',
  'worker_photo',
  'helper_photo',
  'cpdo_email',
  'supervisor_email',
  'worker_email',
  'helper_email',
  'worker_experience',
] as const;

export function centerProfileToExtras(p: Record<string, unknown> | null | undefined): AwcProfileExtrasFields {
  const e = emptyAwcProfileExtras();
  if (!p) return e;
  (Object.keys(e) as (keyof AwcProfileExtrasFields)[]).forEach((k) => {
    if (
      k === 'hero_slides_json' ||
      k === 'admin_cards_json' ||
      k === 'facility_cards_json' ||
      k === 'photo_gallery_json'
    ) {
      return;
    }
    const v = p[k];
    if (v == null || v === '') return;
    if (typeof v === 'boolean') e[k] = v ? 'true' : '';
    else e[k] = String(v);
  });
  e.hero_slides_json = jsonFieldToString(p.hero_slides);
  e.admin_cards_json = jsonFieldToString(p.admin_cards);
  e.facility_cards_json = jsonFieldToString(p.facility_cards);
  e.photo_gallery_json = jsonFieldToString(p.photo_gallery);
  return e;
}

const _n = (s: string) => (s.trim() ? Number(s) : undefined);
const _nb = (s: string): boolean | undefined => {
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
};

/** Merge extras into API payload; skips empty strings for scalars. */
export function extrasToPartialProfile(extras: AwcProfileExtrasFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const str = (k: keyof AwcProfileExtrasFields) => {
    const v = extras[k]?.trim();
    if (v) out[k] = v;
  };
  str('center_type');
  str('scheme');
  str('district');
  str('full_address');
  str('landmark');
  str('rural_urban');
  str('assembly_constituency');
  str('lok_sabha_constituency');
  str('accessibility_notes');
  str('drinking_water_source');
  str('opening_time');
  str('closing_time');
  str('days_of_operation');
  str('contact_number');
  str('worker_qualification');
  for (const k of PORTFOLIO_STRING_KEYS) {
    str(k);
  }

  const hs = parseJsonArrayField(extras.hero_slides_json);
  if (hs !== undefined) out.hero_slides = hs;
  const ac = parseJsonArrayField(extras.admin_cards_json);
  if (ac !== undefined) out.admin_cards = ac;
  const fc = parseJsonArrayField(extras.facility_cards_json);
  if (fc !== undefined) {
    out.facility_cards = normalizeAwcFacilityCardsForSave(fc as Record<string, unknown>[]);
  }
  const pg = parseJsonArrayField(extras.photo_gallery_json);
  if (pg !== undefined) out.photo_gallery = pg;

  const yi = _n(extras.establishment_year);
  if (yi !== undefined && Number.isFinite(yi)) out.establishment_year = Math.round(yi);
  const ta = _n(extras.total_area_sqft);
  if (ta !== undefined && Number.isFinite(ta)) out.total_area_sqft = ta;
  const nr = _n(extras.num_rooms);
  if (nr !== undefined && Number.isFinite(nr)) out.num_rooms = Math.round(nr);
  const we = _n(extras.worker_experience_years);
  if (we !== undefined && Number.isFinite(we)) out.worker_experience_years = Math.round(we);

  for (const k of [
    'total_children_0_3',
    'total_children_3_6',
    'pregnant_women',
    'lactating_mothers',
    'adolescent_girls',
    'total_active_beneficiaries',
  ] as const) {
    const v = _n(extras[k]);
    if (v !== undefined && Number.isFinite(v)) out[k] = Math.round(v);
  }

  for (const k of [
    'kitchen_avail',
    'toilet_avail',
    'toilet_child_friendly',
    'electricity_avail',
    'play_area_avail',
    'storage_avail',
    'digital_devices_avail',
  ] as const) {
    const b = _nb(extras[k]);
    if (b !== undefined) out[k] = b;
  }

  return out;
}

type AwcSectionId = 'hero' | 'about' | 'location' | 'staff' | 'programme' | 'facilityCarousel' | 'infrastructure' | 'cards';

const AWC_SECTION_ROWS: { id: AwcSectionId; label: string }[] = [
  { id: 'hero', label: 'Hero & media' },
  { id: 'about', label: 'About & message' },
  { id: 'location', label: 'Location' },
  { id: 'staff', label: 'Staff & contacts' },
  { id: 'programme', label: 'Programme & data' },
  { id: 'facilityCarousel', label: 'Facilities' },
  { id: 'infrastructure', label: 'Infrastructure & timings' },
  { id: 'cards', label: 'Cards & gallery' },
];

function Panel({ sectionId, active, children }: { sectionId: AwcSectionId; active: AwcSectionId; children: ReactNode }) {
  if (active !== sectionId) return null;
  return <div className="min-w-0">{children}</div>;
}

function textInputClass() {
  return 'w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary';
}

function jsonTextareaClass() {
  return `${textInputClass()} min-h-[7rem] font-mono text-[10px] leading-relaxed`;
}

const MAX_AWC_UPLOAD_BYTES = 1024 * 1024;

async function uploadAwcAssetPrepared(orgId: number, file: File, assetType: string): Promise<string> {
  if (file.size > MAX_AWC_UPLOAD_BYTES) throw new Error('Each image should be under 1 MB.');
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadAwcPortfolioAsset(orgId, prepared, assetType);
  return url;
}

/** Single image → one URL field (same pattern as Health portfolio). */
function AwcImgSlot({
  label,
  organizationId,
  assetType,
  url,
  onUrl,
}: {
  label: string;
  organizationId: number | null;
  assetType: string;
  url: string;
  onUrl: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <span className="block text-[11px] text-text">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png"
        disabled={!organizationId || busy}
        className="block w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !organizationId) return;
          setBusy(true);
          setErr(null);
          try {
            onUrl(await uploadAwcAssetPrepared(organizationId, f, assetType));
          } catch (ex: unknown) {
            setErr(ex instanceof Error ? ex.message : 'Upload failed');
          } finally {
            setBusy(false);
          }
        }}
      />
      {err && <p className="text-[10px] text-red-600">{err}</p>}
      {url ? <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" /> : null}
    </div>
  );
}

export function AwcPortfolioAdminForm({
  organizationId,
  facilityRecord,
  onFacilityRecordPatch,
  extras,
  onExtrasPatch,
  profileImageControl,
}: {
  organizationId: number | null;
  facilityRecord: AwcFacilityRecordFields;
  onFacilityRecordPatch: (patch: Partial<AwcFacilityRecordFields>) => void;
  extras: AwcProfileExtrasFields;
  onExtrasPatch: (patch: Partial<AwcProfileExtrasFields>) => void;
  profileImageControl?: ReactNode;
}) {
  const patchFacility = onFacilityRecordPatch;
  const patchExtras = onExtrasPatch;

  const [activeSection, setActiveSection] = useState<AwcSectionId>('hero');

  useEffect(() => {
    if (!organizationId) setActiveSection('hero');
  }, [organizationId]);

  const boolChecked = (k: keyof AwcProfileExtrasFields) => extras[k] === 'true';

  const setBool = (k: keyof AwcProfileExtrasFields, v: boolean) =>
    patchExtras({ [k]: v ? 'true' : '' } as Partial<AwcProfileExtrasFields>);

  const awcGalleryRows = parseAwcGalleryRows(extras.photo_gallery_json);
  const awcFacilityRows = parseAwcFacilityRows(extras.facility_cards_json);

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <p className="text-[11px] text-text-muted">
        Use the <span className="font-semibold text-text">section tabs</span> below to enter one block at a time (same sections as the public site). Save with{' '}
        <span className="font-semibold text-text">{organizationId ? 'Update AWC' : 'Save AWC'}</span> when finished. Image uploads need an organization id — save the AWC first, then{' '}
        <span className="font-semibold text-text">Edit</span>.
      </p>
      <div className="rounded border border-border bg-muted/30 p-2" role="tablist" aria-label="AWC portfolio sections">
        <span className="mb-1.5 block text-[10px] font-semibold text-text-muted">Section</span>
        <div className="flex max-h-[8.5rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {AWC_SECTION_ROWS.map((s) => {
            const selected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`awc-portfolio-tab-${s.id}`}
                aria-selected={selected}
                aria-controls="awc-portfolio-editor-panel"
                className={`shrink-0 rounded border px-2 py-1.5 text-left text-[10px] font-medium transition-colors sm:text-center ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-text hover:bg-muted/50'
                }`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id="awc-portfolio-editor-panel"
        aria-labelledby={`awc-portfolio-tab-${activeSection}`}
        className="min-h-[12rem] min-w-0 space-y-3"
      >
        <Panel sectionId="hero" active={activeSection}>
          <SectionBox id="awc-hero" title="Hero &amp; facility name (short title for the site)">
            <div className="grid gap-2 md:grid-cols-2">
              <p className="md:col-span-2 text-[10px] text-text-muted">
                Official AWC name, building status, and centre code (organization record). Center type and hero images below are for the public hero; extra slides can stay in the JSON array.
              </p>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Name of AWC (required for save)</span>
                  <CharCount value={facilityRecord.awc_name} max={AWC_PORTFOLIO_FIELD_LIMITS.awc_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.awc_name}
                  onChange={(e) => patchFacility({ awc_name: e.target.value })}
                  placeholder="e.g. AWC Kamalapur"
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.awc_name}
                  required
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">AWC ID / centre code</span>
                  <CharCount value={facilityRecord.awc_id} max={AWC_PORTFOLIO_FIELD_LIMITS.awc_id} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.awc_id}
                  onChange={(e) => patchFacility({ awc_id: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.awc_id}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Building status</span>
                  <CharCount value={facilityRecord.building_status} max={AWC_PORTFOLIO_FIELD_LIMITS.building_status} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.building_status}
                  onChange={(e) => patchFacility({ building_status: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.building_status}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Center type (Main / Mini)</span>
                  <CharCount value={extras.center_type} max={AWC_PORTFOLIO_FIELD_LIMITS.center_type} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.center_type}
                  onChange={(e) => patchExtras({ center_type: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.center_type}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Scheme</span>
                  <CharCount value={extras.scheme} max={AWC_PORTFOLIO_FIELD_LIMITS.scheme} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.scheme}
                  onChange={(e) => patchExtras({ scheme: e.target.value })}
                  placeholder="e.g. ICDS"
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.scheme}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Establishment year</span>
                  <CharCount value={extras.establishment_year} max={AWC_PORTFOLIO_FIELD_LIMITS.establishment_year} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.establishment_year}
                  onChange={(e) => patchExtras({ establishment_year: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.establishment_year}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Sector / project</span>
                  <CharCount value={facilityRecord.sector} max={AWC_PORTFOLIO_FIELD_LIMITS.sector} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.sector}
                  onChange={(e) => patchFacility({ sector: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.sector}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">LGD code</span>
                  <CharCount value={facilityRecord.lgd_code} max={AWC_PORTFOLIO_FIELD_LIMITS.lgd_code} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.lgd_code}
                  onChange={(e) => patchFacility({ lgd_code: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.lgd_code}
                />
              </div>
              <AwcImgSlot
                label="Hero image 1"
                organizationId={organizationId}
                assetType="awc_hero_slide"
                url={heroSlideUrlAt(extras.hero_slides_json, 0)}
                onUrl={(u) => patchExtras({ hero_slides_json: patchHeroSlideAt(extras.hero_slides_json, 0, u) })}
              />
              <AwcImgSlot
                label="Hero image 2"
                organizationId={organizationId}
                assetType="awc_hero_slide"
                url={heroSlideUrlAt(extras.hero_slides_json, 1)}
                onUrl={(u) => patchExtras({ hero_slides_json: patchHeroSlideAt(extras.hero_slides_json, 1, u) })}
              />
              <AwcImgSlot
                label="Hero image 3"
                organizationId={organizationId}
                assetType="awc_hero_slide"
                url={heroSlideUrlAt(extras.hero_slides_json, 2)}
                onUrl={(u) => patchExtras({ hero_slides_json: patchHeroSlideAt(extras.hero_slides_json, 2, u) })}
              />
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Hero slides JSON (optional; fourth slide and objects)</span>
                  <CharCount value={extras.hero_slides_json} max={AWC_PORTFOLIO_FIELD_LIMITS.hero_slides_json} />
                </div>
                <textarea
                  className={jsonTextareaClass()}
                  value={extras.hero_slides_json}
                  onChange={(e) => patchExtras({ hero_slides_json: e.target.value })}
                  placeholder={`[\n  "https://example.com/slide1.jpg",\n  { "image": "https://example.com/slide2.jpg" }\n]`}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.hero_slides_json}
                  spellCheck={false}
                />
              </div>
              {profileImageControl ? <div className="md:col-span-2 space-y-1 border-t border-border pt-2">{profileImageControl}</div> : null}
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="about" active={activeSection}>
          <SectionBox id="awc-about" title="About text &amp; worker message">
            <div className="grid gap-2 md:grid-cols-2">
              <p className="md:col-span-2 text-[10px] text-text-muted">
                Block, GP, village, and coordinates are in <span className="font-medium">Location</span>. Use the fields below for the public About text and centre image.
              </p>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Description (about summary)</span>
                  <CharCount value={facilityRecord.description} max={AWC_PORTFOLIO_FIELD_LIMITS.description} />
                </div>
                <textarea
                  className={`${textInputClass()} min-h-[4rem]`}
                  value={facilityRecord.description}
                  onChange={(e) => patchFacility({ description: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.description}
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Centre / AWW message</span>
                  <CharCount value={extras.center_message} max={AWC_PORTFOLIO_FIELD_LIMITS.center_message} />
                </div>
                <textarea
                  className={`${textInputClass()} min-h-[5rem]`}
                  value={extras.center_message}
                  onChange={(e) => patchExtras({ center_message: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.center_message}
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">AWW experience (display text)</span>
                  <CharCount value={extras.worker_experience} max={AWC_PORTFOLIO_FIELD_LIMITS.worker_experience} />
                </div>
                <textarea
                  className={`${textInputClass()} min-h-[3rem]`}
                  value={extras.worker_experience}
                  onChange={(e) => patchExtras({ worker_experience: e.target.value })}
                  placeholder="Narrative shown under qualification on the public site"
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.worker_experience}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2" />
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">About section image URL</span>
                  <CharCount value={extras.about_image} max={AWC_PORTFOLIO_FIELD_LIMITS.about_image} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.about_image}
                  onChange={(e) => patchExtras({ about_image: e.target.value })}
                  placeholder="https://..."
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.about_image}
                />
              </div>
              <div className="md:col-span-2">
                <AwcImgSlot
                  label="Building / campus image"
                  organizationId={organizationId}
                  assetType="awc_about_image"
                  url={extras.about_image}
                  onUrl={(url) => patchExtras({ about_image: url })}
                />
              </div>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="location" active={activeSection}>
          <SectionBox id="awc-location" title="Location &amp; address">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">ULB / Block</span>
                  <CharCount value={facilityRecord.ulb_block} max={AWC_PORTFOLIO_FIELD_LIMITS.ulb_block} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.ulb_block}
                  onChange={(e) => patchFacility({ ulb_block: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.ulb_block}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">GP / Ward</span>
                  <CharCount value={facilityRecord.gp_name} max={AWC_PORTFOLIO_FIELD_LIMITS.gp_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.gp_name}
                  onChange={(e) => patchFacility({ gp_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.gp_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Village</span>
                  <CharCount value={facilityRecord.ward_village} max={AWC_PORTFOLIO_FIELD_LIMITS.ward_village} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.ward_village}
                  onChange={(e) => patchFacility({ ward_village: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.ward_village}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">District</span>
                  <CharCount value={extras.district} max={AWC_PORTFOLIO_FIELD_LIMITS.district} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.district}
                  onChange={(e) => patchExtras({ district: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.district}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Latitude (required)</span>
                  <CharCount value={facilityRecord.latitude} max={AWC_PORTFOLIO_FIELD_LIMITS.latitude} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.latitude}
                  onChange={(e) => patchFacility({ latitude: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.latitude}
                  required
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Longitude (required)</span>
                  <CharCount value={facilityRecord.longitude} max={AWC_PORTFOLIO_FIELD_LIMITS.longitude} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.longitude}
                  onChange={(e) => patchFacility({ longitude: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.longitude}
                  required
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Full address</span>
                  <CharCount value={extras.full_address} max={AWC_PORTFOLIO_FIELD_LIMITS.full_address} />
                </div>
                <textarea
                  className={`${textInputClass()} min-h-[4rem]`}
                  value={extras.full_address}
                  onChange={(e) => patchExtras({ full_address: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.full_address}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Landmark</span>
                  <CharCount value={extras.landmark} max={AWC_PORTFOLIO_FIELD_LIMITS.landmark} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.landmark}
                  onChange={(e) => patchExtras({ landmark: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.landmark}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Rural / Urban</span>
                  <CharCount value={extras.rural_urban} max={AWC_PORTFOLIO_FIELD_LIMITS.rural_urban} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.rural_urban}
                  onChange={(e) => patchExtras({ rural_urban: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.rural_urban}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Assembly constituency</span>
                  <CharCount value={extras.assembly_constituency} max={AWC_PORTFOLIO_FIELD_LIMITS.assembly_constituency} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.assembly_constituency}
                  onChange={(e) => patchExtras({ assembly_constituency: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.assembly_constituency}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Lok Sabha constituency</span>
                  <CharCount value={extras.lok_sabha_constituency} max={AWC_PORTFOLIO_FIELD_LIMITS.lok_sabha_constituency} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.lok_sabha_constituency}
                  onChange={(e) => patchExtras({ lok_sabha_constituency: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.lok_sabha_constituency}
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Accessibility notes</span>
                  <CharCount value={extras.accessibility_notes} max={AWC_PORTFOLIO_FIELD_LIMITS.accessibility_notes} />
                </div>
                <textarea
                  className={`${textInputClass()} min-h-[3rem]`}
                  value={extras.accessibility_notes}
                  onChange={(e) => patchExtras({ accessibility_notes: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.accessibility_notes}
                />
              </div>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="staff" active={activeSection}>
          <SectionBox id="awc-staff" title="Staff, photos &amp; emails">
            <div className="grid gap-2 md:grid-cols-2">
              <p className="md:col-span-2 text-[10px] text-text-muted">
                If <span className="font-medium">admin_cards</span> JSON is set (Cards tab), it overrides the default CPDO / Supervisor / AWW / AWH cards on the public site.
              </p>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Main phone (AWC)</span>
                  <CharCount value={extras.contact_number} max={AWC_PORTFOLIO_FIELD_LIMITS.contact_number} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.contact_number}
                  onChange={(e) => patchExtras({ contact_number: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.contact_number}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Public email</span>
                  <CharCount value={extras.contact_email} max={AWC_PORTFOLIO_FIELD_LIMITS.staff_email} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.contact_email}
                  onChange={(e) => patchExtras({ contact_email: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.staff_email}
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Office hours</span>
                  <CharCount value={extras.office_hours} max={AWC_PORTFOLIO_FIELD_LIMITS.office_hours} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.office_hours}
                  onChange={(e) => patchExtras({ office_hours: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.office_hours}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Worker qualification</span>
                  <CharCount value={extras.worker_qualification} max={AWC_PORTFOLIO_FIELD_LIMITS.worker_qualification} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.worker_qualification}
                  onChange={(e) => patchExtras({ worker_qualification: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.worker_qualification}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Worker experience (years, numeric)</span>
                  <CharCount value={extras.worker_experience_years} max={AWC_PORTFOLIO_FIELD_LIMITS.worker_experience_years} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.worker_experience_years}
                  onChange={(e) => patchExtras({ worker_experience_years: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.worker_experience_years}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">CPDO</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Name</span>
                  <CharCount value={facilityRecord.cpdo_name} max={AWC_PORTFOLIO_FIELD_LIMITS.cpdo_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.cpdo_name}
                  onChange={(e) => patchFacility({ cpdo_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.cpdo_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Phone</span>
                  <CharCount value={facilityRecord.cpdo_contact_no} max={AWC_PORTFOLIO_FIELD_LIMITS.cpdo_contact_no} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.cpdo_contact_no}
                  onChange={(e) => patchFacility({ cpdo_contact_no: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.cpdo_contact_no}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Email</span>
                  <CharCount value={extras.cpdo_email} max={AWC_PORTFOLIO_FIELD_LIMITS.staff_email} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.cpdo_email}
                  onChange={(e) => patchExtras({ cpdo_email: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.staff_email}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Photo URL</span>
                  <CharCount value={extras.cpdo_photo} max={AWC_PORTFOLIO_FIELD_LIMITS.photo_url} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.cpdo_photo}
                  onChange={(e) => patchExtras({ cpdo_photo: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.photo_url}
                />
              </div>
              <div className="md:col-span-2">
                <AwcImgSlot
                  label="Upload CPDO photo"
                  organizationId={organizationId}
                  assetType="awc_cpdo_photo"
                  url={extras.cpdo_photo}
                  onUrl={(url) => patchExtras({ cpdo_photo: url })}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">Supervisor</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Name</span>
                  <CharCount value={facilityRecord.supervisor_name} max={AWC_PORTFOLIO_FIELD_LIMITS.supervisor_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.supervisor_name}
                  onChange={(e) => patchFacility({ supervisor_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.supervisor_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Phone</span>
                  <CharCount value={facilityRecord.supervisor_contact_name} max={AWC_PORTFOLIO_FIELD_LIMITS.supervisor_contact_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.supervisor_contact_name}
                  onChange={(e) => patchFacility({ supervisor_contact_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.supervisor_contact_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Email</span>
                  <CharCount value={extras.supervisor_email} max={AWC_PORTFOLIO_FIELD_LIMITS.staff_email} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.supervisor_email}
                  onChange={(e) => patchExtras({ supervisor_email: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.staff_email}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Photo URL</span>
                  <CharCount value={extras.supervisor_photo} max={AWC_PORTFOLIO_FIELD_LIMITS.photo_url} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.supervisor_photo}
                  onChange={(e) => patchExtras({ supervisor_photo: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.photo_url}
                />
              </div>
              <div className="md:col-span-2">
                <AwcImgSlot
                  label="Upload supervisor photo"
                  organizationId={organizationId}
                  assetType="awc_supervisor_photo"
                  url={extras.supervisor_photo}
                  onUrl={(url) => patchExtras({ supervisor_photo: url })}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">AWW</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Name</span>
                  <CharCount value={facilityRecord.aww_name} max={AWC_PORTFOLIO_FIELD_LIMITS.aww_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.aww_name}
                  onChange={(e) => patchFacility({ aww_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.aww_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Phone</span>
                  <CharCount value={facilityRecord.aww_contact_no} max={AWC_PORTFOLIO_FIELD_LIMITS.aww_contact_no} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.aww_contact_no}
                  onChange={(e) => patchFacility({ aww_contact_no: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.aww_contact_no}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Email</span>
                  <CharCount value={extras.worker_email} max={AWC_PORTFOLIO_FIELD_LIMITS.staff_email} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.worker_email}
                  onChange={(e) => patchExtras({ worker_email: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.staff_email}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Photo URL</span>
                  <CharCount value={extras.worker_photo} max={AWC_PORTFOLIO_FIELD_LIMITS.photo_url} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.worker_photo}
                  onChange={(e) => patchExtras({ worker_photo: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.photo_url}
                />
              </div>
              <div className="md:col-span-2">
                <AwcImgSlot
                  label="Upload AWW photo"
                  organizationId={organizationId}
                  assetType="awc_worker_photo"
                  url={extras.worker_photo}
                  onUrl={(url) => patchExtras({ worker_photo: url })}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">AWH</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Name</span>
                  <CharCount value={facilityRecord.awh_name} max={AWC_PORTFOLIO_FIELD_LIMITS.awh_name} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.awh_name}
                  onChange={(e) => patchFacility({ awh_name: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.awh_name}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Phone</span>
                  <CharCount value={facilityRecord.awh_contact_no} max={AWC_PORTFOLIO_FIELD_LIMITS.awh_contact_no} />
                </div>
                <input
                  className={textInputClass()}
                  value={facilityRecord.awh_contact_no}
                  onChange={(e) => patchFacility({ awh_contact_no: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.awh_contact_no}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Email</span>
                  <CharCount value={extras.helper_email} max={AWC_PORTFOLIO_FIELD_LIMITS.staff_email} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.helper_email}
                  onChange={(e) => patchExtras({ helper_email: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.staff_email}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Photo URL</span>
                  <CharCount value={extras.helper_photo} max={AWC_PORTFOLIO_FIELD_LIMITS.photo_url} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.helper_photo}
                  onChange={(e) => patchExtras({ helper_photo: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.photo_url}
                />
              </div>
              <div className="md:col-span-2">
                <AwcImgSlot
                  label="Upload AWH photo"
                  organizationId={organizationId}
                  assetType="awc_helper_photo"
                  url={extras.helper_photo}
                  onUrl={(url) => patchExtras({ helper_photo: url })}
                />
              </div>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="programme" active={activeSection}>
          <SectionBox id="awc-programme" title="Strength &amp; beneficiary highlights">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Student strength</span>
                  <CharCount value={facilityRecord.student_strength} max={AWC_PORTFOLIO_FIELD_LIMITS.student_strength} />
                </div>
                <input
                  className={textInputClass()}
                  inputMode="numeric"
                  value={facilityRecord.student_strength}
                  onChange={(e) => patchFacility({ student_strength: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.student_strength}
                />
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">Registered beneficiaries (public “Key highlights”)</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Children 0–3</span>
                  <CharCount value={extras.total_children_0_3} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.total_children_0_3}
                  onChange={(e) => patchExtras({ total_children_0_3: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Children 3–6</span>
                  <CharCount value={extras.total_children_3_6} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.total_children_3_6}
                  onChange={(e) => patchExtras({ total_children_3_6: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Pregnant women</span>
                  <CharCount value={extras.pregnant_women} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.pregnant_women}
                  onChange={(e) => patchExtras({ pregnant_women: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Lactating mothers</span>
                  <CharCount value={extras.lactating_mothers} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.lactating_mothers}
                  onChange={(e) => patchExtras({ lactating_mothers: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Adolescent girls</span>
                  <CharCount value={extras.adolescent_girls} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.adolescent_girls}
                  onChange={(e) => patchExtras({ adolescent_girls: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Total active beneficiaries</span>
                  <CharCount value={extras.total_active_beneficiaries} max={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.total_active_beneficiaries}
                  onChange={(e) => patchExtras({ total_active_beneficiaries: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.beneficiary_count}
                />
              </div>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="facilityCarousel" active={activeSection}>
          <SectionBox id="awc-facility-carousel" title="Facilities (public carousel)">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <p className="text-[10px] text-text-muted">
                Same layout as Health admin: cover image, title, description, optional extra images as JSON per card. Shown on the public AWC site in the &quot;Facilities&quot; carousel.
              </p>
              <CharCount value={extras.facility_cards_json} max={AWC_PORTFOLIO_FIELD_LIMITS.facility_cards_json} />
            </div>
            <div className="space-y-3">
              {(awcFacilityRows.length ? awcFacilityRows : [{}]).map((row, i, arr) => {
                const r = row as Record<string, string>;
                const imagesJson =
                  typeof row.images_json === 'string'
                    ? row.images_json
                    : Array.isArray(row.images)
                      ? JSON.stringify(row.images, null, 0)
                      : '[]';
                return (
                  <div key={i} className="space-y-2 rounded border border-border p-2">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,120px)_1fr] sm:items-end">
                      <AwcImgSlot
                        label="Cover"
                        organizationId={organizationId}
                        assetType="awc_facility_cover"
                        url={String(r.image || '')}
                        onUrl={(v) => {
                          const n = [...arr];
                          n[i] = { ...row, image: v };
                          patchExtras({ facility_cards_json: awcFacilityRowsToJson(n) });
                        }}
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-0.5">
                          <CharCount value={String(r.title || '')} max={AWC_PORTFOLIO_FIELD_LIMITS.facility_title} />
                          <input
                            className={textInputClass()}
                            placeholder="Title"
                            maxLength={AWC_PORTFOLIO_FIELD_LIMITS.facility_title}
                            value={String(r.title || '')}
                            onChange={(e) => {
                              const n = [...arr];
                              n[i] = { ...row, title: e.target.value };
                              patchExtras({ facility_cards_json: awcFacilityRowsToJson(n) });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="self-end text-[10px] text-red-600"
                          onClick={() =>
                            patchExtras({ facility_cards_json: awcFacilityRowsToJson(arr.filter((_, j) => j !== i)) })
                          }
                        >
                          Remove facility
                        </button>
                        <div className="space-y-0.5 md:col-span-2">
                          <CharCount value={String(r.description || '')} max={AWC_PORTFOLIO_FIELD_LIMITS.facility_description} />
                          <textarea
                            rows={3}
                            className={textInputClass()}
                            placeholder="Description"
                            maxLength={AWC_PORTFOLIO_FIELD_LIMITS.facility_description}
                            value={String(r.description || '')}
                            onChange={(e) => {
                              const n = [...arr];
                              n[i] = { ...row, description: e.target.value };
                              patchExtras({ facility_cards_json: awcFacilityRowsToJson(n) });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-text-muted">Gallery images JSON</span>
                      <textarea
                        rows={2}
                        className={`${textInputClass()} font-mono text-[10px]`}
                        value={imagesJson}
                        onChange={(e) => {
                          const n = [...arr];
                          n[i] = { ...row, images_json: e.target.value };
                          delete (n[i] as Record<string, unknown>).images;
                          patchExtras({ facility_cards_json: awcFacilityRowsToJson(n) });
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        disabled={!organizationId}
                        className="max-w-[200px] text-[10px] file:mr-1 file:rounded file:border-0 file:bg-primary file:px-1 file:py-0.5 file:text-primary-foreground"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !organizationId) return;
                          const url = await uploadAwcAssetPrepared(organizationId, f, 'awc_facility_inner');
                          let list: Record<string, string>[] = [];
                          try {
                            list = JSON.parse(imagesJson) as Record<string, string>[];
                            if (!Array.isArray(list)) list = [];
                          } catch {
                            list = [];
                          }
                          list.push({ url, title: '' });
                          const n = [...arr];
                          n[i] = { ...row, images_json: JSON.stringify(list) };
                          delete (n[i] as Record<string, unknown>).images;
                          patchExtras({ facility_cards_json: awcFacilityRowsToJson(n) });
                        }}
                      />
                      <span className="text-[10px] text-text-muted">Appends one image URL to the JSON array.</span>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() =>
                  patchExtras({
                    facility_cards_json: awcFacilityRowsToJson([
                      ...awcFacilityRows,
                      { image: '', title: '', description: '', images_json: '[]' },
                    ]),
                  })
                }
              >
                + Add facility
              </button>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="infrastructure" active={activeSection}>
          <SectionBox id="awc-facilities" title="Infrastructure &amp; timings">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Total area (sq ft)</span>
                  <CharCount value={extras.total_area_sqft} max={AWC_PORTFOLIO_FIELD_LIMITS.total_area_sqft} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.total_area_sqft}
                  onChange={(e) => patchExtras({ total_area_sqft: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.total_area_sqft}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Number of rooms</span>
                  <CharCount value={extras.num_rooms} max={AWC_PORTFOLIO_FIELD_LIMITS.num_rooms} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.num_rooms}
                  onChange={(e) => patchExtras({ num_rooms: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.num_rooms}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Drinking water source</span>
                  <CharCount value={extras.drinking_water_source} max={AWC_PORTFOLIO_FIELD_LIMITS.drinking_water_source} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.drinking_water_source}
                  onChange={(e) => patchExtras({ drinking_water_source: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.drinking_water_source}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 md:col-span-2">
                {(
                  [
                    ['kitchen_avail', 'Kitchen'],
                    ['toilet_avail', 'Toilet'],
                    ['toilet_child_friendly', 'Child-friendly toilet'],
                    ['electricity_avail', 'Electricity'],
                    ['play_area_avail', 'Play area'],
                    ['storage_avail', 'Storage'],
                    ['digital_devices_avail', 'Digital devices'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-[11px] text-text">
                    <input type="checkbox" checked={boolChecked(key)} onChange={(e) => setBool(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="md:col-span-2 border-t border-border pt-2 text-[10px] font-semibold text-text-muted">Timings</div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Opening time</span>
                  <CharCount value={extras.opening_time} max={AWC_PORTFOLIO_FIELD_LIMITS.opening_time} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.opening_time}
                  onChange={(e) => patchExtras({ opening_time: e.target.value })}
                  placeholder="09:00"
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.opening_time}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Closing time</span>
                  <CharCount value={extras.closing_time} max={AWC_PORTFOLIO_FIELD_LIMITS.closing_time} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.closing_time}
                  onChange={(e) => patchExtras({ closing_time: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.closing_time}
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Days of operation</span>
                  <CharCount value={extras.days_of_operation} max={AWC_PORTFOLIO_FIELD_LIMITS.days_of_operation} />
                </div>
                <input
                  className={textInputClass()}
                  value={extras.days_of_operation}
                  onChange={(e) => patchExtras({ days_of_operation: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.days_of_operation}
                />
              </div>
            </div>
          </SectionBox>
        </Panel>

        <Panel sectionId="cards" active={activeSection}>
          <SectionBox id="awc-cards" title="Admin cards &amp; photo gallery">
            <div className="grid gap-3 md:grid-cols-1">
              <p className="text-[10px] text-text-muted">
                Optional JSON for <span className="font-medium">admin_cards</span> ({' '}
                <code className="rounded bg-muted px-0.5">role, name, contact, email, image</code>) to override default key contacts. Invalid JSON is ignored on save.{' '}
                Use the <span className="font-medium">Facilities</span> tab for the public facilities carousel (same as Health).{' '}
                <span className="font-medium">Photo gallery</span> below uses the Health-style row editor.
              </p>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] font-medium text-text">admin_cards</span>
                  <CharCount value={extras.admin_cards_json} max={AWC_PORTFOLIO_FIELD_LIMITS.admin_cards_json} />
                </div>
                <textarea
                  className={jsonTextareaClass()}
                  value={extras.admin_cards_json}
                  onChange={(e) => patchExtras({ admin_cards_json: e.target.value })}
                  maxLength={AWC_PORTFOLIO_FIELD_LIMITS.admin_cards_json}
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h5 className="text-[11px] font-semibold text-text">Photo gallery</h5>
                  <CharCount value={extras.photo_gallery_json} max={AWC_PORTFOLIO_FIELD_LIMITS.photo_gallery_json} />
                </div>
                <p className="text-[10px] text-text-muted">
                  One row per image — same pattern as the Health department &quot;Photo gallery&quot; tab. Saves to <code className="rounded bg-muted px-0.5">photo_gallery</code> on the center profile.
                </p>
                <div className="space-y-2">
                  {(awcGalleryRows.length ? awcGalleryRows : [{ image: '', category: '', title: '', description: '' }]).map((row, i, arr) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,140px)_repeat(3,minmax(0,1fr))_auto] sm:items-end"
                    >
                      <AwcImgSlot
                        label="Image"
                        organizationId={organizationId}
                        assetType="awc_gallery"
                        url={row.image || ''}
                        onUrl={(v) => {
                          const n = [...arr];
                          n[i] = { ...row, image: v };
                          patchExtras({ photo_gallery_json: awcGalleryRowsToJson(n) });
                        }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <CharCount value={row.category || ''} max={AWC_PORTFOLIO_FIELD_LIMITS.gallery_category} />
                        <input
                          className={textInputClass()}
                          placeholder="Category"
                          maxLength={AWC_PORTFOLIO_FIELD_LIMITS.gallery_category}
                          value={row.category || ''}
                          onChange={(e) => {
                            const n = [...arr];
                            n[i] = { ...row, category: e.target.value };
                            patchExtras({ photo_gallery_json: awcGalleryRowsToJson(n) });
                          }}
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <CharCount value={row.title || ''} max={AWC_PORTFOLIO_FIELD_LIMITS.gallery_title} />
                        <input
                          className={textInputClass()}
                          placeholder="Title"
                          maxLength={AWC_PORTFOLIO_FIELD_LIMITS.gallery_title}
                          value={row.title || ''}
                          onChange={(e) => {
                            const n = [...arr];
                            n[i] = { ...row, title: e.target.value };
                            patchExtras({ photo_gallery_json: awcGalleryRowsToJson(n) });
                          }}
                        />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <CharCount value={row.description || ''} max={AWC_PORTFOLIO_FIELD_LIMITS.gallery_description} />
                        <input
                          className={textInputClass()}
                          placeholder="Description (optional)"
                          maxLength={AWC_PORTFOLIO_FIELD_LIMITS.gallery_description}
                          value={row.description || ''}
                          onChange={(e) => {
                            const n = [...arr];
                            n[i] = { ...row, description: e.target.value };
                            patchExtras({ photo_gallery_json: awcGalleryRowsToJson(n) });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="text-[10px] text-red-600"
                        onClick={() => {
                          const next = arr.filter((_, j) => j !== i);
                          patchExtras({ photo_gallery_json: awcGalleryRowsToJson(next) });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-1 text-[11px]"
                    onClick={() => {
                      const base = awcGalleryRows;
                      patchExtras({
                        photo_gallery_json: awcGalleryRowsToJson([
                          ...base,
                          { image: '', category: '', title: '', description: '' },
                        ]),
                      });
                    }}
                  >
                    + Add gallery item
                  </button>
                </div>
              </div>
            </div>
          </SectionBox>
        </Panel>
      </div>
    </div>
  );
}
