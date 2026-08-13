'use client';

type Props = {
  beforeImages: string[];
  afterImages: string[];
  /** When sidebar is open, shift control right so it is not covered. Ignored if `stackedOnly`. */
  sidebarOpen?: boolean;
  /** Render chips only (parent handles absolute positioning). */
  stackedOnly?: boolean;
  onOpenBefore: () => void;
  onOpenAfter: () => void;
};

export function RoadBeforeAfterLayersControl({
  beforeImages,
  afterImages,
  sidebarOpen = false,
  stackedOnly = false,
  onOpenBefore,
  onOpenAfter,
}: Props) {
  const hasBefore = beforeImages.length > 0;
  const hasAfter = afterImages.length > 0;
  if (!hasBefore && !hasAfter) return null;

  const chips = (
    <>
      {hasBefore ? (
        <button
          type="button"
          onClick={onOpenBefore}
          className="flex w-[88px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg hover:ring-2 hover:ring-orange-400/60"
          title="Before photos"
          aria-label="Show before photos"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeImages[0]}
            alt=""
            className="h-14 w-full object-cover"
          />
          <span className="px-1.5 py-1 text-center text-[11px] font-semibold text-slate-800">
            Before
            {beforeImages.length > 1 ? ` · ${beforeImages.length}` : ''}
          </span>
        </button>
      ) : null}
      {hasAfter ? (
        <button
          type="button"
          onClick={onOpenAfter}
          className="flex w-[88px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg hover:ring-2 hover:ring-orange-400/60"
          title="After photos"
          aria-label="Show after photos"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterImages[0]}
            alt=""
            className="h-14 w-full object-cover"
          />
          <span className="px-1.5 py-1 text-center text-[11px] font-semibold text-slate-800">
            After
            {afterImages.length > 1 ? ` · ${afterImages.length}` : ''}
          </span>
        </button>
      ) : null}
    </>
  );

  if (stackedOnly) {
    return <div className="flex flex-col gap-2">{chips}</div>;
  }

  return (
    <div
      className={`pointer-events-auto absolute bottom-4 z-[66] flex flex-col gap-2 ${
        sidebarOpen
          ? 'right-3 left-auto sm:left-[calc(min(400px,calc(100%-1.5rem))+1.25rem)] sm:right-auto'
          : 'left-3'
      }`}
    >
      {chips}
    </div>
  );
}
