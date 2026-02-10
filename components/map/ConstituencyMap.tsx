interface ConstituencyMapProps {
  selectedDepartmentName?: string;
}

export function ConstituencyMap({ selectedDepartmentName }: ConstituencyMapProps) {
  // Placeholder for future real map (Leaflet/Mapbox/etc.)
  return (
    <div className="relative h-[320px] md:h-full bg-background-muted">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
        <div className="text-sm uppercase tracking-[0.2em]">Gopalpur Constituency</div>
        <div className="rounded-xl border border-dashed border-border bg-background/70 px-4 py-3 text-center text-sm max-w-md">
          Map placeholder. Here we will render the actual constituency map with
          department-wise organization markers.
        </div>
        {selectedDepartmentName && (
          <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            Focusing on: {selectedDepartmentName}
          </div>
        )}
      </div>
    </div>
  );
}

