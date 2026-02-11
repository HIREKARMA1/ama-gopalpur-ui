'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, departmentsApi, authApi, clearToken, Department, User } from '../../../services/api';
import { Loader } from '../../../components/common/Loader';

export default function SuperAdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    full_name: '',
    password: '',
    department_id: 0,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, depts, list] = await Promise.all([
          authApi.me(),
          departmentsApi.list(),
          adminApi.listAdmins(),
        ]);
        if (user.role !== 'SUPER_ADMIN') {
          router.replace('/admin/login');
          return;
        }
        setMe(user);
        setDepartments(depts);
        setAdmins(list);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin data');
        clearToken();
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.full_name || !newAdmin.password || !newAdmin.department_id) {
      setError('All fields are required to create a department admin.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await adminApi.createAdmin(newAdmin);
      setAdmins((prev) => [created, ...prev]);
      setNewAdmin({ email: '', full_name: '', password: '', department_id: 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!me) {
    return null;
  }

  return (
    <div className="page-container">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-text">Super admin panel</h1>
          <p className="mt-1 text-xs text-text-muted">
            Manage department admins and high-level configuration.
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
          <h2 className="text-sm font-semibold text-text">Create department admin</h2>
          <p className="mt-1 text-xs text-text-muted">
            Super admin can create department admins. There is no direct signup.
          </p>
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-text">Full name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newAdmin.full_name}
                onChange={(e) => setNewAdmin((s) => ({ ...s, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Department</label>
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={newAdmin.department_id || ''}
                onChange={(e) =>
                  setNewAdmin((s) => ({ ...s, department_id: Number(e.target.value) || 0 }))
                }
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateAdmin}
            disabled={creating}
            className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create admin'}
          </button>
        </section>

        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-sm font-semibold text-text">Department admins</h2>
          <p className="mt-1 text-xs text-text-muted">
            Existing department admins (ICDS, Education, etc.).
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-background-muted">
                  <th className="px-2 py-1 text-left font-medium text-text">Name</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Email</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Department</th>
                  <th className="px-2 py-1 text-left font-medium text-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-border/60">
                    <td className="px-2 py-1">{a.full_name}</td>
                    <td className="px-2 py-1">{a.email}</td>
                    <td className="px-2 py-1 text-text-muted">
                      {departments.find((d) => d.id === a.department_id)?.name || '—'}
                    </td>
                    <td className="px-2 py-1 text-text-muted">
                      {a.is_active ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
                {!admins.length && (
                  <tr>
                    <td className="px-2 py-2 text-xs text-text-muted" colSpan={4}>
                      No department admins yet.
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

