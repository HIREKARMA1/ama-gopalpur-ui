'use client';

import type { Organization } from '../../services/api';
import { HighlightsCyclicDiagram } from '../departments/HighlightsCyclicDiagram';
import { buildWatcoRwssHighlightGroups, watcoHighlightMapHref } from '../../lib/watcoHighlights';

type Props = {
  departmentCode: string;
  organizations: Organization[];
  loading?: boolean;
};

export function WatcoRwssHighlightsEditor({
  departmentCode,
  organizations,
  loading = false,
}: Props) {
  const groups = buildWatcoRwssHighlightGroups(organizations, 'en');

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Department highlights</h2>
      <p className="mt-1 text-xs text-text-muted">
        Two diagrams are shown on the public WATCO/RWSS summary page — one for WATCO schemes and one
        for RWSS. Station-type counts update automatically from organization data (
        <strong>SUB DEPARTMENT</strong> and <strong>STATION TYPE</strong>).
      </p>
      {loading ? (
        <p className="mt-3 text-xs text-text-muted">Loading WATCO and RWSS organization counts…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {groups.map((group) => (
            <div key={group.id} className="min-w-0">
              <h3 className="mb-3 text-sm font-semibold text-text">{group.centerLabel}</h3>
              <HighlightsCyclicDiagram
                items={group.cards}
                centerLabel={group.centerLabel}
                emptyText={
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                    No {group.id} schemes yet. Add organizations with sub department {group.id}.
                  </p>
                }
                makeHref={(item) => watcoHighlightMapHref(departmentCode, item.legendKey)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
