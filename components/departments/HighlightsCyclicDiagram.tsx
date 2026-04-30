import type { ReactNode } from 'react';

type HighlightItem = {
  title: string;
  count: string;
  legendKey: string;
};

const PALETTE = [
  { fill: '#dbeafe', stroke: '#93c5fd' }, // blue-100 / blue-400
  { fill: '#dcfce7', stroke: '#86efac' }, // green-100 / green-400
  { fill: '#ccfbf1', stroke: '#5eead4' }, // teal-100 / teal-300
  { fill: '#ffe4e6', stroke: '#fda4af' }, // rose-100 / rose-300
];

function truncate(s: string, maxLen: number) {
  const v = (s || '').trim();
  if (!v) return '';
  if (v.length <= maxLen) return v;
  return `${v.slice(0, Math.max(0, maxLen - 1))}…`;
}

function centerLabelLines(label: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ['—'];
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = w;
    if (lines.length >= maxLines - 1) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  if (lines.length === maxLines) {
    lines[maxLines - 1] = truncate(lines[maxLines - 1]!, maxCharsPerLine);
  }
  return lines;
}

export function HighlightsCyclicDiagram({
  items,
  centerLabel,
  makeHref,
  emptyText,
  infoText = 'Click any node to view matching organizations.',
}: {
  items: HighlightItem[];
  centerLabel: string;
  makeHref: (item: HighlightItem) => string;
  emptyText: ReactNode;
  infoText?: string;
}) {
  const hasEnough = items.length >= 2;
  if (!items.length) return <>{emptyText}</>;

  // For a single item, show a compact fallback card.
  if (!hasEnough) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, idx) => {
          const pal = PALETTE[idx % PALETTE.length]!;
          return (
            <a
              key={`${item.title}-${idx}`}
              href={makeHref(item)}
              className="block rounded-xl border p-4 shadow-sm"
              style={{ borderColor: pal.stroke, backgroundColor: pal.fill }}
            >
              <p className="text-sm font-medium text-slate-600">{item.title}</p>
              <p className="mt-1 text-3xl font-bold leading-tight text-slate-900">{item.count}</p>
            </a>
          );
        })}
      </div>
    );
  }

  const nodes = items;
  const n = nodes.length;

  const thetaOffset = -Math.PI / 2;

  const mobileRectW = n >= 7 ? 88 : n >= 5 ? 94 : 102;
  const mobileRectH = n >= 7 ? 40 : n >= 5 ? 44 : 48;
  const mobileCenterRadius = 34;
  const mobileNodeRadius = Math.sqrt((mobileRectW / 2) ** 2 + (mobileRectH / 2) ** 2);
  const mobileBaseOrbitR = n >= 7 ? 126 : n >= 5 ? 118 : 112;
  const mobileRequiredOrbitR = (n * (mobileRectW + 14)) / (2 * Math.PI);
  const mobileOrbitR = Math.max(mobileBaseOrbitR, mobileRequiredOrbitR);
  const mobileViewW = Math.max(390, Math.ceil((mobileOrbitR + mobileRectW / 2 + 16) * 2));
  const mobileViewH = Math.max(430, Math.ceil((mobileOrbitR + mobileRectH / 2 + 32) * 2));
  const mobileCx = mobileViewW / 2;
  const mobileCy = mobileViewH / 2 + 4;
  const mobileTitleMaxLen = n >= 7 ? 10 : n >= 5 ? 11 : 12;
  const mobilePoints = nodes.map((_, i) => {
    const theta = thetaOffset + (2 * Math.PI * i) / n;
    return { x: mobileCx + mobileOrbitR * Math.cos(theta), y: mobileCy + mobileOrbitR * Math.sin(theta) };
  });
  const mobileCenterLines = centerLabelLines(centerLabel, 12, 2);
  const mobileCenterFont = mobileCenterLines.join(' ').length > 18 ? 10 : 12;
  const mobileCenterLineHeight = mobileCenterFont + 1;
  const mobileCenterTextStartY = mobileCy - ((mobileCenterLines.length - 1) * mobileCenterLineHeight) / 2;

  const desktopRectW = n >= 7 ? 138 : n >= 5 ? 154 : 170;
  const desktopRectH = n >= 7 ? 64 : n >= 5 ? 68 : 74;
  const desktopCenterRadius = 56;
  const desktopNodeRadius = Math.sqrt((desktopRectW / 2) ** 2 + (desktopRectH / 2) ** 2);
  const desktopBaseOrbitR = n >= 7 ? 210 : n >= 5 ? 195 : 185;
  const desktopRequiredOrbitR = (n * (desktopRectW + 22)) / (2 * Math.PI);
  const desktopOrbitR = Math.max(desktopBaseOrbitR, desktopRequiredOrbitR);
  const desktopViewW = Math.max(760, Math.ceil((desktopOrbitR + desktopRectW / 2 + 24) * 2));
  const desktopViewH = Math.max(500, Math.ceil((desktopOrbitR + desktopRectH / 2 + 48) * 2));
  const desktopCx = desktopViewW / 2;
  const desktopCy = desktopViewH / 2;
  const desktopTitleMaxLen = n >= 7 ? 15 : n >= 5 ? 17 : 19;
  const desktopPoints = nodes.map((_, i) => {
    const theta = thetaOffset + (2 * Math.PI * i) / n;
    return { x: desktopCx + desktopOrbitR * Math.cos(theta), y: desktopCy + desktopOrbitR * Math.sin(theta) };
  });
  const desktopCenterLines = centerLabelLines(centerLabel, 16, 2);
  const desktopCenterFont = desktopCenterLines.join(' ').length > 24 ? 14 : 16;
  const desktopCenterLineHeight = desktopCenterFont + 2;
  const desktopCenterTextStartY = desktopCy - ((desktopCenterLines.length - 1) * desktopCenterLineHeight) / 2;

  return (
    <div className="px-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">{centerLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{infoText}</p>
        </div>
      </div>

      <div className="mt-3">
        <svg
          viewBox={`0 0 ${mobileViewW} ${mobileViewH}`}
          width="100%"
          className="h-[400px] sm:hidden"
          role="img"
          aria-label="Cyclic department highlights diagram"
        >
          <circle cx={mobileCx} cy={mobileCy} r={mobileCenterRadius} fill="#ffffff" stroke="#94a3b8" strokeWidth={2.5} />
          <text x={mobileCx} y={mobileCenterTextStartY} textAnchor="middle" fontSize={mobileCenterFont} fontWeight={900} fill="#0f172a">
            {mobileCenterLines.map((line, idx) => (
              <tspan key={`mobile-center-${idx}`} x={mobileCx} dy={idx === 0 ? 0 : mobileCenterLineHeight}>
                {line}
              </tspan>
            ))}
          </text>

          {mobilePoints.map((p, i) => {
            if (n === 2) {
              if (i === 1) return null;
              const a = mobilePoints[0]!;
              const b = mobilePoints[1]!;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
              const dirX = dx / len;
              const dirY = dy / len;
              const gap = mobileCenterRadius + 10;
              const sx = a.x + dirX * mobileNodeRadius;
              const sy = a.y + dirY * mobileNodeRadius;
              const mx1 = mobileCx - dirX * gap;
              const my1 = mobileCy - dirY * gap;
              const mx2 = mobileCx + dirX * gap;
              const my2 = mobileCy + dirY * gap;
              const ex = b.x - dirX * mobileNodeRadius;
              const ey = b.y - dirY * mobileNodeRadius;

              return (
                <g key="mobile-connector-2">
                  <path d={`M ${sx} ${sy} L ${mx1} ${my1}`} stroke="#cbd5e1" strokeWidth={1.7} fill="none" />
                  <path d={`M ${mx2} ${my2} L ${ex} ${ey}`} stroke="#cbd5e1" strokeWidth={1.7} fill="none" />
                </g>
              );
            }
            const next = (i + 1) % n;
            const a = p;
            const b = mobilePoints[next]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
            const dirX = dx / len;
            const dirY = dy / len;
            const sx = a.x + dirX * mobileNodeRadius;
            const sy = a.y + dirY * mobileNodeRadius;
            const ex = b.x - dirX * mobileNodeRadius;
            const ey = b.y - dirY * mobileNodeRadius;

            return <path key={`mobile-connector-${i}`} d={`M ${sx} ${sy} L ${ex} ${ey}`} stroke="#cbd5e1" strokeWidth={1.7} fill="none" />;
          })}

          {mobilePoints.map((p, i) => {
            const item = nodes[i]!;
            const pal = PALETTE[i % PALETTE.length]!;
            const rectX = p.x - mobileRectW / 2;
            const rectY = p.y - mobileRectH / 2;
            const title = truncate(item.title, mobileTitleMaxLen);

            return (
              <g key={`mobile-${item.title}-${i}`} style={{ cursor: 'pointer' }}>
                <a href={makeHref(item)}>
                  <rect
                    x={rectX}
                    y={rectY}
                    width={mobileRectW}
                    height={mobileRectH}
                    rx={9}
                    ry={9}
                    fill={pal.fill}
                    stroke={pal.stroke}
                    strokeWidth={1.6}
                  />
                  <text x={p.x} y={rectY + 16} textAnchor="middle" fontSize={10} fontWeight={800} fill="#334155">
                    {title}
                  </text>
                  <text x={p.x} y={rectY + mobileRectH - 8} textAnchor="middle" fontSize={20} fontWeight={900} fill="#0f172a">
                    {truncate(String(item.count), 4)}
                  </text>
                </a>
              </g>
            );
          })}
        </svg>

        <svg
          viewBox={`0 0 ${desktopViewW} ${desktopViewH}`}
          width="100%"
          className="hidden h-[430px] sm:block md:h-[500px]"
          role="img"
          aria-label="Cyclic department highlights diagram"
        >

          {/* Center circle */}
          <circle cx={desktopCx} cy={desktopCy} r={desktopCenterRadius} fill="#ffffff" stroke="#94a3b8" strokeWidth={3} />
          <text x={desktopCx} y={desktopCenterTextStartY} textAnchor="middle" fontSize={desktopCenterFont} fontWeight={900} fill="#0f172a">
            {desktopCenterLines.map((line, idx) => (
              <tspan key={`desktop-center-${idx}`} x={desktopCx} dy={idx === 0 ? 0 : desktopCenterLineHeight}>
                {line}
              </tspan>
            ))}
          </text>

          {/* Cyclic connectors behind nodes (without arrowheads). */}
          {desktopPoints.map((p, i) => {
            if (n === 2) {
              if (i === 1) return null;
              const a = desktopPoints[0]!;
              const b = desktopPoints[1]!;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
              const dirX = dx / len;
              const dirY = dy / len;
              const gap = desktopCenterRadius + 16;
              const sx = a.x + dirX * desktopNodeRadius;
              const sy = a.y + dirY * desktopNodeRadius;
              const mx1 = desktopCx - dirX * gap;
              const my1 = desktopCy - dirY * gap;
              const mx2 = desktopCx + dirX * gap;
              const my2 = desktopCy + dirY * gap;
              const ex = b.x - dirX * desktopNodeRadius;
              const ey = b.y - dirY * desktopNodeRadius;

              return (
                <g key="desktop-connector-2">
                  <path d={`M ${sx} ${sy} L ${mx1} ${my1}`} stroke="#cbd5e1" strokeWidth={2.25} fill="none" />
                  <path d={`M ${mx2} ${my2} L ${ex} ${ey}`} stroke="#cbd5e1" strokeWidth={2.25} fill="none" />
                </g>
              );
            }
            const next = (i + 1) % n;
            const a = p;
            const b = desktopPoints[next]!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
            const dirX = dx / len;
            const dirY = dy / len;
            const sx = a.x + dirX * desktopNodeRadius;
            const sy = a.y + dirY * desktopNodeRadius;
            const ex = b.x - dirX * desktopNodeRadius;
            const ey = b.y - dirY * desktopNodeRadius;

            return <path key={`connector-${i}`} d={`M ${sx} ${sy} L ${ex} ${ey}`} stroke="#cbd5e1" strokeWidth={2.25} fill="none" />;
          })}

          {/* Nodes */}
          {desktopPoints.map((p, i) => {
            const item = nodes[i]!;
            const pal = PALETTE[i % PALETTE.length]!;
            const rectX = p.x - desktopRectW / 2;
            const rectY = p.y - desktopRectH / 2;

            const title = truncate(item.title, desktopTitleMaxLen);
            return (
              <g key={`${item.title}-${i}`} style={{ cursor: 'pointer' }}>
                <a href={makeHref(item)}>
                  <rect
                    x={rectX}
                    y={rectY}
                    width={desktopRectW}
                    height={desktopRectH}
                    rx={12}
                    ry={12}
                    fill={pal.fill}
                    stroke={pal.stroke}
                    strokeWidth={2}
                  />
                  <text x={p.x} y={rectY + 24} textAnchor="middle" fontSize={13} fontWeight={800} fill="#334155">
                    {title}
                  </text>
                  <text x={p.x} y={rectY + desktopRectH - 12} textAnchor="middle" fontSize={24} fontWeight={900} fill="#0f172a">
                    {truncate(String(item.count), 4)}
                  </text>
                </a>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

