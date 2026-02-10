interface OrganizationListProps {
  organizations: {
    id: number;
    name: string;
    type: string;
  }[];
  selectedId?: number;
  onSelect: (id: number) => void;
}

export function OrganizationList({
  organizations,
  selectedId,
  onSelect,
}: OrganizationListProps) {
  if (!organizations.length) {
    return (
      <div className="px-4 py-3 text-sm text-text-muted">
        Select a department to see organizations.
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background/80">
      <div className="border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-muted">
        Organizations
      </div>
      <ul className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => {
          const isActive = org.id === selectedId;
          return (
            <li key={org.id}>
              <button
                type="button"
                onClick={() => onSelect(org.id)}
                className={`flex w-full flex-col rounded-lg border px-3 py-2 text-left text-xs shadow-sm transition
                  ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/60 hover:bg-background-muted/60'
                  }`}
              >
                <span className="font-semibold text-text">{org.name}</span>
                <span className="mt-0.5 text-[11px] uppercase tracking-wide text-text-muted">
                  {org.type}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

