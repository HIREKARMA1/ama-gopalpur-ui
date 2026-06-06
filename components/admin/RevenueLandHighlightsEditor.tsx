'use client';

import type { Organization } from '../../services/api';
import { HighlightsTreeDiagram } from '../departments/HighlightsTreeDiagram';
import { buildRevenueLandHighlightTree } from '../../lib/revenueLandHighlights';

type Props = {
  departmentName: string;
  departmentCode: string;
  organizations: Organization[];
  loading?: boolean;
};

export function RevenueLandHighlightsEditor({
  departmentName,
  departmentCode,
  organizations,
  loading = false,
}: Props) {
  const tree = buildRevenueLandHighlightTree(organizations, departmentName, departmentCode, 'en');

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">Department highlights</h2>
      <p className="mt-1 text-xs text-text-muted">
        Tree view shown on the public Revenue summary page. Tahasil offices branch from the department
        root; land parcel counts update automatically from linked parcel records (
        <strong>Tahasils office org ID</strong> on each parcel).
      </p>
      {loading ? (
        <p className="mt-3 text-xs text-text-muted">Loading Tahasil offices and parcel counts…</p>
      ) : (
        <div className="mt-4">
          <HighlightsTreeDiagram
            tree={tree}
            emptyText={
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                Add Tahasil offices and link land parcels to see the highlight tree.
              </p>
            }
          />
        </div>
      )}
    </section>
  );
}
