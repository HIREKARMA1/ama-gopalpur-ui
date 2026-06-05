'use client';

import type { IrrigationConsumerStatsRow } from '../../lib/irrigationConsumerStatsTable';
import {
  displayIrrigationConsumerStatsCell,
  IRRIGATION_CONSUMER_STATS_COLUMNS,
} from '../../lib/irrigationConsumerStatsTable';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type Props = {
  rows: IrrigationConsumerStatsRow[];
  language: 'en' | 'or';
};

export function IrrigationConsumerStatsTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof IRRIGATION_CONSUMER_STATS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  const title = language === 'or' ? 'ସିଚାଇ ବିଭାଗ — ସାରାଂଶ' : 'Irrigation summary';
  const subtitle =
    language === 'or'
      ? 'କଭର୍ଡ ପଞ୍ଚାୟତ, ଆୟାକଟ୍, ଲାଭାନ୍ବିତ ଓ ଫସଲ ସଂଖ୍ୟାର ସାରାଂଶ'
      : 'Totals for panchayats covered, ayacut area, beneficiaries, and crops';

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle} flush>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {label(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={`irr-stats-${idx}`} className="bg-white transition-colors hover:bg-orange-50/30">
                {IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {displayIrrigationConsumerStatsCell(
                      col.key === 'sl_no' ? row.sl_no ?? String(idx + 1) : row[col.key],
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DepartmentSummarySection>
  );
}

