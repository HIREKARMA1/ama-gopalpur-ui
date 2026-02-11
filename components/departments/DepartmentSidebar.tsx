type DepartmentCode =
  | 'NH'
  | 'PWD'
  | 'RD'
  | 'PS_GP_ROAD'
  | 'IRRIGATION'
  | 'MINOR_IRRIGATION'
  | 'DRAINAGE'
  | 'RWSS_WATCO'
  | 'EDUCATION'
  | 'HEALTH'
  | 'AWC_ICDS'
  | 'BEMC_BDO'
  | 'REVENUE'
  | 'ELECTRICITY';

export interface DepartmentItem {
  code: DepartmentCode;
  label: string;
}

const DEPARTMENTS: DepartmentItem[] = [
  { code: 'NH', label: 'NH' },
  { code: 'PWD', label: 'PWD' },
  { code: 'RD', label: 'RD' },
  { code: 'PS_GP_ROAD', label: 'PS/GP – Road' },
  { code: 'IRRIGATION', label: 'Irrigation' },
  { code: 'MINOR_IRRIGATION', label: 'Minor Irrigation' },
  { code: 'DRAINAGE', label: 'Drainage Division' },
  { code: 'RWSS_WATCO', label: 'RWSS / WATCO' },
  { code: 'EDUCATION', label: 'Education' },
  { code: 'HEALTH', label: 'Health' },
  { code: 'AWC_ICDS', label: 'AWC (ICDS)' },
  { code: 'BEMC_BDO', label: 'BEMC / BDOs' },
  { code: 'REVENUE', label: 'Revenue Govt. lands' },
  { code: 'ELECTRICITY', label: 'Electricity (TPSODL)' },
];

interface DepartmentSidebarProps {
  selectedCode?: DepartmentCode;
  onSelect: (dept: DepartmentItem) => void;
}

export function DepartmentSidebar({ selectedCode, onSelect }: DepartmentSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">Departments</h2>
        <p className="mt-1 text-xs text-text-muted">
          Tap a department to see all organizations on the map.
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2 py-3">
          {DEPARTMENTS.map((dept) => {
            const isActive = dept.code === selectedCode;
            return (
              <li key={dept.code}>
                <button
                  type="button"
                  onClick={() => onSelect(dept)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-background-muted text-text'
                    }`}
                >
                  {dept.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

