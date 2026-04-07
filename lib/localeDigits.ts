/** Odia numerals (Unicode Oriya digits U+0B66–U+0B6F). */
const ODIA_DIGITS = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'] as const;

/**
 * Format a non-negative integer for display: Western digits in English, Odia digits in Odia.
 */
export function formatLocaleDigits(value: number, lang: 'en' | 'or'): string {
  if (!Number.isFinite(value)) return String(value);
  const n = Math.max(0, Math.trunc(value));
  const s = String(n);
  if (lang !== 'or') return s;
  return s.replace(/\d/g, (ch) => ODIA_DIGITS[Number(ch)] ?? ch);
}
