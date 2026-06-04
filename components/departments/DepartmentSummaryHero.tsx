import { Building2, MapPinned } from 'lucide-react';

type Props = {
  departmentName: string;
  organizationCount: number;
  overviewLabel: string;
  /** Label under the count (typically the department name). */
  statLabel: string;
  constituencyLabel: string;
};

export function DepartmentSummaryHero({
  departmentName,
  organizationCount,
  overviewLabel,
  statLabel,
  constituencyLabel,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-white to-slate-50 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-orange-200/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-amber-100/40 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-800/80">{overviewLabel}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{departmentName}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPinned className="h-4 w-4 shrink-0 text-orange-600/80" aria-hidden />
            Gopalpur Constituency
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">{organizationCount}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600">{statLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
