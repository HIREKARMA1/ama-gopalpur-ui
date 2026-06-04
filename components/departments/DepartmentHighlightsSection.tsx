import { HighlightsCyclicDiagram } from './HighlightsCyclicDiagram';
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
}: {
  sectionTitle: string;
  emptyText: string;
  infoText: string;
  departmentName: string;
  departmentCode: string;
  highlightCards: HighlightCard[];
}) {
  return (
    <DepartmentSummarySection title={sectionTitle} subtitle={infoText}>
      <HighlightsCyclicDiagram
        items={highlightCards}
        centerLabel={departmentName}
        infoText={infoText}
        emptyText={
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            {emptyText}
          </p>
        }
        makeHref={(item) =>
          `/?dept=${encodeURIComponent(departmentCode || '')}&legend=${encodeURIComponent(item.legendKey)}`
        }
      />
    </DepartmentSummarySection>
  );
}

