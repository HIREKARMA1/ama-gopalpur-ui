'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { Navbar } from '../../../../components/layout/Navbar';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { authApi, setToken, clearToken } from '../../../../services/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in as super admin, redirect to dashboard
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        if (me.role === 'SUPER_ADMIN') {
          router.replace('/admin/super');
        }
      })
      .catch(() => {
        // ignore, user not logged in
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

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
                <div className="relative">
                  <input
                    id="super-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
