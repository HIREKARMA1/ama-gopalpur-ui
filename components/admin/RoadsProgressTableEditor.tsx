'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { RoadsProgressRow } from '../../lib/roadsProgressTable';
import { ROADS_PROGRESS_COLUMNS } from '../../lib/roadsProgressTable';

type RowState = RoadsProgressRow & { clientId: string };

type Props = {
  departmentId: number;
  initialRows: RoadsProgressRow[];
  onSave: (payload: { roads_progress_rows: RoadsProgressRow[] }) => Promise<void>;
};

function toRowState(rows: RoadsProgressRow[]): RowState[] {
  return rows.map((row, index) => ({
    ...row,
    clientId: `row-${index}-${row.fy ?? ''}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}

function newRowState(): RowState {
  return { clientId: `new-${Date.now()}` };
}

function toPayload(rows: RowState[]): RoadsProgressRow[] {
  return rows.map((row, index) => {
    const out: RoadsProgressRow = {};
    for (const col of ROADS_PROGRESS_COLUMNS) {
      const v = String(row[col.key] ?? '').trim();
      if (v) out[col.key] = v;
    }
    if (!out.sl_no) out.sl_no = String(index + 1);
    return out;
  }).filter((row) =>
    ROADS_PROGRESS_COLUMNS.some((col) => String(row[col.key] ?? '').trim() !== ''),
  );
}

export function RoadsProgressTableEditor({ departmentId, initialRows, onSave }: Props) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRows(initialRows.length ? toRowState(initialRows) : [newRowState()]);
  }, [departmentId, initialRows]);

  const updateCell = (clientId: string, key: keyof RoadsProgressRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.clientId === clientId ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => setRows((prev) => [...prev, newRowState()]);

  const removeRow = (clientId: string) => {
    setRows((prev) => (prev.length <= 1 ? [newRowState()] : prev.filter((r) => r.clientId !== clientId)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({ roads_progress_rows: toPayload(rows) });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save road progress table.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Road progress summary table</h2>
      <p className="mt-1 text-xs text-text-muted">
        Shown on the public Roads department summary page (above Road Listing). Add one row per FY or
        reporting period.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {ROADS_PROGRESS_COLUMNS.map((col) => (
                  <th key={col.key} className="px-2 py-2 text-left font-semibold text-text whitespace-nowrap">
                    {col.en}
                  </th>
                ))}
                <th className="px-2 py-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.clientId} className="border-t border-border">
                  {ROADS_PROGRESS_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1 align-top">
                      <input
                        className="w-full min-w-[72px] rounded border border-border bg-background px-2 py-1.5 text-xs"
                        value={String(row[col.key] ?? '')}
                        onChange={(e) => updateCell(row.clientId, col.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1 align-top">
                    <button
                      type="button"
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
                      onClick={() => removeRow(row.clientId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
            onClick={addRow}
          >
            Add row
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save table'}
          </button>
          {saved ? <span className="text-xs text-emerald-600">Saved.</span> : null}
          {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </div>
      </form>
    </section>
  );
}
