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
  /** Count of organizations per department (updated when we load a department) */
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
      <section className="relative flex h-full flex-col min-h-0">
        {/* Optional: small loading indicator above map */}
        {loading && (
          <div className="absolute left-4 top-2 z-[1] flex items-center gap-2 rounded-md bg-white/95 px-3 py-1.5 text-sm shadow">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            Loading…
          </div>
        )}
        {/* View larger map link - top left on map */}
        {/* <a
          href="https://www.google.com/maps"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-2 top-2 z-[1] rounded bg-white/95 px-3 py-1.5 text-sm font-medium text-gray-700 shadow hover:bg-white"
        >
          View larger map
        </a> */}
        {/* Map fills remaining space */}
        <div className="flex-1 min-h-0 relative">
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
