import { HighlightsCyclicDiagram } from './HighlightsCyclicDiagram';

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
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">{sectionTitle}</h2>
      <div className="mt-4">
        <HighlightsCyclicDiagram
          items={highlightCards}
          centerLabel={departmentName}
          infoText={infoText}
          emptyText={<p className="text-sm text-slate-600">{emptyText}</p>}
          makeHref={(item) =>
            `/?dept=${encodeURIComponent(departmentCode || '')}&legend=${encodeURIComponent(item.legendKey)}`
          }
        />
      </div>
    </section>
  );
}

