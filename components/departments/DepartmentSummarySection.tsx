import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Section body without extra card padding (e.g. full-bleed table). */
  flush?: boolean;
  className?: string;
};

export function DepartmentSummarySection({ title, subtitle, children, flush = false, className = '' }: Props) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] ${className}`}
    >
      <header className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{subtitle}</p> : null}
      </header>
      <div className={flush ? '' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}
