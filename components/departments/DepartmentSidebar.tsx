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
      {/* Google Maps-style: compact header + list */}
      <div className="shrink-0 border-b border-border bg-white px-3 py-3 dark:bg-gray-900">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Departments
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Select to show on map
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {DEPARTMENTS.map((dept) => {
            const isActive = dept.code === selectedCode;
            return (
              <li key={dept.code}>
                <button
                  type="button"
                  onClick={() => onSelect(dept)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition
                    ${isActive
                      ? 'bg-primary/15 text-primary font-medium dark:bg-primary/20'
                      : 'text-text hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <span className="truncate">{dept.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

