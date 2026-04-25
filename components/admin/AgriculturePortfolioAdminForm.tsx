'use client';

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';
import { CharCount } from './ArcsPortfolioAdminForm';

type AgriculturePortfolioFormFields = Record<string, string>;

export const AGRICULTURE_PORTFOLIO_FIELD_LIMITS = {
  ag_display_name: 120,
  ag_hero_tagline: 280,
  ag_tagline: 180,
  ag_about: 1500,
  ag_established_year: 10,
  ag_facility_type: 80,
  ag_location_line: 200,
  ag_head_message: 1500,
  ag_head_name: 120,
  ag_head_qualification: 200,
  ag_head_experience: 200,
  ag_head_contact: 20,
  ag_head_email: 254,
  ag_office_hours: 200,
  ag_full_address: 500,
  ag_helpdesk_phone: 20,
  ag_emergency_phone: 20,
  ag_public_email: 254,
  gallery_title: 100,
  gallery_description: 200,
  admin_name: 120,
  admin_role: 120,
  admin_contact: 40,
  admin_email: 120,
  expert_name: 120,
  expert_department: 120,
  expert_qualification: 200,
  expert_designation: 120,
  staff_name: 120,
  staff_category: 40,
  staff_role: 120,
  staff_department: 120,
  staff_contact: 20,
  staff_email: 120,
  facility_title: 100,
  facility_description: 600,
} as const;

export const AGRICULTURE_PORTFOLIO_EMPTY_FORM: Record<string, string> = {
  ag_display_name: '',
  ag_hero_tagline: '',
  ag_tagline: '',
  ag_hero_1: '',
  ag_hero_2: '',
  ag_hero_3: '',
  ag_about: '',
  ag_campus_image: '',
  ag_established_year: '',
  ag_facility_type: '',
  ag_location_line: '',
  ag_head_message: '',
  ag_head_name: '',
  ag_head_photo: '',
  ag_head_qualification: '',
  ag_head_experience: '',
  ag_head_contact: '',
  ag_head_email: '',
  ag_key_admin_cards_json: '[]',
  ag_facility_cards_json: '[]',
  ag_expert_cards_json: '[]',
  ag_expert_attendance_json: '{}',
  ag_staff_rows_json: '[]',
  ag_daily_stock_rows_json: '[]',
  ag_photo_gallery_json: '[]',
  ag_full_address: '',
  ag_helpdesk_phone: '',
  ag_emergency_phone: '',
  ag_public_email: '',
  ag_office_hours: '',
};

export type AgricultureFacilityRecordFields = {
  block_ulb: string;
  gp_ward: string;
  village_locality: string;
  name: string;
  institution_id: string;
  institution_type: string;
  latitude: string;
  longitude: string;
};

export type AgricultureResourcesFields = {
  total_staff: string;
  villages_covered: string;
  farmers_served_last_year: string;
};

type AgriculturePortfolioSectionId =
  | 'hero'
  | 'about'
  | 'keyAdmins'
  | 'facilities'
  | 'experts'
  | 'staff'
  | 'contact'
  | 'resources'
  | 'gallery';

const AG_PORTFOLIO_SECTION_ROWS: { id: AgriculturePortfolioSectionId; label: string }[] = [
  { id: 'hero', label: 'Hero & name' },
  { id: 'about', label: 'About' },
  { id: 'keyAdmins', label: 'Key admin contacts' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'experts', label: 'Team' },
  { id: 'staff', label: 'Staff table' },
  { id: 'contact', label: 'Contact' },
  { id: 'resources', label: 'Highlights' },
  { id: 'gallery', label: 'Gallery' },
];

function parseRows(raw: string): Record<string, string>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, string>[]) : [];
  } catch {
    return [];
  }
}

function rowsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows);
}

export function normalizeAgricultureFacilityCardsForSave(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const next = { ...row };
    const ij = next.images_json;
    if (typeof ij === 'string' && ij.trim()) {
      try {
        const p = JSON.parse(ij) as unknown;
        if (Array.isArray(p)) next.images = p;
      } catch {
        // keep as-is
      }
      delete next.images_json;
    }
    return next;
  });
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadAgriculturePortfolioAsset(orgId, prepared, assetType);
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

function SectionBox({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

export function AgriculturePortfolioAdminForm({
  organizationId,
  form,
  setForm,
  facilityRecord,
  onFacilityRecordPatch,
  profileImageControl,
  resources,
  onResourcesPatch,
}: {
  organizationId: number | null;
  form: AgriculturePortfolioFormFields;
  setForm: Dispatch<SetStateAction<AgriculturePortfolioFormFields>>;
  facilityRecord: AgricultureFacilityRecordFields;
  onFacilityRecordPatch: (patch: Partial<AgricultureFacilityRecordFields>) => void;
  profileImageControl?: ReactNode;
  resources: AgricultureResourcesFields;
  onResourcesPatch: (patch: Partial<AgricultureResourcesFields>) => void;
}) {
  const f = useMemo(() => ({ ...AGRICULTURE_PORTFOLIO_EMPTY_FORM, ...form }), [form]);
  const patch = (p: Partial<AgriculturePortfolioFormFields>) =>
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined) next[k] = v;
      });
      return next;
    });

  const keyAdminRows = parseRows(f.ag_key_admin_cards_json || '[]');
  const facilityRows = parseRows(f.ag_facility_cards_json || '[]');
  const expertRows = parseRows(f.ag_expert_cards_json || '[]');
  const staffRows = parseRows(f.ag_staff_rows_json || '[]');
  const stockRows = parseRows(f.ag_daily_stock_rows_json || '[]');
  const galleryRows = parseRows(f.ag_photo_gallery_json || '[]');

  const [activeSection, setActiveSection] = useState<AgriculturePortfolioSectionId>('hero');
  useEffect(() => {
    if (!AG_PORTFOLIO_SECTION_ROWS.some((s) => s.id === activeSection)) setActiveSection('hero');
  }, [activeSection]);
  const sectionIndex = Math.max(0, AG_PORTFOLIO_SECTION_ROWS.findIndex((s) => s.id === activeSection));

  const section = (id: AgriculturePortfolioSectionId, children: ReactNode) =>
    activeSection === id ? <div className="min-w-0">{children}</div> : null;

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <p className="text-[11px] text-text-muted">
        Use section tabs below to fill data exactly in public page order. Save with{' '}
        <span className="font-semibold text-text">Update facility</span> when done.
      </p>
      <div className="rounded border border-border bg-muted/30 p-2" role="tablist" aria-label="Portfolio sections">
        <span className="mb-1.5 block text-[10px] font-semibold text-text-muted">Section</span>
        <div className="flex max-h-[8.5rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {AG_PORTFOLIO_SECTION_ROWS.map((s) => {
            const selected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`shrink-0 rounded border px-2 py-1.5 text-left text-[10px] font-medium transition-colors sm:text-center ${selected
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

      <div className="min-h-[12rem] min-w-0 space-y-3">
        {section(
          'hero',
          <SectionBox id="ag-hero" title="Hero & facility name">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5">
                <span className="text-[11px] text-text">Facility name</span>
                <input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.name} onChange={(e) => onFacilityRecordPatch({ name: e.target.value })} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-text">Institution ID</span>
                <input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.institution_id} onChange={(e) => onFacilityRecordPatch({ institution_id: e.target.value })} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-text">Institution type</span>
                <input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.institution_type} onChange={(e) => onFacilityRecordPatch({ institution_type: e.target.value })} />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2"><span className="text-[11px] text-text">Display name (short)</span><CharCount value={f.ag_display_name || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_display_name} /></div>
                <input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_display_name} value={f.ag_display_name || ''} onChange={(e) => patch({ ag_display_name: e.target.value })} />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2"><span className="text-[11px] text-text">Hero tagline</span><CharCount value={f.ag_hero_tagline || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_hero_tagline} /></div>
                <textarea rows={3} className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_hero_tagline} value={f.ag_hero_tagline || ''} onChange={(e) => patch({ ag_hero_tagline: e.target.value })} />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2"><span className="text-[11px] text-text">Secondary tagline</span><CharCount value={f.ag_tagline || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_tagline} /></div>
                <input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_tagline} value={f.ag_tagline || ''} onChange={(e) => patch({ ag_tagline: e.target.value })} />
              </div>
              <ImgSlot label="Hero image 1" organizationId={organizationId} assetType="ag_hero_slide" url={f.ag_hero_1 || ''} onUrl={(v) => patch({ ag_hero_1: v })} />
              <ImgSlot label="Hero image 2" organizationId={organizationId} assetType="ag_hero_slide" url={f.ag_hero_2 || ''} onUrl={(v) => patch({ ag_hero_2: v })} />
              <ImgSlot label="Hero image 3" organizationId={organizationId} assetType="ag_hero_slide" url={f.ag_hero_3 || ''} onUrl={(v) => patch({ ag_hero_3: v })} />
              {profileImageControl ? <div className="space-y-1 md:col-span-2 border-t border-border pt-2">{profileImageControl}</div> : null}
            </div>
          </SectionBox>,
        )}

        {section(
          'about',
          <SectionBox id="ag-about" title="About center">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5"><span className="text-[11px] text-text">Block / ULB</span><input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.block_ulb} onChange={(e) => onFacilityRecordPatch({ block_ulb: e.target.value })} /></div>
              <div className="space-y-0.5"><span className="text-[11px] text-text">GP / Ward</span><input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.gp_ward} onChange={(e) => onFacilityRecordPatch({ gp_ward: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><span className="text-[11px] text-text">Village / locality</span><input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.village_locality} onChange={(e) => onFacilityRecordPatch({ village_locality: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">About text</span><CharCount value={f.ag_about || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_about} /></div><textarea rows={5} className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_about} value={f.ag_about || ''} onChange={(e) => patch({ ag_about: e.target.value })} /></div>
              <ImgSlot label="Center/campus image" organizationId={organizationId} assetType="ag_campus_image" url={f.ag_campus_image || ''} onUrl={(v) => patch({ ag_campus_image: v })} />
              <div className="space-y-0.5"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">Year established</span><CharCount value={f.ag_established_year || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_established_year} /></div><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_established_year} value={f.ag_established_year || ''} onChange={(e) => patch({ ag_established_year: e.target.value })} /></div>
              <div className="space-y-0.5"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">Facility type</span><CharCount value={f.ag_facility_type || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_facility_type} /></div><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_facility_type} value={f.ag_facility_type || ''} onChange={(e) => patch({ ag_facility_type: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">Location line</span><CharCount value={f.ag_location_line || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_location_line} /></div><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_location_line} value={f.ag_location_line || ''} onChange={(e) => patch({ ag_location_line: e.target.value })} /></div>
              <div className="md:col-span-2 border-t border-border pt-2" />
              <div className="space-y-0.5 md:col-span-2">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Institution head message</span>
                  <CharCount value={f.ag_head_message || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_message} />
                </div>
                <textarea
                  rows={4}
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_message}
                  value={f.ag_head_message || ''}
                  onChange={(e) => patch({ ag_head_message: e.target.value })}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Institution head full name</span>
                  <CharCount value={f.ag_head_name || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_name} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_name}
                  value={f.ag_head_name || ''}
                  onChange={(e) => patch({ ag_head_name: e.target.value })}
                />
              </div>
              <ImgSlot label="Institution head photo" organizationId={organizationId} assetType="ag_head_photo" url={f.ag_head_photo || ''} onUrl={(v) => patch({ ag_head_photo: v })} />
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Qualification</span>
                  <CharCount value={f.ag_head_qualification || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_qualification} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_qualification}
                  value={f.ag_head_qualification || ''}
                  onChange={(e) => patch({ ag_head_qualification: e.target.value })}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Experience</span>
                  <CharCount value={f.ag_head_experience || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_experience} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_experience}
                  value={f.ag_head_experience || ''}
                  onChange={(e) => patch({ ag_head_experience: e.target.value })}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Contact number</span>
                  <CharCount value={f.ag_head_contact || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_contact} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_contact}
                  value={f.ag_head_contact || ''}
                  onChange={(e) => patch({ ag_head_contact: e.target.value })}
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] text-text">Email</span>
                  <CharCount value={f.ag_head_email || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_email} />
                </div>
                <input
                  type="email"
                  className="w-full rounded border border-border px-2 py-1"
                  maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_head_email}
                  value={f.ag_head_email || ''}
                  onChange={(e) => patch({ ag_head_email: e.target.value })}
                />
              </div>
            </div>
          </SectionBox>,
        )}

        {section(
          'keyAdmins',
          <SectionBox id="ag-admins" title="Key admin contacts">
            <div className="space-y-2">
              {(keyAdminRows.length ? keyAdminRows : [{}]).map((row, i, arr) => (
                <div key={i} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                  <input className="rounded border border-border px-2 py-1" placeholder="Role" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.admin_role} value={row.role || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, role: e.target.value }; patch({ ag_key_admin_cards_json: rowsToJson(n) }); }} />
                  <ImgSlot label="Photo" organizationId={organizationId} assetType="ag_admin_photo" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ ag_key_admin_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Name" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.admin_name} value={row.name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ ag_key_admin_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Contact" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.admin_contact} value={row.contact || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, contact: e.target.value }; patch({ ag_key_admin_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Email" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.admin_email} value={row.email || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, email: e.target.value }; patch({ ag_key_admin_cards_json: rowsToJson(n) }); }} />
                  <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ ag_key_admin_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ ag_key_admin_cards_json: rowsToJson([...keyAdminRows, {}]) })}>+ Add admin contact</button>
            </div>
          </SectionBox>,
        )}

        {section(
          'facilities',
          <SectionBox id="ag-facilities" title="Facilities">
            <div className="space-y-2">
              {(facilityRows.length ? facilityRows : [{}]).map((row, i, arr) => (
                <div key={i} className="space-y-2 rounded border border-border p-2">
                  <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-end">
                    <ImgSlot label="Cover image" organizationId={organizationId} assetType="ag_facility_cover" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ ag_facility_cards_json: rowsToJson(n) }); }} />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input className="rounded border border-border px-2 py-1" placeholder="Facility title" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.facility_title} value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ ag_facility_cards_json: rowsToJson(n) }); }} />
                      <textarea rows={2} className="rounded border border-border px-2 py-1 md:col-span-2" placeholder="Facility description" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.facility_description} value={row.description || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ ag_facility_cards_json: rowsToJson(n) }); }} />
                    </div>
                    <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ ag_facility_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ ag_facility_cards_json: rowsToJson([...facilityRows, {}]) })}>+ Add facility</button>
            </div>
          </SectionBox>,
        )}

        {section(
          'experts',
          <SectionBox id="ag-experts" title="Team">
            <textarea rows={3} className="mb-3 w-full rounded border border-border px-2 py-1 font-mono text-[10px]" placeholder='{"2026-04-11":{"row_0":true}}' value={f.ag_expert_attendance_json || '{}'} onChange={(e) => patch({ ag_expert_attendance_json: e.target.value })} />
            <div className="space-y-2">
              {(expertRows.length ? expertRows : [{}]).map((row, i, arr) => (
                <div key={i} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[100px_repeat(4,minmax(0,1fr))_auto] sm:items-end">
                  <ImgSlot label="Photo" organizationId={organizationId} assetType="ag_expert_photo" url={row.photo || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, photo: v }; patch({ ag_expert_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Name" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.expert_name} value={row.name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ ag_expert_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Department / specialization" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.expert_department} value={row.department || row.specialization || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, department: e.target.value }; patch({ ag_expert_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Qualification" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.expert_qualification} value={row.qualification || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, qualification: e.target.value }; patch({ ag_expert_cards_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Designation" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.expert_designation} value={row.designation || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, designation: e.target.value }; patch({ ag_expert_cards_json: rowsToJson(n) }); }} />
                  <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ ag_expert_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ ag_expert_cards_json: rowsToJson([...expertRows, {}]) })}>+ Add team member</button>
            </div>
          </SectionBox>,
        )}

        {section(
          'staff',
          <SectionBox id="ag-staff" title="Staff table">
            <div className="space-y-2">
              {(staffRows.length ? staffRows : [{}]).map((row, i, arr) => (
                <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-6">
                  <input className="rounded border border-border px-2 py-1" placeholder="Staff name" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_name} value={row.staff_name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, staff_name: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Category" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_category} value={row.category || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, category: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Role/designation" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_role} value={row.role_designation || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, role_designation: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Department" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_department} value={row.department || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, department: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Contact" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_contact} value={row.contact_number || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, contact_number: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} />
                  <div className="flex gap-2"><input className="min-w-0 flex-1 rounded border border-border px-2 py-1" placeholder="Email" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.staff_email} value={row.email || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, email: e.target.value }; patch({ ag_staff_rows_json: rowsToJson(n) }); }} /><button type="button" className="shrink-0 text-[10px] text-red-600" onClick={() => patch({ ag_staff_rows_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>✕</button></div>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ ag_staff_rows_json: rowsToJson([...staffRows, {}]) })}>+ Add staff row</button>
            </div>
          </SectionBox>,
        )}

        {section(
          'contact',
          <SectionBox id="ag-contact" title="Contact">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-0.5"><span className="text-[11px] text-text">Latitude</span><input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.latitude} onChange={(e) => onFacilityRecordPatch({ latitude: e.target.value })} /></div>
              <div className="space-y-0.5"><span className="text-[11px] text-text">Longitude</span><input className="w-full rounded border border-border px-2 py-1" value={facilityRecord.longitude} onChange={(e) => onFacilityRecordPatch({ longitude: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">Full address</span><CharCount value={f.ag_full_address || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_full_address} /></div><textarea rows={2} className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_full_address} value={f.ag_full_address || ''} onChange={(e) => patch({ ag_full_address: e.target.value })} /></div>
              <div className="space-y-0.5"><span className="text-[11px] text-text">Helpdesk phone</span><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_helpdesk_phone} value={f.ag_helpdesk_phone || ''} onChange={(e) => patch({ ag_helpdesk_phone: e.target.value })} /></div>
              <div className="space-y-0.5"><span className="text-[11px] text-text">Emergency phone</span><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_emergency_phone} value={f.ag_emergency_phone || ''} onChange={(e) => patch({ ag_emergency_phone: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><span className="text-[11px] text-text">Public email</span><input type="email" className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_public_email} value={f.ag_public_email || ''} onChange={(e) => patch({ ag_public_email: e.target.value })} /></div>
              <div className="space-y-0.5 md:col-span-2"><div className="flex justify-between gap-2"><span className="text-[11px] text-text">Office hours</span><CharCount value={f.ag_office_hours || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_office_hours} /></div><input className="w-full rounded border border-border px-2 py-1" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.ag_office_hours} value={f.ag_office_hours || ''} onChange={(e) => patch({ ag_office_hours: e.target.value })} /></div>
            </div>
          </SectionBox>,
        )}

        {section(
          'resources',
          <SectionBox id="ag-highlights" title="Key highlights">
            <p className="mb-2 text-[10px] text-text-muted">These values power the top 3 highlight cards on the public Agriculture page.</p>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="space-y-0.5"><label className="block text-[10px] text-text-muted">Total staff</label><input type="number" className="w-full rounded border border-border px-2 py-1" value={resources.total_staff} onChange={(e) => onResourcesPatch({ total_staff: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="block text-[10px] text-text-muted">Villages covered</label><input type="number" className="w-full rounded border border-border px-2 py-1" value={resources.villages_covered} onChange={(e) => onResourcesPatch({ villages_covered: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="block text-[10px] text-text-muted">Farmers served (last year)</label><input type="number" className="w-full rounded border border-border px-2 py-1" value={resources.farmers_served_last_year} onChange={(e) => onResourcesPatch({ farmers_served_last_year: e.target.value })} /></div>
            </div>
          </SectionBox>,
        )}

        {section(
          'gallery',
          <SectionBox id="ag-gallery" title="Photo gallery">
            <div className="space-y-2">
              {(galleryRows.length ? galleryRows : [{ image: '', title: '', description: '' }]).map((row, i, arr) => (
                <div key={i} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,140px)_repeat(2,minmax(0,1fr))_auto] sm:items-end">
                  <ImgSlot label="Image" organizationId={organizationId} assetType="ag_gallery" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ ag_photo_gallery_json: rowsToJson(n) }); }} />
                  <div className="space-y-0.5"><CharCount value={row.title || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.gallery_title} /><input className="w-full rounded border border-border px-2 py-1" placeholder="Title" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.gallery_title} value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ ag_photo_gallery_json: rowsToJson(n) }); }} /></div>
                  <div className="space-y-0.5"><CharCount value={row.description || ''} max={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.gallery_description} /><input className="w-full rounded border border-border px-2 py-1" placeholder="Description" maxLength={AGRICULTURE_PORTFOLIO_FIELD_LIMITS.gallery_description} value={row.description || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ ag_photo_gallery_json: rowsToJson(n) }); }} /></div>
                  <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ ag_photo_gallery_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ ag_photo_gallery_json: rowsToJson([...galleryRows, { image: '', title: '', description: '' }]) })}>+ Add gallery item</button>
            </div>
          </SectionBox>,
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-muted/20 px-2 py-2">
        <button type="button" className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-text hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40" disabled={sectionIndex <= 0} onClick={() => setActiveSection(AG_PORTFOLIO_SECTION_ROWS[sectionIndex - 1]!.id)}>Previous section</button>
        <span className="text-[10px] text-text-muted">{sectionIndex + 1} / {AG_PORTFOLIO_SECTION_ROWS.length} — {AG_PORTFOLIO_SECTION_ROWS[sectionIndex]?.label}</span>
        <button type="button" className="rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-text hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40" disabled={sectionIndex >= AG_PORTFOLIO_SECTION_ROWS.length - 1} onClick={() => setActiveSection(AG_PORTFOLIO_SECTION_ROWS[sectionIndex + 1]!.id)}>Next section</button>
      </div>
    </div>
  );
}
