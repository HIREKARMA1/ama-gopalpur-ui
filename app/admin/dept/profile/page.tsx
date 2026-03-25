'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { authApi, clearToken, User } from '../../../../services/api';
import { Loader } from '../../../../components/common/Loader';
import { ResetPasswordPanel } from '../../../../components/profile/ResetPasswordPanel';

export default function DeptAdminProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await authApi.me();
        if (cancelled) return;
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
      } catch {
        clearToken();
        router.replace('/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel={t('dept.profile.title', language)}
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/profile', labelKey: 'dept.profile.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-3xl space-y-6 pb-20">
        {loading && !me ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h1 className="text-base font-semibold text-slate-900">
                {t('dept.profile.title', language)}
              </h1>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{t('dept.profile.fullName', language)}</p>
                  <p className="mt-1 font-semibold text-slate-900">{me?.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{t('dept.profile.email', language)}</p>
                  <p className="mt-1 font-semibold text-slate-900">{me?.email || '—'}</p>
                </div>
              </div>
            </section>

            <ResetPasswordPanel />
          </>
        )}
      </div>
    </SuperAdminDashboardLayout>
  );
}

