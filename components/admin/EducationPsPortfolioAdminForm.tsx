'use client';

import { useCallback, useState } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

/** Education school form slice used for PS portfolio (all string fields). */
export type PsPortfolioOrgFields = Record<string, string>;

function safeParseJsonArray<T extends object>(raw: string, fallback: T[]): T[] {
  if (!raw.trim()) return fallback;
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function rowsToJson(rows: Record<string, unknown>[]): string {
  // Keep empty rows so "Add row" actions are immediately visible in the UI.
  return JSON.stringify(rows);
}

type FacilityImageRow = { url: string; title: string };
type FacultyAttendanceByDay = Record<string, Record<string, boolean>>;

function normalizeFacilityImages(row: Record<string, unknown>): FacilityImageRow[] {
  const images = Array.isArray(row.images) ? row.images : [];
  if (images.length) {
    // Preserve empty rows too, so "Add image" immediately reflects in UI.
    return images.map((it) => {
      if (!it || typeof it !== 'object') return { url: '', title: '' };
      const rec = it as Record<string, unknown>;
      return {
        url: String(rec.url ?? rec.image ?? '').trim(),
        // Do not trim title while editing; it blocks natural spacing input.
        title: String(rec.title ?? ''),
      };
    });
  }

  const legacyImage = String(row.image ?? '').trim();
  if (legacyImage) return [{ url: legacyImage, title: '' }];
  return [{ url: '', title: '' }];
}

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadPsPortfolioAsset(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
  label,
  organizationId,
  assetType,
  url,
  onUrl,
  disabledHint,
}: {
  label: string;
  organizationId: number | null;
  assetType: string;
  url: string;
  onUrl: (u: string) => void;
  disabledHint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onPick = async (f: File | null) => {
    setErr(null);
    if (!f || !organizationId) return;
    setBusy(true);
    try {
      onUrl(await uploadAsset(organizationId, f, assetType));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1">
      <span className="block text-text">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png"
        disabled={!organizationId || busy}
        className="block w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      {!organizationId && (
        <p className="text-[10px] text-amber-700">{disabledHint || 'Save the school once, then click Edit, to enable uploads.'}</p>
      )}
      {err && <p className="text-[10px] text-red-600">{err}</p>}
      {url ? (
        <div className="mt-1 flex items-center gap-2">
          <img src={url} alt="" className="h-14 w-14 rounded object-cover border border-border" />
          <input
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-mono outline-none"
            value={url}
            onChange={(e) => onUrl(e.target.value)}
            title="URL (editable if you paste a link instead)"
          />
        </div>
      ) : null}
    </div>
  );
}

function SectionBox({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <details open className="mb-3 rounded-lg border border-border bg-background-muted/30" id={id}>
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-text [&::-webkit-details-marker]:hidden">
        <span className="select-none">{title}</span>
      </summary>
      <div className="border-t border-border px-3 py-3">{children}</div>
    </details>
  );
}

export function EducationPsPortfolioAdminForm({
  organizationId,
  org,
  setOrg,
  subDepartment,
}: {
  organizationId: number | null;
  org: PsPortfolioOrgFields;
  setOrg: React.Dispatch<React.SetStateAction<PsPortfolioOrgFields>>;
  subDepartment?: string;
}) {
  const patch = useCallback((p: Partial<PsPortfolioOrgFields>) => {
    setOrg((prev) => {
      const next: PsPortfolioOrgFields = { ...prev };
      Object.entries(p).forEach(([key, value]) => {
        if (value !== undefined) next[key] = value;
      });
      return next;
    });
  }, [setOrg]);

  const facilityRows = safeParseJsonArray<Record<string, unknown>>(org.facility_cards_json || '', []);
  const facultyRows = safeParseJsonArray<Record<string, string>>(org.faculty_cards_json || '', []);
  const galleryRows = safeParseJsonArray<Record<string, string>>(org.photo_gallery_json || '', []);
  const classRows = safeParseJsonArray<Record<string, string>>(org.intake_cards_json || '', []);
  const mdmRows = safeParseJsonArray<Record<string, string>>(org.mdm_daily_json || '', []);
  const ptmRows = safeParseJsonArray<Record<string, string>>(org.ptm_meetings_json || '', []);

  const setFacilities = (rows: Record<string, unknown>[]) => patch({ facility_cards_json: rowsToJson(rows) });
  const setFaculty = (rows: Record<string, string>[]) => patch({ faculty_cards_json: rowsToJson(rows) });
  const setGallery = (rows: Record<string, string>[]) => patch({ photo_gallery_json: rowsToJson(rows) });
  const setClasses = (rows: Record<string, string>[]) => patch({ intake_cards_json: rowsToJson(rows) });
  const setMdmRows = (rows: Record<string, string>[]) => patch({ mdm_daily_json: rowsToJson(rows) });
  const setPtmRows = (rows: Record<string, string>[]) => patch({ ptm_meetings_json: rowsToJson(rows) });
  const attendanceByDay: FacultyAttendanceByDay = (() => {
    try {
      const parsed = org.faculty_attendance_json?.trim() ? JSON.parse(org.faculty_attendance_json) : {};
      return parsed && typeof parsed === 'object' ? (parsed as FacultyAttendanceByDay) : {};
    } catch {
      return {};
    }
  })();
  const todayKey = getTodayKey();
  const markFacultyPresent = (facultyIndex: number) => {
    const rowKey = `row_${facultyIndex}`;
    const next: FacultyAttendanceByDay = { ...attendanceByDay };
    const today = { ...(next[todayKey] || {}) };
    today[rowKey] = true;
    next[todayKey] = today;
    patch({ faculty_attendance_json: JSON.stringify(next) });
  };
  const isFacultyPresentToday = (facultyIndex: number): boolean => {
    const rowKey = `row_${facultyIndex}`;
    return Boolean(attendanceByDay[todayKey]?.[rowKey]);
  };

  const ensureRows = <T extends Record<string, unknown>>(rows: T[], min: number, empty: T) => {
    const next = [...rows];
    while (next.length < min) next.push({ ...empty });
    return next;
  };

  const uploadHint = !organizationId;
  const isHighSchool = (subDepartment || '').toUpperCase() === 'HS';

  return (
    <div className="md:col-span-2 space-y-2 rounded-md border border-border bg-background-muted/40 p-3">
      <div>
        <h3 className="text-xs font-semibold text-text">School portfolio website (section-wise)</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          Instructions: Fill all sections in English. Use file upload for images; larger files are auto-compressed before upload (JPEG or PNG). For lists
          (facilities, faculty, gallery, etc.), add only the rows you need.
        </p>
      </div>

      <SectionBox id="ps-section-a" title="Section A — Hero">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] text-text">School name (English, max 120)</label>
            <input maxLength={120} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.school_name_en} onChange={(e) => patch({ school_name_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1">
            <label className="text-[11px] text-text">School name (Odia)</label>
            <input maxLength={120} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.school_name_od} onChange={(e) => patch({ school_name_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Hero tagline (English, max 280)</label>
            <textarea maxLength={280} rows={2} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.hero_primary_tagline_en} onChange={(e) => patch({ hero_primary_tagline_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Hero tagline (Odia)</label>
            <textarea maxLength={280} rows={2} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.hero_primary_tagline_od} onChange={(e) => patch({ hero_primary_tagline_od: e.target.value })} />
          </div>
          */}
          <ImgSlot label="Hero slide image 1" organizationId={organizationId} assetType="ps_hero_slide" url={org.hero_slide_1} onUrl={(u) => patch({ hero_slide_1: u })} />
          <ImgSlot label="Hero slide image 2" organizationId={organizationId} assetType="ps_hero_slide" url={org.hero_slide_2} onUrl={(u) => patch({ hero_slide_2: u })} />
          <ImgSlot label="Hero slide image 3" organizationId={organizationId} assetType="ps_hero_slide" url={org.hero_slide_3} onUrl={(u) => patch({ hero_slide_3: u })} />
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text-muted">Fallback taglines (optional)</label>
            <input className="w-full rounded border border-border bg-background px-2 py-1 text-xs" placeholder="English fallback" value={org.hero_tagline_en} onChange={(e) => patch({ hero_tagline_en: e.target.value })} />
          </div>
        </div>
      </SectionBox>

      <SectionBox id="ps-section-b" title="Section B — About, headmaster, vision, mission">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">About the school (English, max 2000)</label>
            <textarea maxLength={2000} rows={4} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.about_short_en} onChange={(e) => patch({ about_short_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">About the school (Odia)</label>
            <textarea maxLength={2000} rows={4} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.about_short_od} onChange={(e) => patch({ about_short_od: e.target.value })} />
          </div>
          */}
          <ImgSlot label="School / campus photo (About)" organizationId={organizationId} assetType="ps_about_campus" url={org.about_image} onUrl={(u) => patch({ about_image: u })} />
          <div className="space-y-1">
            <label className="text-[11px] text-text">Year of establishment (e.g. 1918)</label>
            <input maxLength={10} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.esst_year} onChange={(e) => patch({ esst_year: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">School type (English, max 80)</label>
            <input maxLength={80} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.school_type_en} onChange={(e) => patch({ school_type_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1">
            <label className="text-[11px] text-text">School type (Odia)</label>
            <input maxLength={80} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.school_type_od} onChange={(e) => patch({ school_type_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Location one line (English, max 200)</label>
            <input maxLength={200} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.location_en} onChange={(e) => patch({ location_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Location (Odia)</label>
            <input maxLength={200} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.location_od} onChange={(e) => patch({ location_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Headmaster&apos;s message (English, max 1500)</label>
            <textarea maxLength={1500} rows={3} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.headmaster_message_en} onChange={(e) => patch({ headmaster_message_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Headmaster&apos;s message (Odia)</label>
            <textarea maxLength={1500} rows={3} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.headmaster_message_od} onChange={(e) => patch({ headmaster_message_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1">
            <label className="text-[11px] text-text">Headmaster full name</label>
            <input maxLength={120} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.name_of_hm} onChange={(e) => patch({ name_of_hm: e.target.value })} />
          </div>
          <ImgSlot label="Headmaster passport photo" organizationId={organizationId} assetType="ps_headmaster_photo" url={org.headmaster_photo} onUrl={(u) => patch({ headmaster_photo: u })} />
          <div className="space-y-1">
            <label className="text-[11px] text-text">Qualification (max 200)</label>
            <input maxLength={200} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.hm_qualification} onChange={(e) => patch({ hm_qualification: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">Experience (max 200)</label>
            <input maxLength={200} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.hm_experience} onChange={(e) => patch({ hm_experience: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Past experience (paragraph, max 1000)</label>
            <textarea
              maxLength={1000}
              rows={2}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
              value={org.hm_past_experience_en || ''}
              onChange={(e) => patch({ hm_past_experience_en: e.target.value })}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Current experience (paragraph, max 1000)</label>
            <textarea
              maxLength={1000}
              rows={2}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
              value={org.hm_current_experience_en || ''}
              onChange={(e) => patch({ hm_current_experience_en: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">Headmaster contact</label>
            <input maxLength={20} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.headmaster_contact} onChange={(e) => patch({ headmaster_contact: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">Headmaster email</label>
            <input maxLength={254} type="email" className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.headmaster_email} onChange={(e) => patch({ headmaster_email: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Vision (English, max 800)</label>
            <textarea maxLength={800} rows={3} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.vision_text_en} onChange={(e) => patch({ vision_text_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Vision (Odia)</label>
            <textarea maxLength={800} rows={3} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.vision_text_od} onChange={(e) => patch({ vision_text_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Mission (English, max 1200)</label>
            <textarea maxLength={1200} rows={4} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.mission_text_en} onChange={(e) => patch({ mission_text_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Mission (Odia)</label>
            <textarea maxLength={1200} rows={4} className="w-full rounded border border-border bg-background px-2 py-1 text-xs" value={org.mission_text_od} onChange={(e) => patch({ mission_text_od: e.target.value })} />
          </div>
          */}
        </div>
      </SectionBox>

      <SectionBox
        id="ps-section-c"
        title={isHighSchool ? 'Section C — Administration (DEO, BEO)' : 'Section C — Administration (DEO, BEO, BRCC, CRCC)'}
      >
        <p className="mb-2 text-[10px] text-text-muted">Names can match the main school form; photos and emails are for the public website.</p>
        <div className={`grid gap-3 md:grid-cols-2 ${isHighSchool ? 'xl:grid-cols-2' : 'xl:grid-cols-4'}`}>
          <div className="space-y-2 rounded border border-border bg-background p-2">
            <p className="text-[11px] font-semibold uppercase text-text">DEO</p>
            <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_admin_deo" url={org.deo_image} onUrl={(u) => patch({ deo_image: u })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Name" maxLength={120} value={org.deo_name} onChange={(e) => patch({ deo_name: e.target.value })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Contact" maxLength={20} value={org.deo_contact} onChange={(e) => patch({ deo_contact: e.target.value })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Email" type="email" maxLength={254} value={org.deo_email} onChange={(e) => patch({ deo_email: e.target.value })} />
          </div>
          <div className="space-y-2 rounded border border-border bg-background p-2">
            <p className="text-[11px] font-semibold uppercase text-text">BEO</p>
            <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_admin_beo" url={org.beo_image} onUrl={(u) => patch({ beo_image: u })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Name" maxLength={120} value={org.beo_name} onChange={(e) => patch({ beo_name: e.target.value })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Contact" maxLength={20} value={org.beo_contact} onChange={(e) => patch({ beo_contact: e.target.value })} />
            <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Email" type="email" maxLength={254} value={org.beo_email} onChange={(e) => patch({ beo_email: e.target.value })} />
          </div>
          {!isHighSchool && (
            <div className="space-y-2 rounded border border-border bg-background p-2">
              <p className="text-[11px] font-semibold uppercase text-text">BRCC</p>
              <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_admin_brcc" url={org.brcc_image || ''} onUrl={(u) => patch({ brcc_image: u })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Name" maxLength={120} value={org.brcc_name} onChange={(e) => patch({ brcc_name: e.target.value })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Contact" maxLength={20} value={org.brcc_contact} onChange={(e) => patch({ brcc_contact: e.target.value })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Email" type="email" maxLength={254} value={org.brcc_email || ''} onChange={(e) => patch({ brcc_email: e.target.value })} />
            </div>
          )}
          {!isHighSchool && (
            <div className="space-y-2 rounded border border-border bg-background p-2">
              <p className="text-[11px] font-semibold uppercase text-text">CRCC</p>
              <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_admin_crc" url={org.crc_image} onUrl={(u) => patch({ crc_image: u })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Name" maxLength={120} value={org.crc_name} onChange={(e) => patch({ crc_name: e.target.value })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Contact" maxLength={20} value={org.crc_contact} onChange={(e) => patch({ crc_contact: e.target.value })} />
              <input className="w-full rounded border border-border px-2 py-1 text-xs" placeholder="Email" type="email" maxLength={254} value={org.crc_email} onChange={(e) => patch({ crc_email: e.target.value })} />
            </div>
          )}
        </div>
      </SectionBox>

      <SectionBox id="ps-section-d" title="Section D — Facilities (add rows as needed)">
        <div className="space-y-3">
          {ensureRows(facilityRows, 7, { image: '', title: '', description: '' }).map((row, i, arr) => (
            <div key={i} className="space-y-3 rounded border border-border p-2">
              <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Facility title (100)</label>
                  <input maxLength={100} className="w-full rounded border border-border px-2 py-1 text-xs" value={String(row.title ?? '')} onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, title: e.target.value };
                    setFacilities(next);
                  }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-muted">Description (600)</label>
                  <textarea maxLength={600} rows={2} className="w-full rounded border border-border px-2 py-1 text-xs" value={String(row.description ?? '')} onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, description: e.target.value };
                    setFacilities(next);
                  }} />
                </div>
                <button type="button" className="text-[10px] text-red-600" onClick={() => {
                  const next = arr.filter((_, j) => j !== i);
                  setFacilities(next);
                }}>Remove</button>
              </div>

              <div className="space-y-2 rounded border border-border/70 bg-background p-2">
                <p className="text-[10px] font-semibold text-text-muted">Facility images (multiple)</p>
                {normalizeFacilityImages(row).map((img, imgIdx, imgs) => (
                  <div key={imgIdx} className="grid gap-2 rounded border border-border/70 p-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <ImgSlot
                      label={`Image ${imgIdx + 1}`}
                      organizationId={organizationId}
                      assetType="ps_facility"
                      url={img.url}
                      onUrl={(u) => {
                        const nextImgs = [...imgs];
                        nextImgs[imgIdx] = { ...img, url: u };
                        const next = [...arr];
                        next[i] = { ...row, images: nextImgs, image: '' };
                        setFacilities(next);
                      }}
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted">Image title (120)</label>
                      <input
                        maxLength={120}
                        className="w-full rounded border border-border px-2 py-1 text-xs"
                        value={img.title}
                        onChange={(e) => {
                          const nextImgs = [...imgs];
                          nextImgs[imgIdx] = { ...img, title: e.target.value };
                          const next = [...arr];
                          next[i] = { ...row, images: nextImgs, image: '' };
                          setFacilities(next);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="text-[10px] text-red-600"
                      onClick={() => {
                        const nextImgs = imgs.filter((_, k) => k !== imgIdx);
                        const next = [...arr];
                        next[i] = { ...row, images: nextImgs.length ? nextImgs : [{ url: '', title: '' }], image: '' };
                        setFacilities(next);
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded border border-border px-2 py-1 text-[11px]"
                  onClick={() => {
                    const imgs = normalizeFacilityImages(row);
                    const next = [...arr];
                    next[i] = { ...row, images: [...imgs, { url: '', title: '' }], image: '' };
                    setFacilities(next);
                  }}
                >
                  + Add image
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => setFacilities([...facilityRows, { image: '', title: '', description: '' }])}>+ Add facility row</button>
        </div>
      </SectionBox>

      {!isHighSchool && (
      <SectionBox id="ps-section-e" title="Section E — Mid Day Meal (daily)">
        <p className="mb-2 text-[10px] text-text-muted">
          Add daily MDM register entry with date, register photo, and total present students (Girls + Boys).
        </p>
        <div className="space-y-3">
          {ensureRows(mdmRows, 1, { date: '', register_image: '', total_boys: '', total_girls: '', total_students: '' }).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Date</label>
                <input
                  type="date"
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.date || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, date: e.target.value };
                    setMdmRows(next);
                  }}
                />
              </div>
              <ImgSlot
                label="MDM register image"
                organizationId={organizationId}
                assetType="ps_mdm_register"
                url={row.register_image || ''}
                onUrl={(u) => {
                  const next = [...arr];
                  next[i] = { ...row, register_image: u };
                  setMdmRows(next);
                }}
              />
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Total boys</label>
                <input
                  maxLength={10}
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.total_boys || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, total_boys: e.target.value };
                    setMdmRows(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Total girls</label>
                <input
                  maxLength={10}
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.total_girls || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, total_girls: e.target.value };
                    setMdmRows(next);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Total students</label>
                <input
                  maxLength={10}
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.total_students || row.total_present || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, total_students: e.target.value };
                    setMdmRows(next);
                  }}
                />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => setMdmRows(arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-[11px]"
            onClick={() => setMdmRows([...mdmRows, { date: '', register_image: '', total_boys: '', total_girls: '', total_students: '' }])}
          >
            + Add MDM day
          </button>
        </div>
      </SectionBox>
      )}

      <SectionBox id="ps-section-f" title="Section F — Parent Teacher Meeting">
        <p className="mb-2 text-[10px] text-text-muted">
          Add PTM meeting details with date, image, and short description.
        </p>
        <div className="space-y-3">
          {ensureRows(ptmRows, 1, { date: '', image: '', description: '' }).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[1fr_auto_2fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Meeting date</label>
                <input
                  type="date"
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.date || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, date: e.target.value };
                    setPtmRows(next);
                  }}
                />
              </div>
              <ImgSlot
                label="PTM image"
                organizationId={organizationId}
                assetType="ps_ptm_image"
                url={row.image || ''}
                onUrl={(u) => {
                  const next = [...arr];
                  next[i] = { ...row, image: u };
                  setPtmRows(next);
                }}
              />
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted">Short description</label>
                <textarea
                  maxLength={600}
                  rows={2}
                  className="w-full rounded border border-border px-2 py-1 text-xs"
                  value={row.description || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, description: e.target.value };
                    setPtmRows(next);
                  }}
                />
              </div>
              <button type="button" className="text-[10px] text-red-600" onClick={() => setPtmRows(arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-[11px]"
            onClick={() => setPtmRows([...ptmRows, { date: '', image: '', description: '' }])}
          >
            + Add PTM meeting
          </button>
        </div>
      </SectionBox>

      <SectionBox id="ps-section-g" title="Section G — Faculty">
        <p className="mb-2 text-[10px] text-text-muted">Use Check in to mark today&apos;s attendance. Status resets automatically for the next day.</p>
        <div className="space-y-3">
          {ensureRows(facultyRows, 4, { photo: '', name: '', subject: '', qualification: '' }).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[auto_1fr_1fr_1fr_auto_auto] md:items-end">
              <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_faculty" url={row.photo || ''} onUrl={(u) => {
                const next = [...arr];
                next[i] = { ...row, photo: u };
                setFaculty(next);
              }} />
              <input placeholder="Name" maxLength={120} className="rounded border border-border px-2 py-1 text-xs" value={row.name || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, name: e.target.value }; setFaculty(next);
              }} />
              <input placeholder="Subject" maxLength={120} className="rounded border border-border px-2 py-1 text-xs" value={row.subject || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, subject: e.target.value }; setFaculty(next);
              }} />
              <input placeholder="Qualification" maxLength={200} className="rounded border border-border px-2 py-1 text-xs" value={row.qualification || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, qualification: e.target.value }; setFaculty(next);
              }} />
              <button
                type="button"
                className={`rounded border px-2 py-1 text-[11px] ${isFacultyPresentToday(i) ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-border text-text hover:bg-gray-50'}`}
                onClick={() => markFacultyPresent(i)}
                title={todayKey}
              >
                {isFacultyPresentToday(i) ? 'Present today' : 'Check in'}
              </button>
              <button type="button" className="text-[10px] text-red-600" onClick={() => setFaculty(arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => setFaculty([...facultyRows, { photo: '', name: '', subject: '', qualification: '' }])}>+ Add teacher</button>
        </div>
      </SectionBox>

      <SectionBox id="ps-section-h" title="Section H — Gallery (min 8 items recommended)">
        <div className="space-y-3">
          {ensureRows(galleryRows, 8, { image: '', title: '', category: '', description: '' }).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[auto_1fr_1fr_2fr_auto] md:items-end">
              <ImgSlot label="Image" organizationId={organizationId} assetType="ps_gallery" url={row.image || ''} onUrl={(u) => {
                const next = [...arr]; next[i] = { ...row, image: u }; setGallery(next);
              }} />
              <input placeholder="Title (120)" maxLength={120} className="rounded border border-border px-2 py-1 text-xs" value={row.title || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, title: e.target.value }; setGallery(next);
              }} />
              <input placeholder="Category (60)" maxLength={60} className="rounded border border-border px-2 py-1 text-xs" value={row.category || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, category: e.target.value }; setGallery(next);
              }} />
              <textarea placeholder="Description (optional)" maxLength={500} rows={2} className="rounded border border-border px-2 py-1 text-xs" value={row.description || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, description: e.target.value }; setGallery(next);
              }} />
              <button type="button" className="text-[10px] text-red-600" onClick={() => setGallery(arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => setGallery([...galleryRows, { image: '', title: '', category: '', description: '' }])}>+ Add gallery item</button>
        </div>
      </SectionBox>

      <SectionBox id="ps-section-i" title="Section I — Class / intake">
        <div className="space-y-3">
          {ensureRows(classRows, 5, { image: '', class_name: '', strength: '', registered_this_year: '', subjects: '' }).map((row, i, arr) => (
            <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[auto_1fr_1fr_1fr_2fr_auto] md:items-end">
              <ImgSlot label="Classroom image" organizationId={organizationId} assetType="ps_class" url={row.image || ''} onUrl={(u) => {
                const next = [...arr]; next[i] = { ...row, image: u }; setClasses(next);
              }} />
              <input placeholder="Class name" maxLength={40} className="rounded border border-border px-2 py-1 text-xs" value={row.class_name || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, class_name: e.target.value }; setClasses(next);
              }} />
              <input placeholder="Strength" maxLength={10} className="rounded border border-border px-2 py-1 text-xs" value={row.strength || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, strength: e.target.value }; setClasses(next);
              }} />
              <input placeholder="Registered this year" maxLength={10} className="rounded border border-border px-2 py-1 text-xs" value={row.registered_this_year || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, registered_this_year: e.target.value }; setClasses(next);
              }} />
              <textarea placeholder="Subjects (500)" maxLength={500} rows={2} className="rounded border border-border px-2 py-1 text-xs" value={row.subjects || ''} onChange={(e) => {
                const next = [...arr]; next[i] = { ...row, subjects: e.target.value }; setClasses(next);
              }} />
              <button type="button" className="text-[10px] text-red-600" onClick={() => setClasses(arr.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => setClasses([...classRows, { image: '', class_name: '', strength: '', registered_this_year: '', subjects: '' }])}>+ Add class row</button>
        </div>
      </SectionBox>

      <SectionBox id="ps-section-j" title="Section J — Contact + map">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">School address (English, max 1000)</label>
            <textarea maxLength={1000} rows={3} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.contact_address_en} onChange={(e) => patch({ contact_address_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">School address (Odia)</label>
            <textarea maxLength={1000} rows={3} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.contact_address_od} onChange={(e) => patch({ contact_address_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1">
            <label className="text-[11px] text-text">School phone</label>
            <input maxLength={20} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.contact_phone} onChange={(e) => patch({ contact_phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">School office email</label>
            <input maxLength={254} type="email" className="w-full rounded border border-border px-2 py-1 text-xs" value={org.contact_email} onChange={(e) => patch({ contact_email: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Office hours (max 300)</label>
            <textarea maxLength={300} rows={2} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.office_hours_en} onChange={(e) => patch({ office_hours_en: e.target.value })} />
          </div>
          {/* Odia — re-enable when localizing
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-text">Office hours (Odia)</label>
            <textarea maxLength={300} rows={2} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.office_hours_od} onChange={(e) => patch({ office_hours_od: e.target.value })} />
          </div>
          */}
          <div className="space-y-1">
            <label className="text-[11px] text-text">Latitude (map)</label>
            <input maxLength={20} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.latitude} onChange={(e) => patch({ latitude: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-text">Longitude (map)</label>
            <input maxLength={20} className="w-full rounded border border-border px-2 py-1 text-xs" value={org.longitude} onChange={(e) => patch({ longitude: e.target.value })} />
          </div>
        </div>
      </SectionBox>

      {/* Odia / language toggle — re-enable when localizing
      <div className="space-y-1 border-t border-border pt-2">
        <label className="text-[11px] font-medium text-text">Site language default</label>
        <select className="w-full max-w-xs rounded border border-border bg-background px-2 py-1 text-xs" value={org.language || 'en'} onChange={(e) => patch({ language: e.target.value })}>
          <option value="en">English</option>
          <option value="od">Odia</option>
        </select>
      </div>
      */}

    </div>
  );
}
