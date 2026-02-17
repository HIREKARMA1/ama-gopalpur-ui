'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../../components/layout/Navbar';
import {
  organizationsApi,
  departmentsApi,
  profileApi,
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
          setEducationProfile(profile && typeof profile === 'object' ? profile : {});
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
          setHealthProfile(profile && typeof profile === 'object' ? profile : {});
        } else {
          // AWC / ICDS or other: try center profile
          try {
            const profile = await profileApi.getCenterProfile(id);
            setAwcProfile(profile);
          } catch {
            setAwcProfile(null);
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
  if (isAwc) {
    const galleryImages = Array.isArray((awcProfile as Record<string, unknown>)?.gallery_images)
      ? ((awcProfile as Record<string, unknown>).gallery_images as string[]).filter((u): u is string => typeof u === 'string')
      : [];
    return (
      <div className="page-container">
        <Navbar />
        <AwcPortfolioDashboard
          org={org}
          awcProfile={awcProfile}
          departmentName={departments.find((d) => d.id === org.department_id)?.name}
          images={galleryImages}
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

      <main className="flex-1 p-4 space-y-6 max-w-4xl mx-auto">
        {/* Education */}
        {deptCode === 'EDUCATION' && (
          <>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-text">Organization portfolio</h2>
              <ProfileTable
                rows={Array.from(new Set([...EDUCATION_PROFILE_KEYS, ...Object.keys(educationProfile)])).map((key) => ({
                  attribute: getEducationProfileLabel(key),
                  value: educationProfile[key] as string | number | null | undefined,
                }))}
              />
            </section>
            {eduSchoolMaster && (
              <Card title="School master">
                <div className="space-y-1">
                  <DataRow label="UDISE code" value={eduSchoolMaster.udise_code} />
                  <DataRow label="School type" value={eduSchoolMaster.school_type} />
                  <DataRow label="Board" value={eduSchoolMaster.board} />
                  <DataRow label="Medium" value={eduSchoolMaster.medium} />
                  <DataRow label="Management" value={eduSchoolMaster.management_type} />
                  <DataRow label="District" value={eduSchoolMaster.district} />
                  <DataRow label="Block" value={eduSchoolMaster.block} />
                  <DataRow label="Village" value={eduSchoolMaster.village} />
                  <DataRow label="Established year" value={eduSchoolMaster.established_year} />
                  <DataRow label="Status" value={eduSchoolMaster.school_status} />
                  <DataRow label="Contact" value={eduSchoolMaster.contact_phone} />
                  <DataRow label="Email" value={eduSchoolMaster.email} />
                  <DataRow label="Website" value={eduSchoolMaster.website} />
                </div>
              </Card>
            )}
            {eduInfra && (
              <Card title="Infrastructure">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <DataRow label="Classrooms" value={eduInfra.classrooms} />
                  <DataRow label="Smart classrooms" value={eduInfra.smart_classrooms} />
                  <DataRow label="Science labs" value={eduInfra.labs_science} />
                  <DataRow label="Computer labs" value={eduInfra.labs_computer} />
                  <DataRow label="Library books" value={eduInfra.library_books} />
                  <DataRow label="Toilets (boys)" value={eduInfra.toilets_boys} />
                  <DataRow label="Toilets (girls)" value={eduInfra.toilets_girls} />
                  <div className="col-span-2 flex flex-wrap gap-2 pt-1">
                    <span>Sports ground: <BoolBadge value={eduInfra.sports_ground} /></span>
                    <span>Drinking water: <BoolBadge value={eduInfra.drinking_water} /></span>
                    <span>Electricity: <BoolBadge value={eduInfra.electricity} /></span>
                    <span>Internet: <BoolBadge value={eduInfra.internet} /></span>
                  </div>
                </div>
              </Card>
            )}
            {eduGovt && (
              <Card title="Govt registry">
                <div className="space-y-1">
                  <DataRow label="UDISE code" value={eduGovt.udise_code} />
                  <DataRow label="AISHE code" value={eduGovt.aishe_code} />
                  <DataRow label="NSP code" value={eduGovt.nsp_code} />
                  <DataRow label="District code" value={eduGovt.district_code} />
                  <DataRow label="Block code" value={eduGovt.block_code} />
                </div>
              </Card>
            )}
            {eduTeachers.length > 0 && (
              <Card title="Teachers">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Name</th>
                        <th className="text-left py-1 pr-2">Role / Subject</th>
                        <th className="text-left py-1 pr-2">Qualification</th>
                        <th className="text-left py-1 pr-2">Experience (y)</th>
                        <th className="text-left py-1 pr-2">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eduTeachers.map((t) => (
                        <tr key={t.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{t.name ?? '—'}</td>
                          <td className="py-1 pr-2">{t.subject_specialization ?? t.employment_type ?? '—'}</td>
                          <td className="py-1 pr-2">{t.qualification ?? '—'}</td>
                          <td className="py-1 pr-2">{t.experience_years ?? '—'}</td>
                          <td className="py-1 pr-2">{t.contact ?? t.email ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {eduScholarships.length > 0 && (
              <Card title="Scholarships">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Scheme</th>
                        <th className="text-left py-1 pr-2">Student ID</th>
                        <th className="text-left py-1 pr-2">Amount</th>
                        <th className="text-left py-1 pr-2">Year</th>
                        <th className="text-left py-1 pr-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eduScholarships.map((s) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{s.scheme_name ?? '—'}</td>
                          <td className="py-1 pr-2">{s.student_id ?? '—'}</td>
                          <td className="py-1 pr-2">{s.amount ?? '—'}</td>
                          <td className="py-1 pr-2">{s.year ?? '—'}</td>
                          <td className="py-1 pr-2">{s.status ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {eduMiddayMeals.length > 0 && (
              <Card title="Midday meal">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Date</th>
                        <th className="text-left py-1 pr-2">Students served</th>
                        <th className="text-left py-1 pr-2">Meal type</th>
                        <th className="text-left py-1 pr-2">Vendor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eduMiddayMeals.slice(0, 20).map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{m.record_date}</td>
                          <td className="py-1 pr-2">{m.students_served ?? '—'}</td>
                          <td className="py-1 pr-2">{m.meal_type ?? '—'}</td>
                          <td className="py-1 pr-2">{m.vendor_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {eduMiddayMeals.length > 20 && <p className="mt-2 text-xs text-text-muted">Showing latest 20 of {eduMiddayMeals.length}</p>}
                </div>
              </Card>
            )}
            {eduDigital.length > 0 && (
              <Card title="Digital learning">
                <ul className="space-y-2 text-xs">
                  {eduDigital.map((d) => (
                    <li key={d.id} className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Platform: {d.platform_used ?? '—'}</span>
                      <span>Devices: <BoolBadge value={d.device_available} /></span>
                      <span>Students with devices: {d.students_with_devices ?? '—'}</span>
                      <span>Teachers trained: {d.teachers_trained_digital ?? '—'}</span>
                      <span>Usage (hrs/mo): {d.monthly_usage_hours ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {eduProjects.length > 0 && (
              <Card title="Development projects">
                <ul className="space-y-2 text-xs">
                  {eduProjects.map((p) => (
                    <li key={p.id}>
                      <span className="font-medium">{p.project_name ?? '—'}</span>
                      {p.sanctioned_amount != null && <span className="text-text-muted"> · ₹{p.sanctioned_amount}</span>}
                      {p.status && <span className="text-text-muted"> · {p.status}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {eduMonthly.length > 0 && (
              <Card title="Monthly progress">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Month / Year</th>
                        <th className="text-left py-1 pr-2">Enrolled</th>
                        <th className="text-left py-1 pr-2">Dropouts</th>
                        <th className="text-left py-1 pr-2">Budget utilized</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eduMonthly.slice(0, 12).map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{m.month}/{m.year}</td>
                          <td className="py-1 pr-2">{m.students_enrolled ?? '—'}</td>
                          <td className="py-1 pr-2">{m.dropouts ?? '—'}</td>
                          <td className="py-1 pr-2">{m.budget_utilized ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {eduBeneficiary.length > 0 && (
              <Card title="Beneficiary analytics">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Region</th>
                        <th className="text-left py-1 pr-2">Age group</th>
                        <th className="text-left py-1 pr-2">Gender</th>
                        <th className="text-left py-1 pr-2">Caste category</th>
                        <th className="text-left py-1 pr-2">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eduBeneficiary.map((b) => (
                        <tr key={b.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{b.region ?? '—'}</td>
                          <td className="py-1 pr-2">{b.age_group ?? '—'}</td>
                          <td className="py-1 pr-2">{b.gender ?? '—'}</td>
                          <td className="py-1 pr-2">{b.caste_category ?? '—'}</td>
                          <td className="py-1 pr-2">{b.student_count ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Health */}
        {deptCode === 'HEALTH' && (
          <>
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-text">Organization portfolio</h2>
              <ProfileTable
                rows={Array.from(new Set([...HEALTH_PROFILE_KEYS, ...Object.keys(healthProfile)])).map((key) => ({
                  attribute: getHealthProfileLabel(key),
                  value: healthProfile[key] as string | number | null | undefined,
                }))}
              />
            </section>
            {healthMaster && (
              <Card title="Facility master">
                <div className="space-y-1">
                  <DataRow label="Facility type" value={healthMaster.facility_type} />
                  <DataRow label="District" value={healthMaster.district} />
                  <DataRow label="Block" value={healthMaster.block} />
                  <DataRow label="Village" value={healthMaster.village} />
                  <DataRow label="Established year" value={healthMaster.established_year} />
                  <DataRow label="Registration no." value={healthMaster.registration_number} />
                  <DataRow label="Contact" value={healthMaster.contact_phone} />
                  <DataRow label="Email" value={healthMaster.email} />
                  <DataRow label="Beds" value={healthMaster.num_beds} />
                  <DataRow label="Operating hours" value={healthMaster.operating_hours} />
                  <DataRow label="Status" value={healthMaster.facility_status} />
                </div>
              </Card>
            )}
            {healthInfra && (
              <Card title="Infrastructure">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <DataRow label="Total beds" value={healthInfra.beds_total} />
                  <DataRow label="ICU beds" value={healthInfra.icu_beds} />
                  <DataRow label="Operation theatre" value={healthInfra.operation_theatre} />
                  <DataRow label="Labour room" value={healthInfra.labour_room} />
                  <div className="col-span-2 flex flex-wrap gap-2 pt-1">
                    <span>Lab: <BoolBadge value={healthInfra.lab_available} /></span>
                    <span>Pharmacy: <BoolBadge value={healthInfra.pharmacy_available} /></span>
                    <span>Ambulance: <BoolBadge value={healthInfra.ambulance_available} /></span>
                    <span>Blood bank: <BoolBadge value={healthInfra.blood_bank} /></span>
                  </div>
                </div>
              </Card>
            )}
            {healthStaff.length > 0 && (
              <Card title="Staff">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Name</th>
                        <th className="text-left py-1 pr-2">Role</th>
                        <th className="text-left py-1 pr-2">Qualification</th>
                        <th className="text-left py-1 pr-2">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthStaff.map((s) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{s.name ?? '—'}</td>
                          <td className="py-1 pr-2">{s.role ?? '—'}</td>
                          <td className="py-1 pr-2">{s.qualification ?? '—'}</td>
                          <td className="py-1 pr-2">{s.contact ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {healthEquipment.length > 0 && (
              <Card title="Equipment">
                <ul className="space-y-1 text-xs">
                  {healthEquipment.map((e) => (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span>{e.equipment_name ?? '—'}</span>
                      <span>Qty: {e.quantity ?? '—'} · {e.condition ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {healthPatient.length > 0 && (
              <Card title="Patient services (OPD / IPD)">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Date</th>
                        <th className="text-left py-1 pr-2">OPD</th>
                        <th className="text-left py-1 pr-2">IPD</th>
                        <th className="text-left py-1 pr-2">Surgeries</th>
                        <th className="text-left py-1 pr-2">Deliveries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthPatient.slice(0, 20).map((p) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{p.record_date}</td>
                          <td className="py-1 pr-2">{p.opd_count ?? '—'}</td>
                          <td className="py-1 pr-2">{p.ipd_count ?? '—'}</td>
                          <td className="py-1 pr-2">{p.surgeries ?? '—'}</td>
                          <td className="py-1 pr-2">{p.deliveries ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {healthImmunisation.length > 0 && (
              <Card title="Immunisation">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Vaccine</th>
                        <th className="text-left py-1 pr-2">Doses</th>
                        <th className="text-left py-1 pr-2">Age group</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthImmunisation.slice(0, 30).map((i) => (
                        <tr key={i.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{i.vaccine_name ?? '—'}</td>
                          <td className="py-1 pr-2">{i.doses_given ?? '—'}</td>
                          <td className="py-1 pr-2">{i.age_group ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {healthMedicines.length > 0 && (
              <Card title="Medicines stock">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Medicine</th>
                        <th className="text-left py-1 pr-2">Quantity</th>
                        <th className="text-left py-1 pr-2">Unit</th>
                        <th className="text-left py-1 pr-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthMedicines.slice(0, 30).map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{m.medicine_name ?? '—'}</td>
                          <td className="py-1 pr-2">{m.quantity ?? '—'}</td>
                          <td className="py-1 pr-2">{m.unit ?? '—'}</td>
                          <td className="py-1 pr-2">{m.expiry_date ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {healthSchemes.length > 0 && (
              <Card title="Schemes">
                <ul className="space-y-1 text-xs">
                  {healthSchemes.map((s) => (
                    <li key={s.id}>
                      <span className="font-medium">{s.scheme_name ?? '—'}</span>
                      {s.beneficiaries_count != null && <span className="text-text-muted"> · Beneficiaries: {s.beneficiaries_count}</span>}
                      {s.year != null && <span className="text-text-muted"> · Year: {s.year}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {healthMonthly.length > 0 && (
              <Card title="Monthly report">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 pr-2">Month / Year</th>
                        <th className="text-left py-1 pr-2">OPD</th>
                        <th className="text-left py-1 pr-2">IPD</th>
                        <th className="text-left py-1 pr-2">Deliveries</th>
                        <th className="text-left py-1 pr-2">Immunisation</th>
                        <th className="text-left py-1 pr-2">Budget utilized</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthMonthly.slice(0, 12).map((m) => (
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-1 pr-2">{m.month}/{m.year}</td>
                          <td className="py-1 pr-2">{m.total_opd ?? '—'}</td>
                          <td className="py-1 pr-2">{m.total_ipd ?? '—'}</td>
                          <td className="py-1 pr-2">{m.total_deliveries ?? '—'}</td>
                          <td className="py-1 pr-2">{m.total_immunisation ?? '—'}</td>
                          <td className="py-1 pr-2">{m.budget_utilized ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

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
