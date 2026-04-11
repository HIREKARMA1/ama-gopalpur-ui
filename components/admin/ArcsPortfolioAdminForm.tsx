'use client';

import { useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type ArcsFormFields = Record<string, string>;

const MAX_UPLOAD_KB = 100;

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
  const cleaned = rows.filter((r) => Object.values(r).some((v) => String(v ?? '').trim()));
  return JSON.stringify(cleaned.length ? cleaned : []);
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  if (file.size > MAX_UPLOAD_KB * 1024) throw new Error(`Each image should be under ${MAX_UPLOAD_KB} KB.`);
  const prepared = await compressImage(file, { maxSizeMB: 0.12, maxWidth: 1920 });
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
        <textarea rows={3} className="w-full rounded border border-border px-2 py-1" placeholder="About ARCS" value={form.arcs_about || ''} onChange={(e) => patch({ arcs_about: e.target.value })} />
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <ImgSlot label="About image" organizationId={organizationId} assetType="arcs_about_image" url={form.arcs_about_image || ''} onUrl={(v) => patch({ arcs_about_image: v })} />
          <ImgSlot label="Secretary photo" organizationId={organizationId} assetType="arcs_secretary_photo" url={form.arcs_secretary_image || ''} onUrl={(v) => patch({ arcs_secretary_image: v })} />
        </div>
      </SectionBox>

      <SectionBox title="Section C — Incharge Details">
        <div className="space-y-2">
          {(inchargeRows.length ? inchargeRows : [{ role: '', name: '', contact: '', email: '', image: '' }]).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] md:items-end">
              <ImgSlot label="Image" organizationId={organizationId} assetType="arcs_incharge" url={row.image || ''} onUrl={(v) => {
                const n = [...arr]; n[i] = { ...row, image: v }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
              <input className="rounded border border-border px-2 py-1" placeholder="Role (President/Member)" value={row.role || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, role: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
              <input className="rounded border border-border px-2 py-1" placeholder="Name" value={row.name || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
              <input className="rounded border border-border px-2 py-1" placeholder="Contact" value={row.contact || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, contact: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
              <input className="rounded border border-border px-2 py-1" placeholder="Email" value={row.email || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, email: e.target.value }; patch({ arcs_incharge_cards_json: rowsToJson(n) });
              }} />
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
              <input className="rounded border border-border px-2 py-1" placeholder="Category (Total/SC/ST/Women...)" value={row.category || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, category: e.target.value }; patch({ arcs_membership_rows_json: rowsToJson(n) });
              }} />
              <input className="rounded border border-border px-2 py-1" placeholder="Count" value={row.count || ''} onChange={(e) => {
                const n = [...arr]; n[i] = { ...row, count: e.target.value }; patch({ arcs_membership_rows_json: rowsToJson(n) });
              }} />
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
                <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto] md:items-end">
                  <ImgSlot label="Image" organizationId={organizationId} assetType={asset} url={row.image || ''} onUrl={(v) => {
                    const n = [...arr]; n[i] = { ...row, image: v }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Quantity" value={row.quantity || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, quantity: e.target.value }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <input className="rounded border border-border px-2 py-1" placeholder="Price" value={row.price || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, price: e.target.value }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <input type="date" className="rounded border border-border px-2 py-1" value={row.stock_arrival_date || ''} onChange={(e) => {
                    const n = [...arr]; n[i] = { ...row, stock_arrival_date: e.target.value }; patch({ [key]: rowsToJson(n) });
                  }} />
                  <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [key]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
                </div>
              ))}
              <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [key]: rowsToJson([...rows, { image: '', title: '', description: '', quantity: '', price: '', stock_arrival_date: '' }]) })}>
                + Add card
              </button>
            </div>
          ))}
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
                <input className="rounded border border-border px-2 py-1" placeholder="Loan title" value={row.title || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                }} />
                <textarea rows={2} className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => {
                  const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ arcs_loan_cards_json: rowsToJson(n) });
                }} />
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

