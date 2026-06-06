'use client';

import type { RoadsNetworkTotalsRow } from '../../lib/roadsNetworkTotalsTable';
import {
  displayRoadsNetworkTotalsCell,
  ROADS_NETWORK_TOTALS_COLUMNS,
} from '../../lib/roadsNetworkTotalsTable';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type Props = {
  rows: RoadsNetworkTotalsRow[];
  language: 'en' | 'or';
};

export function RoadsNetworkTotalsTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof ROADS_NETWORK_TOTALS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  const title = language === 'or' ? 'ରୋଡ୍ ନେଟୱାର୍କ ସାରାଂଶ' : 'Road network summary';
  const subtitle =
    language === 'or'
      ? 'PWD, RD, GP ଏବଂ ପୌରସଭା ରୋଡ୍ ମୋଟ ସଂଖ୍ୟା'
      : 'Total counts of PWD, RD, GP, and Municipality roads';

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle} flush>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {ROADS_NETWORK_TOTALS_COLUMNS.map((col) => (
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
              <tr key={`road-totals-${idx}`} className="bg-white transition-colors hover:bg-orange-50/30">
                {ROADS_NETWORK_TOTALS_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {displayRoadsNetworkTotalsCell(
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
