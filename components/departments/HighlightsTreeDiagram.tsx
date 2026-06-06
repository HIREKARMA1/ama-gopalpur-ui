import type { ReactNode } from 'react';
import type { RevenueLandHighlightTreeNode } from '../../lib/revenueLandHighlights';

const CHILD_PALETTE = [
  { fill: '#dbeafe', stroke: '#93c5fd', line: '#93c5fd' },
  { fill: '#dcfce7', stroke: '#86efac', line: '#86efac' },
  { fill: '#ccfbf1', stroke: '#5eead4', line: '#5eead4' },
  { fill: '#ffe4e6', stroke: '#fda4af', line: '#fda4af' },
  { fill: '#fef3c7', stroke: '#fcd34d', line: '#fcd34d' },
  { fill: '#ede9fe', stroke: '#c4b5fd', line: '#c4b5fd' },
];

function TreeNodeCard({
  node,
  palette,
  compact = false,
}: {
  node: RevenueLandHighlightTreeNode;
  palette?: (typeof CHILD_PALETTE)[number];
  compact?: boolean;
}) {
  const content = (
    <div
      className={`rounded-2xl border-2 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        compact ? 'px-4 py-3' : 'px-5 py-4'
      }`}
      style={{
        borderColor: palette?.stroke ?? '#94a3b8',
        backgroundColor: palette?.fill ?? '#ffffff',
      }}
    >
      <p className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{node.label}</p>
      {node.count != null && node.countLabel ? (
        <p className={`mt-1 tabular-nums font-extrabold text-slate-900 ${compact ? 'text-xl' : 'text-2xl'}`}>
          {node.count}
          <span className={`ml-2 font-medium text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {node.countLabel}
          </span>
        </p>
      ) : null}
    </div>
  );

  if (node.href) {
    return (
      <a href={node.href} className="block">
        {content}
      </a>
    );
  }
  return content;
}

export function HighlightsTreeDiagram({
  tree,
  emptyText,
}: {
  tree: RevenueLandHighlightTreeNode;
  emptyText: ReactNode;
}) {
  const children = tree.children ?? [];
  if (!children.length && !tree.count) return <>{emptyText}</>;

  return (
    <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <TreeNodeCard node={tree} />

        {children.length > 0 ? (
          <>
            <div className="my-4 h-8 w-px bg-slate-300" aria-hidden />
            <div className="relative w-full">
              {children.length > 1 ? (
                <div
                  className="absolute left-[8%] right-[8%] top-0 hidden h-px bg-slate-300 sm:block"
                  aria-hidden
                />
              ) : null}
              <div
                className={`grid w-full gap-4 ${
                  children.length === 1
                    ? 'max-w-sm grid-cols-1'
                    : children.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {children.map((child, index) => {
                  const palette = CHILD_PALETTE[index % CHILD_PALETTE.length]!;
                  return (
                    <div key={child.id} className="relative flex flex-col items-center">
                      <div className="mb-4 hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
                      <TreeNodeCard node={child} palette={palette} compact />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
