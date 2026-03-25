'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  thClassName?: string;
  tdClassName?: string;
};

export type PaginatedHorizontalTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  pageSize?: number;
  getRowId: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  showPagination?: boolean;
};

export function PaginatedHorizontalTable<T>({
  columns,
  rows,
  pageSize = 10,
  getRowId,
  onRowClick,
  emptyText,
  showPagination = true,
}: PaginatedHorizontalTableProps<T>) {
  const [pageIndex, setPageIndex] = useState(0);
  const { language } = useLanguage();
  const isOdia = language === 'or';

  const pageCount = useMemo(() => Math.max(1, Math.ceil(rows.length / pageSize)), [rows.length, pageSize]);

  const paginated = useMemo(() => {
    const start = pageIndex * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex((i) => Math.min(Math.max(0, i), pageCount - 1));
  }, [pageCount]);

  const clickable = typeof onRowClick === 'function';

  return (
    <>
      <div className="overflow-x-auto max-w-full min-w-0 px-4 py-3">
        <div className="rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-max border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-border/60">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`w-[120px] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                        c.thClassName ?? ''
                      }`}
                    >
                      <span className="block truncate">{c.header}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500 italic">
                      {emptyText ?? (isOdia ? 'କୌଣସି ରେକର୍ଡ ମିଳିଲା ନାହିଁ।' : 'No records found.')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const id = getRowId(row);
                    return (
                      <tr
                        key={id}
                        className={`${clickable ? 'hover:bg-slate-50 cursor-pointer' : ''} transition-colors`}
                        onClick={clickable ? () => onRowClick?.(row) : undefined}
                        role={clickable ? 'button' : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={
                          clickable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') onRowClick?.(row);
                              }
                            : undefined
                        }
                      >
                        {columns.map((c) => (
                          <td
                            key={String(id) + '-' + c.key}
                            className={`w-[120px] px-4 py-2 text-text whitespace-nowrap truncate max-w-[120px] ${
                              c.tdClassName ?? ''
                            }`}
                          >
                            {c.render(row)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPagination && (
        <div className="p-4 bg-slate-50/60 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-text-muted flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-1 border border-border/60">
              {isOdia ? 'ପୃଷ୍ଠା' : 'Page'}{' '}
              <span className="font-semibold text-text">{pageIndex + 1}</span>{' '}
              {isOdia ? 'ର' : 'of'} <span className="font-semibold text-text">{pageCount}</span>
            </span>
            <span className="text-text-muted">({rows.length} {isOdia ? 'ମୋଟ' : 'total'})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              className="px-3 py-1.5 rounded border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs hover:bg-slate-100 transition-colors"
            >
              {isOdia ? 'ପଛୁଆ' : 'Prev'}
            </button>
            <button
              type="button"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
              className="px-3 py-1.5 rounded border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs hover:bg-slate-100 transition-colors"
            >
              {isOdia ? 'ଆଗକୁ' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

