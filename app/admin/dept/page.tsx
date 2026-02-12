'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, organizationsApi, clearToken, Organization, User } from '../../../services/api';
import { Loader } from '../../../components/common/Loader';

export default function DepartmentAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [newOrg, setNewOrg] = useState({
    ulb_block: '',
    gp_name: '',
    ward_village: '',
    sector: '',
    awc_name: '',
    latitude: '',
    longitude: '',
    lgd_code: '',
  });
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await authApi.me();
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/admin/login');
          return;
        }
        setMe(user);
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
      const formData = new FormData();
      formData.append('file', file);
      // department_id is enforced by backend for dept admin; no need to send.
      const resp = await fetch('/api/v1/organizations/bulk_csv', {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || `Upload failed with status ${resp.status}`);
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
                setNewOrg({
                  ulb_block: '',
                  gp_name: '',
                  ward_village: '',
                  sector: '',
                  awc_name: '',
                  latitude: '',
                  longitude: '',
                  lgd_code: '',
                });
                setEditingOrgId(null);
              } catch (err: any) {
                setError(err.message || 'Failed to create organization');
              } finally {
                setCreating(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="block text-text">ULB / Block Name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.ulb_block}
                onChange={(e) => setNewOrg((s) => ({ ...s, ulb_block: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">GP Name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.gp_name}
                onChange={(e) => setNewOrg((s) => ({ ...s, gp_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Ward / Village Name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.ward_village}
                onChange={(e) => setNewOrg((s) => ({ ...s, ward_village: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Sector</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.sector}
                onChange={(e) => setNewOrg((s) => ({ ...s, sector: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">AWC Name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.awc_name}
                onChange={(e) => setNewOrg((s) => ({ ...s, awc_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">LGD Code</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.lgd_code}
                onChange={(e) => setNewOrg((s) => ({ ...s, lgd_code: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Latitude</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.latitude}
                onChange={(e) => setNewOrg((s) => ({ ...s, latitude: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Longitude</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newOrg.longitude}
                onChange={(e) => setNewOrg((s) => ({ ...s, longitude: e.target.value }))}
                required
              />
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

        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Bulk CSV upload</h2>
          <p className="mt-1 text-xs text-text-muted">
            Upload ICDS AWC CSV (same format as backend import). Existing AWC organizations for this
            department will be replaced.
          </p>
          <form className="mt-3 flex flex-col gap-2 text-xs md:flex-row md:items-center" onSubmit={handleUpload}>
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
                  <th className="px-2 py-1 text-left font-medium text-text">Sl. No.</th>
                  <th className="px-2 py-1 text-left font-medium text-text">AWC Name</th>
                  <th className="px-2 py-1 text-left font-medium text-text">ULB / Block</th>
                  <th className="px-2 py-1 text-left font-medium text-text">GP Name</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Ward / Village</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Sector</th>
                  <th className="px-2 py-1 text-left font-medium text-text">LGD Code</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Latitude</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Longitude</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, idx) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="px-2 py-1 text-text-muted">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-2 py-1">{o.name}</td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.ulb_block ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.gp_name ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.ward_village ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.sector ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.lgd_code ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.latitude != null ? o.latitude.toFixed(6) : '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.longitude != null ? o.longitude.toFixed(6) : '—'}
                    </td>
                    <td className="px-2 py-1 space-x-1">
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                        onClick={() => {
                          setEditingOrgId(o.id);
                          setNewOrg({
                            ulb_block: String(o.attributes?.ulb_block ?? ''),
                            gp_name: String(o.attributes?.gp_name ?? ''),
                            ward_village: String(o.attributes?.ward_village ?? ''),
                            sector: String(o.attributes?.sector ?? ''),
                            awc_name: o.name,
                            latitude: o.latitude != null ? String(o.latitude) : '',
                            longitude: o.longitude != null ? String(o.longitude) : '',
                            lgd_code: String(o.attributes?.lgd_code ?? ''),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-500 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(o.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!orgs.length && (
                  <tr>
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={10}>
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

