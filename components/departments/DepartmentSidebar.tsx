'use client';

import type { MessageKey } from '../i18n/messages';
import { Department } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const DEPT_MESSAGE_KEYS: Record<string, MessageKey> = {
  EDUCATION: 'dept.education',
  HEALTH: 'dept.health',
  ICDS: 'dept.icds',
  AWC_ICDS: 'dept.icds',
  ROADS: 'dept.roads',
};

function getDepartmentLabel(dept: Department, language: 'en' | 'or'): string {
  const key = DEPT_MESSAGE_KEYS[dept.code?.toUpperCase() ?? ''];
  return key ? t(key, language) : dept.name;
}

/** Icon component: medical cross */
function IconHealthcare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
    </svg>
  );
}

/** Icon: graduation cap */
function IconEducation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    </svg>
  );
}

/** Icon: water drop */
function IconWater({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />
    </svg>
  );
}

/** Icon: road / transport */
function IconRoads({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 4H6v2h12V4zm-2 14h-4v-6H6l6-6 6 6h-6v6z" />
    </svg>
  );
}

/** Icon: lightning / electricity */
function IconElectricity({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </svg>
  );
}

/** Icon: sanitation */
function IconSanitation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 8.5C9 7.67 9.67 7 10.5 7s1.5.67 1.5 1.5S11.33 10 10.5 10 9 9.33 9 8.5zm6 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L7 13h2v4h2v-4h2v-2H9.69C10.37 9.55 11 8.85 11 8.5 11 7.67 10.33 7 9.5 7H6.08C7.12 4.28 9.38 2 12 2c4.41 0 8 3.59 8 8s-3.59 8-8 8z" />
    </svg>
  );
}

/** Default icon: building / generic */
function IconDefault({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </svg>
  );
}

export function getDepartmentIcon(code: string, name: string) {
  const c = code.toLowerCase();
  const n = name.toLowerCase();
  if (c.includes('health') || n.includes('health')) return IconHealthcare;
  if (c.includes('education') || n.includes('education')) return IconEducation;
  if (c.includes('water') || n.includes('water') || c.includes('rwss') || c.includes('watco')) return IconWater;
  if (c.includes('road') || c.includes('pwd') || c.includes('transport')) return IconRoads;
  if (c.includes('electric') || n.includes('electric')) return IconElectricity;
  if (c.includes('sanitation') || c.includes('drainage') || c.includes('icds') || c.includes('awc')) return IconSanitation;
  return IconDefault;
}

interface DepartmentSidebarProps {
  departments: Department[];
  selectedId: number | null;
  /** Optional count per department id (e.g. after loading orgs) */
  countByDepartmentId?: Record<number, number>;
  /** Subtitle suffix e.g. "Facilities Total", "Schools", "Assets" - can be per-dept later */
  countLabel?: string;
  onSelect: (dept: Department) => void;
}

export function DepartmentSidebar({
  departments,
  selectedId,
  countByDepartmentId = {},
  countLabel = 'Total',
  onSelect,
}: DepartmentSidebarProps) {
  const { language } = useLanguage();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800/70 px-4 py-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          {t('sidebar.title', language)}
        </h2>
        <p className="mt-1.5 text-[13px] text-slate-300">
          {t('sidebar.subtitle', language)}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {departments.length === 0 ? (
          <p className="text-sm text-slate-300">{t('sidebar.loading', language)}</p>
        ) : (
          <ul className="space-y-3">
            {departments.map((dept) => {
                const isSelected = dept.id === selectedId;
                const count = countByDepartmentId[dept.id];
                const Icon = getDepartmentIcon(dept.code, dept.name);

                return (
                  <li key={dept.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(dept)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left shadow-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800/80 text-slate-100 hover:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-white/15' : 'bg-slate-700'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-100'}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                          {getDepartmentLabel(dept, language)}
                        </p>
                        {count != null && (
                          <p className={`mt-0.5 text-xs ${isSelected ? 'text-orange-50' : 'text-slate-400'}`}>
                            {count} {language === 'or' ? t('sidebar.total', language) : countLabel}
                          </p>
                        )}
                      </div>
                      {count != null && (
                        <span
                          className={`ml-1 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-700'
                            }`}
                        >
                          {count}
                        </span>
                      )}
                      <span className={isSelected ? 'text-orange-50' : 'text-slate-400'}>
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </nav>
    </div>
  );
}
