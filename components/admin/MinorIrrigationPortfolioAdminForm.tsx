'use client';

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type MinorIrrigationPortfolioFormFields = Record<string, string>;
type UploadAssetFn = (id: number, file: File, assetType: string) => Promise<{ url: string }>;

export const MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM: MinorIrrigationPortfolioFormFields = {
  // Hero / identity
  minor_display_name: '',
  minor_hero_primary_tagline: '',
  minor_hero_1: '',
  minor_hero_2: '',
  minor_hero_3: '',

  // About / leadership
  minor_about_short: '',
  minor_campus_image: '',
  minor_established_year: '',
  minor_facility_type: '',
  minor_location_line: '',
  minor_inst_head_message: '',
  minor_inst_head_name: '',
  minor_inst_head_photo: '',
  minor_inst_head_qualification: '',
  minor_inst_head_experience: '',
  minor_inst_head_contact: '',
  minor_inst_head_email: '',

  // People / infrastructure
  minor_key_admin_cards_json: '[]',
  minor_facility_cards_json: '[]',
  minor_faculty_cards_json: '[]',
  minor_staff_rows_json: '[]',

  // Contact
  minor_full_address: '',
  minor_helpdesk_phone: '',
  minor_emergency_phone: '',
  minor_public_email: '',
  minor_office_hours: '',
  minor_contact_email: '',

  // Gallery (array of image URLs)
  gallery_images: '[]',
};

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

async function uploadAsset(
  orgId: number,
  file: File,
  assetType: string,
  uploadAssetApi: UploadAssetFn,
): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await uploadAssetApi(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
  label,
  organizationId,
  assetType,
  uploadAssetApi,
  url,
  onUrl,
}: {
  label: string;
  organizationId: number | null;
  assetType: string;
  uploadAssetApi: UploadAssetFn;
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
        accept="image/jpeg,image/png,image/webp"
        disabled={!organizationId || busy}
        className="block w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !organizationId) return;
          setBusy(true);
          setErr(null);
          try {
            onUrl(await uploadAsset(organizationId, f, assetType, uploadAssetApi));
          } catch (ex: unknown) {
            const msg = ex instanceof Error ? ex.message : 'Upload failed';
            if (/minor irrigation|irrigation/i.test(msg)) {
              setErr('Image upload is not enabled for this department. Paste an image URL below.');
            } else {
              setErr(msg);
            }
          } finally {
            setBusy(false);
          }
        }}
      />
      <input
        type="url"
        className="w-full rounded border border-border px-2 py-1 text-[11px]"
        placeholder="Or paste image URL"
        value={url}
        onChange={(e) => onUrl(e.target.value)}
      />
      {err ? <p className="text-[10px] text-red-600">{err}</p> : null}
      {url ? <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" /> : null}
    </div>
  );
}

type MinorIrrigationPortfolioSectionId =
  | 'hero'
  | 'about'
  | 'keyAdmins'
  | 'facilities'
  | 'team'
  | 'staff'
  | 'contact'
  | 'gallery';

function SectionBox({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

function PortfolioSectionPanel({
  sectionId,
  activeSection,
  children,
}: {
  sectionId: MinorIrrigationPortfolioSectionId;
  activeSection: MinorIrrigationPortfolioSectionId;
  children: ReactNode;
}) {
  if (activeSection !== sectionId) return null;
  return <div className="min-w-0">{children}</div>;
}

function CharField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-text-muted">{label}</label>
      <input
        className="w-full rounded border border-border px-2 py-1"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function JsonField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-text-muted">{label}</label>
      <textarea
        rows={rows}
        className="w-full rounded border border-border px-2 py-1 font-mono text-[10px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function MinorIrrigationPortfolioAdminForm({
  organizationId,
  form,
  setForm,
  existingProfile,
  uploadAssetApi = organizationsApi.uploadMinorIrrigationPortfolioAsset,
}: {
  organizationId: number | null;
  form: MinorIrrigationPortfolioFormFields;
  setForm: Dispatch<SetStateAction<MinorIrrigationPortfolioFormFields>>;
  existingProfile?: Record<string, unknown>;
  uploadAssetApi?: UploadAssetFn;
}) {
  const f = useMemo(() => ({ ...MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM, ...form }) as MinorIrrigationPortfolioFormFields, [form]);
  const keyAdminRows = useMemo(() => parseRows(f.minor_key_admin_cards_json), [f.minor_key_admin_cards_json]);
  const facilityRows = useMemo(() => parseRows(f.minor_facility_cards_json), [f.minor_facility_cards_json]);
  const teamRows = useMemo(() => parseRows(f.minor_faculty_cards_json), [f.minor_faculty_cards_json]);
  const staffRows = useMemo(() => parseRows(f.minor_staff_rows_json), [f.minor_staff_rows_json]);
  const galleryRows = useMemo(() => parseRows(f.gallery_images), [f.gallery_images]);
  const patch = (p: Partial<MinorIrrigationPortfolioFormFields>) => {
    setForm((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(p)) {
        if (v !== undefined) next[k] = v;
      }
      return next;
    });
  };

  const visibleSections = useMemo(
    () =>
      [
        { id: 'hero', label: 'Hero & identity' },
        { id: 'about', label: 'About / leader' },
        { id: 'keyAdmins', label: 'Key admin contacts' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'team', label: 'Team' },
        { id: 'staff', label: 'TS & NTS staff' },
        { id: 'contact', label: 'Contact' },
        { id: 'gallery', label: 'Gallery' },
      ] as const,
    [],
  );

  const [activeSection, setActiveSection] = useState<MinorIrrigationPortfolioSectionId>('hero');

  useEffect(() => {
    if (!visibleSections.some((s) => s.id === activeSection)) setActiveSection(visibleSections[0]!.id);
  }, [visibleSections, activeSection]);

  const sectionIndex = Math.max(0, visibleSections.findIndex((s) => s.id === activeSection));

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <p className="text-[11px] text-text-muted">
        Use the <span className="font-semibold text-text">section tabs</span> to enter one block at a time.
        Save from the parent screen (updates are merged into this organization profile).
      </p>

      <div className="rounded border border-border bg-muted/30 p-2" role="tablist" aria-label="Minor irrigation portfolio sections">
        <span className="mb-1.5 block text-[10px] font-semibold text-text-muted">Section</span>
        <div className="flex max-h-[8.5rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {visibleSections.map((s) => {
            const selected = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`minor-portfolio-tab-${s.id}`}
                aria-selected={selected}
                aria-controls="minor-portfolio-editor-panel"
                className={`shrink-0 rounded border px-2 py-1.5 text-left text-[10px] font-medium transition-colors sm:text-center ${
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-text hover:bg-muted/50'
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
        id="minor-portfolio-editor-panel"
        aria-labelledby={`minor-portfolio-tab-${activeSection}`}
        className="min-h-[12rem] min-w-0 space-y-3"
      >
        <PortfolioSectionPanel sectionId="hero" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-hero" title="Hero & identity">
            <p className="mb-2 text-[10px] text-text-muted">
              Display name and tagline are used on the public hero.
              Cover image comes from the parent “Profile image” upload.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <CharField
                label="MIP name"
                value={f.minor_display_name}
                onChange={(v) => patch({ minor_display_name: v })}
                maxLength={120}
                placeholder="e.g. MIP / Project name"
              />
              <CharField
                label="Hero primary tagline"
                value={f.minor_hero_primary_tagline}
                onChange={(v) => patch({ minor_hero_primary_tagline: v })}
                maxLength={280}
                placeholder="Short hero description"
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <ImgSlot
                label="Hero image 1"
                organizationId={organizationId}
                assetType="minor_hero_slide"
                uploadAssetApi={uploadAssetApi}
                url={f.minor_hero_1}
                onUrl={(v) => patch({ minor_hero_1: v })}
              />
              <ImgSlot
                label="Hero image 2"
                organizationId={organizationId}
                assetType="minor_hero_slide"
                uploadAssetApi={uploadAssetApi}
                url={f.minor_hero_2}
                onUrl={(v) => patch({ minor_hero_2: v })}
              />
              <ImgSlot
                label="Hero image 3"
                organizationId={organizationId}
                assetType="minor_hero_slide"
                uploadAssetApi={uploadAssetApi}
                url={f.minor_hero_3}
                onUrl={(v) => patch({ minor_hero_3: v })}
              />
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-medium text-text-muted">Organization id</span>
              <div className="mt-1 rounded border border-border bg-muted/20 px-2 py-1.5 text-[10px] text-text">
                {organizationId ?? '—'}
              </div>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="about" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-about" title="About / leader">
            <p className="mb-2 text-[10px] text-text-muted">Use this to populate the About section on the public site.</p>
            <div className="space-y-3">
              <JsonField
                label="About text (public)"
                value={f.minor_about_short}
                onChange={(v) => patch({ minor_about_short: v })}
                placeholder="Write 2-5 lines about the MIP / irrigation scheme."
                rows={5}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <ImgSlot
                  label="Campus / about image"
                  organizationId={organizationId}
                  assetType="minor_campus_image"
                  uploadAssetApi={uploadAssetApi}
                  url={f.minor_campus_image}
                  onUrl={(v) => patch({ minor_campus_image: v })}
                />
                <CharField
                  label="Established year"
                  value={f.minor_established_year}
                  onChange={(v) => patch({ minor_established_year: v })}
                  maxLength={10}
                  placeholder="e.g. 2015"
                />
                <CharField
                  label="Facility / category type"
                  value={f.minor_facility_type}
                  onChange={(v) => patch({ minor_facility_type: v })}
                  maxLength={80}
                  placeholder="e.g. Minor Irrigation Project"
                />
                <CharField
                  label="Location (one line)"
                  value={f.minor_location_line}
                  onChange={(v) => patch({ minor_location_line: v })}
                  maxLength={200}
                  placeholder="Block / GP / village"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <CharField
                  label="Leader message"
                  value={f.minor_inst_head_message}
                  onChange={(v) => patch({ minor_inst_head_message: v })}
                  maxLength={1500}
                  placeholder="Institution head message..."
                />
                <ImgSlot
                  label="Leader photo"
                  organizationId={organizationId}
                  assetType="minor_inst_head_photo"
                  uploadAssetApi={uploadAssetApi}
                  url={f.minor_inst_head_photo}
                  onUrl={(v) => patch({ minor_inst_head_photo: v })}
                />
                <CharField
                  label="Leader name"
                  value={f.minor_inst_head_name}
                  onChange={(v) => patch({ minor_inst_head_name: v })}
                  maxLength={120}
                  placeholder="Name"
                />
                <CharField
                  label="Leader qualification"
                  value={f.minor_inst_head_qualification}
                  onChange={(v) => patch({ minor_inst_head_qualification: v })}
                  maxLength={200}
                  placeholder="e.g. Diploma / degree"
                />
                <CharField
                  label="Leader experience"
                  value={f.minor_inst_head_experience}
                  onChange={(v) => patch({ minor_inst_head_experience: v })}
                  maxLength={200}
                  placeholder="e.g. 5 years"
                />
                <CharField
                  label="Leader contact (phone)"
                  value={f.minor_inst_head_contact}
                  onChange={(v) => patch({ minor_inst_head_contact: v })}
                  maxLength={40}
                  placeholder="+91..."
                />
                <CharField
                  label="Leader email"
                  value={f.minor_inst_head_email}
                  onChange={(v) => patch({ minor_inst_head_email: v })}
                  maxLength={254}
                  placeholder="email@domain.com"
                />
              </div>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="keyAdmins" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-key-admins" title="Key admin contacts">
            <div className="space-y-2">
              {(keyAdminRows.length ? keyAdminRows : [{}]).map((row, i, arr) => (
                <div
                  key={i}
                  className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                >
                  <ImgSlot
                    label="Photo"
                    organizationId={organizationId}
                    assetType="minor_key_admin_photo"
                    uploadAssetApi={uploadAssetApi}
                    url={row.image || ''}
                    onUrl={(v) => {
                      const n = [...arr];
                      n[i] = { ...row, image: v };
                      patch({ minor_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Role"
                    value={row.role || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, role: e.target.value };
                      patch({ minor_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Name"
                    value={row.name || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, name: e.target.value };
                      patch({ minor_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Contact"
                    value={row.contact || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, contact: e.target.value };
                      patch({ minor_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Email"
                    value={row.email || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, email: e.target.value };
                      patch({ minor_key_admin_cards_json: rowsToJson(n) });
                    }}
                  />
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={() => patch({ minor_key_admin_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() => patch({ minor_key_admin_cards_json: rowsToJson([...keyAdminRows, {}]) })}
              >
                + Add admin contact
              </button>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="facilities" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-facilities" title="Facilities">
            <div className="space-y-2">
              {(facilityRows.length ? facilityRows : [{}]).map((row, i, arr) => (
                <div key={i} className="space-y-2 rounded border border-border p-2">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,120px)_1fr] sm:items-end">
                    <ImgSlot
                      label="Cover"
                      organizationId={organizationId}
                      assetType="minor_facility_cover"
                      uploadAssetApi={uploadAssetApi}
                      url={row.image || ''}
                      onUrl={(v) => {
                        const n = [...arr];
                        n[i] = { ...row, image: v };
                        patch({ minor_facility_cards_json: rowsToJson(n) });
                      }}
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="w-full rounded border border-border px-2 py-1"
                        placeholder="Title"
                        value={row.title || ''}
                        onChange={(e) => {
                          const n = [...arr];
                          n[i] = { ...row, title: e.target.value };
                          patch({ minor_facility_cards_json: rowsToJson(n) });
                        }}
                      />
                      <button
                        type="button"
                        className="self-end text-[10px] text-red-600"
                        onClick={() => patch({ minor_facility_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}
                      >
                        Remove facility
                      </button>
                      <textarea
                        rows={2}
                        className="w-full rounded border border-border px-2 py-1 md:col-span-2"
                        placeholder="Description"
                        value={row.description || ''}
                        onChange={(e) => {
                          const n = [...arr];
                          n[i] = { ...row, description: e.target.value };
                          patch({ minor_facility_cards_json: rowsToJson(n) });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() => patch({ minor_facility_cards_json: rowsToJson([...facilityRows, {}]) })}
              >
                + Add facility
              </button>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="team" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-team" title="Team">
            <div className="space-y-2">
              {(teamRows.length ? teamRows : [{}]).map((row, i, arr) => (
                <div
                  key={i}
                  className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[minmax(0,120px)_repeat(4,minmax(0,1fr))_auto] sm:items-end"
                >
                  <ImgSlot
                    label="Photo"
                    organizationId={organizationId}
                    assetType="minor_team_photo"
                    uploadAssetApi={uploadAssetApi}
                    url={row.photo || ''}
                    onUrl={(v) => {
                      const n = [...arr];
                      n[i] = { ...row, photo: v };
                      patch({ minor_faculty_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Name"
                    value={row.name || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, name: e.target.value };
                      patch({ minor_faculty_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Department / specialization"
                    value={row.subject || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, subject: e.target.value };
                      patch({ minor_faculty_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Qualification"
                    value={row.qualification || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, qualification: e.target.value };
                      patch({ minor_faculty_cards_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Designation"
                    value={row.designation || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, designation: e.target.value };
                      patch({ minor_faculty_cards_json: rowsToJson(n) });
                    }}
                  />
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={() => patch({ minor_faculty_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() => patch({ minor_faculty_cards_json: rowsToJson([...teamRows, {}]) })}
              >
                + Add team member
              </button>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="staff" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-staff" title="TS & NTS staff">
            <div className="space-y-2">
              {(staffRows.length ? staffRows : [{}]).map((row, i, arr) => (
                <div
                  key={i}
                  className="grid min-w-0 gap-2 overflow-x-auto rounded border border-border p-2 sm:grid-cols-[repeat(6,minmax(0,1fr))_auto] sm:items-end"
                >
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Staff name"
                    value={row.staff_name || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, staff_name: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Category"
                    value={row.category || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, category: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Role / designation"
                    value={row.role_designation || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, role_designation: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Department"
                    value={row.department || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, department: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Contact number"
                    value={row.contact_number || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, contact_number: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Email"
                    value={row.email || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, email: e.target.value };
                      patch({ minor_staff_rows_json: rowsToJson(n) });
                    }}
                  />
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={() => patch({ minor_staff_rows_json: rowsToJson(arr.filter((_, j) => j !== i)) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() => patch({ minor_staff_rows_json: rowsToJson([...staffRows, {}]) })}
              >
                + Add staff row
              </button>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="contact" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-contact" title="Contact">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <CharField
                  label="Full address (public)"
                  value={f.minor_full_address}
                  onChange={(v) => patch({ minor_full_address: v })}
                  maxLength={500}
                  placeholder="Street / village..."
                />
                <CharField
                  label="Helpdesk phone"
                  value={f.minor_helpdesk_phone}
                  onChange={(v) => patch({ minor_helpdesk_phone: v })}
                  maxLength={40}
                  placeholder="+91..."
                />
                <CharField
                  label="Emergency phone"
                  value={f.minor_emergency_phone}
                  onChange={(v) => patch({ minor_emergency_phone: v })}
                  maxLength={40}
                  placeholder="+91..."
                />
                <CharField
                  label="Public email"
                  value={f.minor_public_email}
                  onChange={(v) => patch({ minor_public_email: v })}
                  maxLength={254}
                  placeholder="email@domain.com"
                />
                <CharField
                  label="Office hours"
                  value={f.minor_office_hours}
                  onChange={(v) => patch({ minor_office_hours: v })}
                  maxLength={200}
                  placeholder="e.g. 10:00-16:00"
                />
                <CharField
                  label="Contact email (optional)"
                  value={f.minor_contact_email}
                  onChange={(v) => patch({ minor_contact_email: v })}
                  maxLength={120}
                  placeholder="email@domain.com"
                />
              </div>
            </div>
          </SectionBox>
        </PortfolioSectionPanel>

        <PortfolioSectionPanel sectionId="gallery" activeSection={activeSection}>
          <SectionBox id="minor-portfolio-gallery" title="Gallery">
            <div className="space-y-2">
              {(galleryRows.length ? galleryRows : [{ url: '', title: '', description: '' }]).map((row, i, arr) => (
                <div
                  key={i}
                  className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,140px)_1fr_1fr_auto] sm:items-end"
                >
                  <ImgSlot
                    label="Image"
                    organizationId={organizationId}
                    assetType="minor_gallery"
                    uploadAssetApi={uploadAssetApi}
                    url={row.url || row.image || ''}
                    onUrl={(v) => {
                      const n = [...arr];
                      n[i] = { ...row, url: v, image: v };
                      patch({ gallery_images: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Image URL"
                    value={row.url || row.image || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, url: e.target.value, image: e.target.value };
                      patch({ gallery_images: rowsToJson(n) });
                    }}
                  />
                  <input
                    className="rounded border border-border px-2 py-1"
                    placeholder="Title"
                    value={row.title || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, title: e.target.value };
                      patch({ gallery_images: rowsToJson(n) });
                    }}
                  />
                  <textarea
                    rows={2}
                    className="sm:col-span-3 w-full rounded border border-border px-2 py-1 font-mono text-[10px]"
                    placeholder="Description"
                    value={row.description || ''}
                    onChange={(e) => {
                      const n = [...arr];
                      n[i] = { ...row, description: e.target.value };
                      patch({ gallery_images: rowsToJson(n) });
                    }}
                  />
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={() => patch({ gallery_images: rowsToJson(arr.filter((_, j) => j !== i)) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px]"
                onClick={() => patch({ gallery_images: rowsToJson([...galleryRows, { url: '', title: '', description: '' }]) })}
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

