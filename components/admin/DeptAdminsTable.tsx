'use client';

import type { Department, User } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

export interface DeptAdminsTableProps {
  admins: User[];
  departments: Department[];
  onEdit: (admin: User) => void;
  onToggleActive: (admin: User) => void;
  onDelete: (admin: User) => void;
}

export function DeptAdminsTable({
  admins,
  departments,
  onEdit,
  onToggleActive,
  onDelete,
}: DeptAdminsTableProps) {
  const { language } = useLanguage();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200/60 bg-indigo-500/10">
            <th className="px-4 py-3 text-left font-semibold text-slate-800">
              {t('super.admins.name', language)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-800">
              {t('super.admins.email', language)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-800">
              {t('super.admins.department', language)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-800">
              {t('super.admins.status', language)}
            </th>
            <th className="px-4 py-3 text-right font-semibold text-slate-800">
              {t('super.admins.actions', language)}
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => {
            const dept = departments.find((d) => d.id === a.department_id);
            return (
              <tr
                key={a.id}
                className="border-b border-slate-200/50 transition-colors hover:bg-white/40"
              >
                <td className="px-4 py-3 font-medium text-slate-900">{a.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{a.email}</td>
                <td className="px-4 py-3 text-slate-600">{dept ? `${dept.name} (${dept.code})` : '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.is_active ? t('super.admins.active', language) : t('super.admins.inactive', language)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {t('super.admins.edit', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(a)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                        a.is_active ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {a.is_active ? t('super.admins.deactivate', language) : t('super.admins.activate', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(a)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      {t('super.admins.delete', language)}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {!admins.length && (
            <tr>
              <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                {t('super.admins.empty', language)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

