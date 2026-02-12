'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { authApi, setToken, clearToken } from '../../../../services/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
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
        setError('This login is only for super admin. Use department admin login instead.');
        return;
      }
      router.push('/admin/super');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text">Super admin login</h1>
        <p className="mt-1 text-xs text-text-muted">
          Use the super admin credentials to manage departments and department admins.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1 text-sm">
            <label className="block text-text">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 text-sm">
            <label className="block text-text">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

