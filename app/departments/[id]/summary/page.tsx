'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DepartmentSummaryPage } from '../../../../components/departments/DepartmentSummaryPage';
import { Loader } from '../../../../components/common/Loader';
import { departmentsApi, organizationsApi, type Department, type Organization } from '../../../../services/api';

export default function DepartmentSummaryRoutePage() {
  const params = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [organizationCount, setOrganizationCount] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const deptId = Number(params?.id);
        const dept = await departmentsApi.get(deptId);
        setDepartment(dept);
        const pageSize = 1000;
        let skip = 0;
        let total = 0;
        const all: Organization[] = [];
        while (true) {
          const orgs = await organizationsApi.listByDepartment(deptId, { skip, limit: pageSize });
          all.push(...orgs);
          total += orgs.length;
          if (orgs.length < pageSize) break;
          skip += pageSize;
          if (skip > 100000) break; // hard safety guard
        }
        setOrganizationCount(total);
        setOrganizations(all);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load department summary.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (error || !department) return <div className="p-6 text-sm text-red-600">{error || 'Department not found.'}</div>;
  return <DepartmentSummaryPage department={department} organizationCount={organizationCount} organizations={organizations} />;
}
