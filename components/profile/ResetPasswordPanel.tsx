'use client';

import { FormEvent, useMemo, useState } from 'react';
import { authApi } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

export function ResetPasswordPanel() {
  const { language } = useLanguage();
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cooldownSeconds = useMemo(() => {
    if (!cooldownUntilMs) return 0;
    const left = Math.ceil((cooldownUntilMs - Date.now()) / 1000);
    return Math.max(0, left);
  }, [cooldownUntilMs]);

  const canRequestOtp = !requesting && cooldownSeconds === 0;

  const requestOtp = async () => {
    setError(null);
    setStatus(null);
    setRequesting(true);
    try {
      const res = await authApi.requestPasswordOtp();
      setOtpSent(true);
      setStatus(res.message || t('dept.profile.otpSent', language));
      setCooldownUntilMs(Date.now() + (res.resend_after_seconds || 60) * 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('dept.profile.error.requestOtp', language));
    } finally {
      setRequesting(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!otp.trim()) {
      setError(t('dept.profile.error.otpRequired', language));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('dept.profile.error.passwordMin', language));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('dept.profile.error.passwordMismatch', language));
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPasswordWithOtp({
        otp: otp.trim(),
        new_password: newPassword,
      });
      setStatus(res.message || t('dept.profile.passwordUpdated', language));
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('dept.profile.error.resetFailed', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {t('dept.profile.resetPassword.title', language)}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {t('dept.profile.resetPassword.subtitle', language)}
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={requestOtp}
            disabled={!canRequestOtp}
            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60 disabled:pointer-events-none"
          >
            {requesting
              ? t('dept.profile.requestingOtp', language)
              : otpSent
                ? t('dept.profile.resendOtp', language)
                : t('dept.profile.requestOtp', language)}
          </button>
          {cooldownSeconds > 0 && (
            <span className="text-xs text-slate-600">
              {t('dept.profile.cooldown', language)} {cooldownSeconds}s
            </span>
          )}
        </div>

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700">
              {t('dept.profile.otpLabel', language)}
            </label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              placeholder={t('dept.profile.otpPlaceholder', language)}
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700">
              {t('dept.profile.newPassword', language)}
            </label>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              placeholder={t('dept.profile.passwordPlaceholder', language)}
              required
              minLength={8}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              {t('dept.profile.confirmPassword', language)}
            </label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              placeholder={t('dept.profile.passwordPlaceholder', language)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          {status && (
            <p className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {status}
            </p>
          )}

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 disabled:pointer-events-none"
            >
              {submitting ? t('dept.profile.updating', language) : t('dept.profile.updatePassword', language)}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

