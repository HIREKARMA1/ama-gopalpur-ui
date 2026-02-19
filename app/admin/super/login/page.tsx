'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { authApi, setToken, clearToken } from '../../../../services/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      clearToken();
      const token = await authApi.login(email, password);
      setToken(token.access_token);
      const me = await authApi.me();
      if (me.role !== 'SUPER_ADMIN') {
        clearToken();
        setError(t('login.error.superOnly', language));
        return;
      }
      router.push('/admin/super');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.error.failed', language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-orange-200/80 bg-orange-500/5 shadow-lg overflow-hidden">
            <div className="border-b border-orange-200/60 bg-orange-500/10 px-6 py-4">
              <h1 className="text-xl font-bold text-orange-900">
                {t('login.super.title', language)}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {t('login.super.subtitle', language)}
              </p>
            </div>
            <form className="p-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="super-login-email" className="block text-sm font-medium text-slate-700">
                  {t('login.email', language)}
                </label>
                <input
                  id="super-login-email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="super-login-password" className="block text-sm font-medium text-slate-700">
                  {t('login.password', language)}
                </label>
                <input
                  id="super-login-password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200/80">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? t('login.signingIn', language) : t('login.signIn', language)}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
