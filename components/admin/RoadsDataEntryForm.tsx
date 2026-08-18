'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { organizationsApi, type Organization } from '../../services/api';
import {
  isGpRoadSector,
  isPwdOrRdRoadSector,
  isSummaryOnlyRoadSector,
  isUsableRoadLatLng,
  mergeRoadEditAttributes,
  parseRoadImageKeys,
  resolveRoadImportGeometry,
  roadImportRowHasMapGeometry,
} from '../../lib/roadsOrganization';

type Props = {
  departmentId: number;
  onCreated?: (org: Organization) => void;
  editingRoad?: Organization | null;
  /** Full form save — parent should exit edit mode. */
  onUpdated?: (org: Organization) => void;
  /** Mid-edit image upload/remove — parent should stay in edit mode. */
  onPatched?: (org: Organization) => void;
  onCancelEdit?: () => void;
};

function toNumberOrNull(value: string): number | null {
  const s = value.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parsePathCoordinatePairs(value: string): Array<[number, number]> {
  const raw = value.trim();
  if (!raw) return [];
  const nums = (raw.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => Number(n));
  if (nums.length < 4) return [];
  const out: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lng = nums[i];
    const lat = nums[i + 1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push([lng, lat]);
  }
  return out;
}

const ROAD_SECTOR_OPTIONS = ['NH', 'SH', 'PWD', 'RD', 'PS', 'GP', 'MUNICIPALITY'] as const;
const RATING_OPTIONS = ['', '1', '2', '3', '4', '5'] as const;

export function RoadsDataEntryForm({
  departmentId,
  onCreated,
  editingRoad = null,
  onUpdated,
  onPatched,
  onCancelEdit,
}: Props) {
  const [roadName, setRoadName] = useState('');
  const [roadCode, setRoadCode] = useState('');
  const [roadSector, setRoadSector] = useState('');
  const [nameOfDivision, setNameOfDivision] = useState('');
  const [scheme, setScheme] = useState('');
  const [block, setBlock] = useState('');
  const [gpWard, setGpWard] = useState('');
  const [village, setVillage] = useState('');
  const [lengthKm, setLengthKm] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [pointAName, setPointAName] = useState('');
  const [pointBName, setPointBName] = useState('');
  const [yearOfConstruction, setYearOfConstruction] = useState('');
  const [lastRepairedDate, setLastRepairedDate] = useState('');
  const [presentCondition, setPresentCondition] = useState('');
  const [issues, setIssues] = useState('');
  const [remarks, setRemarks] = useState('');
  const [conditionBeforeRating, setConditionBeforeRating] = useState('');
  const [conditionAfterRating, setConditionAfterRating] = useState('');
  const [conditionBeforeNotes, setConditionBeforeNotes] = useState('');
  const [conditionAfterNotes, setConditionAfterNotes] = useState('');
  const [sanctionAmount, setSanctionAmount] = useState('');
  const [sanctionDate, setSanctionDate] = useState('');
  const [workCompletedDate, setWorkCompletedDate] = useState('');
  const [beforeImageKeys, setBeforeImageKeys] = useState<string[]>([]);
  const [afterImageKeys, setAfterImageKeys] = useState<string[]>([]);
  const [roadImageKeys, setRoadImageKeys] = useState<string[]>([]);
  const [uploadingPhase, setUploadingPhase] = useState<'before' | 'after' | 'gallery' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEditing = editingRoad != null;
  const isSummaryOnlySector = useMemo(() => isSummaryOnlyRoadSector(roadSector), [roadSector]);
  const showsMaintenanceFields = useMemo(
    () => isPwdOrRdRoadSector(roadSector),
    [roadSector],
  );

  const reset = () => {
    setRoadName('');
    setRoadCode('');
    setRoadSector('');
    setNameOfDivision('');
    setScheme('');
    setBlock('');
    setGpWard('');
    setVillage('');
    setLengthKm('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setPathCoordinates('');
    setPointAName('');
    setPointBName('');
    setYearOfConstruction('');
    setLastRepairedDate('');
    setPresentCondition('');
    setIssues('');
    setRemarks('');
    setConditionBeforeRating('');
    setConditionAfterRating('');
    setConditionBeforeNotes('');
    setConditionAfterNotes('');
    setSanctionAmount('');
    setSanctionDate('');
    setWorkCompletedDate('');
    setBeforeImageKeys([]);
    setAfterImageKeys([]);
    setRoadImageKeys([]);
  };

  useEffect(() => {
    if (!editingRoad) {
      reset();
      return;
    }
    const attrs = (editingRoad.attributes ?? {}) as Record<string, unknown>;
    setRoadName(editingRoad.name ?? '');
    setRoadCode(String(attrs.road_code ?? ''));
    setRoadSector(String(attrs.road_sector ?? ''));
    setNameOfDivision(
      String(attrs.name_of_division ?? attrs.division_name ?? attrs.division ?? ''),
    );
    setScheme(String(attrs.scheme ?? attrs.scheme_name ?? ''));
    setBlock(String(attrs.block ?? editingRoad.address ?? ''));
    setGpWard(String(attrs.gp_ward ?? attrs.gpward ?? ''));
    setVillage(String(attrs.village ?? attrs.village_name ?? ''));
    setLengthKm(String(attrs.length_km ?? ''));
    setStartLat(String(attrs.start_lat ?? ''));
    setStartLng(String(attrs.start_lng ?? ''));
    setEndLat(String(attrs.end_lat ?? ''));
    setEndLng(String(attrs.end_lng ?? ''));
    setPathCoordinates(String(attrs.path_coordinates ?? ''));
    setPointAName(String(attrs.point_a_name ?? ''));
    setPointBName(String(attrs.point_b_name ?? ''));
    setYearOfConstruction(String(attrs.year_of_construction ?? ''));
    setLastRepairedDate(
      String(attrs.last_repaired_date ?? attrs.last_maintenance_date ?? ''),
    );
    setPresentCondition(String(attrs.present_condition ?? ''));
    setIssues(String(attrs.issues ?? ''));
    setRemarks(String(attrs.remarks ?? ''));
    setConditionBeforeRating(String(attrs.condition_before_rating ?? ''));
    setConditionAfterRating(String(attrs.condition_after_rating ?? ''));
    setConditionBeforeNotes(String(attrs.condition_before_notes ?? ''));
    setConditionAfterNotes(String(attrs.condition_after_notes ?? ''));
    setSanctionAmount(String(attrs.sanction_amount ?? ''));
    setSanctionDate(String(attrs.sanction_date ?? ''));
    setWorkCompletedDate(String(attrs.work_completed_date ?? ''));
    setBeforeImageKeys(parseRoadImageKeys(attrs.before_image_keys));
    setAfterImageKeys(parseRoadImageKeys(attrs.after_image_keys));
    setRoadImageKeys(parseRoadImageKeys(attrs.road_image_keys));
    setError(null);
    setSaved(false);
    // Hydrate only when switching roads (or entering/leaving edit), not when
    // parent refreshes the same org after a mid-edit image patch.
  }, [editingRoad?.id]);

  const syncImageKeysFromAttrs = (attrs: Record<string, unknown>) => {
    setBeforeImageKeys(parseRoadImageKeys(attrs.before_image_keys));
    setAfterImageKeys(parseRoadImageKeys(attrs.after_image_keys));
    setRoadImageKeys(parseRoadImageKeys(attrs.road_image_keys));
  };

  const uploadConditionImages = async (
    phase: 'before' | 'after' | 'gallery',
    files: FileList | null,
  ) => {
    if (!editingRoad || !files?.length) return;
    const list = Array.from(files);
    setUploadingPhase(phase);
    setError(null);
    try {
      let last: Organization | null = null;
      const assetType =
        phase === 'before' ? 'roads_before' : phase === 'after' ? 'roads_after' : 'roads_gallery';
      for (const file of list) {
        last = await organizationsApi.uploadRoadsConditionAsset(
          editingRoad.id,
          file,
          assetType,
        );
        syncImageKeysFromAttrs((last.attributes ?? {}) as Record<string, unknown>);
      }
      if (last) onPatched?.(last);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image(s).');
    } finally {
      setUploadingPhase(null);
    }
  };

  const removeConditionImage = async (phase: 'before' | 'after' | 'gallery', url: string) => {
    if (!editingRoad) return;
    const nextBefore =
      phase === 'before' ? beforeImageKeys.filter((u) => u !== url) : beforeImageKeys;
    const nextAfter =
      phase === 'after' ? afterImageKeys.filter((u) => u !== url) : afterImageKeys;
    const nextRoad =
      phase === 'gallery' ? roadImageKeys.filter((u) => u !== url) : roadImageKeys;
    setBeforeImageKeys(nextBefore);
    setAfterImageKeys(nextAfter);
    setRoadImageKeys(nextRoad);
    setError(null);
    try {
      const attrs = {
        ...((editingRoad.attributes ?? {}) as Record<string, unknown>),
        before_image_keys: nextBefore.length ? nextBefore : null,
        after_image_keys: nextAfter.length ? nextAfter : null,
        road_image_keys: nextRoad.length ? nextRoad : null,
        updated_at: new Date().toISOString(),
      };
      const updated = await organizationsApi.update(editingRoad.id, { attributes: attrs });
      syncImageKeysFromAttrs((updated.attributes ?? {}) as Record<string, unknown>);
      onPatched?.(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove image.');
      const attrs = (editingRoad.attributes ?? {}) as Record<string, unknown>;
      syncImageKeysFromAttrs(attrs);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!roadName.trim()) {
      setError('Road name is required.');
      return;
    }
    if (!roadSector.trim()) {
      setError('Road type (sector) is required.');
      return;
    }

    const parsedPath = parsePathCoordinatePairs(pathCoordinates);
    const sLat = toNumberOrNull(startLat);
    const sLng = toNumberOrNull(startLng);
    const eLat = toNumberOrNull(endLat);
    const eLng = toNumberOrNull(endLng);
    const hasStart = isUsableRoadLatLng(sLat, sLng);
    const hasEnd = isUsableRoadLatLng(eLat, eLng);
    const hasStartEnd = hasStart && hasEnd;
    const hasStartOnly = hasStart && !hasEnd;
    const hasPath = parsedPath.length >= 2;
    const hasMapGeometry = roadImportRowHasMapGeometry({
      pathCoordinates,
      startLat,
      startLng,
      endLat,
      endLng,
    });

    if ((startLat.trim() || startLng.trim()) && !hasStart) {
      setError('Start coordinates look invalid. Provide both lat and lng.');
      return;
    }
    if ((endLat.trim() || endLng.trim()) && !hasEnd) {
      setError(
        'End coordinates look invalid. Provide both lat and lng, or leave end blank for a map pin only.',
      );
      return;
    }

    if (isSummaryOnlySector) {
      if (!block.trim()) {
        setError('Block is required for GP / Municipality roads.');
        return;
      }
      if (!gpWard.trim()) {
        setError('GP/Ward is required for GP / Municipality roads.');
        return;
      }
      if (isGpRoadSector(roadSector) && !village.trim()) {
        setError('Village is required for GP roads.');
        return;
      }
    }

    let finalStartLat: number | null = null;
    let finalStartLng: number | null = null;
    let finalEndLat: number | null = null;
    let finalEndLng: number | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (!isSummaryOnlySector) {
      if (!hasStartEnd && !hasPath && !hasStartOnly) {
        setError(
          'Provide start/end coordinates, start coordinates only, or a valid path coordinates value.',
        );
        return;
      }
    } else if (hasMapGeometry && !hasStart) {
      setError('Provide both start latitude and start longitude for map placement.');
      return;
    }

    const resolved = resolveRoadImportGeometry({
      pathCoordinates,
      startLat,
      startLng,
      endLat,
      endLng,
    });
    finalStartLat = resolved.start_lat != null ? Number(resolved.start_lat) : null;
    finalStartLng = resolved.start_lng != null ? Number(resolved.start_lng) : null;
    finalEndLat = resolved.end_lat != null ? Number(resolved.end_lat) : null;
    finalEndLng = resolved.end_lng != null ? Number(resolved.end_lng) : null;
    latitude = resolved.latitude;
    longitude = resolved.longitude;

    if (!isSummaryOnlySector && hasMapGeometry) {
      if (finalStartLat == null || finalStartLng == null) {
        setError('Unable to derive valid road coordinates.');
        return;
      }
      if (hasStartEnd && (finalEndLat == null || finalEndLng == null)) {
        setError('Unable to derive valid road coordinates.');
        return;
      }
    }

    setSaving(true);
    try {
      const attributeUpdates = {
          block: block.trim() || null,
          gp_ward: gpWard.trim() || null,
          village: village.trim() || null,
          road_code: roadCode.trim() || null,
          road_sector: roadSector.trim() || null,
          name_of_division: nameOfDivision.trim() || null,
          scheme: scheme.trim() || null,
          length_km: lengthKm.trim() || null,
          path_coordinates: resolved.path_coordinates,
          start_lat: resolved.start_lat,
          start_lng: resolved.start_lng,
          end_lat: resolved.end_lat,
          end_lng: resolved.end_lng,
          point_a_name: pointAName.trim() || null,
          point_b_name: pointBName.trim() || null,
          year_of_construction: yearOfConstruction.trim() || null,
          last_repaired_date: showsMaintenanceFields ? lastRepairedDate.trim() || null : null,
          present_condition: showsMaintenanceFields ? presentCondition.trim() || null : null,
          last_maintenance_date: showsMaintenanceFields ? lastRepairedDate.trim() || null : null,
          issues: issues.trim() || null,
          remarks: remarks.trim() || null,
          condition_before_rating: conditionBeforeRating.trim() || null,
          condition_after_rating: conditionAfterRating.trim() || null,
          condition_before_notes: conditionBeforeNotes.trim() || null,
          condition_after_notes: conditionAfterNotes.trim() || null,
          sanction_amount: sanctionAmount.trim() || null,
          sanction_date: sanctionDate.trim() || null,
          work_completed_date: workCompletedDate.trim() || null,
          before_image_keys: beforeImageKeys.length ? beforeImageKeys : null,
          after_image_keys: afterImageKeys.length ? afterImageKeys : null,
          road_image_keys: roadImageKeys.length ? roadImageKeys : null,
          summary_only: resolved.summary_only,
          updated_at: new Date().toISOString(),
        };
      const payload = {
        department_id: departmentId,
        name: roadName.trim(),
        type: 'OTHER',
        latitude,
        longitude,
        address: block.trim() || undefined,
        description: roadSector.trim() ? `Road sector: ${roadSector.trim()}` : undefined,
        attributes: mergeRoadEditAttributes(
          (editingRoad?.attributes ?? {}) as Record<string, unknown>,
          attributeUpdates,
        ),
      };

      if (editingRoad) {
        const updated = await organizationsApi.update(editingRoad.id, {
          name: payload.name,
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.address,
          description: payload.description,
          attributes: payload.attributes,
        });
        onUpdated?.(updated);
      } else {
        const created = await organizationsApi.create(payload);
        onCreated?.(created);
      }
      setSaved(true);
      if (!editingRoad) {
        reset();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save road entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-text">Road data entry</h2>
      <p className="mt-1 text-xs text-text-muted">
        {isEditing
          ? 'Edit road record for the summary Road Listing table.'
          : 'Add road records for the summary Road Listing table.'}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        {isSummaryOnlySector
          ? 'GP and Municipality roads list in the summary table. Add start lat/lng to show a map pin; optional end/path upgrades to a line track. Required: road name, road type, Block, GP/Ward (village required for GP).'
          : 'For NH/SH/PWD/RD/PS roads on the map, provide path coordinates, start/end coordinates, or start coordinates only.'}
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Road name *"
          value={roadName}
          onChange={(e) => setRoadName(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Road code"
          value={roadCode}
          onChange={(e) => setRoadCode(e.target.value)}
        />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-text">Road type *</span>
          <select
            className="rounded border border-border bg-background px-3 py-2"
            value={roadSector}
            onChange={(e) => setRoadSector(e.target.value)}
          >
            <option value="">Select type</option>
            {ROAD_SECTOR_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Name of division"
          value={nameOfDivision}
          onChange={(e) => setNameOfDivision(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Scheme"
          value={scheme}
          onChange={(e) => setScheme(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Block *"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="GP/Ward *"
          value={gpWard}
          onChange={(e) => setGpWard(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Village"
          value={village}
          onChange={(e) => setVillage(e.target.value)}
        />
        <label className="flex flex-col gap-1 text-[11px] text-text-muted md:col-span-2">
          <span>Length (in km)</span>
          <input
            className="rounded border border-border px-3 py-2 text-xs text-text"
            placeholder="Leave blank to calculate from path"
            value={lengthKm}
            onChange={(e) => setLengthKm(e.target.value)}
          />
        </label>
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Starting point name (optional)"
          value={pointAName}
          onChange={(e) => setPointAName(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Ending point name (optional)"
          value={pointBName}
          onChange={(e) => setPointBName(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder={isSummaryOnlySector ? 'Start latitude (for map pin)' : 'Start latitude *'}
          value={startLat}
          onChange={(e) => setStartLat(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder={isSummaryOnlySector ? 'Start longitude (for map pin)' : 'Start longitude *'}
          value={startLng}
          onChange={(e) => setStartLng(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="End latitude (optional)"
          value={endLat}
          onChange={(e) => setEndLat(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="End longitude (optional)"
          value={endLng}
          onChange={(e) => setEndLng(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Path coordinates (optional)"
          value={pathCoordinates}
          onChange={(e) => setPathCoordinates(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Year of construction"
          value={yearOfConstruction}
          onChange={(e) => setYearOfConstruction(e.target.value)}
        />
        {showsMaintenanceFields ? (
          <>
            <label className="flex flex-col gap-1 text-[11px] text-text-muted">
              <span>Last repaired date</span>
              <input
                type="date"
                className="rounded border border-border px-3 py-2 text-xs text-text"
                value={lastRepairedDate}
                onChange={(e) => setLastRepairedDate(e.target.value)}
              />
            </label>
            <input
              className="rounded border border-border px-3 py-2"
              placeholder="Present condition"
              value={presentCondition}
              onChange={(e) => setPresentCondition(e.target.value)}
            />
          </>
        ) : null}
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Issues observed"
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <div className="md:col-span-2 rounded-lg border border-border/80 bg-slate-50/60 p-3 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-text">Before / After condition</h3>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Ratings are 1 (worst) to 5 (best). Upload photos after saving the road (edit mode).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text">Before rating</span>
              <select
                className="rounded border border-border bg-background px-3 py-2"
                value={conditionBeforeRating}
                onChange={(e) => setConditionBeforeRating(e.target.value)}
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={`before-${opt || 'empty'}`} value={opt}>
                    {opt ? `${opt} / 5` : 'Not set'}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text">After rating</span>
              <select
                className="rounded border border-border bg-background px-3 py-2"
                value={conditionAfterRating}
                onChange={(e) => setConditionAfterRating(e.target.value)}
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={`after-${opt || 'empty'}`} value={opt}>
                    {opt ? `${opt} / 5` : 'Not set'}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="rounded border border-border px-3 py-2"
              placeholder="Before notes"
              value={conditionBeforeNotes}
              onChange={(e) => setConditionBeforeNotes(e.target.value)}
            />
            <input
              className="rounded border border-border px-3 py-2"
              placeholder="After notes"
              value={conditionAfterNotes}
              onChange={(e) => setConditionAfterNotes(e.target.value)}
            />
            <input
              className="rounded border border-border px-3 py-2"
              placeholder="Sanction amount"
              value={sanctionAmount}
              onChange={(e) => setSanctionAmount(e.target.value)}
            />
            <label className="flex flex-col gap-1 text-[11px] text-text-muted">
              <span>Sanction date</span>
              <input
                type="date"
                className="rounded border border-border px-3 py-2 text-xs text-text"
                value={sanctionDate}
                onChange={(e) => setSanctionDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-text-muted md:col-span-2">
              <span>Work completed date</span>
              <input
                type="date"
                className="rounded border border-border px-3 py-2 text-xs text-text"
                value={workCompletedDate}
                onChange={(e) => setWorkCompletedDate(e.target.value)}
              />
            </label>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="flex flex-col gap-1 text-[11px] text-text-muted">
                    <span>Upload before images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingPhase != null || saving}
                      onChange={(e) => {
                        void uploadConditionImages('before', e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className="mt-0.5 text-[10px] text-text-muted">Shown on Before map control only</p>
                  {uploadingPhase === 'before' ? (
                    <p className="mt-1 text-[11px] text-text-muted">Uploading…</p>
                  ) : null}
                  {beforeImageKeys.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {beforeImageKeys.map((url) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Before condition"
                            className="h-14 w-20 rounded object-cover border border-border"
                          />
                          <button
                            type="button"
                            disabled={uploadingPhase != null || saving}
                            onClick={() => void removeConditionImage('before', url)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                            aria-label="Remove before image"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="flex flex-col gap-1 text-[11px] text-text-muted">
                    <span>Upload after images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingPhase != null || saving}
                      onChange={(e) => {
                        void uploadConditionImages('after', e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className="mt-0.5 text-[10px] text-text-muted">Shown on After map control only</p>
                  {uploadingPhase === 'after' ? (
                    <p className="mt-1 text-[11px] text-text-muted">Uploading…</p>
                  ) : null}
                  {afterImageKeys.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {afterImageKeys.map((url) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="After condition"
                            className="h-14 w-20 rounded object-cover border border-border"
                          />
                          <button
                            type="button"
                            disabled={uploadingPhase != null || saving}
                            onClick={() => void removeConditionImage('after', url)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                            aria-label="Remove after image"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="flex flex-col gap-1 text-[11px] text-text-muted">
                    <span>Upload road images (sidebar)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingPhase != null || saving}
                      onChange={(e) => {
                        void uploadConditionImages('gallery', e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className="mt-0.5 text-[10px] text-text-muted">Shown in sidebar top carousel only</p>
                  {uploadingPhase === 'gallery' ? (
                    <p className="mt-1 text-[11px] text-text-muted">Uploading…</p>
                  ) : null}
                  {roadImageKeys.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roadImageKeys.map((url) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Road sidebar"
                            className="h-14 w-20 rounded object-cover border border-border"
                          />
                          <button
                            type="button"
                            disabled={uploadingPhase != null || saving}
                            onClick={() => void removeConditionImage('gallery', url)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
                            aria-label="Remove road image"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-text-muted">
              Save the road first, then edit it to upload before / after / sidebar photos.
            </p>
          )}
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEditing ? 'Update road' : 'Save road'}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                onCancelEdit?.();
                reset();
                setSaved(false);
                setError(null);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text"
            >
              Cancel edit
            </button>
          ) : null}
          {saved ? <span className="text-[11px] text-green-600">Saved</span> : null}
        </div>
        {error ? <p className="md:col-span-2 text-xs text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
