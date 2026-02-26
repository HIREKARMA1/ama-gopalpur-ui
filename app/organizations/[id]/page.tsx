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
  Organization,
  Department,
  CenterProfile,
  EducationSchoolMaster,
  EducationInfrastructure,
  EducationGovtRegistry,
  HealthFacilityMaster,
  HealthInfrastructure as HealthInfra,
} from '../../../services/api';
import { EDUCATION_TYPE_LABELS } from '../../../lib/mapConfig';
import {
  getEducationProfileLabel,
  getHealthProfileLabel,
  EDUCATION_PROFILE_KEYS,
  HEALTH_PROFILE_KEYS,
} from '../../../lib/profileLabels';
import { Loader } from '../../../components/common/Loader';
import { AwcPortfolioDashboard } from '../../../components/organization/AwcPortfolioDashboard';
import { EducationPortfolioDashboard } from '../../../components/organization/EducationPortfolioDashboard';
import { HealthPortfolioDashboard } from '../../../components/organization/HealthPortfolioDashboard';

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
  const [eduSchoolMaster, setEduSchoolMaster] = useState<EducationSchoolMaster | null>(null);
  const [eduInfra, setEduInfra] = useState<EducationInfrastructure | null>(null);
  const [eduGovt, setEduGovt] = useState<EducationGovtRegistry | null>(null);
  const [eduTeachers, setEduTeachers] = useState<Awaited<ReturnType<typeof educationApi.listTeachers>>>([]);
  const [eduScholarships, setEduScholarships] = useState<Awaited<ReturnType<typeof educationApi.listScholarships>>>([]);
  const [eduMiddayMeals, setEduMiddayMeals] = useState<Awaited<ReturnType<typeof educationApi.listMiddayMeals>>>([]);
  const [eduDigital, setEduDigital] = useState<Awaited<ReturnType<typeof educationApi.listDigitalLearning>>>([]);
  const [eduProjects, setEduProjects] = useState<Awaited<ReturnType<typeof educationApi.listDevelopmentProjects>>>([]);
  const [eduMonthly, setEduMonthly] = useState<Awaited<ReturnType<typeof educationApi.listMonthlyProgress>>>([]);
  const [eduBeneficiary, setEduBeneficiary] = useState<Awaited<ReturnType<typeof educationApi.listBeneficiaryAnalytics>>>([]);
  const [healthMaster, setHealthMaster] = useState<HealthFacilityMaster | null>(null);
  const [healthInfra, setHealthInfra] = useState<HealthInfra | null>(null);
  const [healthStaff, setHealthStaff] = useState<Awaited<ReturnType<typeof healthApi.listStaff>>>([]);
  const [healthEquipment, setHealthEquipment] = useState<Awaited<ReturnType<typeof healthApi.listEquipment>>>([]);
  const [healthPatient, setHealthPatient] = useState<Awaited<ReturnType<typeof healthApi.listPatientServices>>>([]);
  const [healthImmunisation, setHealthImmunisation] = useState<Awaited<ReturnType<typeof healthApi.listImmunisation>>>([]);
  const [healthMedicines, setHealthMedicines] = useState<Awaited<ReturnType<typeof healthApi.listMedicinesStock>>>([]);
  const [healthSchemes, setHealthSchemes] = useState<Awaited<ReturnType<typeof healthApi.listSchemes>>>([]);
  const [healthMonthly, setHealthMonthly] = useState<Awaited<ReturnType<typeof healthApi.listMonthlyReport>>>([]);
  const [educationProfile, setEducationProfile] = useState<Record<string, unknown>>({});
  const [healthProfile, setHealthProfile] = useState<Record<string, unknown>>({});
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

        if (code === 'EDUCATION') {
          const [master, infra, govt, teachers, scholarships, midday, digital, projects, monthly, beneficiary, profile] = await Promise.all([
            educationApi.getSchoolMaster(id),
            educationApi.getInfrastructure(id),
            educationApi.getGovtRegistry(id),
            educationApi.listTeachers(id),
            educationApi.listScholarships(id),
            educationApi.listMiddayMeals(id),
            educationApi.listDigitalLearning(id),
            educationApi.listDevelopmentProjects(id),
            educationApi.listMonthlyProgress(id),
            educationApi.listBeneficiaryAnalytics(id),
            educationApi.getProfile(id),
          ]);
          setEduSchoolMaster(master ?? null);
          setEduInfra(infra ?? null);
          setEduGovt(govt ?? null);
          setEduTeachers(teachers ?? []);
          setEduScholarships(scholarships ?? []);
          setEduMiddayMeals(midday ?? []);
          setEduDigital(digital ?? []);
          setEduProjects(projects ?? []);
          setEduMonthly(monthly ?? []);
          setEduBeneficiary(beneficiary ?? []);
          setEducationProfile(
            profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {},
          );
        } else if (code === 'HEALTH') {
          const [master, infra, staff, equipment, patient, immunisation, medicines, schemes, monthly, profile] = await Promise.all([
            healthApi.getFacilityMaster(id),
            healthApi.getInfrastructure(id),
            healthApi.listStaff(id),
            healthApi.listEquipment(id),
            healthApi.listPatientServices(id),
            healthApi.listImmunisation(id),
            healthApi.listMedicinesStock(id),
            healthApi.listSchemes(id),
            healthApi.listMonthlyReport(id),
            healthApi.getProfile(id),
          ]);
          setHealthMaster(master ?? null);
          setHealthInfra(infra ?? null);
          setHealthStaff(staff ?? []);
          setHealthEquipment(equipment ?? []);
          setHealthPatient(patient ?? []);
          setHealthImmunisation(immunisation ?? []);
          setHealthMedicines(medicines ?? []);
          setHealthSchemes(schemes ?? []);
          setHealthMonthly(monthly ?? []);
          setHealthProfile(
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
    return (
      <div className="page-container">
        <Navbar />
        <EducationPortfolioDashboard
          org={org}
          schoolMaster={eduSchoolMaster}
          infra={eduInfra}
          educationProfile={educationProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
        />
      </div>
    );
  }

  if (deptCode === 'HEALTH') {
    const galleryImages = Array.isArray((healthProfile as any)?.gallery_images)
      ? ((healthProfile as any).gallery_images as string[])
      : [];
    const images = galleryImages.length > 0 ? galleryImages : org.cover_image_key ? [org.cover_image_key] : [];
    return (
      <div className="page-container">
        <Navbar />
        <HealthPortfolioDashboard
          org={org}
          facilityMaster={healthMaster}
          infra={healthInfra}
          healthProfile={healthProfile}
          staff={healthStaff}
          equipment={healthEquipment}
          patientServices={healthPatient}
          immunisation={healthImmunisation}
          medicines={healthMedicines}
          schemes={healthSchemes}
          monthly={healthMonthly}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={images}
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
