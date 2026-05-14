/** Tahasil public portfolio (Revenue Govt Land) — form defaults and profile merge for admin + API. */

export const TAHASIL_PORTFOLIO_EMPTY_FORM: Record<string, string> = {
  tahasil_display_name: '',
  tahasil_hero_tagline: '',
  tahasil_hero_1: '',
  tahasil_hero_2: '',
  tahasil_hero_3: '',
  tahasil_official_name: '',
  tahasil_district: '',
  tahasil_about_text: '',
  tahasil_office_image: '',
  tahasil_full_office_address: '',
  tahasil_head_name: '',
  tahasil_head_designation: '',
  tahasil_head_message: '',
  tahasil_head_photo: '',
  tahasil_head_contact: '',
  tahasil_head_email: '',
  tahasil_office_hours: '',
  tahasil_head_experience: '',
  tahasil_head_qualification: '',
  tahasil_key_contact_cards_json: '[]',
  tahasil_ri_circle_cards_json: '[]',
  tahasil_monitoring_rows_json: '[]',
  tahasil_photo_gallery_json: '[]',
  tahasil_govt_parcel_count: '',
  tahasil_govt_parcel_area_value: '',
  tahasil_govt_parcel_area_unit: '',
  tahasil_helpdesk_phone: '',
  tahasil_public_email: '',
  tahasil_full_address: '',
  tahasil_public_office_hours: '',
  tahasil_website_url: '',
  tahasil_bhulekh_url: '',
};

function v(x: unknown): string {
  return x != null && String(x).trim() !== '' ? String(x).trim() : '';
}

/** First non-empty string among profile keys (CSV + portfolio aliases). */
function firstV(p: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const s = v(p[k]);
    if (s) return s;
  }
  return '';
}

function jsonArrString(raw: unknown, fallback: string): string {
  if (raw == null) return fallback;
  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return fallback;
}

/** Hydrate string form state from merged organization profile (CSV + portfolio keys). */
export function mergeTahasilPortfolioFromProfile(profile: Record<string, unknown> | null | undefined): Record<string, string> {
  const p = profile && typeof profile === 'object' ? profile : {};
  return {
    ...TAHASIL_PORTFOLIO_EMPTY_FORM,
    tahasil_display_name: firstV(p, ['tahasil_display_name', 'tahsil_name', 'tahsildar_name']),
    tahasil_hero_tagline: firstV(p, ['tahasil_hero_tagline', 'description']),
    tahasil_hero_1: v(p.tahasil_hero_1),
    tahasil_hero_2: v(p.tahasil_hero_2),
    tahasil_hero_3: v(p.tahasil_hero_3),
    tahasil_official_name: firstV(p, ['tahasil_official_name', 'tahsil_name']),
    tahasil_district: v(p.tahasil_district),
    tahasil_about_text: firstV(p, ['tahasil_about_text', 'description']),
    tahasil_office_image: v(p.tahasil_office_image),
    tahasil_full_office_address: firstV(p, ['tahasil_full_office_address']),
    tahasil_head_name: firstV(p, ['tahasil_head_name', 'tahsildar_name']),
    tahasil_head_designation: v(p.tahasil_head_designation),
    tahasil_head_message: v(p.tahasil_head_message),
    tahasil_head_photo: v(p.tahasil_head_photo),
    tahasil_head_contact: firstV(p, ['tahasil_head_contact', 'contact_number']),
    tahasil_head_email: firstV(p, ['tahasil_head_email', 'email_id']),
    tahasil_office_hours: v(p.tahasil_office_hours),
    tahasil_head_experience: v(p.tahasil_head_experience),
    tahasil_head_qualification: v(p.tahasil_head_qualification),
    tahasil_key_contact_cards_json: jsonArrString(p.tahasil_key_contact_cards, '[]'),
    tahasil_ri_circle_cards_json: jsonArrString(p.tahasil_ri_circle_cards, '[]'),
    tahasil_monitoring_rows_json: jsonArrString(p.tahasil_monitoring_rows, '[]'),
    tahasil_photo_gallery_json: jsonArrString(p.tahasil_photo_gallery, '[]'),
    tahasil_govt_parcel_count: v(p.tahasil_govt_parcel_count),
    tahasil_govt_parcel_area_value: v(p.tahasil_govt_parcel_area_value),
    tahasil_govt_parcel_area_unit: v(p.tahasil_govt_parcel_area_unit),
    tahasil_helpdesk_phone: firstV(p, ['tahasil_helpdesk_phone', 'contact_number']),
    tahasil_public_email: firstV(p, ['tahasil_public_email', 'email_id']),
    tahasil_full_address: firstV(p, ['tahasil_full_address', 'tahasil_full_office_address']),
    tahasil_public_office_hours: v(p.tahasil_public_office_hours),
    tahasil_website_url: v(p.tahasil_website_url),
    tahasil_bhulekh_url: v(p.tahasil_bhulekh_url),
  };
}

function parseJsonArray(raw: string): unknown[] {
  if (!raw.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/** Build profile patch for `revenueLandApi.putProfile` (merges with existing profile on server). */
export function tahasilPortfolioFormToProfilePayload(form: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const str = (k: keyof typeof TAHASIL_PORTFOLIO_EMPTY_FORM) => {
    const val = (form[k] ?? '').trim();
    if (val) out[k] = val;
  };
  (Object.keys(TAHASIL_PORTFOLIO_EMPTY_FORM) as (keyof typeof TAHASIL_PORTFOLIO_EMPTY_FORM)[]).forEach((k) => {
    if (k.endsWith('_json')) {
      const key = k.replace(/_json$/, '') as 'tahasil_key_contact_cards';
      out[key] = parseJsonArray(form[k] ?? '[]');
      return;
    }
    str(k);
  });
  return out;
}
