'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';
import { TAHASIL_PORTFOLIO_EMPTY_FORM } from '../../lib/tahasilPortfolioForm';

type FormFields = Record<string, string>;

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadRevenueLandPortfolioAsset(orgId, prepared, assetType);
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
      {url ? (
        <div className="flex flex-wrap items-end gap-2">
          <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" />
          <button
            type="button"
            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100"
            onClick={() => onUrl('')}
          >
            Remove image
          </button>
        </div>
      ) : null}
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

function parseRows(raw: string): Record<string, string>[] {
  if (!raw.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as Record<string, string>[]) : [];
  } catch {
    return [];
  }
}

function rowsToJson(rows: Record<string, string>[]): string {
  return JSON.stringify(rows);
}

type SectionId =
  | 'hero'
  | 'about'
  | 'head'
  | 'contacts'
  | 'ri'
  | 'highlights'
  | 'monitoring'
  | 'gallery'
  | 'links';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'hero', label: 'Hero & name' },
  { id: 'about', label: 'About this Tahasil' },
  { id: 'head', label: 'Tahsildar' },
  { id: 'contacts', label: 'Key contacts' },
  { id: 'ri', label: 'Revenue circles & RIs' },
  { id: 'highlights', label: 'Key highlights' },
  { id: 'monitoring', label: 'Operations (Last FY)' },
  { id: 'gallery', label: 'Gallery (max 8)' },
  { id: 'links', label: 'Contact & links' },
];

function Panel({ id, active, children }: { id: SectionId; active: SectionId; children: ReactNode }) {
  if (active !== id) return null;
  return <div className="min-w-0 space-y-3">{children}</div>;
}

export function TahasilPortfolioAdminForm({
  organizationId,
  form,
  setForm,
}: {
  organizationId: number | null;
  form: FormFields;
  setForm: Dispatch<SetStateAction<FormFields>>;
}) {
  const f = useMemo(() => ({ ...TAHASIL_PORTFOLIO_EMPTY_FORM, ...form }) as FormFields, [form]);
  const patch = (p: Partial<FormFields>) =>
    setForm((prev) => {
      const n = { ...prev };
      Object.entries(p).forEach(([k, v]) => {
        if (v !== undefined) n[k] = v;
      });
      return n;
    });

  const keyRows = useMemo(() => parseRows(f.tahasil_key_contact_cards_json || '[]'), [f.tahasil_key_contact_cards_json]);
  const riRows = useMemo(() => parseRows(f.tahasil_ri_circle_cards_json || '[]'), [f.tahasil_ri_circle_cards_json]);
  const monRows = useMemo(() => parseRows(f.tahasil_monitoring_rows_json || '[]'), [f.tahasil_monitoring_rows_json]);
  const galleryRows = useMemo(() => parseRows(f.tahasil_photo_gallery_json || '[]'), [f.tahasil_photo_gallery_json]);

  const [active, setActive] = useState<SectionId>('hero');

  const textField = (key: keyof typeof TAHASIL_PORTFOLIO_EMPTY_FORM, label: string, multiline = false, span2 = false) => (
    <label className={`block space-y-1 ${span2 ? 'md:col-span-2' : ''}`}>
      <span className="text-[11px] text-text">{label}</span>
      {multiline ? (
        <textarea
          className="min-h-[72px] w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
          value={f[key] ?? ''}
          onChange={(e) => patch({ [key]: e.target.value } as Partial<FormFields>)}
        />
      ) : (
        <input
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
          value={f[key] ?? ''}
          onChange={(e) => patch({ [key]: e.target.value } as Partial<FormFields>)}
        />
      )}
    </label>
  );

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <p className="text-[11px] text-text-muted">
        Section tabs match the public Tahasil portfolio. Save with <span className="font-semibold text-text">Update Tahasil office</span>.
        Image uploads require a saved office — use <span className="font-semibold text-text">Edit</span> first.
      </p>
      <div className="rounded border border-border bg-muted/30 p-2" role="tablist" aria-label="Tahasil portfolio sections">
        <span className="mb-1.5 block text-[10px] font-semibold text-text-muted">Section</span>
        <div className="flex max-h-[9rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {SECTIONS.map((s) => {
            const sel = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={sel}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${sel ? 'bg-primary text-primary-foreground' : 'bg-background text-text hover:bg-muted'}`}
                onClick={() => setActive(s.id)}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Panel id="hero" active={active}>
        <SectionBox id="tah-hero" title="Hero (top banner)">
          <div className="grid gap-2 md:grid-cols-2">
            {textField('tahasil_display_name', 'Tahasil name (banner title)')}
            {textField('tahasil_hero_tagline', 'Tagline (optional)')}
            <ImgSlot
              label="Hero image 1"
              organizationId={organizationId}
              assetType="tahasil_hero_slide"
              url={f.tahasil_hero_1 ?? ''}
              onUrl={(u) => patch({ tahasil_hero_1: u })}
            />
            <ImgSlot
              label="Hero image 2"
              organizationId={organizationId}
              assetType="tahasil_hero_slide"
              url={f.tahasil_hero_2 ?? ''}
              onUrl={(u) => patch({ tahasil_hero_2: u })}
            />
            <ImgSlot
              label="Hero image 3"
              organizationId={organizationId}
              assetType="tahasil_hero_slide"
              url={f.tahasil_hero_3 ?? ''}
              onUrl={(u) => patch({ tahasil_hero_3: u })}
            />
          </div>
        </SectionBox>
      </Panel>

      <Panel id="about" active={active}>
        <SectionBox id="tah-about" title="About this Tahasil">
          <div className="grid gap-2 md:grid-cols-2">
            {textField('tahasil_official_name', 'Official Tahasil name (About heading)')}
            {textField('tahasil_district', 'District')}
            {textField('tahasil_full_office_address', 'Full office address', true, true)}
            {textField('tahasil_about_text', 'About text (2–5 sentences)', true, true)}
            <ImgSlot
              label="Tahasil office photo"
              organizationId={organizationId}
              assetType="tahasil_office_photo"
              url={f.tahasil_office_image ?? ''}
              onUrl={(u) => patch({ tahasil_office_image: u })}
            />
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            Tahasil code, sub-division, block, PIN, and year established are edited in the CSV fields above when available.
          </p>
        </SectionBox>
      </Panel>

      <Panel id="head" active={active}>
        <SectionBox id="tah-head" title="Tahsildar (office head)">
          <div className="grid gap-2 md:grid-cols-2">
            {textField('tahasil_head_name', 'Tahsildar name')}
            {textField('tahasil_head_designation', 'Designation')}
            {textField('tahasil_head_message', 'Welcome message', true, true)}
            <ImgSlot
              label="Head photo"
              organizationId={organizationId}
              assetType="tahasil_head_photo"
              url={f.tahasil_head_photo ?? ''}
              onUrl={(u) => patch({ tahasil_head_photo: u })}
            />
            {textField('tahasil_head_contact', 'Office phone')}
            {textField('tahasil_head_email', 'Email')}
            {textField('tahasil_office_hours', 'Visiting / office hours')}
            {textField('tahasil_head_experience', 'Experience')}
            {textField('tahasil_head_qualification', 'Qualification')}
          </div>
        </SectionBox>
      </Panel>

      <Panel id="contacts" active={active}>
        <SectionBox id="tah-contacts" title="Key contacts (officers)">
          <div className="space-y-2">
            {keyRows.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded border border-border/80 p-2 md:grid-cols-2">
                {(['role', 'name', 'phone', 'email', 'section'] as const).map((k) => (
                  <label key={k} className="block space-y-1">
                    <span className="text-[10px] text-text-muted">{k}</span>
                    <input
                      className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
                      value={row[k] ?? ''}
                      onChange={(e) => {
                        const next = [...keyRows];
                        next[idx] = { ...next[idx], [k]: e.target.value };
                        patch({ tahasil_key_contact_cards_json: rowsToJson(next) });
                      }}
                    />
                  </label>
                ))}
                <div className="md:col-span-2">
                  <ImgSlot
                    label="Photo"
                    organizationId={organizationId}
                    assetType="tahasil_contact_photo"
                    url={row.photo ?? ''}
                    onUrl={(u) => {
                      const next = [...keyRows];
                      next[idx] = { ...next[idx], photo: u };
                      patch({ tahasil_key_contact_cards_json: rowsToJson(next) });
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-red-600 hover:underline"
                    onClick={() => {
                      const next = keyRows.filter((_, i) => i !== idx);
                      patch({ tahasil_key_contact_cards_json: rowsToJson(next) });
                    }}
                  >
                    Remove row
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted"
              onClick={() => patch({ tahasil_key_contact_cards_json: rowsToJson([...keyRows, {}]) })}
            >
              Add contact
            </button>
          </div>
        </SectionBox>
      </Panel>

      <Panel id="ri" active={active}>
        <SectionBox id="tah-ri" title="Revenue circles & RIs">
          <div className="space-y-2">
            {riRows.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded border border-border/80 p-2 md:grid-cols-2">
                {(['circle_name', 'ri_name', 'area_covered', 'ri_phone', 'village_count'] as const).map((k) => (
                  <label key={k} className="block space-y-1">
                    <span className="text-[10px] text-text-muted">{k.replace(/_/g, ' ')}</span>
                    <input
                      className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
                      value={row[k] ?? ''}
                      onChange={(e) => {
                        const next = [...riRows];
                        next[idx] = { ...next[idx], [k]: e.target.value };
                        patch({ tahasil_ri_circle_cards_json: rowsToJson(next) });
                      }}
                    />
                  </label>
                ))}
                <div className="md:col-span-2">
                  <ImgSlot
                    label="RI photo (optional)"
                    organizationId={organizationId}
                    assetType="tahasil_ri_photo"
                    url={row.ri_photo ?? ''}
                    onUrl={(u) => {
                      const next = [...riRows];
                      next[idx] = { ...next[idx], ri_photo: u };
                      patch({ tahasil_ri_circle_cards_json: rowsToJson(next) });
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-red-600 hover:underline"
                    onClick={() => {
                      const next = riRows.filter((_, i) => i !== idx);
                      patch({ tahasil_ri_circle_cards_json: rowsToJson(next) });
                    }}
                  >
                    Remove circle
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted"
              onClick={() => patch({ tahasil_ri_circle_cards_json: rowsToJson([...riRows, {}]) })}
            >
              Add circle
            </button>
          </div>
        </SectionBox>
      </Panel>

      <Panel id="highlights" active={active}>
        <SectionBox id="tah-hi" title="Key highlights (optional — CSV totals are used on site when present)">
          <div className="grid gap-2 md:grid-cols-2">
            {textField('tahasil_govt_parcel_count', 'Total govt land parcels (count)')}
            {textField('tahasil_govt_parcel_area_value', 'Total area of parcels (number)')}
            {textField('tahasil_govt_parcel_area_unit', 'Unit (acres or hectares)')}
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            Plot/khata/mutation/revenue figures are taken from the main Tahasil CSV columns when filled (same keys as bulk
            import).
          </p>
        </SectionBox>
      </Panel>

      <Panel id="monitoring" active={active}>
        <SectionBox id="tah-mon" title="Operations & monitoring (Last FY)">
          <div className="space-y-2">
            {monRows.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded border border-border/80 p-2 md:grid-cols-2">
                {(['record_date', 'indicator_name', 'count_or_amount', 'unit', 'notes'] as const).map((k) => (
                  <label key={k} className={`block space-y-1 ${k === 'notes' ? 'md:col-span-2' : ''}`}>
                    <span className="text-[10px] text-text-muted">{k.replace(/_/g, ' ')}</span>
                    <input
                      className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
                      value={row[k] ?? ''}
                      onChange={(e) => {
                        const next = [...monRows];
                        next[idx] = { ...next[idx], [k]: e.target.value };
                        patch({ tahasil_monitoring_rows_json: rowsToJson(next) });
                      }}
                    />
                  </label>
                ))}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-red-600 hover:underline"
                    onClick={() => {
                      const next = monRows.filter((_, i) => i !== idx);
                      patch({ tahasil_monitoring_rows_json: rowsToJson(next) });
                    }}
                  >
                    Remove row
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted"
              onClick={() => patch({ tahasil_monitoring_rows_json: rowsToJson([...monRows, {}]) })}
            >
              Add monitoring row
            </button>
          </div>
        </SectionBox>
      </Panel>

      <Panel id="gallery" active={active}>
        <SectionBox id="tah-gal" title="Gallery (max 8 photos)">
          <div className="space-y-2">
            {galleryRows.map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded border border-border/80 p-2 md:grid-cols-2">
                <label className="block space-y-1 md:col-span-2">
                  <span className="text-[10px] text-text-muted">Caption</span>
                  <input
                    className="w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
                    value={row.title ?? row.caption ?? ''}
                    onChange={(e) => {
                      const next = [...galleryRows];
                      next[idx] = { ...next[idx], title: e.target.value };
                      patch({ tahasil_photo_gallery_json: rowsToJson(next) });
                    }}
                  />
                </label>
                <div className="md:col-span-2">
                  <ImgSlot
                    label="Photo"
                    organizationId={organizationId}
                    assetType="tahasil_gallery"
                    url={row.image ?? ''}
                    onUrl={(u) => {
                      const next = [...galleryRows];
                      next[idx] = { ...next[idx], image: u };
                      patch({ tahasil_photo_gallery_json: rowsToJson(next) });
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="text-[10px] font-medium text-red-600 hover:underline"
                    onClick={() => {
                      const next = galleryRows.filter((_, i) => i !== idx);
                      patch({ tahasil_photo_gallery_json: rowsToJson(next) });
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            ))}
            {galleryRows.length < 8 ? (
              <button
                type="button"
                className="rounded border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted"
                onClick={() => patch({ tahasil_photo_gallery_json: rowsToJson([...galleryRows, {}]) })}
              >
                Add gallery photo
              </button>
            ) : (
              <p className="text-[10px] text-text-muted">Maximum 8 photos.</p>
            )}
          </div>
        </SectionBox>
      </Panel>

      <Panel id="links" active={active}>
        <SectionBox id="tah-contact" title="Public contact & links">
          <div className="grid gap-2 md:grid-cols-2">
            {textField('tahasil_helpdesk_phone', 'Public helpdesk phone')}
            {textField('tahasil_public_email', 'Public email')}
            {textField('tahasil_full_address', 'Office address (public)', true, true)}
            {textField('tahasil_public_office_hours', 'Office hours')}
            {textField('tahasil_website_url', 'Official website URL')}
            {textField('tahasil_bhulekh_url', 'Online land records URL')}
          </div>
        </SectionBox>
      </Panel>
    </div>
  );
}
