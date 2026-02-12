'use client';

import { useEffect, useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { ConstituencyMap } from '../components/map/ConstituencyMap';
import { DepartmentSidebar, DepartmentItem } from '../components/departments/DepartmentSidebar';
import { departmentsApi, organizationsApi, Department, Organization } from '../services/api';

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  const handleSelectDepartment = (deptItem: DepartmentItem) => {
    setSelectedDept(deptItem);
    setLoading(true);
    const backendDept = departments.find((d) => d.code === deptItem.code);
    if (!backendDept) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    organizationsApi
      .listByDepartment(backendDept.id)
      .then((data) => setOrganizations(data))
      .finally(() => setLoading(false));
  };

  return (
    <Shell
      sidebar={<DepartmentSidebar selectedCode={selectedDept?.code} onSelect={handleSelectDepartment} />}
    >
      <section className="flex h-full flex-col min-h-0">
        {/* Minimal header: single line, doesn't steal map space */}
        <header className="shrink-0 flex items-center gap-2 border-b border-border bg-white px-3 py-2 dark:bg-gray-900">
          <h1 className="text-sm font-semibold text-text truncate">
            AMA Gopalpur · Rangeilunda
          </h1>
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </header>
        {/* Full-screen map: takes all remaining space */}
        <div className="flex-1 min-h-0 relative">
          <ConstituencyMap
            selectedDepartmentCode={selectedDept?.code}
            organizations={organizations}
          />
        </div>
      </section>
    </Shell>
  );
}

