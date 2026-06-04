/** Portfolio JSON keys saved in addition to diploma CSV columns. */
export const DIPLOMA_PORTFOLIO_EXTRA_KEYS = [
  'hero_primary_tagline_en',
  'hero_slide_1',
  'hero_slide_2',
  'hero_slide_3',
  'about_image',
  'welcome_text_en',
  'values_text_en',
  'headmaster_photo',
  'name_of_hm',
  'headmaster_message_en',
  'hm_qualification',
  'hm_period_from',
  'hm_period_to',
  'hm_period_currently_continuing',
  'headmaster_contact',
  'headmaster_email',
  'vision_text_en',
  'mission_text_en',
  'placement_officer_name',
  'placement_officer_contact',
  'placement_officer_email',
  'placement_officer_qualification',
  'placement_officer_photo',
  'placement_officer_experience_from',
  'placement_officer_experience_to',
  'placement_partners',
  'placement_description',
  'placement_percentage_last_year',
  'highest_package_lpa',
  'diploma_admin_cards_json',
  'department_programme_cards_json',
  'student_life_cards_json',
  'facility_cards_json',
  'faculty_cards_json',
  'photo_gallery_json',
  'notice_board_json',
] as const;

export const DIPLOMA_PROFILE_JSON_ARRAY_KEYS: Record<string, string> = {
  facility_cards_json: 'facility_cards',
  department_programme_cards_json: 'department_programme_cards',
  student_life_cards_json: 'student_life_cards',
  faculty_cards_json: 'faculty_cards',
  photo_gallery_json: 'photo_gallery',
  diploma_admin_cards_json: 'diploma_admin_cards',
  notice_board_json: 'notice_board',
};

export function applyDiplomaPortfolioExtrasToProfile(
  profileData: Record<string, unknown>,
  eduFormValues: Record<string, string>,
  parseJsonArray: (raw: string) => unknown[],
): void {
  for (const key of DIPLOMA_PORTFOLIO_EXTRA_KEYS) {
    const v = eduFormValues[key];
    if (v != null && String(v).trim() !== '') profileData[key] = v;
  }
  const periodFrom = String(eduFormValues.hm_period_from || '').trim();
  const periodTo = String(eduFormValues.hm_period_to || '').trim();
  const isCurrent = String(eduFormValues.hm_period_currently_continuing || '').toLowerCase() === 'true';
  if (periodFrom || periodTo || isCurrent) {
    profileData.hm_experience = isCurrent
      ? `${periodFrom || 'N/A'} to Present`
      : `${periodFrom || 'N/A'} to ${periodTo || 'N/A'}`;
  }
  const college = String(eduFormValues.college_name || '').trim();
  if (college) {
    profileData.college_name = college;
    profileData.name_of_college = college;
  }
  if (!String(profileData.placement_officer_name || '').trim()) {
    const tpo = String(eduFormValues.tpo_name || '').trim();
    if (tpo) profileData.placement_officer_name = tpo;
  }
  if (!String(profileData.placement_officer_contact || '').trim()) {
    const tpoC = String(eduFormValues.tpo_contact || '').trim();
    if (tpoC) profileData.placement_officer_contact = tpoC;
  }
  for (const [jsonKey, profileKey] of Object.entries(DIPLOMA_PROFILE_JSON_ARRAY_KEYS)) {
    profileData[profileKey] = parseJsonArray(eduFormValues[jsonKey] || '');
  }
}

export function loadDiplomaPortfolioFormExtras(
  values: Record<string, string>,
  p: Record<string, unknown> | undefined,
  v: (x: unknown) => string,
): void {
  for (const key of DIPLOMA_PORTFOLIO_EXTRA_KEYS) {
    values[key] = v(p?.[key]);
  }
  values.facility_cards_json = Array.isArray(p?.facility_cards) ? JSON.stringify(p.facility_cards) : '[]';
  values.department_programme_cards_json = Array.isArray(p?.department_programme_cards)
    ? JSON.stringify(p.department_programme_cards)
    : '[]';
  values.student_life_cards_json = Array.isArray(p?.student_life_cards) ? JSON.stringify(p.student_life_cards) : '[]';
  values.faculty_cards_json = Array.isArray(p?.faculty_cards) ? JSON.stringify(p.faculty_cards) : '[]';
  values.photo_gallery_json = Array.isArray(p?.photo_gallery) ? JSON.stringify(p.photo_gallery) : '[]';
  values.diploma_admin_cards_json = Array.isArray(p?.diploma_admin_cards)
    ? JSON.stringify(p.diploma_admin_cards)
    : '[]';
  values.notice_board_json = Array.isArray(p?.notice_board) ? JSON.stringify(p.notice_board) : '[]';
  if (!values.placement_officer_name) {
    values.placement_officer_name = v(p?.tpo_name);
  }
  if (!values.placement_officer_contact) {
    values.placement_officer_contact = v(p?.tpo_contact);
  }
}
