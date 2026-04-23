'use client';

import type { Department } from '../../services/api';
import { departmentsApi } from '../../services/api';
import { DepartmentMapSummaryEditor } from './DepartmentMapSummaryEditor';
import { DepartmentSummaryEditor } from './DepartmentSummaryEditor';

type Props = {
  department: Department;
  onDepartmentUpdated: (department: Department) => void;
};

export function DepartmentSummaryManagementSection({ department, onDepartmentUpdated }: Props) {
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
    </div>
  );
}
