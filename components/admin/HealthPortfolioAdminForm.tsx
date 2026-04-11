'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';
import { getHealthProfileLabel } from '../../lib/profileLabels';
import { CharCount } from './ArcsPortfolioAdminForm';

type HealthPortfolioFormFields = Record<string, string>;

const MAX_UPLOAD_BYTES = 1024 * 1024;

export const HEALTH_PORTFOLIO_FIELD_LIMITS = {
  health_display_name: 120,
  health_hero_tagline: 280,
  health_about: 1500,
  health_established_year: 10,
  health_facility_type: 80,
  health_location_line: 200,
  health_inst_head_message: 1500,
  health_inst_head_name: 120,
  health_inst_head_qualification: 200,
  health_inst_head_experience: 200,
  health_inst_head_contact: 20,
  health_inst_head_email: 254,
  health_tagline: 180,
  health_office_hours: 200,
  health_full_address: 500,
  health_helpdesk_phone: 20,
  health_emergency_phone: 20,
  health_public_email: 254,
  health_contact_email: 120,
  gallery_category: 80,
  gallery_title: 100,
  gallery_description: 200,
  facility_title: 100,
  facility_description: 600,
  admin_name: 120,
  admin_role: 120,
  admin_contact: 40,
  admin_email: 120,
  doctor_name: 120,
  doctor_department: 120,
  doctor_qualification: 200,
  doctor_designation: 120,
  ts_nts_name: 120,
  ts_nts_category: 24,
  ts_nts_role: 120,
  ts_nts_department: 120,
  ts_nts_contact: 20,
  ts_nts_email: 120,
  resource_description: 800,
} as const;

/** Staff count keys used for public “Key highlights” total staff (same order as summed on site). */
const RESOURCE_STAFF_COUNT_KEYS = [
  'no_of_ts',
  'no_of_nts',
  'no_of_mo',
  'no_of_pharmacist',
  'no_of_anm',
  'no_of_health_worker',
  'no_of_pathology',
  'no_of_clerk',
  'no_of_sweeper',
  'no_of_nw',
] as const;

/** Defaults merged with `form` so every controlled field is defined (avoids broken renders if state misses keys). */
export const HEALTH_PORTFOLIO_EMPTY_FORM: Record<string, string> = {
  health_display_name: '',
  health_hero_tagline: '',
  health_tagline: '',
  health_hero_1: '',
  health_hero_2: '',
  health_hero_3: '',
  health_about: '',
  health_campus_image: '',
  health_established_year: '',
  health_facility_type: '',
  health_location_line: '',
  health_inst_head_message: '',
  health_inst_head_name: '',
  health_inst_head_photo: '',
  health_inst_head_qualification: '',
  health_inst_head_experience: '',
  health_inst_head_contact: '',
  health_inst_head_email: '',
  health_key_admin_cards_json: '[]',
  health_health_facility_cards_json: '[]',
  health_doctor_cards_json: '[]',
  health_doctor_attendance_json: '{}',
  health_ts_nts_staff_rows_json: '[]',
  health_clinical_staff_rows_json: '[]',
  health_equipment_rows_json: '[]',
  health_photo_gallery_json: '[]',
  health_full_address: '',
  health_helpdesk_phone: '',
  health_emergency_phone: '',
  health_public_email: '',
  health_office_hours: '',
  health_contact_email: '',
};

export type HealthPortfolioResourcesFields = {
  no_of_ts: string;
  no_of_nts: string;
  no_of_mo: string;
  no_of_pharmacist: string;
  no_of_anm: string;
  no_of_health_worker: string;
  no_of_pathology: string;
  no_of_clerk: string;
  no_of_sweeper: string;
  no_of_nw: string;
  no_of_bed: string;
  no_of_icu: string;
  x_ray_availabilaty: string;
  ct_scan_availability: string;
  availability_of_pathology_testing: string;
  description: string;
};

const KEY_ADMIN_FIXED_LABELS = ['Matron / Nursing in-charge', 'Pharmacist in-charge'] as const;

/** Legacy arrays had 4 fixed slots (MOIC, BPHO, Matron, Pharmacist) without a `role` field — drop the first two. */
function normalizeHealthKeyAdminRows(raw: Record<string, string>[]): Record<string, string>[] {
  const hasAnyRole = raw.some((r) => String(r.role || '').trim() !== '');
  if (raw.length >= 4 && !hasAnyRole) {
    return [raw[2] || {}, raw[3] || {}, ...raw.slice(4)];
  }
  if (raw.length === 0) return [{}, {}];
  if (raw.length === 1) return [raw[0] || {}, {}];
  return [...raw];
}

function parseRows(raw: string): Record<string, string>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, string>[]) : [];
  } catch {
    return [];
  }
}

function parseFacilityRows(raw: string): Record<string, unknown>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function rowsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows);
}

/** Normalize facility rows for API: parse `images_json` string into `images` array. */
export function normalizeHealthFacilityCardsForSave(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const next = { ...row };
    const ij = next.images_json;
    if (typeof ij === 'string' && ij.trim()) {
      try {
        const p = JSON.parse(ij) as unknown;
        if (Array.isArray(p)) next.images = p;
      } catch {
        /* keep as-is */
      }
      delete next.images_json;
    }
    return next;
  });
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Each image should be under 1 MB.');
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadHealthPortfolioAsset(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
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
            onUrl(await uploadAsset(organizationId, f, assetType));
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

function SectionBox({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

type HealthPortfolioSectionId =
  | 'hero'
  | 'about'
  | 'keyAdmins'
  | 'facilities'
  | 'doctors'
  | 'tsNts'
  | 'contact'
  | 'resources'
  | 'gallery';

/** Core facility / CSV fields edited alongside the portfolio (saved with the same form submit). */
export type HealthFacilityRecordFields = {
  block_ulb: string;
  gp_ward: string;
  village: string;
  name: string;
  institution_id: string;
  latitude: string;
  longitude: string;
  category: string;
  inst_head_name: string;
  inst_head_contact: string;
};

const HEALTH_PORTFOLIO_SECTION_ROWS: { id: HealthPortfolioSectionId; label: string; resourceOnly?: true }[] = [
  { id: 'hero', label: 'Hero & name' },
  { id: 'about', label: 'About' },
  { id: 'keyAdmins', label: 'Key admin contacts' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'doctors', label: 'Doctors & attendance' },
  { id: 'tsNts', label: 'TS & NTS staff' },
  { id: 'contact', label: 'Contact' },
  { id: 'resources', label: 'Highlights & staffing data', resourceOnly: true },
  { id: 'gallery', label: 'Gallery' },
];

function PortfolioSectionPanel({
  sectionId,
  activeSection,
  children,
}: {
  sectionId: HealthPortfolioSectionId;
  activeSection: HealthPortfolioSectionId;
  children: ReactNode;
}) {
  if (activeSection !== sectionId) return null;
  return <div className="min-w-0">{children}</div>;
}

export function HealthPortfolioAdminForm({
  organizationId,
  form,
  setForm,
  resources,
  onResourcesPatch,
  facilityRecord,
  onFacilityRecordPatch,
  profileImageControl,
}: {
  organizationId: number | null;
  form: HealthPortfolioFormFields;
  setForm: Dispatch<SetStateAction<HealthPortfolioFormFields>>;
  /** Staffing / beds / diagnostics saved on the same profile as the portfolio (Key highlights on public site). */
  resources?: HealthPortfolioResourcesFields;
  onResourcesPatch?: (patch: Partial<HealthPortfolioResourcesFields>) => void;
  facilityRecord: HealthFacilityRecordFields;
  onFacilityRecordPatch: (patch: Partial<HealthFacilityRecordFields>) => void;
  /** Optional cover image control rendered in the Hero section. */
  profileImageControl?: ReactNode;
}) {
  const f = useMemo(
    () => ({ ...HEALTH_PORTFOLIO_EMPTY_FORM, ...form }) as HealthPortfolioFormFields,
    [form],
  );

  const galleryRows = parseRows(f.health_photo_gallery_json || '');
  const keyAdminRows = useMemo(
    () => normalizeHealthKeyAdminRows(parseRows(f.health_key_admin_cards_json || '[]')),
    [f.health_key_admin_cards_json],
  );
  const facilityRows = parseFacilityRows(f.health_health_facility_cards_json || '[]');
  const doctorRows = parseRows(f.health_doctor_cards_json || '[]');
  const tsNtsRows = parseRows(f.health_ts_nts_staff_rows_json || '[]');

  const publicAboutName =
    [f.health_display_name, facilityRecord.name].find((s) => String(s || '').trim() !== '')?.trim() ||
    'this health centre';

  const patch = (p: Partial<HealthPortfolioFormFields>) =>
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(p).forEach(([key, value]) => {
        if (value !== undefined) next[key] = value;
      });
      return next;
    });

  const totalStaffPreview = useMemo(() => {
    if (!resources) return 0;
    return RESOURCE_STAFF_COUNT_KEYS.reduce((acc, k) => acc + (Number(String(resources[k]).replace(/\s/g, '')) || 0), 0);
  }, [resources]);

  const showResourcesSection = Boolean(resources && onResourcesPatch);
  const visibleSections = useMemo(
    () => HEALTH_PORTFOLIO_SECTION_ROWS.filter((r) => !r.resourceOnly || showResourcesSection),
    [showResourcesSection],
  );

  const [activeSection, setActiveSection] = useState<HealthPortfolioSectionId>('hero');

  useEffect(() => {
    if (!visibleSections.some((s) => s.id === activeSection)) {
      setActiveSection(visibleSections[0]?.id ?? 'hero');
    }
  }, [visibleSections, activeSection]);

  const sectionIndex = Math.max(0, visibleSections.findIndex((s) => s.id === activeSection));

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <p className="text-[11px] text-text-muted">
        Use the <span className="font-semibold text-text">section tabs</span> below to enter one block at a time (same sections as the public site). Save with{' '}
        <span className="font-semibold text-text">Update facility</span> when finished. Image uploads need an organization id — save the facility first, then{' '}
        <span className="font-semibold text-text">Edit</span>.
      </p>
      <div className="rounded border border-border bg-muted/30 p-2" role="tablist" aria-label="Portfolio sections">
        <span className="mb-1.5 block text-[10px] font-semibold text-text-muted">Section</span>
        <div className="flex max-h-[8.5rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {visibleSections.map((s) => {
            const selected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`health-portfolio-tab-${s.id}`}
                aria-selected={selected}
                aria-controls="health-portfolio-editor-panel"
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
        id="health-portfolio-editor-panel"
        aria-labelledby={`health-portfolio-tab-${activeSection}`}
        className="min-h-[12rem] min-w-0 space-y-3"
      >
      <PortfolioSectionPanel sectionId="hero" activeSection={activeSection}>
      <SectionBox id="health-portfolio-hero" title="Hero &amp; facility name (short title for the site)">
        <div className="grid gap-2 md:grid-cols-2">
          <p className="md:col-span-2 text-[10px] text-text-muted">
            Official facility name and category (organization record). Short display name and taglines below are for the public hero.
          </p>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Facility name (required for save)</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.name}
              onChange={(e) => onFacilityRecordPatch({ name: e.target.value })}
              placeholder="e.g. CHC, Keluapalli"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Institution ID</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.institution_id}
              onChange={(e) => onFacilityRecordPatch({ institution_id: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Category</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.category}
              onChange={(e) => onFacilityRecordPatch({ category: e.target.value })}
              placeholder="e.g. CHC"
            />
          </div>
          <div className="space-y-0.5 md:col-span-2 border-t border-border pt-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Health care center name (short)</span>
              <CharCount value={f.health_display_name || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_display_name} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Shown on hero if set; else facility name"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_display_name}
              value={f.health_display_name || ''}
              onChange={(e) => patch({ health_display_name: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Hero tagline (paragraph)</span>
              <CharCount value={f.health_hero_tagline || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_hero_tagline} />
            </div>
            <textarea
              rows={3}
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_hero_tagline}
              value={f.health_hero_tagline || ''}
              onChange={(e) => patch({ health_hero_tagline: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Short tagline (one line, optional fallback under name)</span>
              <CharCount value={f.health_tagline || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_tagline} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Used if hero tagline is empty"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_tagline}
              value={f.health_tagline || ''}
              onChange={(e) => patch({ health_tagline: e.target.value })}
            />
          </div>
          <ImgSlot label="Hero image 1" organizationId={organizationId} assetType="health_hero_slide" url={f.health_hero_1 || ''} onUrl={(v) => patch({ health_hero_1: v })} />
          <ImgSlot label="Hero image 2" organizationId={organizationId} assetType="health_hero_slide" url={f.health_hero_2 || ''} onUrl={(v) => patch({ health_hero_2: v })} />
          <ImgSlot label="Hero image 3" organizationId={organizationId} assetType="health_hero_slide" url={f.health_hero_3 || ''} onUrl={(v) => patch({ health_hero_3: v })} />
          {profileImageControl ? (
            <div className="space-y-1 md:col-span-2 border-t border-border pt-2">{profileImageControl}</div>
          ) : null}
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="about" activeSection={activeSection}>
      <SectionBox id="health-portfolio-about" title={`About ${publicAboutName}`}>
        <div className="grid gap-2 md:grid-cols-2">
          <p className="md:col-span-2 text-[10px] text-text-muted">
            Block / GP / village are stored on the organization profile (address and records). Use the narrative block below for the public About text.
          </p>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Block / ULB</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.block_ulb}
              onChange={(e) => onFacilityRecordPatch({ block_ulb: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">GP / Ward</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.gp_ward}
              onChange={(e) => onFacilityRecordPatch({ gp_ward: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <span className="text-[11px] text-text">Village</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.village}
              onChange={(e) => onFacilityRecordPatch({ village: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 border-t border-border pt-2" />
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">About health care center</span>
              <CharCount value={f.health_about || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_about} />
            </div>
            <textarea
              rows={5}
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_about}
              value={f.health_about || ''}
              onChange={(e) => patch({ health_about: e.target.value })}
            />
          </div>
          <ImgSlot label="Building / campus image" organizationId={organizationId} assetType="health_campus_image" url={f.health_campus_image || ''} onUrl={(v) => patch({ health_campus_image: v })} />
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Year of establishment</span>
              <CharCount value={f.health_established_year || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_established_year} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_established_year}
              value={f.health_established_year || ''}
              onChange={(e) => patch({ health_established_year: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Facility type</span>
              <CharCount value={f.health_facility_type || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_facility_type} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Health Care Center"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_facility_type}
              value={f.health_facility_type || ''}
              onChange={(e) => patch({ health_facility_type: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Location (one line)</span>
              <CharCount value={f.health_location_line || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_location_line} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_location_line}
              value={f.health_location_line || ''}
              onChange={(e) => patch({ health_location_line: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Institution head message</span>
              <CharCount value={f.health_inst_head_message || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_message} />
            </div>
            <textarea
              rows={4}
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_message}
              value={f.health_inst_head_message || ''}
              onChange={(e) => patch({ health_inst_head_message: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Institution head full name</span>
              <CharCount value={f.health_inst_head_name || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_name} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_name}
              value={f.health_inst_head_name || ''}
              onChange={(e) => patch({ health_inst_head_name: e.target.value })}
            />
          </div>
          <ImgSlot label="Institution head photo" organizationId={organizationId} assetType="health_inst_head_photo" url={f.health_inst_head_photo || ''} onUrl={(v) => patch({ health_inst_head_photo: v })} />
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Qualification</span>
              <CharCount value={f.health_inst_head_qualification || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_qualification} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_qualification}
              value={f.health_inst_head_qualification || ''}
              onChange={(e) => patch({ health_inst_head_qualification: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Experience</span>
              <CharCount value={f.health_inst_head_experience || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_experience} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_experience}
              value={f.health_inst_head_experience || ''}
              onChange={(e) => patch({ health_inst_head_experience: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Contact</span>
              <CharCount value={f.health_inst_head_contact || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_contact} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_contact}
              value={f.health_inst_head_contact || ''}
              onChange={(e) => patch({ health_inst_head_contact: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Email</span>
              <CharCount value={f.health_inst_head_email || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_email} />
            </div>
            <input
              type="email"
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_inst_head_email}
              value={f.health_inst_head_email || ''}
              onChange={(e) => patch({ health_inst_head_email: e.target.value })}
            />
          </div>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="keyAdmins" activeSection={activeSection}>
      <SectionBox id="health-portfolio-key-admins" title="Key admin contacts">
        <p className="mb-2 text-[10px] text-text-muted">
          First two rows are Matron and Pharmacist in-charge. Use <span className="font-medium">Add admin contact</span> for more roles (set
          the role label for each).
        </p>
        <div className="space-y-3">
          {KEY_ADMIN_FIXED_LABELS.map((label, i) => {
            const row = keyAdminRows[i] || {};
            return (
              <div
                key={`fixed-${label}`}
                className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end"
              >
                <div className="text-[10px] font-semibold text-text-muted">{label}</div>
                <ImgSlot
                  label="Photo"
                  organizationId={organizationId}
                  assetType="health_key_admin_photo"
                  url={row.image || ''}
                  onUrl={(v) => {
                    const n = [...keyAdminRows];
                    while (n.length < KEY_ADMIN_FIXED_LABELS.length) n.push({});
                    n[i] = { ...row, image: v };
                    patch({ health_key_admin_cards_json: rowsToJson(n) });
                  }}
                />
                <div className="space-y-0.5">
                  <CharCount value={row.name || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_name} />
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Name"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_name}
                    value={row.name || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      while (n.length < KEY_ADMIN_FIXED_LABELS.length) n.push({});
                      n[i] = { ...row, name: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Contact"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_contact}
                    value={row.contact || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      while (n.length < KEY_ADMIN_FIXED_LABELS.length) n.push({});
                      n[i] = { ...row, contact: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Email"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_email}
                    value={row.email || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      while (n.length < KEY_ADMIN_FIXED_LABELS.length) n.push({});
                      n[i] = { ...row, email: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
              </div>
            );
          })}
          {keyAdminRows.slice(KEY_ADMIN_FIXED_LABELS.length).map((row, j) => {
            const i = j + KEY_ADMIN_FIXED_LABELS.length;
            return (
              <div
                key={`extra-${i}-${row.role || ''}-${row.name || ''}`}
                className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,120px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,auto)] sm:items-end"
              >
                <div className="space-y-0.5 sm:col-span-1">
                  <CharCount value={row.role || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_role} />
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Role / designation"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_role}
                    value={row.role || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      n[i] = { ...row, role: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <ImgSlot
                  label="Photo"
                  organizationId={organizationId}
                  assetType="health_key_admin_photo"
                  url={row.image || ''}
                  onUrl={(v) => {
                    const n = [...keyAdminRows];
                    n[i] = { ...row, image: v };
                    patch({ health_key_admin_cards_json: rowsToJson(n) });
                  }}
                />
                <div className="space-y-0.5">
                  <CharCount value={row.name || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_name} />
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Name"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_name}
                    value={row.name || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      n[i] = { ...row, name: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Contact"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_contact}
                    value={row.contact || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      n[i] = { ...row, contact: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Email"
                    maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.admin_email}
                    value={row.email || ''}
                    onChange={(e) => {
                      const n = [...keyAdminRows];
                      n[i] = { ...row, email: e.target.value };
                      patch({ health_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="shrink-0 self-center text-[10px] text-red-600"
                  onClick={() => patch({ health_key_admin_cards_json: rowsToJson(keyAdminRows.filter((_, idx) => idx !== i)) })}
                >
                  Remove
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="rounded border border-border bg-background px-2 py-1 text-[11px] font-medium text-text hover:bg-muted/50"
            onClick={() => {
              const n = [...keyAdminRows];
              while (n.length < KEY_ADMIN_FIXED_LABELS.length) n.push({});
              n.push({ role: '', name: '', contact: '', email: '' });
              patch({ health_key_admin_cards_json: rowsToJson(n) });
            }}
          >
            + Add admin contact
          </button>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="facilities" activeSection={activeSection}>
      <SectionBox id="health-portfolio-facilities" title="Facilities">
        <p className="mb-2 text-[10px] text-text-muted">
          Cover image opens the modal; add extra images as JSON array: [{`{ "url": "...", "title": "..." }`}] per facility (or use uploads
          and paste URLs).
        </p>
        <div className="space-y-3">
          {(facilityRows.length ? facilityRows : [{}]).map((row, i, arr) => {
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
                  <ImgSlot
                    label="Cover"
                    organizationId={organizationId}
                    assetType="health_facility_cover"
                    url={String(r.image || '')}
                    onUrl={(v) => {
                      const n = [...arr];
                      n[i] = { ...row, image: v };
                      patch({ health_health_facility_cards_json: rowsToJson(n) });
                    }}
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-0.5">
                      <CharCount value={String(r.title || '')} max={HEALTH_PORTFOLIO_FIELD_LIMITS.facility_title} />
                      <input
                        className="w-full rounded border border-border px-2 py-1"
                        placeholder="Title"
                        maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.facility_title}
                        value={String(r.title || '')}
                        onChange={(e) => {
                          const n = [...arr];
                          n[i] = { ...row, title: e.target.value };
                          patch({ health_health_facility_cards_json: rowsToJson(n) });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="self-end text-[10px] text-red-600"
                      onClick={() => patch({ health_health_facility_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}
                    >
                      Remove facility
                    </button>
                    <div className="space-y-0.5 md:col-span-2">
                      <CharCount value={String(r.description || '')} max={HEALTH_PORTFOLIO_FIELD_LIMITS.facility_description} />
                      <textarea
                        rows={3}
                        className="w-full rounded border border-border px-2 py-1"
                        placeholder="Description"
                        maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.facility_description}
                        value={String(r.description || '')}
                        onChange={(e) => {
                          const n = [...arr];
                          n[i] = { ...row, description: e.target.value };
                          patch({ health_health_facility_cards_json: rowsToJson(n) });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-muted">Gallery images JSON</span>
                  <textarea
                    rows={2}
                    className="w-full rounded border border-border px-2 py-1 font-mono text-[10px]"
                    value={imagesJson}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, images_json: e.target.value };
                      delete (n[i] as Record<string, unknown>).images;
                      patch({ health_health_facility_cards_json: rowsToJson(n) });
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={!organizationId}
                    className="max-w-[200px] text-[10px] file:mr-1 file:rounded file:border-0 file:bg-primary file:px-1 file:py-0.5"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f || !organizationId) return;
                      const url = await uploadAsset(organizationId, f, 'health_facility_inner');
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
                      patch({ health_health_facility_cards_json: rowsToJson(n) });
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
            onClick={() => patch({ health_health_facility_cards_json: rowsToJson([...facilityRows, { image: '', title: '', description: '', images_json: '[]' }]) })}
          >
            + Add facility
          </button>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="doctors" activeSection={activeSection}>
      <SectionBox id="health-portfolio-doctors" title="Doctors &amp; today attendance">
        <p className="mb-2 text-[10px] text-text-muted">
          Attendance uses the same JSON shape as PS faculty: dates as keys, then row_0, row_1, … (boolean). Optional — leave {'{}'} to hide
          attendance on the public page.
        </p>
        <textarea
          rows={3}
          className="mb-3 w-full rounded border border-border px-2 py-1 font-mono text-[10px]"
          placeholder='{"2026-04-11":{"row_0":true}}'
          value={f.health_doctor_attendance_json || '{}'}
          onChange={(e) => patch({ health_doctor_attendance_json: e.target.value })}
        />
        <div className="space-y-2">
          {(doctorRows.length ? doctorRows : [{}]).map((row, i, arr) => (
            <div
              key={i}
              className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[minmax(0,100px)_repeat(4,minmax(0,1fr))_auto] sm:items-end"
            >
              <ImgSlot
                label="Photo"
                organizationId={organizationId}
                assetType="health_doctor_photo"
                url={row.photo || ''}
                onUrl={(v) => {
                  const n = [...arr];
                  n[i] = { ...row, photo: v };
                  patch({ health_doctor_cards_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Name"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.doctor_name}
                value={row.name || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, name: e.target.value };
                  patch({ health_doctor_cards_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Dept / Specialization"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.doctor_department}
                value={row.department || row.specialization || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, department: e.target.value };
                  patch({ health_doctor_cards_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Qualification"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.doctor_qualification}
                value={row.qualification || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, qualification: e.target.value };
                  patch({ health_doctor_cards_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Designation"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.doctor_designation}
                value={row.designation || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, designation: e.target.value };
                  patch({ health_doctor_cards_json: rowsToJson(n) });
                }}
              />
              <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ health_doctor_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ health_doctor_cards_json: rowsToJson([...doctorRows, {}]) })}>
            + Add doctor
          </button>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="tsNts" activeSection={activeSection}>
      <SectionBox id="health-portfolio-ts-nts" title="TS &amp; NTS staff">
        <div className="space-y-2">
          {(tsNtsRows.length ? tsNtsRows : [{}]).map((row, i, arr) => (
            <div key={i} className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 md:grid-cols-6">
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Staff name"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_name}
                value={row.staff_name || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, staff_name: e.target.value };
                  patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="TS / NTS"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_category}
                value={row.category || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, category: e.target.value };
                  patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Role"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_role}
                value={row.role_designation || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, role_designation: e.target.value };
                  patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Department"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_department}
                value={row.department || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, department: e.target.value };
                  patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                }}
              />
              <input
                className="rounded border border-border px-2 py-1"
                placeholder="Contact"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_contact}
                value={row.contact_number || ''}
                onChange={(e) => {
                  const n = [...arr];
                  n[i] = { ...row, contact_number: e.target.value };
                  patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                }}
              />
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded border border-border px-2 py-1"
                  placeholder="Email"
                  maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.ts_nts_email}
                  value={row.email || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, email: e.target.value };
                    patch({ health_ts_nts_staff_rows_json: rowsToJson(n) });
                  }}
                />
                <button type="button" className="shrink-0 text-[10px] text-red-600" onClick={() => patch({ health_ts_nts_staff_rows_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ health_ts_nts_staff_rows_json: rowsToJson([...tsNtsRows, {}]) })}>
            + Add staff row
          </button>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      <PortfolioSectionPanel sectionId="contact" activeSection={activeSection}>
      <SectionBox id="health-portfolio-contact" title="Contact">
        <p className="mb-2 text-[10px] text-text-muted">
          Coordinates are required for the organization and the public map embed (same pattern as school contact pages).
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Latitude (required for save)</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.latitude}
              onChange={(e) => onFacilityRecordPatch({ latitude: e.target.value })}
              placeholder="e.g. 19.210478"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Longitude (required for save)</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              value={facilityRecord.longitude}
              onChange={(e) => onFacilityRecordPatch({ longitude: e.target.value })}
              placeholder="e.g. 84.809169"
            />
          </div>
          <div className="space-y-0.5 md:col-span-2 border-t border-border pt-2">
            <CharCount value={f.health_full_address || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_full_address} />
            <textarea
              rows={2}
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Full address (public)"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_full_address}
              value={f.health_full_address || ''}
              onChange={(e) => patch({ health_full_address: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Helpdesk phone</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_helpdesk_phone}
              value={f.health_helpdesk_phone || ''}
              onChange={(e) => patch({ health_helpdesk_phone: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] text-text">Emergency phone</span>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_emergency_phone}
              value={f.health_emergency_phone || ''}
              onChange={(e) => patch({ health_emergency_phone: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <span className="text-[11px] text-text">Public email</span>
            <input
              type="email"
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_public_email}
              value={f.health_public_email || ''}
              onChange={(e) => patch({ health_public_email: e.target.value })}
            />
          </div>
          <div className="space-y-0.5 md:col-span-2">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-text">Office hours</span>
              <CharCount value={f.health_office_hours || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.health_office_hours} />
            </div>
            <input
              className="w-full rounded border border-border px-2 py-1"
              maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.health_office_hours}
              value={f.health_office_hours || ''}
              onChange={(e) => patch({ health_office_hours: e.target.value })}
            />
          </div>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>

      {resources && onResourcesPatch ? (
        <PortfolioSectionPanel sectionId="resources" activeSection={activeSection}>
        <SectionBox id="health-portfolio-resources" title="Highlights &amp; staffing data">
          <p className="mb-2 text-[10px] text-text-muted">
            These numbers drive the <span className="font-semibold">Key highlights</span> cards on the public site (beds, total staff, ICU).
            X-Ray / CT / pathology fields are stored on the profile for records only.
          </p>
          <p className="mb-3 text-[10px] font-medium text-text">
            Total staff preview (sum of TS … NW): <span className="tabular-nums">{totalStaffPreview}</span>
          </p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_STAFF_COUNT_KEYS.map((key) => (
              <div key={key} className="space-y-0.5">
                <label className="block text-[10px] text-text-muted">{getHealthProfileLabel(key, 'en')}</label>
                <input
                  type="number"
                  className="w-full rounded border border-border px-2 py-1"
                  value={resources[key]}
                  onChange={(e) => onResourcesPatch({ [key]: e.target.value } as Partial<HealthPortfolioResourcesFields>)}
                />
              </div>
            ))}
            <div className="space-y-0.5">
              <label className="block text-[10px] text-text-muted">{getHealthProfileLabel('no_of_bed', 'en')}</label>
              <input
                type="number"
                className="w-full rounded border border-border px-2 py-1"
                value={resources.no_of_bed}
                onChange={(e) => onResourcesPatch({ no_of_bed: e.target.value })}
              />
            </div>
            <div className="space-y-0.5">
              <label className="block text-[10px] text-text-muted">{getHealthProfileLabel('no_of_icu', 'en')}</label>
              <input
                type="number"
                className="w-full rounded border border-border px-2 py-1"
                value={resources.no_of_icu}
                onChange={(e) => onResourcesPatch({ no_of_icu: e.target.value })}
              />
            </div>
            <div className="space-y-0.5 md:col-span-2">
              <label className="block text-[10px] text-text-muted">X-Ray availability</label>
              <input
                className="w-full rounded border border-border px-2 py-1"
                value={resources.x_ray_availabilaty}
                onChange={(e) => onResourcesPatch({ x_ray_availabilaty: e.target.value })}
              />
            </div>
            <div className="space-y-0.5 md:col-span-2">
              <label className="block text-[10px] text-text-muted">{getHealthProfileLabel('ct_scan_availability', 'en')}</label>
              <input
                className="w-full rounded border border-border px-2 py-1"
                value={resources.ct_scan_availability}
                onChange={(e) => onResourcesPatch({ ct_scan_availability: e.target.value })}
              />
            </div>
            <div className="space-y-0.5 md:col-span-2 lg:col-span-3">
              <label className="block text-[10px] text-text-muted">{getHealthProfileLabel('availability_of_pathology_testing', 'en')}</label>
              <input
                className="w-full rounded border border-border px-2 py-1"
                value={resources.availability_of_pathology_testing}
                onChange={(e) => onResourcesPatch({ availability_of_pathology_testing: e.target.value })}
              />
            </div>
            <div className="space-y-0.5 md:col-span-2 lg:col-span-3">
              <div className="flex justify-between gap-2">
                <label className="block text-[10px] text-text-muted">
                  {getHealthProfileLabel('description', 'en')} (also fills about if “About” is empty on site)
                </label>
                <CharCount value={resources.description || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.resource_description} />
              </div>
              <textarea
                rows={2}
                className="w-full rounded border border-border px-2 py-1"
                maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.resource_description}
                value={resources.description}
                onChange={(e) => onResourcesPatch({ description: e.target.value })}
              />
            </div>
          </div>
        </SectionBox>
        </PortfolioSectionPanel>
      ) : null}

      <PortfolioSectionPanel sectionId="gallery" activeSection={activeSection}>
      <SectionBox id="health-portfolio-gallery" title="Photo gallery">
        <div className="space-y-2">
          {(galleryRows.length ? galleryRows : [{ image: '', category: '', title: '', description: '' }]).map((row, i, arr) => (
            <div
              key={i}
              className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,140px)_repeat(3,minmax(0,1fr))_auto] sm:items-end"
            >
              <ImgSlot
                label="Image"
                organizationId={organizationId}
                assetType="health_gallery"
                url={row.image || ''}
                onUrl={(v) => {
                  const n = [...arr];
                  n[i] = { ...row, image: v };
                  patch({ health_photo_gallery_json: rowsToJson(n) });
                }}
              />
              <div className="min-w-0 space-y-0.5">
                <CharCount value={row.category || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_category} />
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Category"
                  maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_category}
                  value={row.category || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, category: e.target.value };
                    patch({ health_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <div className="min-w-0 space-y-0.5">
                <CharCount value={row.title || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_title} />
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Title"
                  maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_title}
                  value={row.title || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, title: e.target.value };
                    patch({ health_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <div className="min-w-0 space-y-0.5">
                <CharCount value={row.description || ''} max={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_description} />
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Description (optional)"
                  maxLength={HEALTH_PORTFOLIO_FIELD_LIMITS.gallery_description}
                  value={row.description || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, description: e.target.value };
                    patch({ health_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ health_photo_gallery_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-[11px]"
            onClick={() => patch({ health_photo_gallery_json: rowsToJson([...galleryRows, { image: '', category: '', title: '', description: '' }]) })}
          >
            + Add gallery item
          </button>
        </div>
      </SectionBox>
      </PortfolioSectionPanel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-muted/20 px-2 py-2">
        <button
          type="button"
          className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-text hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={sectionIndex <= 0}
          onClick={() => setActiveSection(visibleSections[sectionIndex - 1]!.id)}
        >
          Previous section
        </button>
        <span className="text-[10px] text-text-muted">
          {sectionIndex + 1} / {visibleSections.length}
          {visibleSections[sectionIndex] ? ` — ${visibleSections[sectionIndex]!.label}` : ''}
        </span>
        <button
          type="button"
          className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-text hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={sectionIndex >= visibleSections.length - 1}
          onClick={() => setActiveSection(visibleSections[sectionIndex + 1]!.id)}
        >
          Next section
        </button>
      </div>
    </div>
  );
}
