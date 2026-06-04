'use client';

import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { DepartmentSummaryContent } from '../../services/api';
import {
  ministersForSave,
  newMinisterRow,
  parseSummaryMinisters,
  reorderMinisters,
  type DepartmentSummaryMinister,
} from '../../lib/departmentSummaryMinisters';
import { compressImage } from '../../lib/imageCompression';

type Props = {
  departmentId: number;
  initialValue?: DepartmentSummaryContent | null;
  onUploadPhoto: (file: File) => Promise<string>;
  onSave: (payload: Partial<DepartmentSummaryContent>) => Promise<void>;
};

export function DepartmentSummaryMinistersEditor({
  departmentId,
  initialValue,
  onUploadPhoto,
  onSave,
}: Props) {
  const [rows, setRows] = useState<DepartmentSummaryMinister[]>(() =>
    parseSummaryMinisters(initialValue?.summary_ministers),
  );
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRows(parseSummaryMinisters(initialValue?.summary_ministers));
  }, [initialValue?.summary_ministers]);

  const patchRow = (id: string, patch: Partial<DepartmentSummaryMinister>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const uploadPhoto = async (id: string, file: File) => {
    setError(null);
    setUploadingId(id);
    try {
      const compressed = await compressImage(file, { maxSizeMB: 0.5 });
      const url = await onUploadPhoto(compressed);
      patchRow(id, { photo_url: url });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not upload minister photo.');
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSave({
        summary_ministers: ministersForSave(rows),
        minister_name: null,
        minister_name_od: null,
        minister_message: null,
        minister_message_od: null,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save ministers.');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!dragId) return;
    setRows((prev) => reorderMinisters(prev, dragId, targetId));
    setDragId(null);
    setDropTargetId(null);
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-text">Ministers section (summary page)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add ministers for the public summary page (photo, name, designation). Drag the handle to change display order (two cards per row on laptop).
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
          onClick={() => setRows((prev) => [...prev, newMinisterRow()])}
        >
          + Add minister
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ministers yet. Click &quot;Add minister&quot; to start.</p>
        ) : null}
        {rows.map((row, index) => {
          const isDragging = dragId === row.id;
          const isDropTarget = dropTargetId === row.id && dragId && dragId !== row.id;
          return (
            <div
              key={row.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragId !== row.id) setDropTargetId(row.id);
              }}
              onDragLeave={() => {
                if (dropTargetId === row.id) setDropTargetId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(row.id);
              }}
              className={`rounded-lg border p-3 transition-colors ${
                isDragging
                  ? 'border-primary/40 bg-primary/5 opacity-60'
                  : isDropTarget
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    draggable
                    onDragStart={(e) => {
                      setDragId(row.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTargetId(null);
                    }}
                    className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                    title="Drag to reorder"
                    aria-label={`Drag to reorder minister ${index + 1}`}
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-text">
                    Position {index + 1}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[11px] text-red-600 hover:underline"
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs text-text">Photo</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      key={`minister-photo-${departmentId}-${row.id}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="block text-xs"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadPhoto(row.id, file);
                        e.target.value = '';
                      }}
                    />
                    {uploadingId === row.id ? (
                      <span className="text-[11px] text-muted-foreground">Uploading…</span>
                    ) : null}
                    {row.photo_url ? (
                      <button
                        type="button"
                        className="text-[11px] text-red-600"
                        onClick={() => patchRow(row.id, { photo_url: '' })}
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                  {row.photo_url ? (
                    <img src={row.photo_url} alt="" className="mt-2 h-24 w-20 rounded border object-cover" />
                  ) : null}
                </div>
                <input
                  className="rounded border border-border px-2 py-1 text-xs"
                  placeholder="Name (English)"
                  value={row.name ?? ''}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                />
                <input
                  className="rounded border border-border px-2 py-1 text-xs"
                  placeholder="Name (Odia)"
                  value={row.name_od ?? ''}
                  onChange={(e) => patchRow(row.id, { name_od: e.target.value })}
                />
                <input
                  className="rounded border border-border px-2 py-1 text-xs"
                  placeholder="Designation (English)"
                  value={row.designation ?? ''}
                  onChange={(e) => patchRow(row.id, { designation: e.target.value })}
                />
                <input
                  className="rounded border border-border px-2 py-1 text-xs"
                  placeholder="Designation (Odia)"
                  value={row.designation_od ?? ''}
                  onChange={(e) => patchRow(row.id, { designation_od: e.target.value })}
                />
                {/* Minister message — hidden for now; re-enable when needed
                <textarea
                  className="rounded border border-border px-2 py-1 text-xs md:col-span-2"
                  rows={2}
                  placeholder="Message (English)"
                  value={row.message ?? ''}
                  onChange={(e) => patchRow(row.id, { message: e.target.value })}
                />
                <textarea
                  className="rounded border border-border px-2 py-1 text-xs md:col-span-2"
                  rows={2}
                  placeholder="Message (Odia)"
                  value={row.message_od ?? ''}
                  onChange={(e) => patchRow(row.id, { message_od: e.target.value })}
                />
                */}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save ministers'}
        </button>
        {saved ? <span className="text-[11px] text-green-600">Saved</span> : null}
        {rows.length > 1 ? (
          <span className="text-[11px] text-muted-foreground">Order is saved with the button above.</span>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </section>
  );
}
