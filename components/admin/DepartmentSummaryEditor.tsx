'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { DepartmentSummaryContent } from '../../services/api';

type Props = {
  departmentId: number;
  initialValue?: DepartmentSummaryContent | null;
  onUploadAboutImage: (file: File) => Promise<string>;
  onSave: (payload: DepartmentSummaryContent | null) => Promise<void>;
};

type FormState = {
  about_image: string;
  overview: string;
  minister_message: string;
};

function toInitialForm(summary?: DepartmentSummaryContent | null): FormState {
  return {
    about_image: summary?.about_image ?? '',
    overview: summary?.overview ?? '',
    minister_message: summary?.minister_message ?? '',
  };
}

export function DepartmentSummaryEditor({ departmentId, initialValue, onUploadAboutImage, onSave }: Props) {
  const [form, setForm] = useState<FormState>(toInitialForm(initialValue));
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);

  useEffect(() => {
    setForm(toInitialForm(initialValue));
  }, [initialValue]);

  const hasContent = useMemo(
    () =>
      Boolean(
        form.overview.trim() ||
          form.minister_message.trim(),
      ),
    [form],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = hasContent
        ? {
            overview: form.overview.trim() || null,
            minister_message: form.minister_message.trim() || null,
          }
        : null;
      await onSave(payload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save summary.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAboutImage = async () => {
    if (!aboutImageFile) return;
    setError(null);
    setUploadingImage(true);
    try {
      const uploadedUrl = await onUploadAboutImage(aboutImageFile);
      setForm((prev) => ({ ...prev, about_image: uploadedUrl }));
      setAboutImageFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not upload about image.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Department summary page content</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Manage only the 3 public fields used on the department summary page.
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3">
        <div className="rounded border border-border p-3">
          <p className="text-xs font-semibold text-text">About image</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Upload image file for the About section.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              key={`dept-summary-about-${departmentId}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block text-xs"
              onChange={(e) => setAboutImageFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              disabled={!aboutImageFile || uploadingImage}
              onClick={uploadAboutImage}
              className="rounded border border-border px-2 py-1 text-xs disabled:opacity-60"
            >
              {uploadingImage ? 'Uploading...' : 'Upload image'}
            </button>
            {form.about_image ? (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, about_image: '' }))}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
              >
                Remove image
              </button>
            ) : null}
          </div>
          {form.about_image ? (
            <p className="mt-2 break-all text-[11px] text-muted-foreground">{form.about_image}</p>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">No image uploaded.</p>
          )}
        </div>
        <textarea className="rounded border border-border px-3 py-2 text-xs" rows={4} placeholder="Overview paragraph" value={form.overview} onChange={(e) => setForm((p) => ({ ...p, overview: e.target.value }))} />
        <textarea className="rounded border border-border px-3 py-2 text-xs" rows={3} placeholder="Minister message" value={form.minister_message} onChange={(e) => setForm((p) => ({ ...p, minister_message: e.target.value }))} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">
            {saving ? 'Saving...' : 'Save summary page'}
          </button>
          {saved && <span className="text-[11px] text-green-600">Saved</span>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </section>
  );
}
