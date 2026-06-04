'use client';

import type { RoadsProgressRow } from '../../lib/roadsProgressTable';
import {
  displayRoadsProgressCell,
  ROADS_PROGRESS_COLUMNS,
} from '../../lib/roadsProgressTable';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type Props = {
  rows: RoadsProgressRow[];
  language: 'en' | 'or';
};

export function RoadsProgressTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof ROADS_PROGRESS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  const title = language === 'or' ? 'ରୋଡ୍ ପ୍ରଗତି ସାରାଂଶ' : 'Road progress summary';
  const subtitle =
    language === 'or'
      ? 'ବିଭାଗ ସ୍ତରରେ ରୋଡ୍ ଉନ୍ନତି ଓ ପ୍ରସ୍ତାବ ସାରାଂଶ'
      : 'Department-level road upgradation and proposal summary';

  return (
    <DepartmentSummarySection title={title} subtitle={subtitle} flush>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {ROADS_PROGRESS_COLUMNS.map((col) => (
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
              <tr key={`progress-${idx}`} className="bg-white transition-colors hover:bg-orange-50/30">
                {ROADS_PROGRESS_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {displayRoadsProgressCell(
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
