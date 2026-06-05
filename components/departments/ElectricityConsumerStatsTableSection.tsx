'use client';

import type { ElectricityConsumerStatsRow } from '../../lib/electricityConsumerStatsTable';
import {
  displayElectricityConsumerStatsCell,
  ELECTRICITY_CONSUMER_STATS_COLUMNS,
} from '../../lib/electricityConsumerStatsTable';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type Props = {
  rows: ElectricityConsumerStatsRow[];
  language: 'en' | 'or';
};

export function ElectricityConsumerStatsTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof ELECTRICITY_CONSUMER_STATS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  const title = language === 'or' ? 'ବିଦ୍ୟୁତ୍ ଗ୍ରାହକ ସାରାଂଶ' : 'Electricity consumer summary';
  const subtitle =
    language === 'or'
      ? 'ସବ୍-ଷ୍ଟେସନ ଓ ଗ୍ରାହକ ସଂଖ୍ୟାର ସାରାଂଶ'
      : 'Summary of substations and consumer counts';

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle} flush>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {ELECTRICITY_CONSUMER_STATS_COLUMNS.map((col) => (
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
              <tr key={`elec-stats-${idx}`} className="bg-white transition-colors hover:bg-orange-50/30">
                {ELECTRICITY_CONSUMER_STATS_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {displayElectricityConsumerStatsCell(
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
