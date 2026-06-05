'use client';

import type { MinorIrrigationConsumerStatsRow } from '../../lib/minorIrrigationConsumerStatsTable';
import {
  displayMinorIrrigationConsumerStatsCell,
  MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS,
} from '../../lib/minorIrrigationConsumerStatsTable';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type Props = {
  rows: MinorIrrigationConsumerStatsRow[];
  language: 'en' | 'or';
};

export function MinorIrrigationConsumerStatsTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  const title = language === 'or' ? 'କ୍ଷୁଦ୍ର ସିଚାଇ — ସାରାଂଶ' : 'Minor irrigation summary';
  const subtitle =
    language === 'or'
      ? 'କଭର୍ଡ ପଞ୍ଚାୟତ, ଆୟାକଟ୍, ଲାଭାନ୍ବିତ ଓ ଆୟାକଟଦାର ସଂଖ୍ୟାର ସାରାଂଶ'
      : 'Totals for panchayats covered, ayacut area, beneficiaries, and ayicutdars benefited';

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle} flush>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
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
              <tr key={`minor-irr-stats-${idx}`} className="bg-white transition-colors hover:bg-orange-50/30">
                {MINOR_IRRIGATION_CONSUMER_STATS_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {displayMinorIrrigationConsumerStatsCell(
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
