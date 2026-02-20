'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/layout/Shell';
import { ConstituencyMap } from '../components/map/ConstituencyMap';
import { DepartmentSidebar, getDepartmentIcon } from '../components/departments/DepartmentSidebar';
import { useLanguage } from '../components/i18n/LanguageContext';
import { departmentsApi, organizationsApi, Department, Organization } from '../services/api';

export default function HomePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [countByDepartmentId, setCountByDepartmentId] = useState<Record<number, number>>({});
  const { language } = useLanguage();

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDept(dept);
    setLoading(true);
    organizationsApi
      .listByDepartment(dept.id, { limit: 1000 })
      .then((data) => {
        setOrganizations(data);
        setCountByDepartmentId((prev) => ({ ...prev, [dept.id]: data.length }));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Shell
      sidebar={
        <DepartmentSidebar
          departments={departments}
          selectedId={selectedDept?.id ?? null}
          countByDepartmentId={countByDepartmentId}
          countLabel="Total"
          onSelect={handleSelectDepartment}
        />
      }
      renderMobileBar={({ sidebarOpen, setSidebarOpen }) => {
        if (sidebarOpen) return null;
        return (
        <div className="md:hidden">
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-t-2xl bg-slate-900/95 px-3 py-2 shadow-[0_-4px_12px_rgba(15,23,42,0.85)] backdrop-blur">
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-3">
                {departments
                  .filter((dept) => dept.name !== 'ICDS (Anganwadi)')
                  .map((dept) => {
                    const Icon = getDepartmentIcon(dept.code, dept.name);
                    const isSelected = selectedDept?.id === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(dept)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-medium transition ${
                          isSelected
                            ? 'border-orange-400 bg-orange-500 text-white shadow'
                            : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                        aria-label={dept.name}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 shadow hover:bg-slate-700"
              aria-label={sidebarOpen ? 'Close departments' : 'Open departments'}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}}
    >
      <section className="relative flex h-full min-h-0 flex-col">
        {loading && (
          <div className="absolute left-4 top-4 z-[1] flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Loading…
          </div>
        )}
        <div className="relative flex-1 min-h-0 rounded-tl-lg bg-slate-200 shadow-inner">
          <ConstituencyMap
            selectedDepartmentCode={selectedDept?.code}
            organizations={organizations}
            onSelectOrganization={(id) => router.push(`/organizations/${id}`)}
          />
        </div>
      </section>
    </Shell>
  );
}
