'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/layout/Navbar';
import {
  organizationsApi,
  departmentsApi,
  profileApi,
  icdsApi,
  educationApi,
  healthApi,
  electricityApi,
  arcsApi,
  watcoApi,
  revenueLandApi,
  minorIrrigationApi,
  irrigationApi,
  Organization,
  Department,
  CenterProfile,
  EducationSchoolMaster,
  EducationInfrastructure,
  EducationGovtRegistry,
  ElectricityMaster,
  HealthDailyAttendance,
  HealthDailyMedicineStock,
  HealthPatientService,
  HealthDailyExtraData,
} from '../../../services/api';
import { EDUCATION_TYPE_LABELS } from '../../../lib/mapConfig';
import { Loader } from '../../../components/common/Loader';
import { AwcPortfolioDashboard } from '../../../components/organization/AwcPortfolioDashboard';
import { EducationPortfolioDashboard } from '../../../components/organization/EducationPortfolioDashboard';
import { EducationPsPortfolioWebsite } from '../../../components/organization/EducationPsPortfolioWebsite';
import { HealthPortfolioDashboard } from '../../../components/organization/HealthPortfolioDashboard';
import { ElectricityPortfolioDashboard } from '../../../components/organization/ElectricityPortfolioDashboard';
import { ArcsPortfolioWebsite } from '../../../components/organization/ArcsPortfolioWebsite';
import { WaterPortfolioDashboard } from '../../../components/organization/WaterPortfolioDashboard';
import { RevenueLandPortfolioDashboard } from '../../../components/organization/RevenueLandPortfolioDashboard';
import { AgriculturePortfolioDashboard } from '../../../components/organization/AgriculturePortfolioDashboard';
import { MinorIrrigationPortfolioWebsite } from '../../../components/organization/MinorIrrigationPortfolioWebsite';
import { IrrigationPortfolioDashboard } from '../../../components/organization/IrrigationPortfolioDashboard';
import type { RevenueGovtLandRow } from '../../../lib/revenueGovtLandTable';

const HEALTH_TYPE_LABELS: Record<string, string> = {
  HOSPITAL: 'Hospital',
  HEALTH_CENTRE: 'Health Centre',
  OTHER: 'Other',
};

function formatValue(value: string | number | null | undefined): string {
  if (value == null || String(value).trim() === '') return 'NA';
  return String(value);
}

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-2 border-b border-border/50 py-1.5 text-xs last:border-0">
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-text text-right">{formatValue(value)}</span>
    </div>
  );
}

/** Portfolio-style two-column table: Attribute | Value. Use for org profile data. */
function ProfileTable({
  rows,
  className = '',
}: {
  rows: { attribute: string; value: string | number | null | undefined }[];
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border ${className}`}>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-2.5 text-left font-semibold text-text w-[40%] max-w-[200px]">Attribute</th>
            <th className="px-4 py-2.5 text-left font-semibold text-text">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ attribute, value }, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2 text-text-muted align-top">{attribute}</td>
              <td className="px-4 py-2 text-text align-top">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-text border-b border-border pb-2 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function BoolBadge({ value }: { value?: boolean | null }) {
  if (value == null) return <span className="text-text-muted">—</span>;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

/** ICDS/AWC portfolio attributes in display order. Label and key path (profile key or 'org.name' etc.). */
const AWC_PORTFOLIO_ROWS: { attribute: string; key: string }[] = [
  { attribute: 'Block / ULB', key: 'block_name' },
  { attribute: 'GP / Ward', key: 'gram_panchayat' },
  { attribute: 'Village', key: 'village_ward' },
  { attribute: 'Name of AWC', key: 'org.name' },
  { attribute: 'AWC ID', key: 'center_code' },
  { attribute: 'Building status', key: 'building_type' },
  { attribute: 'Latitude', key: 'org.latitude' },
  { attribute: 'Longitude', key: 'org.longitude' },
  { attribute: 'Student strength', key: 'student_strength' },
  { attribute: 'CPDO name', key: 'cpdo_name' },
  { attribute: 'CPDO contact no', key: 'cpdo_contact_no' },
  { attribute: 'Supervisor name', key: 'supervisor_name' },
  { attribute: 'Supervisor contact', key: 'supervisor_contact_name' },
  { attribute: 'AWW name', key: 'worker_name' },
  { attribute: 'AWW contact no', key: 'aww_contact_no' },
  { attribute: 'AWH name', key: 'helper_name' },
  { attribute: 'AWH contact no', key: 'awh_contact_no' },
  { attribute: 'Description', key: 'description' },
  { attribute: 'Centre type', key: 'center_type' },
  { attribute: 'Establishment year', key: 'establishment_year' },
  { attribute: 'Scheme', key: 'scheme' },
  { attribute: 'Sector', key: 'sector' },
  { attribute: 'District', key: 'district' },
  { attribute: 'Full address', key: 'full_address' },
  { attribute: 'Contact', key: 'contact_number' },
  { attribute: 'Children 0–3', key: 'total_children_0_3' },
  { attribute: 'Children 3–6', key: 'total_children_3_6' },
  { attribute: 'Pregnant women', key: 'pregnant_women' },
  { attribute: 'Lactating mothers', key: 'lactating_mothers' },
  { attribute: 'Total active beneficiaries', key: 'total_active_beneficiaries' },
];

export default function OrganizationProfilePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [org, setOrg] = useState<Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [awcProfile, setAwcProfile] = useState<CenterProfile | null>(null);
  const [educationProfile, setEducationProfile] = useState<Record<string, unknown>>({});
  const [healthProfile, setHealthProfile] = useState<Record<string, unknown>>({});
  const [healthDailyAttendance, setHealthDailyAttendance] = useState<HealthDailyAttendance[]>([]);
  const [healthDailyMedicineStock, setHealthDailyMedicineStock] = useState<HealthDailyMedicineStock[]>([]);
  const [healthPatientServices, setHealthPatientServices] = useState<HealthPatientService[]>([]);
  const [healthDailyExtra, setHealthDailyExtra] = useState<HealthDailyExtraData[]>([]);
  const [electricityProfile, setElectricityProfile] = useState<Record<string, unknown>>({});
  const [arcsProfile, setArcsProfile] = useState<Record<string, unknown>>({});
  const [electricityMaster, setElectricityMaster] = useState<ElectricityMaster | null>(null);
  const [electricityStaff, setElectricityStaff] = useState<Awaited<ReturnType<typeof electricityApi.listStaff>>>([]);
  const [electricityDaily, setElectricityDaily] = useState<Awaited<ReturnType<typeof electricityApi.listDaily>>>([]);
  const [electricityMonthly, setElectricityMonthly] = useState<Awaited<ReturnType<typeof electricityApi.listMonthly>>>([]);
  const [waterProfile, setWaterProfile] = useState<Record<string, unknown>>({});
  const [waterDailyOperations, setWaterDailyOperations] = useState<Awaited<ReturnType<typeof watcoApi.listDailyOperations>>>([]);
  const [waterDailyPumpLogs, setWaterDailyPumpLogs] = useState<Awaited<ReturnType<typeof watcoApi.listDailyPumpLogs>>>([]);
  const [waterDailyTankLevels, setWaterDailyTankLevels] = useState<Awaited<ReturnType<typeof watcoApi.listDailyTankLevels>>>([]);
  const [revenueProfile, setRevenueProfile] = useState<Record<string, unknown>>({});
  const [revenueTahasilParcels, setRevenueTahasilParcels] = useState<RevenueGovtLandRow[]>([]);
  const [agricultureProfile, setAgricultureProfile] = useState<Record<string, unknown>>({});
  const [agricultureDailyMetrics, setAgricultureDailyMetrics] = useState<import('../../../services/api').AgricultureDailyMetric[]>([]);
  const [agricultureMonthlyReports, setAgricultureMonthlyReports] = useState<import('../../../services/api').AgricultureMonthlyReport[]>([]);
  const [minorIrrigationProfile, setMinorIrrigationProfile] = useState<Record<string, unknown>>({});
  const [irrigationProfile, setIrrigationProfile] = useState<Record<string, unknown>>({});
  const [snpDailyStock, setSnpDailyStock] = useState<Awaited<ReturnType<typeof icdsApi.listSnpDailyStock>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('Invalid organization ID');
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      setHealthDailyAttendance([]);
      setHealthDailyMedicineStock([]);
      setHealthPatientServices([]);
      setHealthDailyExtra([]);
      try {
        const [orgRes, deptsRes] = await Promise.all([
          organizationsApi.get(id),
          departmentsApi.list(),
        ]);
        setOrg(orgRes);
        setDepartments(deptsRes);
        const dept = deptsRes.find((d) => d.id === orgRes.department_id);
        const code = dept?.code ?? null;
        setDeptCode(code ?? null);
        setRevenueTahasilParcels([]);

        if (code === 'EDUCATION') {
          const profile = await educationApi.getProfile(id);
          setEducationProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
        } else if (code === 'HEALTH') {
          const [profile, attendance, medicinePrimary, patients, extra] = await Promise.all([
            healthApi.getProfile(id),
            healthApi.listDailyAttendance(id, { limit: 400 }).catch(() => []),
            healthApi.listDailyMedicineStock(id, { limit: 500 }).catch(() => []),
            healthApi.listPatientServices(id, { limit: 400 }).catch(() => []),
            healthApi.listDailyExtraData(id, { limit: 200 }).catch(() => []),
          ]);
          const medicine =
            Array.isArray(medicinePrimary) && medicinePrimary.length > 0
              ? medicinePrimary
              : await healthApi
                  .listDailyMedicineStockForDept({ organization_id: id, limit: 500 })
                  .catch(() => []);
          setHealthProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
          setHealthDailyAttendance(attendance);
          setHealthDailyMedicineStock(medicine);
          setHealthPatientServices(patients);
          setHealthDailyExtra(extra);
        } else if (code === 'ARCS') {
          const prof = await arcsApi.getProfile(id);
          setArcsProfile(prof && typeof prof === 'object' ? (prof as Record<string, unknown>) : {});
        } else if (code === 'ELECTRICITY') {
          const [master, prof, staff, daily, monthly] = await Promise.all([
            electricityApi.getMaster(id),
            electricityApi.getProfile(id),
            electricityApi.listStaff(id),
            electricityApi.listDaily(id),
            electricityApi.listMonthly(id),
          ]);
          setElectricityMaster(master);
          setElectricityProfile(prof || {});
          setElectricityStaff(staff || []);
          setElectricityDaily(daily || []);
          setElectricityMonthly(monthly || []);
        } else if (code === 'WATCO_RWSS') {
          const [profile, ops, pumps, tanks] = await Promise.all([
            watcoApi.getProfile(id),
            watcoApi.listDailyOperations(id),
            watcoApi.listDailyPumpLogs(id),
            watcoApi.listDailyTankLevels(id),
          ]);
          setWaterProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
          setWaterDailyOperations(ops || []);
          setWaterDailyPumpLogs(pumps || []);
          setWaterDailyTankLevels(tanks || []);
        } else if (code === 'REVENUE_LAND') {
          const profile = await revenueLandApi.getProfile(id);
          setRevenueProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
          if ((orgRes.sub_department || '') === 'TAHASIL_OFFICE') {
            const parcelOrgs = await revenueLandApi.listParcelsForTahasilOffice(id);
            const parcelProfiles = await Promise.all(
              parcelOrgs.map((o) => revenueLandApi.getProfile(o.id).catch(() => ({}))),
            );
            setRevenueTahasilParcels(
              parcelOrgs.map((po, idx) => ({
                org: po,
                profile: (parcelProfiles[idx] && typeof parcelProfiles[idx] === 'object'
                  ? parcelProfiles[idx]
                  : {}) as Record<string, unknown>,
              })),
            );
          }
        } else if (code === 'AGRICULTURE') {
          const { agricultureApi } = await import('../../../services/api');
          const [profile, dailyMetrics, monthlyReports] = await Promise.all([
            agricultureApi.getProfile(id),
            agricultureApi.listDailyMetrics(id, { limit: 100 }),
            agricultureApi.listMonthlyReports(id, { limit: 100 }),
          ]);
          setAgricultureProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
          setAgricultureDailyMetrics(Array.isArray(dailyMetrics) ? dailyMetrics : []);
          setAgricultureMonthlyReports(Array.isArray(monthlyReports) ? monthlyReports : []);
        } else if (code === 'MINOR_IRRIGATION') {
          const profile = await minorIrrigationApi.getProfile(id);
          setMinorIrrigationProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
        } else if (code === 'IRRIGATION') {
          const profile = await irrigationApi.getProfile(id);
          setIrrigationProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
        } else {
          // AWC / ICDS or other: try center profile and SNP daily stock
          try {
            const [profile, snp] = await Promise.all([
              profileApi.getCenterProfile(id),
              icdsApi.listSnpDailyStock(id),
            ]);
            setAwcProfile(profile ?? null);
            setSnpDailyStock(Array.isArray(snp) ? snp : []);
          } catch {
            setAwcProfile(null);
            setSnpDailyStock([]);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-4">
          <Loader size="lg" />
        </main>
      </div>
    );
  }
  if (error || !org) {
    return (
      <div className="page-container p-6">
        <Navbar />
        <p className="text-red-600">{error || 'Organization not found'}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">Back to map</Link>
      </div>
    );
  }

  const typeLabel = deptCode === 'EDUCATION'
    ? (EDUCATION_TYPE_LABELS[org.type] ?? org.type.replace(/_/g, ' '))
    : deptCode === 'HEALTH'
      ? (HEALTH_TYPE_LABELS[org.type] ?? org.type.replace(/_/g, ' '))
      : org.type === 'AWC' ? 'Anganwadi Centre (AWC)' : org.type.replace(/_/g, ' ');

  // ICDS/AWC: professional portfolio dashboard with image slider
  const isAwc = deptCode === 'ICDS' || deptCode === 'AWC_ICDS' || org.type === 'AWC';
  if (deptCode === 'EDUCATION') {
    const galleryImages = Array.isArray((educationProfile as any)?.gallery_images)
      ? ((educationProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    if (['PS', 'UPS', 'HS'].includes((org.sub_department || '').toUpperCase())) {
      const lang = String((educationProfile as Record<string, unknown>)?.language || 'en').toLowerCase() === 'od' ? 'od' : 'en';
      return (
        <div className="page-container">
          <Navbar />
          <EducationPsPortfolioWebsite
            org={org}
            profile={educationProfile}
            images={images}
            language={lang}
          />
        </div>
      );
    }
    return (
      <div className="page-container">
        <Navbar />
        <EducationPortfolioDashboard
          org={org}
          educationProfile={educationProfile}
          images={images}
        />
      </div>
    );
  }

  if (deptCode === 'HEALTH') {
    return (
      <div className="page-container">
        <Navbar />
        <HealthPortfolioDashboard
          org={org}
          healthProfile={healthProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          dailyAttendance={healthDailyAttendance}
          dailyMedicineStock={healthDailyMedicineStock}
          patientServices={healthPatientServices}
          dailyExtraData={healthDailyExtra}
        />
      </div>
    );
  }

  if (deptCode === 'REVENUE_LAND') {
    const galleryImages = Array.isArray((revenueProfile as any)?.gallery_images)
      ? ((revenueProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <RevenueLandPortfolioDashboard
          org={org}
          profile={revenueProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
          isTahasilOffice={org.sub_department === 'TAHASIL_OFFICE'}
          parcelRows={revenueTahasilParcels}
        />
      </div>
    );
  }

  if (deptCode === 'AGRICULTURE') {
    const galleryImages = Array.isArray((agricultureProfile as any)?.gallery_images)
      ? ((agricultureProfile as any).gallery_images as string[])
      : [];
    const images =
      galleryImages.length > 0
        ? galleryImages
        : org.cover_image_key
          ? [org.cover_image_key]
          : [];
    return (
      <div className="page-container">
        <Navbar />
        <AgriculturePortfolioDashboard
          org={org}
          profile={agricultureProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
          dailyMetrics={agricultureDailyMetrics}
          monthlyReports={agricultureMonthlyReports}
        />
      </div>
    );
  }

  if (deptCode === 'WATCO_RWSS') {
    const galleryImages = Array.isArray((waterProfile as any)?.gallery_images)
      ? ((waterProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <WaterPortfolioDashboard
          org={org}
          waterProfile={waterProfile}
          images={images}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          dailyOperations={waterDailyOperations}
          dailyPumpLogs={waterDailyPumpLogs}
          dailyTankLevels={waterDailyTankLevels}
        />
      </div>
    );
  }

  if (isAwc) {
    const galleryImages = Array.isArray((awcProfile as Record<string, unknown>)?.gallery_images)
      ? ((awcProfile as Record<string, unknown>).gallery_images as string[]).filter((u): u is string => typeof u === 'string')
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <AwcPortfolioDashboard
          org={org}
          awcProfile={awcProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
          snpDailyStock={snpDailyStock}
        />
      </div>
    );
  }

  if (deptCode === 'ARCS') {
    const galleryImages = Array.isArray((arcsProfile as Record<string, unknown>)?.gallery_images)
      ? ((arcsProfile as Record<string, unknown>).gallery_images as string[]).filter(
        (u): u is string => typeof u === 'string',
      )
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <ArcsPortfolioWebsite
          org={org}
          profile={arcsProfile}
          images={images}
        />
      </div>
    );
  }

  if (deptCode === 'ELECTRICITY') {
    const galleryImages = Array.isArray((electricityProfile as any)?.gallery_images)
      ? ((electricityProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <ElectricityPortfolioDashboard
          org={org}
          electricityMaster={electricityMaster}
          electricityProfile={electricityProfile}
          staff={electricityStaff}
          dailyReports={electricityDaily}
          monthlyReports={electricityMonthly}
          images={images}
        />
      </div>
    );
  }

  if (deptCode === 'IRRIGATION') {
    const galleryImages = Array.isArray((irrigationProfile as any)?.gallery_images)
      ? ((irrigationProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <IrrigationPortfolioDashboard
          org={org}
          profile={irrigationProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
        />
      </div>
    );
  }

  if (deptCode === 'MINOR_IRRIGATION') {
    const galleryImages = Array.isArray((minorIrrigationProfile as any)?.gallery_images)
      ? ((minorIrrigationProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <MinorIrrigationPortfolioWebsite
          org={org}
          profile={minorIrrigationProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded border border-border px-2 py-1 text-xs text-text hover:bg-background-muted"
          >
            ← Back to map
          </Link>
          <span className="text-text-muted">|</span>
          <h1 className="text-lg font-semibold text-text">{org.name}</h1>
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {typeLabel}
          {departments.find((d) => d.id === org.department_id)?.name && (
            <> · {departments.find((d) => d.id === org.department_id)!.name}</>
          )}
        </p>
        {(org.address || (org.latitude != null && org.longitude != null)) && (
          <p className="mt-1 text-xs text-text-muted">
            {org.address}
            {org.latitude != null && org.longitude != null && (
              <> · {org.latitude.toFixed(5)}, {org.longitude.toFixed(5)}</>
            )}
          </p>
        )}
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-[1920px] mx-auto">
        {deptCode !== 'EDUCATION' && deptCode !== 'HEALTH' && deptCode !== 'ICDS' && deptCode !== 'AWC_ICDS' && org.type !== 'AWC' && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-text">Organization portfolio</h2>
            <p className="text-sm text-text-muted">No department-specific profile template for this organization type.</p>
          </section>
        )}
      </main>
    </div>
  );
}
