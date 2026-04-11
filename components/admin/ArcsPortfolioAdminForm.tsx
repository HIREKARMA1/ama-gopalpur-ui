'use client';

import { useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type ArcsFormFields = Record<string, string>;

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB

/** Limits aligned with public portfolio line-clamps / layout. */
export const ARCS_FIELD_LIMITS = {
  arcs_name: 100,
  arcs_tagline: 180,
  arcs_about: 2500,
  arcs_secretary_message: 600,
  arcs_vision: 600,
  arcs_mission: 600,
  arcs_office_hours: 200,
  stock_title: 100,
  stock_description: 280,
  loan_title: 100,
  loan_description: 350,
  incharge_role: 80,
  incharge_name: 100,
  incharge_contact: 60,
  incharge_email: 120,
  membership_category: 80,
  membership_count: 24,
  gallery_category: 80,
  gallery_title: 100,
  gallery_description: 200,
  stock_quantity: 40,
  stock_price: 40,
  full_address: 500,
  office_phone: 40,
  office_email: 120,
  secretary_name: 100,
  registration_number: 80,
  block_ulb: 120,
  jurisdiction_type: 80,
} as const;

export function CharCount({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return <span className={`tabular-nums ${n > max ? 'text-red-600' : 'text-text-muted'}`}>{n}/{max}</span>;
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

/** Persist all rows including empty ones so “Add row” stays visible until the user fills or removes it. */
function rowsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows);
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Each image should be under 1 MB.');
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadArcsPortfolioAsset(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
  label, organizationId, assetType, url, onUrl,
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

function SectionBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

export function ArcsPortfolioAdminForm({
  organizationId,
  form,
  setForm,
}: {
  organizationId: number | null;
  form: ArcsFormFields;
  setForm: Dispatch<SetStateAction<ArcsFormFields>>;
}) {
  const inchargeRows = parseRows(form.arcs_incharge_cards_json || '');
  const membershipRows = parseRows(form.arcs_membership_rows_json || '');
  const fertiliserRows = parseRows(form.arcs_fertiliser_cards_json || '');
  const seedRows = parseRows(form.arcs_seed_cards_json || '');
  const loanRows = parseRows(form.arcs_loan_cards_json || '');
  const galleryRows = parseRows(form.arcs_photo_gallery_json || '');

  const patch = (p: Partial<ArcsFormFields>) => setForm((prev) => {
    const next: ArcsFormFields = { ...prev };
    Object.entries(p).forEach(([key, value]) => {
      if (value !== undefined) next[key] = value;
    });
    return next;
  });

  return (
    <div className="space-y-3 text-xs">
      <SectionBox title="Section A — Hero">
        <div className="grid gap-2 md:grid-cols-2">
          <input className="rounded border border-border px-2 py-1" placeholder="ARCS name" value={form.arcs_name || ''} onChange={(e) => patch({ arcs_name: e.target.value })} />
          <input className="rounded border border-border px-2 py-1" placeholder="Tagline" value={form.arcs_tagline || ''} onChange={(e) => patch({ arcs_tagline: e.target.value })} />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <ImgSlot label="Hero image 1" organizationId={organizationId} assetType="arcs_hero_slide" url={form.arcs_hero_1 || ''} onUrl={(v) => patch({ arcs_hero_1: v })} />
          <ImgSlot label="Hero image 2" organizationId={organizationId} assetType="arcs_hero_slide" url={form.arcs_hero_2 || ''} onUrl={(v) => patch({ arcs_hero_2: v })} />
          <ImgSlot label="Hero image 3" organizationId={organizationId} assetType="arcs_hero_slide" url={form.arcs_hero_3 || ''} onUrl={(v) => patch({ arcs_hero_3: v })} />
        </div>
      </SectionBox>

      <SectionBox title="Section B — About + Secretary">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-text">About ARCS</span>
            <CharCount value={form.arcs_about || ''} max={ARCS_FIELD_LIMITS.arcs_about} />
          </div>
          <textarea
            rows={3}
            className="w-full rounded border border-border px-2 py-1"
            placeholder="About ARCS"
            maxLength={ARCS_FIELD_LIMITS.arcs_about}
            value={form.arcs_about || ''}
            onChange={(e) => patch({ arcs_about: e.target.value })}
          />
        </div>
        <div className="mt-2 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-text">Secretary&apos;s message</span>
            <CharCount value={form.arcs_secretary_message || ''} max={ARCS_FIELD_LIMITS.arcs_secretary_message} />
          </div>
          <textarea
            rows={2}
            className="w-full rounded border border-border px-2 py-1"
            placeholder="Secretary's message (optional)"
            maxLength={ARCS_FIELD_LIMITS.arcs_secretary_message}
            value={form.arcs_secretary_message || ''}
            onChange={(e) => patch({ arcs_secretary_message: e.target.value })}
          />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-text">Vision</span>
              <CharCount value={form.arcs_vision || ''} max={ARCS_FIELD_LIMITS.arcs_vision} />
            </div>
            <textarea
              rows={2}
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Vision (optional)"
              maxLength={ARCS_FIELD_LIMITS.arcs_vision}
              value={form.arcs_vision || ''}
              onChange={(e) => patch({ arcs_vision: e.target.value })}
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-text">Mission</span>
              <CharCount value={form.arcs_mission || ''} max={ARCS_FIELD_LIMITS.arcs_mission} />
            </div>
            <textarea
              rows={2}
              className="w-full rounded border border-border px-2 py-1"
              placeholder="Mission (optional)"
              maxLength={ARCS_FIELD_LIMITS.arcs_mission}
              value={form.arcs_mission || ''}
              onChange={(e) => patch({ arcs_mission: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <ImgSlot label="About image" organizationId={organizationId} assetType="arcs_about_image" url={form.arcs_about_image || ''} onUrl={(v) => patch({ arcs_about_image: v })} />
          <ImgSlot label="Secretary photo" organizationId={organizationId} assetType="arcs_secretary_photo" url={form.arcs_secretary_image || ''} onUrl={(v) => patch({ arcs_secretary_image: v })} />
        </div>
      </SectionBox>

      <SectionBox title="Section — Contact (public site)">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-text">Office hours</span>
            <CharCount value={form.arcs_office_hours || ''} max={ARCS_FIELD_LIMITS.arcs_office_hours} />
          </div>
          <input
            className="w-full rounded border border-border px-2 py-1"
            placeholder="Office hours (e.g. Mon–Fri 10:00–17:00)"
            maxLength={ARCS_FIELD_LIMITS.arcs_office_hours}
            value={form.arcs_office_hours || ''}
            onChange={(e) => patch({ arcs_office_hours: e.target.value })}
          />
        </div>
        <p className="mt-1 text-[10px] text-text-muted">Address, phone and email use the main ARCS fields above the portfolio form.</p>
      </SectionBox>

      <SectionBox title="Section C — Incharge Details">
        <div className="space-y-2">
          {(inchargeRows.length ? inchargeRows : [{ role: '', name: '', contact: '', email: '', image: '' }]).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,140px)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
              <ImgSlot label="Image" organizationId={organizationId} assetType="arcs_incharge" url={row.image || ''} onUrl={(v) => {
                const n = [...arr]; n[i] = { ...row, image: v }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Role</span>
                  <CharCount value={row.role || ''} max={ARCS_FIELD_LIMITS.incharge_role} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Role (President/Member)" maxLength={ARCS_FIELD_LIMITS.incharge_role} value={row.role || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, role: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
                }} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Name</span>
                  <CharCount value={row.name || ''} max={ARCS_FIELD_LIMITS.incharge_name} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Name" maxLength={ARCS_FIELD_LIMITS.incharge_name} value={row.name || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
                }} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Contact</span>
                  <CharCount value={row.contact || ''} max={ARCS_FIELD_LIMITS.incharge_contact} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Contact" maxLength={ARCS_FIELD_LIMITS.incharge_contact} value={row.contact || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, contact: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
                }} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Email</span>
                  <CharCount value={row.email || ''} max={ARCS_FIELD_LIMITS.incharge_email} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Email" maxLength={ARCS_FIELD_LIMITS.incharge_email} value={row.email || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, email: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
                }} />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ arcs_incharge_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ arcs_incharge_cards_json: rowsToJson([...inchargeRows, { role: '', name: '', contact: '', email: '', image: '' }]) })}>+ Add incharge</button>
        </div>
      </SectionBox>

      <SectionBox title="Section D — Membership Table">
        <div className="space-y-2">
          {(membershipRows.length ? membershipRows : [{ category: '', count: '' }]).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[1fr_1fr_auto]">
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Category</span>
                  <CharCount value={row.category || ''} max={ARCS_FIELD_LIMITS.membership_category} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Category (Total/SC/ST/Women...)" maxLength={ARCS_FIELD_LIMITS.membership_category} value={row.category || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, category: e.target.value }; patch({ arcs_membership_rows_json: rowsToJson(n) });
                }} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Count</span>
                  <CharCount value={row.count || ''} max={ARCS_FIELD_LIMITS.membership_count} />
                </div>
                <input className="w-full rounded border border-border px-2 py-1" placeholder="Count" maxLength={ARCS_FIELD_LIMITS.membership_count} value={row.count || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, count: e.target.value }; patch({ arcs_membership_rows_json: rowsToJson(n) });
                }} />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ arcs_membership_rows_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ arcs_membership_rows_json: rowsToJson([...membershipRows, { category: '', count: '' }]) })}>+ Add membership row</button>
        </div>
      </SectionBox>

      <SectionBox title="Section E/F — Fertiliser and Seed Cards">
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            ['Fertiliser cards', fertiliserRows, 'arcs_fertiliser_cards_json', 'arcs_fertiliser'] as const,
            ['Seed cards', seedRows, 'arcs_seed_cards_json', 'arcs_seed'] as const,
          ].map(([title, rows, key, asset]) => (
            <div key={key} className="space-y-2 rounded border border-border p-2">
              <p className="font-medium">{title}</p>
              {(rows.length ? rows : [{ image: '', title: '', description: '', quantity: '', price: '', stock_arrival_date: '' }]).map((row, i, arr) => (
                <div key={i} className="space-y-2 rounded border border-border p-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
                    <ImgSlot label="Image" organizationId={organizationId} assetType={asset} url={row.image || ''} onUrl={(v) => {
                      const n = [...arr]; n[i] = { ...row, image: v }; patch({ [key]: rowsToJson(n) });
                    }} />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex justify-between gap-1">
                        <span className="text-[10px] text-text-muted">Title</span>
                        <CharCount value={row.title || ''} max={ARCS_FIELD_LIMITS.stock_title} />
                      </div>
                      <input className="w-full rounded border border-border px-2 py-1" placeholder="Title" maxLength={ARCS_FIELD_LIMITS.stock_title} value={row.title || ''} onChange={(e) => {
                        const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [key]: rowsToJson(n) });
                      }} />
                    </div>
                    <input type="date" className="min-w-0 rounded border border-border px-2 py-1" value={row.stock_arrival_date || ''} onChange={(e) => {
                      const n = [...arr]; n[i] = { ...row, stock_arrival_date: e.target.value }; patch({ [key]: rowsToJson(n) });
                    }} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between gap-1">
                      <span className="text-[10px] text-text-muted">Description</span>
                      <CharCount value={row.description || ''} max={ARCS_FIELD_LIMITS.stock_description} />
                    </div>
                    <textarea rows={2} className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Description" maxLength={ARCS_FIELD_LIMITS.stock_description} value={row.description || ''} onChange={(e) => {
                      const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ [key]: rowsToJson(n) });
                    }} />
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[6rem] flex-1 space-y-0.5">
                      <div className="flex justify-between gap-1">
                        <span className="text-[10px] text-text-muted">Qty</span>
                        <CharCount value={row.quantity || ''} max={ARCS_FIELD_LIMITS.stock_quantity} />
                      </div>
                      <input className="w-full rounded border border-border px-2 py-1" placeholder="Quantity" maxLength={ARCS_FIELD_LIMITS.stock_quantity} value={row.quantity || ''} onChange={(e) => {
                        const n = [...arr]; n[i] = { ...row, quantity: e.target.value }; patch({ [key]: rowsToJson(n) });
                      }} />
                    </div>
                    <div className="min-w-[6rem] flex-1 space-y-0.5">
                      <div className="flex justify-between gap-1">
                        <span className="text-[10px] text-text-muted">Price</span>
                        <CharCount value={row.price || ''} max={ARCS_FIELD_LIMITS.stock_price} />
                      </div>
                      <input className="w-full rounded border border-border px-2 py-1" placeholder="Price" maxLength={ARCS_FIELD_LIMITS.stock_price} value={row.price || ''} onChange={(e) => {
                        const n = [...arr]; n[i] = { ...row, price: e.target.value }; patch({ [key]: rowsToJson(n) });
                      }} />
                    </div>
                    <button type="button" className="ml-auto shrink-0 text-[10px] text-red-600" onClick={() => patch({ [key]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [key]: rowsToJson([...rows, { image: '', title: '', description: '', quantity: '', price: '', stock_arrival_date: '' }]) })}>
                + Add card
              </button>
            </div>
          ))}
        </div>
      </SectionBox>

      <SectionBox title="Section — Photo gallery (same layout as PS portfolio)">
        <div className="space-y-2">
          {(galleryRows.length ? galleryRows : [{ image: '', category: '', title: '', description: '' }]).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-[minmax(0,140px)_repeat(3,minmax(0,1fr))_auto] sm:items-end">
              <ImgSlot
                label="Image"
                organizationId={organizationId}
                assetType="arcs_gallery"
                url={row.image || ''}
                onUrl={(v) => {
                  const n = [...arr];
                  n[i] = { ...row, image: v };
                  patch({ arcs_photo_gallery_json: rowsToJson(n) });
                }}
              />
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Category</span>
                  <CharCount value={row.category || ''} max={ARCS_FIELD_LIMITS.gallery_category} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Category"
                  maxLength={ARCS_FIELD_LIMITS.gallery_category}
                  value={row.category || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, category: e.target.value };
                    patch({ arcs_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Title</span>
                  <CharCount value={row.title || ''} max={ARCS_FIELD_LIMITS.gallery_title} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Title"
                  maxLength={ARCS_FIELD_LIMITS.gallery_title}
                  value={row.title || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, title: e.target.value };
                    patch({ arcs_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex justify-between gap-1">
                  <span className="text-[10px] text-text-muted">Description</span>
                  <CharCount value={row.description || ''} max={ARCS_FIELD_LIMITS.gallery_description} />
                </div>
                <input
                  className="w-full rounded border border-border px-2 py-1"
                  placeholder="Description"
                  maxLength={ARCS_FIELD_LIMITS.gallery_description}
                  value={row.description || ''}
                  onChange={(e) => {
                    const n = [...arr];
                    n[i] = { ...row, description: e.target.value };
                    patch({ arcs_photo_gallery_json: rowsToJson(n) });
                  }}
                />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ arcs_photo_gallery_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-[11px]"
            onClick={() => patch({ arcs_photo_gallery_json: rowsToJson([...galleryRows, { image: '', category: '', title: '', description: '' }]) })}
          >
            + Add gallery item
          </button>
        </div>
      </SectionBox>

      <SectionBox title="Section G — Mini Bank Loan Cards">
        <div className="space-y-2">
          {(loanRows.length ? loanRows : [{ image: '', title: '', description: '', sanctions: '[]' }]).map((row, i, arr) => (
            <div key={i} className="space-y-2 rounded border border-border p-2">
              <div className="grid gap-2 md:grid-cols-[auto_1fr_2fr_auto] md:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="arcs_loan" url={row.image || ''} onUrl={(v) => {
                  const n = [...arr]; n[i] = { ...row, image: v }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                }} />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex justify-between gap-1">
                    <span className="text-[10px] text-text-muted">Title</span>
                    <CharCount value={row.title || ''} max={ARCS_FIELD_LIMITS.loan_title} />
                  </div>
                  <input className="w-full rounded border border-border px-2 py-1" placeholder="Loan title" maxLength={ARCS_FIELD_LIMITS.loan_title} value={row.title || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                  }} />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex justify-between gap-1">
                    <span className="text-[10px] text-text-muted">Description</span>
                    <CharCount value={row.description || ''} max={ARCS_FIELD_LIMITS.loan_description} />
                  </div>
                  <textarea rows={2} className="w-full rounded border border-border px-2 py-1" placeholder="Description" maxLength={ARCS_FIELD_LIMITS.loan_description} value={row.description || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                  }} />
                </div>
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ arcs_loan_cards_json: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
              <textarea
                rows={4}
                className="w-full rounded border border-border px-2 py-1 font-mono text-[11px]"
                placeholder='Loan sanctions JSON array, e.g. [{"farmer":"Name","date":"2026-04-09","amount":"50000","interest_rate":"7%","year":"2026"}]'
                value={row.sanctions || '[]'}
                onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, sanctions: e.target.value }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                }}
              />
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ arcs_loan_cards_json: rowsToJson([...loanRows, { image: '', title: '', description: '', sanctions: '[]' }]) })}>+ Add loan card</button>
        </div>
      </SectionBox>
    </div>
  );
}

