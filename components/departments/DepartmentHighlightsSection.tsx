import type { RevenueLandHighlightTreeNode } from '../../lib/revenueLandHighlights';
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
}: {
  sectionTitle: string;
  emptyText: string;
  infoText: string;
  departmentName: string;
  departmentCode: string;
  highlightCards: HighlightCard[];
  highlightTree?: RevenueLandHighlightTreeNode | null;
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

