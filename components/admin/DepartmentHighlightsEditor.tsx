'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { DepartmentSummaryHighlightCard } from '../../services/api';

const TITLE_MAX = 120;
const VALUE_MAX = 80;

type HighlightRow = {
  clientId: string;
  title: string;
  value: string;
};

type Props = {
  departmentId: number;
  displayCards: DepartmentSummaryHighlightCard[];
  loading?: boolean;
  onSave: (payload: { highlight_cards: DepartmentSummaryHighlightCard[] }) => Promise<void>;
};

function toRows(cards: DepartmentSummaryHighlightCard[]): HighlightRow[] {
  return cards.map((card, index) => ({
    clientId: `card-${index}-${(card.title || '').slice(0, 12)}`,
    title: card.title ?? '',
    value: card.value ?? '',
  }));
}

function newRow(): HighlightRow {
  return {
    clientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    value: '',
  };
}

export function DepartmentHighlightsEditor({ departmentId, displayCards, loading = false, onSave }: Props) {
  const [rows, setRows] = useState<HighlightRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    setRows(toRows(displayCards));
  }, [departmentId, loading, displayCards]);

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const removeRow = (clientId: string) => {
    setRows((prev) => prev.filter((row) => row.clientId !== clientId));
  };

  const updateRow = (clientId: string, patch: Partial<Pick<HighlightRow, 'title' | 'value'>>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              ...patch,
              title: patch.title !== undefined ? patch.title.slice(0, TITLE_MAX) : row.title,
              value: patch.value !== undefined ? patch.value.slice(0, VALUE_MAX) : row.value,
            }
          : row,
      ),
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const highlight_cards = rows
        .map((row) => ({
          title: row.title.trim(),
          value: row.value.trim(),
        }))
        .filter((row) => row.title && row.value);
      await onSave({ highlight_cards });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save department highlights.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Department highlights</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Values below match what visitors see on the department summary page (from saved highlights or
        current organization data). Review and edit as needed, then save. Clear all rows and save to
        show automatic counts from organizations again.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading current highlights…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No highlights to show. Add an attribute below.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li
                key={row.clientId}
                className="grid gap-2 rounded border border-border p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <label className="block text-xs">
                  <span className="mb-1 block font-medium text-text">Attribute {index + 1}</span>
                  <input
                    className="w-full rounded border border-border px-3 py-2 text-xs"
                    placeholder="e.g. Total schools"
                    value={row.title}
                    maxLength={TITLE_MAX}
                    onChange={(e) => updateRow(row.clientId, { title: e.target.value })}
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium text-text">Value</span>
                  <input
                    className="w-full rounded border border-border px-3 py-2 text-xs"
                    placeholder="e.g. 142"
                    value={row.value}
                    maxLength={VALUE_MAX}
                    onChange={(e) => updateRow(row.clientId, { value: e.target.value })}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.clientId)}
                    className="rounded border border-red-300 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={loading}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-muted/40 disabled:opacity-60"
          >
            Add attribute
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save highlights'}
          </button>
          {saved && <span className="text-[11px] text-green-600">Saved</span>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </section>
  );
}
