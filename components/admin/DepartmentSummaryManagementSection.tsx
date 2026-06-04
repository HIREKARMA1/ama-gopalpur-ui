'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Department, Organization } from '../../services/api';
import { departmentsApi } from '../../services/api';
import {
  fetchAllOrganizationsForDepartment,
  resolveEffectiveHighlightCards,
} from '../../lib/departmentSummaryHighlights';
import { DepartmentHighlightsEditor } from './DepartmentHighlightsEditor';
import { DepartmentMapSummaryEditor } from './DepartmentMapSummaryEditor';
import { DepartmentSummaryEditor } from './DepartmentSummaryEditor';
import { DepartmentSummaryMinistersEditor } from './DepartmentSummaryMinistersEditor';
import { RoadsProgressTableEditor } from './RoadsProgressTableEditor';
import { parseRoadsProgressRows } from '../../lib/roadsProgressTable';

type Props = {
  department: Department;
  onDepartmentUpdated: (department: Department) => void;
};

export function DepartmentSummaryManagementSection({ department, onDepartmentUpdated }: Props) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOrgsLoading(true);
      try {
        const all = await fetchAllOrganizationsForDepartment(department.id);
        if (!cancelled) setOrganizations(all);
      } catch {
        if (!cancelled) setOrganizations([]);
      } finally {
        if (!cancelled) setOrgsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [department.id]);

  const displayCards = useMemo(
    () => resolveEffectiveHighlightCards(department.department_summary, organizations, department.code),
    [department.department_summary, department.code, organizations],
  );

  const isRoadsDept = (department.code || '').toUpperCase() === 'ROADS';
  const roadsProgressRows = useMemo(
    () => parseRoadsProgressRows(department.department_summary),
    [department.department_summary],
  );

  return (
    <div className="space-y-4">
      <DepartmentMapSummaryEditor
        key={department.id}
        departmentId={department.id}
        initialSummary={department.map_summary}
        onSaved={(summary) => {
          onDepartmentUpdated({ ...department, map_summary: summary });
        }}
        saveAction={async (id, map_summary) => {
          await departmentsApi.updateMapSummary(id, { map_summary });
        }}
        titleKey="admin.dept.mapSummary.title"
        subtitleKey="admin.dept.mapSummary.subtitle"
        labelKey="admin.dept.mapSummary.label"
        placeholderKey="admin.dept.mapSummary.placeholder"
        charCountKey="admin.dept.mapSummary.charCount"
        saveKey="admin.dept.mapSummary.save"
        savingKey="admin.dept.mapSummary.saving"
        savedKey="admin.dept.mapSummary.saved"
        errorKey="admin.dept.mapSummary.error"
      />
      <DepartmentSummaryMinistersEditor
        departmentId={department.id}
        initialValue={department.department_summary}
        onUploadPhoto={async (file) => {
          const res = await departmentsApi.uploadSummaryMinisterImage(department.id, file);
          return res.url;
        }}
        onSave={async (department_summary) => {
          const updated = await departmentsApi.updateSummary(department.id, { department_summary });
          onDepartmentUpdated(updated);
        }}
      />
      <DepartmentSummaryEditor
        departmentId={department.id}
        initialValue={department.department_summary}
        onUploadAboutImage={async (file) => {
          const res = await departmentsApi.uploadSummaryAboutImage(department.id, file);
          return res.url;
        }}
        onSave={async (department_summary) => {
          const updated = await departmentsApi.updateSummary(department.id, { department_summary });
          onDepartmentUpdated(updated);
        }}
      />
      <DepartmentHighlightsEditor
        departmentId={department.id}
        displayCards={displayCards}
        loading={orgsLoading}
        onSave={async ({ highlight_cards }) => {
          const updated = await departmentsApi.updateSummary(department.id, {
            department_summary: { highlight_cards },
          });
          onDepartmentUpdated(updated);
        }}
      />
      {isRoadsDept ? (
        <RoadsProgressTableEditor
          departmentId={department.id}
          initialRows={roadsProgressRows}
          onSave={async ({ roads_progress_rows }) => {
            const updated = await departmentsApi.updateSummary(department.id, {
              department_summary: { roads_progress_rows },
            });
            onDepartmentUpdated(updated);
          }}
        />
      ) : null}
    </div>
  );
}
