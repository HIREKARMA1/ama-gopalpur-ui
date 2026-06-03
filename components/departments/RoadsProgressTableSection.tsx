'use client';

import type { RoadsProgressRow } from '../../lib/roadsProgressTable';
import {
  displayRoadsProgressCell,
  ROADS_PROGRESS_COLUMNS,
} from '../../lib/roadsProgressTable';

type Props = {
  rows: RoadsProgressRow[];
  language: 'en' | 'or';
};

export function RoadsProgressTableSection({ rows, language }: Props) {
  if (!rows.length) return null;

  const label = (col: (typeof ROADS_PROGRESS_COLUMNS)[number]) =>
    language === 'or' ? col.or : col.en;

  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">
        {language === 'or' ? 'ରୋଡ୍ ପ୍ରଗତି ସାରାଂଶ' : 'Road progress summary'}
      </h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {ROADS_PROGRESS_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
                  >
                    {label(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`progress-${idx}`} className="border-t border-slate-100/90 hover:bg-slate-50/70">
                  {ROADS_PROGRESS_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
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
      </div>
    </section>
  );
}
