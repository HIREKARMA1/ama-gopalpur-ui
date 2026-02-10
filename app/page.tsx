'use client';

import { useEffect, useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { ConstituencyMap } from '../components/map/ConstituencyMap';
import { DepartmentSidebar, DepartmentItem } from '../components/departments/DepartmentSidebar';
import { OrganizationList } from '../components/organizations/OrganizationList';
import { Loader } from '../components/common/Loader';
import { departmentsApi, organizationsApi, Department, Organization } from '../services/api';

export default function HomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Preload departments from backend; for now we can also have
    // static mapping and later sync with backend codes.
    departmentsApi
      .list()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  const handleSelectDepartment = (deptItem: DepartmentItem) => {
    setSelectedDept(deptItem);
    setSelectedOrgId(undefined);
    setLoading(true);
    // Later we will map sidebar codes to backend IDs.
    const backendDept = departments.find((d) => d.code === deptItem.code);
    if (!backendDept) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    organizationsApi
      .listByDepartment(backendDept.id)
      .then((data) => {
        setOrganizations(data);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Shell
      sidebar={<DepartmentSidebar selectedCode={selectedDept?.code} onSelect={handleSelectDepartment} />}
    >
      <section className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-text">
              AMA Gopalpur Constituency Overview
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              Explore infrastructure and services across departments on a single map.
            </p>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <ConstituencyMap selectedDepartmentName={selectedDept?.label} />
          {loading ? (
            <Loader />
          ) : (
            <OrganizationList
              organizations={organizations}
              selectedId={selectedOrgId}
              onSelect={setSelectedOrgId}
            />
          )}
        </div>
      </section>
    </Shell>
  );
}

