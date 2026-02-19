'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, organizationsApi, departmentsApi, profileApi, clearToken, getToken, educationApi, healthApi, Organization, User, Department, CenterProfile } from '../../../services/api';
import { Loader } from '../../../components/common/Loader';

/** ICDS minister CSV: all attributes for AWC profile (no SL NO; use system-generated org id). */
const ICDS_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,NAME OF AWC,AWC ID,BUILDING STATUS,LATITUDE,LONGITUDE,STUDENT STRENGTH,CPDO NAME,CPDO CONTACT NO,SUPERVISOR NAME,SUPERVISOR CONTACT NAME,AWW NAME,AWW CONTACT NO,AWH NAME,AWH CONTACT NO,DESCRIPTION,SECTOR,LGD CODE\n';

const EDUCATION_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,NAME OF SCHOOL,SCHOOL ID,ESST YEAR,CATEGORY,I,II,III,IV,V,VI,VII,VIII,IX,X,DEO NAME,DEO CONTACT,BEO NAME,BEO CONTACT,BRCC NAME,BRCC CONTACT,CRCC NAME,CRCC CONTACT,NAME OF HM,CONTACT OF HM,NO OF TS,NO OF NTS,NO OF TGP(PCM),NO OF TGP(CBZ),NO OF TGT(ARTS),BUILDING STATUS,NO OF ROOMS,NO OF SMART CLASS ROOMS,SCIENCE LAB,TOILET(M),TOILET(F),RAMP,MEETING HALL,STAFF COMMON ROOM,NCC,NSS,JRC,ECO CLUB,LIBRARY,ICC HEAD NAME,ICC HEAD CONTACT,PLAY GROUND,CYCLE STAND,DRINKING WATER(TW),DRINKING WATER(TAP),DRINKING WATER(OVERHEAD TAP),DRINKING WATER(AQUAGUARD),LATITUDE,LONGITUDE,DESCRIPTION\n';
const HEALTH_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,LATITUDE,LONGITUDE,NAME,INSTITUTION ID,CATEGORY,INST HEAD NAME,INST HEAD CONTACT,NO OF TS,NO OF NTS,NO OF MO,NO OF PHARMACIST,NO OF ANM,NO OF HEALTH WORKER,NO OF PATHOLOGY,NO OF CLERK,NO OF SWEEPER,NO OF NW,NO OF BED,NO OF ICU,X-RAY AVAILABILTY,CT-SCAN AVAILABILITY,AVAILABILITY OF PATHOLOGY TESTING,DESCRIPTION\n';

export default function DepartmentAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [orgProfiles, setOrgProfiles] = useState<Record<number, CenterProfile | null>>({});
  const [healthProfiles, setHealthProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [educationProfiles, setEducationProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [newOrg, setNewOrg] = useState({
    ulb_block: '',
    gp_name: '',
    ward_village: '',
    sector: '',
    awc_name: '',
    awc_id: '',
    building_status: '',
    latitude: '',
    longitude: '',
    lgd_code: '',
    student_strength: '',
    cpdo_name: '',
    cpdo_contact_no: '',
    supervisor_name: '',
    supervisor_contact_name: '',
    aww_name: '',
    aww_contact_no: '',
    awh_name: '',
    awh_contact_no: '',
    description: '',
  });
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [editingHealthId, setEditingHealthId] = useState<number | null>(null);
  const [newHealthOrg, setNewHealthOrg] = useState({
    block_ulb: '', gp_ward: '', village: '', latitude: '', longitude: '', name: '', category: '',
    inst_head_name: '', inst_head_contact: '', no_of_ts: '', no_of_nts: '', no_of_mo: '', no_of_pharmacist: '',
    no_of_anm: '', no_of_health_worker: '', no_of_pathology: '', no_of_clerk: '', no_of_sweeper: '', no_of_nw: '',
    no_of_bed: '', no_of_icu: '', x_ray_availabilaty: '', ct_scan_availability: '', availability_of_pathology_testing: '', description: '',
  });
  const emptyHealthOrg = () => ({
    block_ulb: '', gp_ward: '', village: '', latitude: '', longitude: '', name: '', institution_id: '', category: '',
    inst_head_name: '', inst_head_contact: '', no_of_ts: '', no_of_nts: '', no_of_mo: '', no_of_pharmacist: '',
    no_of_anm: '', no_of_health_worker: '', no_of_pathology: '', no_of_clerk: '', no_of_sweeper: '', no_of_nw: '',
    no_of_bed: '', no_of_icu: '', x_ray_availabilaty: '', ct_scan_availability: '', availability_of_pathology_testing: '', description: '',
  });

  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const emptyEducationOrg = () => ({
    block_ulb: '', gp_ward: '', village: '', name_of_school: '', school_id: '', esst_year: '', category: '',
    class_i: '', class_ii: '', class_iii: '', class_iv: '', class_v: '', class_vi: '', class_vii: '', class_viii: '', class_ix: '', class_x: '',
    deo_name: '', deo_contact: '', beo_name: '', beo_contact: '', brcc_name: '', brcc_contact: '', crcc_name: '', crcc_contact: '',
    name_of_hm: '', contact_of_hm: '', no_of_ts: '', no_of_nts: '', no_of_tgp_pcm: '', no_of_tgp_cbz: '', no_of_tgt_arts: '',
    building_status: '', no_of_rooms: '', no_of_smart_class_rooms: '', science_lab: '', toilet_m: '', toilet_f: '',
    ramp: '', meeting_hall: '', staff_common_room: '', ncc: '', nss: '', jrc: '', eco_club: '', library: '',
    icc_head_name: '', icc_head_contact: '', play_ground: '', cycle_stand: '',
    drinking_water_tw: '', drinking_water_tap: '', drinking_water_overhead_tap: '', drinking_water_aquaguard: '',
    latitude: '', longitude: '', description: '',
  });
  const [newEducationOrg, setNewEducationOrg] = useState(emptyEducationOrg());

  const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
  const _s = (s: string) => (s.trim() || undefined);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/admin/login');
          return;
        }
        setMe(user);
        setDepartments(deptList);
        const dept = user.department_id ? deptList.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);
        if (user.department_id) {
          const list = await organizationsApi.listByDepartment(user.department_id, {
            skip: 0,
            limit: PAGE_SIZE,
          });
          setOrgs(list);
          setPage(0);
          setHasMore(list.length === PAGE_SIZE);
        } else {
          setError('Department is not set for this admin user.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load department admin data');
        clearToken();
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    if (deptCode === 'EDUCATION' || deptCode === 'HEALTH' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, CenterProfile | null> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await profileApi.getCenterProfile(o.id);
          profiles[o.id] = p ?? null;
        })
      );
      if (!cancelled) setOrgProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'HEALTH' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await healthApi.getProfile(o.id);
          profiles[o.id] = p && typeof p === 'object' ? p : {};
        })
      );
      if (!cancelled) setHealthProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'EDUCATION' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await educationApi.getProfile(o.id);
          profiles[o.id] = p && typeof p === 'object' ? p : {};
        })
      );
      if (!cancelled) setEducationProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this organization?')) return;
    try {
      await organizationsApi.delete(id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization');
    }
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Please choose a CSV file.');
      return;
    }
    const file = fileInput.files[0];
    setUploading(true);
    setError(null);
    try {
      if (deptCode === 'EDUCATION') {
        const result = await educationApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'HEALTH') {
        const result = await healthApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        const resp = await fetch('/api/v1/organizations/bulk_csv', {
          method: 'POST',
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.detail || `Upload failed with status ${resp.status}`);
        }
      }
      if (me?.department_id) {
        const list = await organizationsApi.listByDepartment(me.department_id, {
          skip: 0,
          limit: PAGE_SIZE,
        });
        setOrgs(list);
        setPage(0);
        setHasMore(list.length === PAGE_SIZE);
      }
      (form.elements.namedItem('file') as HTMLInputElement).value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    let csvContent: string;
    let filename: string;
    if (deptCode === 'EDUCATION') {
      csvContent = EDUCATION_CSV_HEADER;
      filename = 'education_template.csv';
    } else if (deptCode === 'HEALTH') {
      csvContent = HEALTH_CSV_HEADER;
      filename = 'health_template.csv';
    } else {
      csvContent = ICDS_CSV_HEADER + 'RANGEILUNDA,BADAKUSASTHALLI,BADAGUMULA,BADA GUMULLA-I,,,19.270275,84.781087,,,,,,,,,,KAMALAPUR,412630\n';
      filename = 'icds_awc_template.csv';
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="page-container">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-text">Department admin panel</h1>
          <p className="mt-1 text-xs text-text-muted">
            Manage organizations and bulk upload CSV for your department.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <div className="text-right">
            <div>{me.full_name}</div>
            <div className="text-[11px]">{me.email}</div>
          </div>
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-[11px] text-text hover:border-primary"
            onClick={() => {
              clearToken();
              router.push('/admin/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4">
        {error && <p className="text-xs text-red-500">{error}</p>}

        {deptCode !== 'EDUCATION' && deptCode !== 'HEALTH' && (
        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Manual AWC entry</h2>
          <p className="mt-1 text-xs text-text-muted">
            Add a single ICDS AWC manually. Fields mirror the CSV columns.
          </p>
          <form
            className="mt-3 grid gap-3 text-xs md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!me?.department_id) {
                setError('Department is not set for this admin user.');
                return;
              }
              if (!newOrg.awc_name || !newOrg.latitude || !newOrg.longitude) {
                setError('AWC Name, Latitude and Longitude are required.');
                return;
              }
              setCreating(true);
              setError(null);
              try {
                const lat = Number(newOrg.latitude);
                const lng = Number(newOrg.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                  throw new Error('Latitude and Longitude must be valid numbers.');
                }
                const addressParts = [newOrg.gp_name, newOrg.ward_village].filter(Boolean);
                const basePayload = {
                  name: newOrg.awc_name,
                  latitude: lat,
                  longitude: lng,
                  description: newOrg.sector ? `Sector: ${newOrg.sector}` : undefined,
                  address: addressParts.length ? addressParts.join(', ') : undefined,
                  attributes: {
                    ulb_block: newOrg.ulb_block,
                    gp_name: newOrg.gp_name,
                    ward_village: newOrg.ward_village,
                    sector: newOrg.sector,
                    lgd_code: newOrg.lgd_code,
                  } as Record<string, string | number | null>,
                };

                let updated: Organization;
                if (editingOrgId) {
                  updated = await organizationsApi.update(editingOrgId, basePayload);
                  setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                } else {
                  const created = await organizationsApi.create({
                    department_id: me.department_id,
                    type: 'AWC',
                    ...basePayload,
                  });
                  updated = created;
                  setOrgs((prev) => [created, ...prev]);
                }
                const profilePayload: Partial<CenterProfile> = {
                  block_name: newOrg.ulb_block || undefined,
                  gram_panchayat: newOrg.gp_name || undefined,
                  village_ward: newOrg.ward_village || undefined,
                  center_code: newOrg.awc_id || undefined,
                  building_type: newOrg.building_status || undefined,
                  student_strength: newOrg.student_strength ? parseInt(newOrg.student_strength, 10) : undefined,
                  cpdo_name: newOrg.cpdo_name || undefined,
                  cpdo_contact_no: newOrg.cpdo_contact_no || undefined,
                  supervisor_name: newOrg.supervisor_name || undefined,
                  supervisor_contact_name: newOrg.supervisor_contact_name || undefined,
                  worker_name: newOrg.aww_name || undefined,
                  aww_contact_no: newOrg.aww_contact_no || undefined,
                  helper_name: newOrg.awh_name || undefined,
                  awh_contact_no: newOrg.awh_contact_no || undefined,
                  description: newOrg.description || undefined,
                  sector: newOrg.sector || undefined,
                };
                await profileApi.putCenterProfile(updated.id, profilePayload);
                setOrgProfiles((prev) => ({ ...prev, [updated.id]: { ...profilePayload, organization_id: updated.id } as CenterProfile }));
                const emptyOrg = {
                  ulb_block: '', gp_name: '', ward_village: '', sector: '', awc_name: '', awc_id: '', building_status: '',
                  latitude: '', longitude: '', lgd_code: '', student_strength: '', cpdo_name: '', cpdo_contact_no: '',
                  supervisor_name: '', supervisor_contact_name: '', aww_name: '', aww_contact_no: '', awh_name: '', awh_contact_no: '', description: '',
                };
                setNewOrg(emptyOrg);
                setEditingOrgId(null);
              } catch (err: any) {
                setError(err.message || 'Failed to save organization');
              } finally {
                setCreating(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="block text-text">ULB / Block Name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.ulb_block} onChange={(e) => setNewOrg((s) => ({ ...s, ulb_block: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">GP / Ward Name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.gp_name} onChange={(e) => setNewOrg((s) => ({ ...s, gp_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Village</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.ward_village} onChange={(e) => setNewOrg((s) => ({ ...s, ward_village: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Name of AWC</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.awc_name} onChange={(e) => setNewOrg((s) => ({ ...s, awc_name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWC ID</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.awc_id} onChange={(e) => setNewOrg((s) => ({ ...s, awc_id: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Building status</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.building_status} onChange={(e) => setNewOrg((s) => ({ ...s, building_status: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Latitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.latitude} onChange={(e) => setNewOrg((s) => ({ ...s, latitude: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Longitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.longitude} onChange={(e) => setNewOrg((s) => ({ ...s, longitude: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Student strength</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.student_strength} onChange={(e) => setNewOrg((s) => ({ ...s, student_strength: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">CPDO name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.cpdo_name} onChange={(e) => setNewOrg((s) => ({ ...s, cpdo_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">CPDO contact no</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.cpdo_contact_no} onChange={(e) => setNewOrg((s) => ({ ...s, cpdo_contact_no: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Supervisor name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.supervisor_name} onChange={(e) => setNewOrg((s) => ({ ...s, supervisor_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Supervisor contact</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.supervisor_contact_name} onChange={(e) => setNewOrg((s) => ({ ...s, supervisor_contact_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWW name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.aww_name} onChange={(e) => setNewOrg((s) => ({ ...s, aww_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWW contact no</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.aww_contact_no} onChange={(e) => setNewOrg((s) => ({ ...s, aww_contact_no: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWH name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.awh_name} onChange={(e) => setNewOrg((s) => ({ ...s, awh_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWH contact no</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.awh_contact_no} onChange={(e) => setNewOrg((s) => ({ ...s, awh_contact_no: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Description</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.description} onChange={(e) => setNewOrg((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Sector</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.sector} onChange={(e) => setNewOrg((s) => ({ ...s, sector: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">LGD Code</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newOrg.lgd_code} onChange={(e) => setNewOrg((s) => ({ ...s, lgd_code: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {creating ? 'Saving...' : editingOrgId ? 'Update AWC' : 'Save AWC'}
              </button>
            </div>
          </form>
        </section>
        )}

        {deptCode === 'EDUCATION' && (
        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Manual School entry</h2>
          <p className="mt-1 text-xs text-text-muted">
            Add a single school manually. Fields mirror the Education CSV columns.
          </p>
          <form
            className="mt-3 grid gap-3 text-xs md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!me?.department_id) {
                setError('Department is not set for this admin user.');
                return;
              }
              if (!newEducationOrg.name_of_school?.trim() || !newEducationOrg.latitude?.trim() || !newEducationOrg.longitude?.trim()) {
                setError('Name of School, Latitude and Longitude are required.');
                return;
              }
              setCreating(true);
              setError(null);
              try {
                const lat = Number(newEducationOrg.latitude);
                const lng = Number(newEducationOrg.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                  throw new Error('Latitude and Longitude must be valid numbers.');
                }
                const addressParts = [newEducationOrg.block_ulb, newEducationOrg.gp_ward, newEducationOrg.village].filter(Boolean);
                const basePayload = {
                  name: newEducationOrg.name_of_school.trim(),
                  latitude: lat,
                  longitude: lng,
                  address: addressParts.length ? addressParts.join(', ') : undefined,
                  attributes: {
                    ulb_block: newEducationOrg.block_ulb || null,
                    gp_name: newEducationOrg.gp_ward || null,
                    ward_village: newEducationOrg.village || null,
                    sector: newEducationOrg.category || null,
                  } as Record<string, string | number | null>,
                };
                let updated: Organization;
                if (editingEducationId) {
                  updated = await organizationsApi.update(editingEducationId, basePayload);
                  setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                } else {
                  const created = await organizationsApi.create({
                    department_id: me.department_id,
                    type: 'PRIMARY_SCHOOL',
                    ...basePayload,
                  });
                  updated = created;
                  setOrgs((prev) => [created, ...prev]);
                }
                const profileData: Record<string, unknown> = {
                  block_ulb: _s(newEducationOrg.block_ulb),
                  gp_ward: _s(newEducationOrg.gp_ward),
                  village: _s(newEducationOrg.village),
                  name_of_school: newEducationOrg.name_of_school.trim(),
                  school_id: _s(newEducationOrg.school_id),
                  esst_year: _n(newEducationOrg.esst_year),
                  category: _s(newEducationOrg.category),
                  class_i: _n(newEducationOrg.class_i), class_ii: _n(newEducationOrg.class_ii), class_iii: _n(newEducationOrg.class_iii),
                  class_iv: _n(newEducationOrg.class_iv), class_v: _n(newEducationOrg.class_v), class_vi: _n(newEducationOrg.class_vi),
                  class_vii: _n(newEducationOrg.class_vii), class_viii: _n(newEducationOrg.class_viii), class_ix: _n(newEducationOrg.class_ix), class_x: _n(newEducationOrg.class_x),
                  deo_name: _s(newEducationOrg.deo_name), deo_contact: _s(newEducationOrg.deo_contact),
                  beo_name: _s(newEducationOrg.beo_name), beo_contact: _s(newEducationOrg.beo_contact),
                  brcc_name: _s(newEducationOrg.brcc_name), brcc_contact: _s(newEducationOrg.brcc_contact),
                  crcc_name: _s(newEducationOrg.crcc_name), crcc_contact: _s(newEducationOrg.crcc_contact),
                  name_of_hm: _s(newEducationOrg.name_of_hm), contact_of_hm: _s(newEducationOrg.contact_of_hm),
                  no_of_ts: _n(newEducationOrg.no_of_ts), no_of_nts: _n(newEducationOrg.no_of_nts),
                  no_of_tgp_pcm: _n(newEducationOrg.no_of_tgp_pcm), no_of_tgp_cbz: _n(newEducationOrg.no_of_tgp_cbz), no_of_tgt_arts: _n(newEducationOrg.no_of_tgt_arts),
                  building_status: _s(newEducationOrg.building_status), no_of_rooms: _n(newEducationOrg.no_of_rooms), no_of_smart_class_rooms: _n(newEducationOrg.no_of_smart_class_rooms),
                  science_lab: _s(newEducationOrg.science_lab), toilet_m: _s(newEducationOrg.toilet_m), toilet_f: _s(newEducationOrg.toilet_f),
                  ramp: _s(newEducationOrg.ramp), meeting_hall: _s(newEducationOrg.meeting_hall), staff_common_room: _s(newEducationOrg.staff_common_room),
                  ncc: _s(newEducationOrg.ncc), nss: _s(newEducationOrg.nss), jrc: _s(newEducationOrg.jrc), eco_club: _s(newEducationOrg.eco_club), library: _s(newEducationOrg.library),
                  icc_head_name: _s(newEducationOrg.icc_head_name), icc_head_contact: _s(newEducationOrg.icc_head_contact),
                  play_ground: _s(newEducationOrg.play_ground), cycle_stand: _s(newEducationOrg.cycle_stand),
                  drinking_water_tw: _s(newEducationOrg.drinking_water_tw), drinking_water_tap: _s(newEducationOrg.drinking_water_tap),
                  drinking_water_overhead_tap: _s(newEducationOrg.drinking_water_overhead_tap), drinking_water_aquaguard: _s(newEducationOrg.drinking_water_aquaguard),
                  latitude: lat, longitude: lng, description: _s(newEducationOrg.description),
                };
                await educationApi.putProfile(updated.id, profileData);
                setEducationProfiles((prev) => ({ ...prev, [updated.id]: profileData }));
                setNewEducationOrg(emptyEducationOrg());
                setEditingEducationId(null);
              } catch (err: any) {
                setError(err.message || 'Failed to save school');
              } finally {
                setCreating(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="block text-text">Block / ULB</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.block_ulb} onChange={(e) => setNewEducationOrg((s) => ({ ...s, block_ulb: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">GP / Ward</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.gp_ward} onChange={(e) => setNewEducationOrg((s) => ({ ...s, gp_ward: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Village</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.village} onChange={(e) => setNewEducationOrg((s) => ({ ...s, village: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Name of School</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.name_of_school} onChange={(e) => setNewEducationOrg((s) => ({ ...s, name_of_school: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">School ID</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.school_id} onChange={(e) => setNewEducationOrg((s) => ({ ...s, school_id: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">ESST Year</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.esst_year} onChange={(e) => setNewEducationOrg((s) => ({ ...s, esst_year: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Category</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.category} onChange={(e) => setNewEducationOrg((s) => ({ ...s, category: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Latitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.latitude} onChange={(e) => setNewEducationOrg((s) => ({ ...s, latitude: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Longitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.longitude} onChange={(e) => setNewEducationOrg((s) => ({ ...s, longitude: e.target.value }))} required />
            </div>
            <div className="space-y-1"><label className="block text-text">Class I</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_i} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_i: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class II</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_ii} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_ii: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class III</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_iii} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_iii: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class IV</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_iv} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_iv: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class V</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_v} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_v: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class VI</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_vi} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_vi: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class VII</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_vii} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_vii: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class VIII</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_viii} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_viii: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class IX</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_ix} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_ix: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Class X</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.class_x} onChange={(e) => setNewEducationOrg((s) => ({ ...s, class_x: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">DEO Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.deo_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, deo_name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">DEO Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.deo_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, deo_contact: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">BEO Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.beo_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, beo_name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">BEO Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.beo_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, beo_contact: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">BRCC Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.brcc_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, brcc_name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">BRCC Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.brcc_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, brcc_contact: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">CRCC Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.crcc_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, crcc_name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">CRCC Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.crcc_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, crcc_contact: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Name of HM</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.name_of_hm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, name_of_hm: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Contact of HM</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.contact_of_hm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, contact_of_hm: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of TS</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_ts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_ts: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of NTS</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_nts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_nts: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of TGP (PCM)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgp_pcm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgp_pcm: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of TGP (CBZ)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgp_cbz} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgp_cbz: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of TGT (Arts)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgt_arts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgt_arts: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Building Status</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.building_status} onChange={(e) => setNewEducationOrg((s) => ({ ...s, building_status: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of Rooms</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_rooms} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_rooms: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">No of Smart Class Rooms</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_smart_class_rooms} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_smart_class_rooms: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Science Lab</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.science_lab} onChange={(e) => setNewEducationOrg((s) => ({ ...s, science_lab: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Toilet (M)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.toilet_m} onChange={(e) => setNewEducationOrg((s) => ({ ...s, toilet_m: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Toilet (F)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.toilet_f} onChange={(e) => setNewEducationOrg((s) => ({ ...s, toilet_f: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Ramp</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.ramp} onChange={(e) => setNewEducationOrg((s) => ({ ...s, ramp: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Meeting Hall</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.meeting_hall} onChange={(e) => setNewEducationOrg((s) => ({ ...s, meeting_hall: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Staff Common Room</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.staff_common_room} onChange={(e) => setNewEducationOrg((s) => ({ ...s, staff_common_room: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">NCC</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.ncc} onChange={(e) => setNewEducationOrg((s) => ({ ...s, ncc: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">NSS</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.nss} onChange={(e) => setNewEducationOrg((s) => ({ ...s, nss: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">JRC</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.jrc} onChange={(e) => setNewEducationOrg((s) => ({ ...s, jrc: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Eco Club</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.eco_club} onChange={(e) => setNewEducationOrg((s) => ({ ...s, eco_club: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Library</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.library} onChange={(e) => setNewEducationOrg((s) => ({ ...s, library: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">ICC Head Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.icc_head_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, icc_head_name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">ICC Head Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.icc_head_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, icc_head_contact: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Play Ground</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.play_ground} onChange={(e) => setNewEducationOrg((s) => ({ ...s, play_ground: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Cycle Stand</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.cycle_stand} onChange={(e) => setNewEducationOrg((s) => ({ ...s, cycle_stand: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Drinking Water (TW)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_tw} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_tw: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Drinking Water (Tap)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_tap} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_tap: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Drinking Water (Overhead Tap)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_overhead_tap} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_overhead_tap: e.target.value }))} /></div>
            <div className="space-y-1"><label className="block text-text">Drinking Water (Aquaguard)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_aquaguard} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_aquaguard: e.target.value }))} /></div>
            <div className="space-y-1 md:col-span-2"><label className="block text-text">Description</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.description} onChange={(e) => setNewEducationOrg((s) => ({ ...s, description: e.target.value }))} /></div>
            <div className="md:col-span-2">
              <button type="submit" disabled={creating} className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {creating ? 'Saving...' : editingEducationId ? 'Update School' : 'Save School'}
              </button>
            </div>
          </form>
        </section>
        )}

        {deptCode === 'HEALTH' && (
        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Manual Health facility entry</h2>
          <p className="mt-1 text-xs text-text-muted">
            Add a single Health facility manually. Fields mirror the CSV columns.
          </p>
          <form
            className="mt-3 grid gap-3 text-xs md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!me?.department_id) {
                setError('Department is not set for this admin user.');
                return;
              }
              if (!newHealthOrg.name?.trim() || !newHealthOrg.latitude?.trim() || !newHealthOrg.longitude?.trim()) {
                setError('Name, Latitude and Longitude are required.');
                return;
              }
              setCreating(true);
              setError(null);
              try {
                const lat = Number(newHealthOrg.latitude);
                const lng = Number(newHealthOrg.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                  throw new Error('Latitude and Longitude must be valid numbers.');
                }
                const addressParts = [newHealthOrg.block_ulb, newHealthOrg.gp_ward, newHealthOrg.village].filter(Boolean);
                const basePayload = {
                  name: newHealthOrg.name.trim(),
                  latitude: lat,
                  longitude: lng,
                  address: addressParts.length ? addressParts.join(', ') : undefined,
                  attributes: {
                    ulb_block: newHealthOrg.block_ulb || null,
                    gp_name: newHealthOrg.gp_ward || null,
                    ward_village: newHealthOrg.village || null,
                  } as Record<string, string | number | null>,
                };
                let updated: Organization;
                if (editingHealthId) {
                  updated = await organizationsApi.update(editingHealthId, basePayload);
                  setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                } else {
                  const created = await organizationsApi.create({
                    department_id: me.department_id,
                    type: 'HEALTH_CENTRE',
                    ...basePayload,
                  });
                  updated = created;
                  setOrgs((prev) => [created, ...prev]);
                }
                const profileData: Record<string, unknown> = {
                  block_ulb: _s(newHealthOrg.block_ulb),
                  gp_ward: _s(newHealthOrg.gp_ward),
                  village: _s(newHealthOrg.village),
                  latitude: lat,
                  longitude: lng,
                  name: newHealthOrg.name.trim(),
                  institution_id: _s(newHealthOrg.institution_id),
                  category: _s(newHealthOrg.category),
                  inst_head_name: _s(newHealthOrg.inst_head_name),
                  inst_head_contact: _s(newHealthOrg.inst_head_contact),
                  no_of_ts: _n(newHealthOrg.no_of_ts),
                  no_of_nts: _n(newHealthOrg.no_of_nts),
                  no_of_mo: _n(newHealthOrg.no_of_mo),
                  no_of_pharmacist: _n(newHealthOrg.no_of_pharmacist),
                  no_of_anm: _n(newHealthOrg.no_of_anm),
                  no_of_health_worker: _n(newHealthOrg.no_of_health_worker),
                  no_of_pathology: _n(newHealthOrg.no_of_pathology),
                  no_of_clerk: _n(newHealthOrg.no_of_clerk),
                  no_of_sweeper: _n(newHealthOrg.no_of_sweeper),
                  no_of_nw: _n(newHealthOrg.no_of_nw),
                  no_of_bed: _n(newHealthOrg.no_of_bed),
                  no_of_icu: _n(newHealthOrg.no_of_icu),
                  x_ray_availabilaty: _s(newHealthOrg.x_ray_availabilaty),
                  ct_scan_availability: _s(newHealthOrg.ct_scan_availability),
                  availability_of_pathology_testing: _s(newHealthOrg.availability_of_pathology_testing),
                  description: _s(newHealthOrg.description),
                };
                await healthApi.putProfile(updated.id, profileData);
                setNewHealthOrg(emptyHealthOrg());
                setEditingHealthId(null);
              } catch (err: any) {
                setError(err.message || 'Failed to save facility');
              } finally {
                setCreating(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="block text-text">Block / ULB</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.block_ulb} onChange={(e) => setNewHealthOrg((s) => ({ ...s, block_ulb: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">GP / Ward</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.gp_ward} onChange={(e) => setNewHealthOrg((s) => ({ ...s, gp_ward: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Village</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.village} onChange={(e) => setNewHealthOrg((s) => ({ ...s, village: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.name} onChange={(e) => setNewHealthOrg((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Institution ID</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.institution_id} onChange={(e) => setNewHealthOrg((s) => ({ ...s, institution_id: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Latitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.latitude} onChange={(e) => setNewHealthOrg((s) => ({ ...s, latitude: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Longitude</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.longitude} onChange={(e) => setNewHealthOrg((s) => ({ ...s, longitude: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Category</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.category} onChange={(e) => setNewHealthOrg((s) => ({ ...s, category: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Inst Head Name</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.inst_head_name} onChange={(e) => setNewHealthOrg((s) => ({ ...s, inst_head_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Inst Head Contact</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.inst_head_contact} onChange={(e) => setNewHealthOrg((s) => ({ ...s, inst_head_contact: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of TS</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_ts} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_ts: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of NTS</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_nts} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_nts: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of MO</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_mo} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_mo: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Pharmacist</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_pharmacist} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_pharmacist: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of ANM</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_anm} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_anm: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Health Worker</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_health_worker} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_health_worker: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Pathology</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_pathology} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_pathology: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Clerk</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_clerk} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_clerk: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Sweeper</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_sweeper} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_sweeper: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of NW</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_nw} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_nw: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of Bed</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_bed} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_bed: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">No of ICU</label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.no_of_icu} onChange={(e) => setNewHealthOrg((s) => ({ ...s, no_of_icu: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">X-Ray Availability</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.x_ray_availabilaty} onChange={(e) => setNewHealthOrg((s) => ({ ...s, x_ray_availabilaty: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">CT-Scan Availability</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.ct_scan_availability} onChange={(e) => setNewHealthOrg((s) => ({ ...s, ct_scan_availability: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Availability of Pathology Testing</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.availability_of_pathology_testing} onChange={(e) => setNewHealthOrg((s) => ({ ...s, availability_of_pathology_testing: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">Description</label>
              <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newHealthOrg.description} onChange={(e) => setNewHealthOrg((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={creating} className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {creating ? 'Saving...' : editingHealthId ? 'Update facility' : 'Save facility'}
              </button>
            </div>
          </form>
        </section>
        )}

        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Bulk CSV upload</h2>
          <p className="mt-1 text-xs text-text-muted">
            {deptCode === 'EDUCATION'
              ? 'Upload Education minister CSV. Organizations and profiles will be created or updated by NAME OF SCHOOL, LATITUDE, LONGITUDE.'
              : deptCode === 'HEALTH'
                ? 'Upload Health minister CSV. Organizations and profiles will be created or updated by NAME, LATITUDE, LONGITUDE.'
                : 'Upload ICDS AWC CSV (same format as backend import). Existing AWC organizations for this department will be replaced.'}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
              onClick={handleDownloadTemplate}
            >
              Download CSV template
            </button>
            <form className="flex flex-col gap-2 md:flex-row md:items-center" onSubmit={handleUpload}>
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                className="text-xs"
              />
              <button
                type="submit"
                disabled={uploading}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Organizations in your department</h2>
          <p className="mt-1 text-xs text-text-muted">
            You can see and delete organizations for your department. (Full edit UI will be added on
            top of this.)
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background-muted">
                  <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Sl. No.</th>
                  <th className="px-2 py-1 text-left font-medium text-text">{deptCode === 'EDUCATION' ? 'School Name' : deptCode === 'HEALTH' ? 'Facility Name' : 'AWC Name'}</th>
                  {(deptCode !== 'EDUCATION' && deptCode !== 'HEALTH') && (
                    <>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWC ID</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Building status</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Student strength</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CPDO name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CPDO contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Supervisor name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Supervisor contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWW name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWW contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWH name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWH contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Sector</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">LGD Code</th>
                    </>
                  )}
                  {deptCode === 'EDUCATION' && (
                    <>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">School ID</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ESST Year</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Category</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">I</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">II</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">III</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">IV</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">V</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">VI</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">VII</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">VIII</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">IX</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">X</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DEO Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DEO Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BEO Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BEO Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BRCC Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BRCC Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CRCC Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CRCC Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">HM Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">HM Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of TS</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NTS</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGP(PCM)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGP(CBZ)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGT(Arts)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Building Status</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Rooms</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Smart Class</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Science Lab</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Toilet(M)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Toilet(F)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Ramp</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Meeting Hall</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Staff Room</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">NCC</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">NSS</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">JRC</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Eco Club</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Library</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ICC Head</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ICC Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Play Ground</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Cycle Stand</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(TW)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Tap)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Overhead)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Aquaguard)</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                    </>
                  )}
                  {deptCode === 'HEALTH' && (
                    <>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Institution ID</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Category</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Inst Head Name</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Inst Head Contact</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of TS</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NTS</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of MO</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Pharmacist</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of ANM</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Health Worker</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Pathology</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Clerk</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Sweeper</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NW</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Bed</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of ICU</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">X-Ray</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CT-Scan</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Pathology Testing</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                    </>
                  )}
                  <th className="px-2 py-1 text-left font-medium text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, idx) => {
                  const prof = orgProfiles[o.id];
                  const hp = healthProfiles[o.id];
                  const ep = educationProfiles[o.id];
                  const _ = (v: string | number | null | undefined) => (v != null && String(v).trim() !== '' ? String(v) : '—');
                  return (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="px-2 py-1 text-text-muted">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-2 py-1">{o.name}</td>
                    {(deptCode !== 'EDUCATION' && deptCode !== 'HEALTH') && (
                      <>
                        <td className="px-2 py-1 text-text-muted">{_(o.attributes?.ulb_block ?? prof?.block_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(o.attributes?.gp_name ?? prof?.gram_panchayat)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(o.attributes?.ward_village ?? prof?.village_ward)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.center_code)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.building_type)}</td>
                        <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                        <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.student_strength)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.cpdo_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.cpdo_contact_no)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.supervisor_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.supervisor_contact_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.worker_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.aww_contact_no)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.helper_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(prof?.awh_contact_no)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(o.attributes?.sector ?? prof?.sector)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(o.attributes?.lgd_code)}</td>
                      </>
                    )}
                    {deptCode === 'EDUCATION' && (
                      <>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.block_ulb ?? o.attributes?.ulb_block)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.gp_ward ?? o.attributes?.gp_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.village ?? o.attributes?.ward_village)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.school_id)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.esst_year)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.category)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_i)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_ii)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_iii)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_iv)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_v)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_vi)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_vii)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_viii)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_ix)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.class_x)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.deo_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.deo_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.beo_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.beo_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.brcc_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.brcc_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.crcc_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.crcc_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.name_of_hm)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.contact_of_hm)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_ts)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_nts)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgp_pcm)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgp_cbz)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgt_arts)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.building_status)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_rooms)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_smart_class_rooms)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.science_lab)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.toilet_m)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.toilet_f)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.ramp)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.meeting_hall)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.staff_common_room)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.ncc)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.nss)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.jrc)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.eco_club)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.library)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.icc_head_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.icc_head_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.play_ground)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.cycle_stand)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_tw)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_tap)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_overhead_tap)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_aquaguard)}</td>
                        <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                        <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                      </>
                    )}
                    {deptCode === 'HEALTH' && (
                      <>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.block_ulb ?? o.attributes?.ulb_block)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.gp_ward ?? o.attributes?.gp_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.village ?? o.attributes?.ward_village)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.institution_id)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.category)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.inst_head_name)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.inst_head_contact)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_ts)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_nts)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_mo)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_pharmacist)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_anm)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_health_worker)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_pathology)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_clerk)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_sweeper)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_nw)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_bed)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_icu)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.x_ray_availabilaty)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.ct_scan_availability)}</td>
                        <td className="px-2 py-1 text-text-muted">{_(hp?.availability_of_pathology_testing)}</td>
                        <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                        <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                      </>
                    )}
                    <td className="px-2 py-1 space-x-1">
                      <Link href={`/organizations/${o.id}`} className="rounded border border-primary/50 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10">View profile</Link>
                      {deptCode !== 'EDUCATION' && deptCode !== 'HEALTH' && (
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                        onClick={async () => {
                          setEditingOrgId(o.id);
                          const p = await profileApi.getCenterProfile(o.id);
                          setNewOrg({
                            ulb_block: String(o.attributes?.ulb_block ?? p?.block_name ?? ''),
                            gp_name: String(o.attributes?.gp_name ?? p?.gram_panchayat ?? ''),
                            ward_village: String(o.attributes?.ward_village ?? p?.village_ward ?? ''),
                            sector: String(o.attributes?.sector ?? p?.sector ?? ''),
                            awc_name: o.name,
                            awc_id: String(p?.center_code ?? ''),
                            building_status: String(p?.building_type ?? ''),
                            latitude: o.latitude != null ? String(o.latitude) : '',
                            longitude: o.longitude != null ? String(o.longitude) : '',
                            lgd_code: String(o.attributes?.lgd_code ?? ''),
                            student_strength: p?.student_strength != null ? String(p.student_strength) : '',
                            cpdo_name: String(p?.cpdo_name ?? ''),
                            cpdo_contact_no: String(p?.cpdo_contact_no ?? ''),
                            supervisor_name: String(p?.supervisor_name ?? ''),
                            supervisor_contact_name: String(p?.supervisor_contact_name ?? ''),
                            aww_name: String(p?.worker_name ?? ''),
                            aww_contact_no: String(p?.aww_contact_no ?? ''),
                            awh_name: String(p?.helper_name ?? ''),
                            awh_contact_no: String(p?.awh_contact_no ?? ''),
                            description: String(p?.description ?? ''),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Edit
                      </button>
                      )}
                      {deptCode === 'EDUCATION' && (
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                        onClick={async () => {
                          setEditingEducationId(o.id);
                          const p = await educationApi.getProfile(o.id) as Record<string, unknown> | undefined;
                          const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                          setNewEducationOrg({
                            block_ulb: v(p?.block_ulb ?? o.attributes?.ulb_block),
                            gp_ward: v(p?.gp_ward ?? o.attributes?.gp_name),
                            village: v(p?.village ?? o.attributes?.ward_village),
                            name_of_school: v(p?.name_of_school ?? o.name),
                            school_id: v(p?.school_id),
                            esst_year: v(p?.esst_year),
                            category: v(p?.category ?? o.attributes?.sector),
                            class_i: v(p?.class_i), class_ii: v(p?.class_ii), class_iii: v(p?.class_iii),
                            class_iv: v(p?.class_iv), class_v: v(p?.class_v), class_vi: v(p?.class_vi),
                            class_vii: v(p?.class_vii), class_viii: v(p?.class_viii), class_ix: v(p?.class_ix), class_x: v(p?.class_x),
                            deo_name: v(p?.deo_name), deo_contact: v(p?.deo_contact),
                            beo_name: v(p?.beo_name), beo_contact: v(p?.beo_contact),
                            brcc_name: v(p?.brcc_name), brcc_contact: v(p?.brcc_contact),
                            crcc_name: v(p?.crcc_name), crcc_contact: v(p?.crcc_contact),
                            name_of_hm: v(p?.name_of_hm), contact_of_hm: v(p?.contact_of_hm),
                            no_of_ts: v(p?.no_of_ts), no_of_nts: v(p?.no_of_nts),
                            no_of_tgp_pcm: v(p?.no_of_tgp_pcm), no_of_tgp_cbz: v(p?.no_of_tgp_cbz), no_of_tgt_arts: v(p?.no_of_tgt_arts),
                            building_status: v(p?.building_status), no_of_rooms: v(p?.no_of_rooms), no_of_smart_class_rooms: v(p?.no_of_smart_class_rooms),
                            science_lab: v(p?.science_lab), toilet_m: v(p?.toilet_m), toilet_f: v(p?.toilet_f),
                            ramp: v(p?.ramp), meeting_hall: v(p?.meeting_hall), staff_common_room: v(p?.staff_common_room),
                            ncc: v(p?.ncc), nss: v(p?.nss), jrc: v(p?.jrc), eco_club: v(p?.eco_club), library: v(p?.library),
                            icc_head_name: v(p?.icc_head_name), icc_head_contact: v(p?.icc_head_contact),
                            play_ground: v(p?.play_ground), cycle_stand: v(p?.cycle_stand),
                            drinking_water_tw: v(p?.drinking_water_tw), drinking_water_tap: v(p?.drinking_water_tap),
                            drinking_water_overhead_tap: v(p?.drinking_water_overhead_tap), drinking_water_aquaguard: v(p?.drinking_water_aquaguard),
                            latitude: o.latitude != null ? String(o.latitude) : '',
                            longitude: o.longitude != null ? String(o.longitude) : '',
                            description: v(p?.description),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Edit
                      </button>
                      )}
                      {deptCode === 'HEALTH' && (
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                        onClick={async () => {
                          setEditingHealthId(o.id);
                          const p = await healthApi.getProfile(o.id) as Record<string, unknown> | undefined;
                          const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                          setNewHealthOrg({
                            block_ulb: v(p?.block_ulb ?? o.attributes?.ulb_block),
                            gp_ward: v(p?.gp_ward ?? o.attributes?.gp_name),
                            village: v(p?.village ?? o.attributes?.ward_village),
                            latitude: o.latitude != null ? String(o.latitude) : '',
                            longitude: o.longitude != null ? String(o.longitude) : '',
                            name: v(p?.name ?? o.name),
                            institution_id: v(p?.institution_id),
                            category: v(p?.category),
                            inst_head_name: v(p?.inst_head_name),
                            inst_head_contact: v(p?.inst_head_contact),
                            no_of_ts: v(p?.no_of_ts),
                            no_of_nts: v(p?.no_of_nts),
                            no_of_mo: v(p?.no_of_mo),
                            no_of_pharmacist: v(p?.no_of_pharmacist),
                            no_of_anm: v(p?.no_of_anm),
                            no_of_health_worker: v(p?.no_of_health_worker),
                            no_of_pathology: v(p?.no_of_pathology),
                            no_of_clerk: v(p?.no_of_clerk),
                            no_of_sweeper: v(p?.no_of_sweeper),
                            no_of_nw: v(p?.no_of_nw),
                            no_of_bed: v(p?.no_of_bed),
                            no_of_icu: v(p?.no_of_icu),
                            x_ray_availabilaty: v(p?.x_ray_availabilaty),
                            ct_scan_availability: v(p?.ct_scan_availability),
                            availability_of_pathology_testing: v(p?.availability_of_pathology_testing),
                            description: v(p?.description),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Edit
                      </button>
                      )}
                      <button
                        type="button"
                        className="rounded border border-red-500 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(o.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {!orgs.length && (
                  <tr>
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={deptCode === 'ICDS' || deptCode === 'AWC_ICDS' ? 21 : deptCode === 'HEALTH' ? 27 : deptCode === 'EDUCATION' ? 61 : 10}>
                      No organizations yet for your department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
              <span>Page {page + 1}</span>
              <div className="space-x-2">
                <button
                  type="button"
                  disabled={page === 0 || !me?.department_id}
                  className="rounded border border-border px-2 py-1 text-[11px] hover:bg-gray-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!me?.department_id || page === 0) return;
                    const newPage = page - 1;
                    const list = await organizationsApi.listByDepartment(me.department_id, {
                      skip: newPage * PAGE_SIZE,
                      limit: PAGE_SIZE,
                    });
                    setOrgs(list);
                    setPage(newPage);
                    setHasMore(list.length === PAGE_SIZE);
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!hasMore || !me?.department_id}
                  className="rounded border border-border px-2 py-1 text-[11px] hover:bg-gray-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!me?.department_id || !hasMore) return;
                    const newPage = page + 1;
                    const list = await organizationsApi.listByDepartment(me.department_id, {
                      skip: newPage * PAGE_SIZE,
                      limit: PAGE_SIZE,
                    });
                    setOrgs(list);
                    setPage(newPage);
                    setHasMore(list.length === PAGE_SIZE);
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

