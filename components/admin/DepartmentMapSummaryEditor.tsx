'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { DEPARTMENT_MAP_SUMMARY_MAX_LENGTH } from '../../lib/departmentMapSummary';

export function DepartmentMapSummaryEditor({
  departmentId,
  initialSummary,
  onSaved,
  saveAction,
  titleKey,
  subtitleKey,
  labelKey,
  placeholderKey,
  charCountKey,
  saveKey,
  savingKey,
  savedKey,
  errorKey,
}: {
  departmentId: number;
  initialSummary?: string | null;
  onSaved: (summary: string | null) => void;
  saveAction: (id: number, map_summary: string | null) => Promise<void>;
  titleKey: MessageKey;
  subtitleKey: MessageKey;
  labelKey: MessageKey;
  placeholderKey: MessageKey;
  /** Expects `{used}` and `{max}` placeholders */
  charCountKey: MessageKey;
  saveKey: MessageKey;
  savingKey: MessageKey;
  savedKey: MessageKey;
  errorKey: MessageKey;
}) {
  const { language } = useLanguage();
  const [value, setValue] = useState(initialSummary ?? '');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(initialSummary ?? '');
  }, [departmentId, initialSummary]);

  const used = value.length;
  const charHint = t(charCountKey, language)
    .replace('{used}', String(used))
    .replace('{max}', String(DEPARTMENT_MAP_SUMMARY_MAX_LENGTH));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const trimmed = value.trim();
      const payload = trimmed.length ? trimmed.slice(0, DEPARTMENT_MAP_SUMMARY_MAX_LENGTH) : null;
      await saveAction(departmentId, payload);
      onSaved(payload);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(errorKey, language));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4 text-sm">
      <h2 className="font-semibold text-text">{t(titleKey, language)}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t(subtitleKey, language).replace('{max}', String(DEPARTMENT_MAP_SUMMARY_MAX_LENGTH))}
      </p>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-text">{t(labelKey, language)}</span>
          <textarea
            value={value}
            maxLength={DEPARTMENT_MAP_SUMMARY_MAX_LENGTH}
            onChange={(e) => setValue(e.target.value.slice(0, DEPARTMENT_MAP_SUMMARY_MAX_LENGTH))}
            rows={5}
            placeholder={t(placeholderKey, language)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-muted-foreground">{charHint}</span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? t(savingKey, language) : t(saveKey, language)}
          </button>
          {savedFlash && <span className="text-[11px] text-green-600">{t(savedKey, language)}</span>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </section>
  );
}
