'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/layout/Shell';
import { ConstituencyMap } from '../components/map/ConstituencyMap';
import { DepartmentSidebar } from '../components/departments/DepartmentSidebar';
import { departmentsApi, organizationsApi, Department, Organization } from '../services/api';

export default function HomePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [countByDepartmentId, setCountByDepartmentId] = useState<Record<number, number>>({});

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
