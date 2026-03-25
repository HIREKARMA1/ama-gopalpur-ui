'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminDashboardLayout } from '../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../components/i18n/LanguageContext';
import { t } from '../../../components/i18n/messages';
import { Loader } from '../../../components/common/Loader';
import { adminApi, departmentsApi, authApi, clearToken, Department, User } from '../../../services/api';
import { DeptAdminsTable } from '../../../components/admin/DeptAdminsTable';
import { DeptAdminEditorModal } from '../../../components/admin/DeptAdminEditorModal';

export default function SuperAdminPage() {
  const router = useRouter();
  const { language } = useLanguage();
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
  const [editing, setEditing] = useState<User | null>(null);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, depts, list] = await Promise.all([
          authApi.me(),
          departmentsApi.list(),
          adminApi.listAdmins(),
        ]);
        if (user.role !== 'SUPER_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        setDepartments(depts);
        setAdmins(list);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('super.error.loadFailed', language));
        clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.full_name || !newAdmin.password || !newAdmin.department_id) {
      setError(t('super.create.errorRequired', language));
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await adminApi.createAdmin(newAdmin);
      setAdmins((prev) => [created, ...prev]);
      setNewAdmin({ email: '', full_name: '', password: '', department_id: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('super.create.errorFailed', language));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (admin: User) => {
    setSavingRowId(admin.id);
    setError(null);
    try {
      const updated = await adminApi.updateAdmin(admin.id, { is_active: !admin.is_active });
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('super.create.errorFailed', language));
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDelete = async (admin: User) => {
    if (!window.confirm(t('super.admins.confirmDelete', language))) return;
    setSavingRowId(admin.id);
    setError(null);
    try {
      await adminApi.deleteAdmin(admin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('super.create.errorFailed', language));
    } finally {
      setSavingRowId(null);
    }
  };

  if (!me && !loading) {
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('super.panel.title', language)}
      sectionLabel={t('super.sidebar.dashboard', language)}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-5">
        {loading && !me ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

        {/* Create department admin – teal section */}
        <section className="rounded-2xl border border-teal-200/80 bg-teal-500/5 shadow-sm overflow-hidden">
          <div className="border-b border-teal-200/60 bg-teal-500/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-teal-900 sm:text-base">
              {t('super.create.title', language)}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              {t('super.create.subtitle', language)}
            </p>
          </div>
          <div className="px-5 pb-4 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 sm:text-sm">
                  {t('super.create.fullName', language)}
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 sm:text-sm">
                  {t('login.email', language)}
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 sm:text-sm">
                  {t('login.password', language)}
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 sm:text-sm">
                  {t('super.create.department', language)}
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  value={newAdmin.department_id || ''}
                  onChange={(e) =>
                    setNewAdmin((s) => ({ ...s, department_id: Number(e.target.value) || 0 }))
                  }
                >
                  <option value="">{t('super.create.selectDepartment', language)}</option>
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
              className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {creating ? t('super.create.creating', language) : t('super.create.button', language)}
            </button>
          </div>
        </section>

        {/* Department admins list – indigo section */}
        <section className="rounded-2xl border border-indigo-200/80 bg-indigo-500/5 shadow-sm overflow-hidden">
          <div className="border-b border-indigo-200/60 bg-indigo-500/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-indigo-900 sm:text-base">
              {t('super.admins.title', language)}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
              {t('super.admins.subtitle', language)}
            </p>
            {savingRowId != null && (
              <p className="mt-1 text-[11px] text-slate-600">
                {t('super.admins.saving', language)}
              </p>
            )}
          </div>
          <DeptAdminsTable
            admins={admins}
            departments={departments}
            onEdit={(a) => setEditing(a)}
            onToggleActive={handleToggleActive}
            onDelete={(a) => handleDelete(a)}
          />
        </section>
          </>
        )}
      </div>

      <DeptAdminEditorModal
        open={!!editing}
        admin={editing}
        departments={departments}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }}
      />
    </SuperAdminDashboardLayout>
  );
}

