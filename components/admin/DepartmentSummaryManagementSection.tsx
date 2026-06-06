'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Department, Organization } from '../../services/api';
import { departmentsApi } from '../../services/api';
import {
  fetchAllOrganizationsForDepartment,
  resolveEffectiveHighlightCards,
} from '../../lib/departmentSummaryHighlights';
import { DepartmentHighlightsEditor } from './DepartmentHighlightsEditor';
import { RevenueLandHighlightsEditor } from './RevenueLandHighlightsEditor';
import { DepartmentMapSummaryEditor } from './DepartmentMapSummaryEditor';
import { DepartmentSummaryEditor } from './DepartmentSummaryEditor';
import { DepartmentSummaryMinistersEditor } from './DepartmentSummaryMinistersEditor';
import { ElectricityConsumerStatsTableEditor } from './ElectricityConsumerStatsTableEditor';
import { parseElectricityConsumerStatsRows } from '../../lib/electricityConsumerStatsTable';
import { IrrigationConsumerStatsTableEditor } from './IrrigationConsumerStatsTableEditor';
import { parseIrrigationConsumerStatsRows } from '../../lib/irrigationConsumerStatsTable';
import { MinorIrrigationConsumerStatsTableEditor } from './MinorIrrigationConsumerStatsTableEditor';
import { parseMinorIrrigationConsumerStatsRows } from '../../lib/minorIrrigationConsumerStatsTable';
import { RoadsNetworkTotalsTableEditor } from './RoadsNetworkTotalsTableEditor';
import { RoadsProgressTableEditor } from './RoadsProgressTableEditor';
import { parseRoadsNetworkTotalsRows } from '../../lib/roadsNetworkTotalsTable';
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

  const deptCode = (department.code || '').toUpperCase();
  const isElectricityDept = deptCode === 'ELECTRICITY';
  const isIrrigationDept = deptCode === 'IRRIGATION';
  const isMinorIrrigationDept = deptCode === 'MINOR_IRRIGATION';
  const isRoadsDept = deptCode === 'ROADS';
  const isRevenueLandDept = deptCode === 'REVENUE_LAND';
  const electricityConsumerStatsRows = useMemo(
    () => parseElectricityConsumerStatsRows(department.department_summary),
    [department.department_summary],
  );
  const irrigationConsumerStatsRows = useMemo(
    () => parseIrrigationConsumerStatsRows(department.department_summary),
    [department.department_summary],
  );
  const minorIrrigationConsumerStatsRows = useMemo(
    () => parseMinorIrrigationConsumerStatsRows(department.department_summary),
    [department.department_summary],
  );
  const roadsProgressRows = useMemo(
    () => parseRoadsProgressRows(department.department_summary),
    [department.department_summary],
  );
  const roadsNetworkTotalsRows = useMemo(
    () => parseRoadsNetworkTotalsRows(department.department_summary),
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
      {isRevenueLandDept ? (
        <RevenueLandHighlightsEditor
          departmentName={department.name}
          departmentCode={department.code || ''}
          organizations={organizations}
          loading={orgsLoading}
        />
      ) : (
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
      )}
      {isElectricityDept ? (
        <ElectricityConsumerStatsTableEditor
          departmentId={department.id}
          initialRows={electricityConsumerStatsRows}
          onSave={async ({ electricity_consumer_stats_rows }) => {
            const updated = await departmentsApi.updateSummary(department.id, {
              department_summary: { electricity_consumer_stats_rows },
            });
            onDepartmentUpdated(updated);
          }}
        />
      ) : null}
      {isIrrigationDept ? (
        <IrrigationConsumerStatsTableEditor
          departmentId={department.id}
          initialRows={irrigationConsumerStatsRows}
          onSave={async ({ irrigation_consumer_stats_rows }) => {
            const updated = await departmentsApi.updateSummary(department.id, {
              department_summary: { irrigation_consumer_stats_rows },
            });
            onDepartmentUpdated(updated);
          }}
        />
      ) : null}
      {isMinorIrrigationDept ? (
        <MinorIrrigationConsumerStatsTableEditor
          departmentId={department.id}
          initialRows={minorIrrigationConsumerStatsRows}
          onSave={async ({ minor_irrigation_consumer_stats_rows }) => {
            const updated = await departmentsApi.updateSummary(department.id, {
              department_summary: { minor_irrigation_consumer_stats_rows },
            });
            onDepartmentUpdated(updated);
          }}
        />
      ) : null}
      {isRoadsDept ? (
        <>
          <RoadsNetworkTotalsTableEditor
            departmentId={department.id}
            initialRows={roadsNetworkTotalsRows}
            onSave={async ({ roads_network_totals_rows }) => {
              const updated = await departmentsApi.updateSummary(department.id, {
                department_summary: { roads_network_totals_rows },
              });
              onDepartmentUpdated(updated);
            }}
          />
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
        </>
      ) : null}
    </div>
  );
}
