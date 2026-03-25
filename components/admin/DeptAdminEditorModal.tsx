'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Department, User } from '../../services/api';
import { adminApi } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

export interface DeptAdminEditorModalProps {
  open: boolean;
  admin: User | null;
  departments: Department[];
  onClose: () => void;
  onSaved: (updated: User) => void;
}

export function DeptAdminEditorModal({
  open,
  admin,
  departments,
  onClose,
  onSaved,
}: DeptAdminEditorModalProps) {
  const { language } = useLanguage();
  const [fullName, setFullName] = useState(admin?.full_name ?? '');
  const [departmentId, setDepartmentId] = useState<number | ''>(admin?.department_id ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState<boolean>(admin?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form fields when opening or switching the selected admin.
  useEffect(() => {
    if (!open || !admin) return;
    setFullName(admin.full_name ?? '');
    setDepartmentId(admin.department_id ?? '');
    setIsActive(Boolean(admin.is_active));
    setPassword('');
    setError(null);
  }, [open, admin?.id]);

  const title = useMemo(() => {
    if (!admin) return t('super.admins.edit', language);
    return `${t('super.admins.edit', language)}: ${admin.full_name}`;
  }, [admin, language]);

  if (!open || !admin) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: { full_name?: string; department_id?: number; password?: string; is_active?: boolean } = {};
      if (fullName.trim() && fullName.trim() !== admin.full_name) payload.full_name = fullName.trim();
      if (departmentId !== '' && departmentId !== admin.department_id) payload.department_id = Number(departmentId);
      if (password.trim()) payload.password = password;
      if (isActive !== admin.is_active) payload.is_active = isActive;

      const updated = await adminApi.updateAdmin(admin.id, payload);
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('super.create.errorFailed', language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={t('super.sidebar.close', language)}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-600">{admin.email}</p>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                {t('super.create.fullName', language)}
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                {t('super.create.department', language)}
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('super.create.selectDepartment', language)}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                {t('super.admins.newPasswordOptional', language)}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('dept.profile.passwordPlaceholder', language)}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-700">{t('super.admins.status', language)}</span>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                {isActive ? t('super.admins.active', language) : t('super.admins.inactive', language)}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('super.sidebar.close', language)}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60 disabled:pointer-events-none"
            >
              {saving ? t('super.admins.saving', language) : t('super.admins.save', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

