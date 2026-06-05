'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { MinorIrrigationConsumerStatsRow } from '../../lib/minorIrrigationConsumerStatsTable';
import { MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS } from '../../lib/minorIrrigationConsumerStatsTable';

type RowState = MinorIrrigationConsumerStatsRow & { clientId: string };

type Props = {
  departmentId: number;
  initialRows: MinorIrrigationConsumerStatsRow[];
  onSave: (
    payload: { minor_irrigation_consumer_stats_rows: MinorIrrigationConsumerStatsRow[] },
  ) => Promise<void>;
};

function toRowState(rows: MinorIrrigationConsumerStatsRow[]): RowState[] {
  return rows.map((row, index) => ({
    ...row,
    clientId: `row-${index}-${row.sl_no ?? ''}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}

function newRowState(): RowState {
  return { clientId: `new-${Date.now()}` };
}

function toPayload(rows: RowState[]): MinorIrrigationConsumerStatsRow[] {
  return rows
    .map((row, index) => {
      const out: MinorIrrigationConsumerStatsRow = {};
      for (const col of MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS) {
        const v = String(row[col.key] ?? '').trim();
        if (v) out[col.key] = v;
      }
      if (!out.sl_no) out.sl_no = String(index + 1);
      return out;
    })
    .filter((row) =>
      MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS.some((col) => String(row[col.key] ?? '').trim() !== ''),
    );
}

export function MinorIrrigationConsumerStatsTableEditor({ departmentId, initialRows, onSave }: Props) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRows(initialRows.length ? toRowState(initialRows) : [newRowState()]);
  }, [departmentId, initialRows]);

  const updateCell = (clientId: string, key: keyof MinorIrrigationConsumerStatsRow, value: string) => {
    setRows((prev) => prev.map((row) => (row.clientId === clientId ? { ...row, [key]: value } : row)));
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
      await onSave({ minor_irrigation_consumer_stats_rows: toPayload(rows) });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save minor irrigation stats table.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Minor irrigation totals summary table</h2>
      <p className="mt-1 text-xs text-text-muted">
        Shown on the public Minor Irrigation department summary page (above MIP listing). Add rows for
        panchayats covered, ayacut area, beneficiaries, and ayicutdars benefited.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="overflow-x-auto rounded border border-border">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-2 py-2 text-left font-semibold text-text"
                  >
                    {col.en}
                  </th>
                ))}
                <th className="w-16 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.clientId} className="border-t border-border">
                  {MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1 align-top">
                      <input
                        className="w-full min-w-[88px] rounded border border-border bg-background px-2 py-1.5 text-xs"
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
