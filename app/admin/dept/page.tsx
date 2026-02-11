'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, departmentsApi, organizationsApi, clearToken, Organization, User } from '../../../services/api';
import { Loader } from '../../../components/common/Loader';

export default function DepartmentAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
          const list = await organizationsApi.listByDepartment(user.department_id);
          setOrgs(list);
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
        const list = await organizationsApi.listByDepartment(me.department_id);
        setOrgs(list);
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
                  <th className="px-2 py-1 text-left font-medium text-text">Name</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Type</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Address</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Sector / LGD</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="px-2 py-1">{o.name}</td>
                    <td className="px-2 py-1 text-text-muted">{o.type}</td>
                    <td className="px-2 py-1 text-text-muted">{o.address || '—'}</td>
                    <td className="px-2 py-1 text-text-muted">
                      {o.attributes?.sector ? `Sector: ${o.attributes.sector}` : ''}
                      {o.attributes?.lgd_code ? ` · LGD: ${o.attributes.lgd_code}` : ''}
                    </td>
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={5}>
                      No organizations yet for your department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

