import type { RevenueLandHighlightTreeNode } from '../../lib/revenueLandHighlights';
import type { WatcoHighlightGroup } from '../../lib/watcoHighlights';
import { watcoHighlightMapHref } from '../../lib/watcoHighlights';
import { HighlightsCyclicDiagram } from './HighlightsCyclicDiagram';
import { HighlightsTreeDiagram } from './HighlightsTreeDiagram';
import { DepartmentSummarySection } from './DepartmentSummarySection';

type HighlightCard = {
  title: string;
  count: string;
  legendKey: string;
};

export function DepartmentHighlightsSection({
  sectionTitle,
  emptyText,
  infoText,
  departmentName,
  departmentCode,
  highlightCards,
  highlightTree,
  watcoHighlightGroups,
}: {
  sectionTitle: string;
  emptyText: string;
  infoText: string;
  departmentName: string;
  departmentCode: string;
  highlightCards: HighlightCard[];
  highlightTree?: RevenueLandHighlightTreeNode | null;
  watcoHighlightGroups?: WatcoHighlightGroup[] | null;
}) {
  const emptyNode = (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
      {emptyText}
    </p>
  );

  return (
    <DepartmentSummarySection title={sectionTitle} subtitle={infoText}>
      {highlightTree ? (
        <HighlightsTreeDiagram tree={highlightTree} emptyText={emptyNode} />
      ) : watcoHighlightGroups?.length ? (
        <div className="space-y-10">
          {watcoHighlightGroups.map((group) => (
            <div key={group.id}>
              <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-slate-600 sm:text-base">
                {group.centerLabel}
              </h3>
              <HighlightsCyclicDiagram
                items={group.cards}
                centerLabel={group.centerLabel}
                emptyText={emptyNode}
                makeHref={(item) => watcoHighlightMapHref(departmentCode, item.legendKey)}
              />
            </div>
          ))}
        </div>
      ) : (
        <HighlightsCyclicDiagram
          items={highlightCards}
          centerLabel={departmentName}
          infoText={infoText}
          emptyText={emptyNode}
          makeHref={(item) =>
            `/?dept=${encodeURIComponent(departmentCode || '')}&legend=${encodeURIComponent(item.legendKey)}`
          }
        />
      )}
    </DepartmentSummarySection>
  );
}

