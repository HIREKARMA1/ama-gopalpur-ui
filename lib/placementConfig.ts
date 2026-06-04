/** Resolve external placement-records page URL (profile overrides env). */
export function resolvePlacementRecordsUrl(profile: Record<string, unknown>): string | null {
  const fromProfile = String(profile.placement_records_url ?? '').trim();
  if (fromProfile) return fromProfile;
  const fromEnv = (process.env.NEXT_PUBLIC_PLACEMENT_RECORDS_URL ?? '').trim();
  return fromEnv || null;
}
