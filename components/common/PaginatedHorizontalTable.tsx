'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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
  /**
   * When false, skips the padded outer wrapper and inner card shell so the caller
   * can place the table inside its own frame (e.g. a single bordered panel).
   */
  embedInCard?: boolean;
  /** Wider columns and slightly larger text for dense data grids. */
  comfortable?: boolean;
  /** Client-side sort: active column key from {@link TableColumn.key}. */
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  /** When set, column headers become sort toggles (calls with column `key`). */
  onSortColumn?: (columnKey: string) => void;
  /**
   * Server-driven pagination: pass one page of `rows`, total row count, and controlled page index.
   * When set, internal page slicing is disabled and Prev/Next call `onPageChange`.
   */
  serverPagination?: {
    total: number;
    pageIndex: number;
    onPageChange: (nextPageIndex: number) => void;
    loading?: boolean;
  };
};

export function PaginatedHorizontalTable<T>({
  columns,
  rows,
  pageSize = 10,
  getRowId,
  onRowClick,
  emptyText,
  showPagination = true,
  embedInCard = true,
  comfortable = false,
  sortKey = null,
  sortDir = 'asc',
  onSortColumn,
  serverPagination,
}: PaginatedHorizontalTableProps<T>) {
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const { language } = useLanguage();
  const isOdia = language === 'or';

  const isServer = serverPagination != null;
  const pageIndex = isServer ? serverPagination.pageIndex : internalPageIndex;

  const pageCount = useMemo(() => {
    if (isServer) return Math.max(1, Math.ceil(serverPagination.total / pageSize));
    return Math.max(1, Math.ceil(rows.length / pageSize));
  }, [isServer, serverPagination?.total, pageSize, rows.length]);

  const paginated = useMemo(() => {
    if (isServer) return rows;
    const start = internalPageIndex * pageSize;
    return rows.slice(start, start + pageSize);
  }, [isServer, rows, internalPageIndex, pageSize]);

  useEffect(() => {
    if (isServer) return;
    setInternalPageIndex((i) => Math.min(Math.max(0, i), pageCount - 1));
  }, [isServer, pageCount]);

  const clickable = typeof onRowClick === 'function';
  const sortable = typeof onSortColumn === 'function';

  const cellMin = comfortable ? 'min-w-[11rem]' : 'w-[120px]';
  const cellMax = comfortable ? 'max-w-[18rem]' : 'max-w-[120px]';
  const tableText = comfortable ? 'text-sm' : 'text-xs';
  const thText = comfortable ? 'text-[11px]' : 'text-[10px]';
  const thPy = comfortable ? 'py-3.5' : 'py-3';
  const tdPy = comfortable ? 'py-2.5' : 'py-2';

  const tableEl = (
    <div className="overflow-x-auto min-w-0">
      <table className={`w-max min-w-full border-collapse ${tableText}`}>
        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-border/60">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`${cellMin} ${comfortable ? '' : 'w-[120px]'} px-4 ${thPy} text-left ${thText} font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                  sortable ? 'align-bottom' : ''
                } ${c.thClassName ?? ''}`}
              >
                {sortable ? (
                  <button
                    type="button"
                    className={`flex max-w-full items-center gap-1 rounded px-0.5 py-0.5 text-left hover:bg-slate-100/80 ${
                      sortKey === c.key ? 'text-slate-900' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSortColumn?.(c.key);
                    }}
                  >
                    <span className="min-w-0 truncate">{c.header}</span>
                    <span className="inline-flex shrink-0 text-slate-500" aria-hidden>
                      {sortKey === c.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </span>
                  </button>
                ) : (
                  <span className="block truncate">{c.header}</span>
                )}
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
                      className={`${cellMin} ${comfortable ? '' : 'w-[120px]'} px-4 ${tdPy} text-text whitespace-nowrap truncate ${cellMax} ${
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
  );

  return (
    <>
      {embedInCard ? (
        <div className="overflow-x-auto max-w-full min-w-0 px-4 py-3">
          <div className="rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden">{tableEl}</div>
        </div>
      ) : (
        tableEl
      )}

      {showPagination && (
        <div
          className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 ${
            embedInCard ? 'bg-slate-50/60 border-border/60' : 'bg-slate-50/40'
          }`}
        >
          <div className="text-xs text-text-muted flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-1 border border-border/60">
              {isOdia ? 'ପୃଷ୍ଠା' : 'Page'}{' '}
              <span className="font-semibold text-text">{pageIndex + 1}</span>{' '}
              {isOdia ? 'ର' : 'of'} <span className="font-semibold text-text">{pageCount}</span>
            </span>
            <span className="text-text-muted">
              (
              {isServer ? serverPagination.total : rows.length}{' '}
              {isOdia ? 'ମୋଟ' : 'total'}
              {serverPagination?.loading ? ` · ${isOdia ? 'ଲୋଡ୍…' : 'Loading…'}` : ''})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageIndex === 0 || serverPagination?.loading}
              onClick={() => {
                if (isServer) serverPagination.onPageChange(pageIndex - 1);
                else setInternalPageIndex((i) => Math.max(0, i - 1));
              }}
              className="px-3 py-1.5 rounded border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs hover:bg-slate-100 transition-colors"
            >
              {isOdia ? 'ପଛୁଆ' : 'Prev'}
            </button>
            <button
              type="button"
              disabled={pageIndex >= pageCount - 1 || serverPagination?.loading}
              onClick={() => {
                if (isServer) serverPagination.onPageChange(pageIndex + 1);
                else setInternalPageIndex((i) => Math.min(pageCount - 1, i + 1));
              }}
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

