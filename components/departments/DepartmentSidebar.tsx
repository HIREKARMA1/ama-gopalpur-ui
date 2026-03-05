'use client';

import type { IconType } from 'react-icons';
import { FaGraduationCap, FaHospital, FaTint, FaRoad, FaBolt, FaChild, FaBuilding } from 'react-icons/fa';
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
  ELECTRICITY: 'dept.electricity',
  DRAINAGE: 'dept.drainage',
  WATCO_RWSS: 'dept.water',
};

function getDepartmentLabel(dept: Department, language: 'en' | 'or'): string {
  const key = DEPT_MESSAGE_KEYS[dept.code?.toUpperCase() ?? ''];
  return key ? t(key, language) : dept.name;
}

/** Map department code/name to a React Icon component */
function getBaseDepartmentIcon(code: string, name: string): IconType {
  const c = code.toLowerCase();
  const n = name.toLowerCase();
  if (c.includes('health') || n.includes('health')) return FaHospital;
  if (c.includes('education') || n.includes('education')) return FaGraduationCap;
  if (c.includes('water') || n.includes('rwss') || c.includes('watco') || n.includes('water')) return FaTint;
  if (c.includes('road') || c.includes('pwd') || c.includes('transport')) return FaRoad;
  if (c.includes('electric') || n.includes('electric')) return FaBolt;
  if (c.includes('sanitation') || c.includes('drainage') || c.includes('icds') || c.includes('awc')) return FaChild;
  return FaBuilding;
}

export function getDepartmentIcon(code: string, name: string) {
  return getBaseDepartmentIcon(code, name);
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
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left shadow-sm transition-all duration-200 ${isSelected
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-slate-800/80 text-slate-100 hover:bg-slate-800'
                      }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-white/15' : 'bg-slate-700'
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
