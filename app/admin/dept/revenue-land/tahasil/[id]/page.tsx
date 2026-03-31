'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  departmentsApi,
  organizationsApi,
  revenueLandApi,
  clearToken,
  Department,
  Organization,
  User,
} from '../../../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../../../components/i18n/LanguageContext';
import { t } from '../../../../../../components/i18n/messages';
import { Loader } from '../../../../../../components/common/Loader';
import { compressImage } from '../../../../../../lib/imageCompression';

const REVENUE_LAND_CSV_HEADER =
  'TAHASIL,RI CIRCLE,BLOCK/ULB,GP/WARD,MOUZA/VILLAGE,HABITATION/LOCALITY,KHATA NO,PLOT NO,LAND TYPE (GOVT/PRIVATE/OTHER),GOVT LAND CATEGORY (Gochar/Gramya Jungle/Sarbasadharan/Khasmahal/Nazul/Other),KISAM,KISAM DESCRIPTION,TOTAL AREA (ACRES),TOTAL AREA (HECTARES),TOTAL AREA (SQFT),ROR YEAR,DEPARTMENT RECORDED AS OWNER,DESCRIPTION,TAHASIL OFFICE ORG ID\n';

const splitHeader = (header: string): string[] =>
  header.trim().replace(/\n$/, '').split(',').map((h) => h.trim());

const snakeFromHeader = (label: string): string =>
  label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[?]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');

const PAGE_SIZE = 25;

export default function TahasilParcelsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { language } = useLanguage();
  const isOdia = language === 'or';
  const tr = (en: string, or: string) => (isOdia ? or : en);
  const tahasilOrgId = Number(params.id);

  const [me, setMe] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tahasilOrg, setTahasilOrg] = useState<Organization | null>(null);
  const [tahasilProfile, setTahasilProfile] = useState<Record<string, unknown>>({});
  const [parcelOrgs, setParcelOrgs] = useState<Organization[]>([]);
  const [parcelProfiles, setParcelProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingParcelId, setDeletingParcelId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [parcelImageFile, setParcelImageFile] = useState<File | null>(null);
  const [editingParcelId, setEditingParcelId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const headers = useMemo(() => splitHeader(REVENUE_LAND_CSV_HEADER), []);

  const loadParcels = async (orgId: number) => {
    const parcels = await revenueLandApi.listParcelsForTahasilOffice(orgId);
    setParcelOrgs(parcels);
    const entries = await Promise.all(
      parcels.map(async (org) => {
        const prof = await revenueLandApi.getProfile(org.id);
        return [org.id, (prof && typeof prof === 'object' ? prof : {}) as Record<string, unknown>] as const;
      }),
    );
    setParcelProfiles(Object.fromEntries(entries));
  };

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(tahasilOrgId)) {
        setError(tr('Invalid Tahasil office ID.', 'ଅବୈଧ ତହସିଲ କାର୍ଯ୍ୟାଳୟ ID.'));
        setLoading(false);
        return;
      }
      try {
        const [user, deptList, org] = await Promise.all([
          authApi.me(),
          departmentsApi.list(),
          organizationsApi.get(tahasilOrgId),
        ]);
        if (org.sub_department !== 'TAHASIL_OFFICE') {
          throw new Error(tr('Selected organization is not a Tahasil office.', 'ବାଛାଯାଇଥିବା ସଂସ୍ଥା ତହସିଲ କାର୍ଯ୍ୟାଳୟ ନୁହେଁ।'));
        }
        setMe(user);
        setDepartments(deptList);
        setTahasilOrg(org);

        const profile = await revenueLandApi.getProfile(tahasilOrgId);
        const prof = (profile && typeof profile === 'object' ? profile : {}) as Record<string, unknown>;
        setTahasilProfile(prof);

        const tahasilKey = String(prof.tahasil ?? org.name ?? '');
        // Tahasil context is already selected via this page; we don't need to ask for
        // `TAHASIL` / `TAHASIL OFFICE ORG ID` again in the create/bulk forms.
        setFormValues({});

        await loadParcels(tahasilOrgId);
      } catch (err: any) {
        setError(
          err.message ||
            tr('Failed to load Tahasil office.', 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ ଲୋଡ୍ କରିବାରେ ବିଫଳ।'),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tahasilOrgId]);

  const visibleParcels = useMemo(() => {
    const start = page * PAGE_SIZE;
    return parcelOrgs.slice(start, start + PAGE_SIZE);
  }, [parcelOrgs, page]);

  const handleDeleteParcel = async (org: Organization) => {
    const confirmed = window.confirm(
      tr(
        `Delete "${org.name}"? This action cannot be undone.`,
        `"${org.name}" କୁ ଡିଲିଟ୍ କରିବେ କି? ଏହି କାର୍ଯ୍ୟ ପୁନରୁଦ୍ଧାର ହେବ ନାହିଁ।`,
      ),
    );
    if (!confirmed) return;

    setDeletingParcelId(org.id);
    setError(null);
    try {
      await organizationsApi.delete(org.id);
      if (editingParcelId === org.id) {
        setEditingParcelId(null);
        setFormValues({});
        setParcelImageFile(null);
      }
      const nextTotal = Math.max(0, parcelOrgs.length - 1);
      const nextMaxPage = Math.max(0, Math.ceil(nextTotal / PAGE_SIZE) - 1);
      setPage((p) => Math.min(p, nextMaxPage));
      await loadParcels(tahasilOrgId);
    } catch (err: any) {
      setError(err.message || tr('Failed to delete land parcel', 'ଜମି ପାର୍ସେଲ୍ ଡିଲିଟ୍ କରିବାରେ ବିଫଳ'));
    } finally {
      setDeletingParcelId(null);
    }
  };

  const handleDownloadTemplate = () => {
    const tahasil = String(tahasilProfile.tahasil ?? tahasilOrg?.name ?? '').trim();
    const cols = splitHeader(REVENUE_LAND_CSV_HEADER);
    const visibleCols = cols.filter(
      (c) => c !== 'TAHASIL' && c !== 'TAHASIL OFFICE ORG ID',
    );
    const sampleRow = visibleCols.map(() => '').join(',');
    const csvContent = `${visibleCols.join(',')}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revenue_land_parcels_tahasil_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError(tr('Please choose a CSV file.', 'ଦୟାକରି ଏକ CSV ଫାଇଲ୍ ଚୟନ କରନ୍ତୁ।'));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Backend bulk import expects `TAHASIL` and `TAHASIL OFFICE ORG ID` columns.
      // Since this page is already scoped to a specific Tahasil office, we inject
      // these columns automatically if the uploaded CSV template does not include them.
      const tahasil = String(tahasilProfile.tahasil ?? tahasilOrg?.name ?? '').trim();
      const backendCols = splitHeader(REVENUE_LAND_CSV_HEADER);

      const rawText = await file.text();
      const lines = rawText.split(/\r?\n/).filter((l) => l.trim() !== '');
      const headerLine = lines[0] ?? '';
      const uploadedCols = headerLine.split(',').map((h) => h.trim());

      const hasTahasilCols =
        uploadedCols.includes('TAHASIL') && uploadedCols.includes('TAHASIL OFFICE ORG ID');

      const csvFileToSend = (() => {
        if (hasTahasilCols) return file;

        const dataLines = lines.slice(1);
        const injectedRows = dataLines.map((line) => {
          const parts = line.split(',');
          const valuesByHeader = new Map<string, string>();
          uploadedCols.forEach((c, idx) => {
            valuesByHeader.set(c, parts[idx] ?? '');
          });

          const injected = backendCols.map((c) => {
            if (c === 'TAHASIL') return tahasil;
            if (c === 'TAHASIL OFFICE ORG ID') return String(tahasilOrgId);
            return valuesByHeader.get(c) ?? '';
          });
          return injected.join(',');
        });

        const injectedCsv = `${backendCols.join(',')}\n${injectedRows.join('\n')}\n`;
        return new File([injectedCsv], file.name, { type: file.type || 'text/csv' });
      })();

      const result = await revenueLandApi.bulkCsv(csvFileToSend);
      await loadParcels(tahasilOrgId);
      setPage(0);
      if (result.errors?.length) {
        setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
      }
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || tr('Failed to upload CSV', 'CSV ଅପଲୋଡ୍ କରିବାରେ ବିଫଳ'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={false}
      panelTitle={t('login.dept.title', language)}
      sectionLabel={t('super.sidebar.dashboard', language)}
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/revenue-land-monitoring', labelKey: 'revenueLand.monitoring.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        {error && <p className="text-xs text-red-500">{error}</p>}

        <section className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-text">
                {editingParcelId
                  ? tr('Edit land parcel entry', 'ଜମି ପାର୍ସେଲ୍ ସମ୍ପାଦନା')
                  : tr('Create land parcel entry', 'ଜମି ପାର୍ସେଲ୍ ପ୍ରବେଶ ସୃଷ୍ଟି କରନ୍ତୁ')}
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {tr('Under Tahasil office:', 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ ଅଧୀନରେ:')}{' '}
                <strong>{tahasilOrg?.name ?? '—'}</strong> (TAHASIL:{' '}
                <strong>{String(tahasilProfile.tahasil ?? tahasilOrg?.name ?? '—')}</strong>)
              </p>
            </div>
            <Link
              href="/admin/dept"
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text hover:bg-gray-50"
            >
              {tr('Back to Tahasil list', 'ତହସିଲ ତାଲିକାକୁ ଫେରନ୍ତୁ')}
            </Link>
          </div>

          <form
            className="grid gap-3 text-xs md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!me?.department_id) {
                setError(tr('Department is not set for this admin user.', 'ଏହି ଅଧିକାରୀ ଉପଭୋକ୍ତା ପାଇଁ ବିଭାଗ ସେଟ୍ ନାହିଁ।'));
                return;
              }
              const nameField = (formValues.name || '').trim();
              const mouza = (formValues[snakeFromHeader('MOUZA/VILLAGE')] || '').trim();
              const habitation = (formValues[snakeFromHeader('HABITATION/LOCALITY')] || '').trim();
              const name = nameField || [habitation, mouza].filter(Boolean).join(' / ');
              if (!name) {
                setError(tr('Land parcel name is required.', 'ଜମି ପାର୍ସେଲ୍ ନାମ ଆବଶ୍ୟକ।'));
                return;
              }
              setCreating(true);
              setError(null);
              try {
                const tahasil = String(tahasilProfile.tahasil ?? tahasilOrg?.name ?? '').trim();
                const block = (formValues[snakeFromHeader('BLOCK/ULB')] || '').trim();
                const gp = (formValues[snakeFromHeader('GP/WARD')] || '').trim();
                const addressParts = [habitation, mouza, gp, block, tahasil].filter((p) => p && p.trim());
                const attrs: Record<string, string | number | null> = {
                  tahasil: tahasil || null,
                  block_ulb: block || null,
                  gp_ward: gp || null,
                  mouza_village: mouza || null,
                  habitation_locality: habitation || null,
                  tahasil_office_org_id: tahasilOrgId,
                };

                const org = editingParcelId
                  ? await organizationsApi.update(editingParcelId, {
                      name,
                      address: addressParts.length ? addressParts.join(', ') : undefined,
                      sub_department: 'LAND_PARCEL',
                      attributes: attrs,
                    })
                  : await organizationsApi.create({
                      department_id: me.department_id,
                      name,
                      type: 'OTHER',
                      address: addressParts.length ? addressParts.join(', ') : undefined,
                      sub_department: 'LAND_PARCEL',
                      attributes: attrs,
                    });

                const profileData: Record<string, unknown> = {};
                headers.forEach((header) => {
                  const key = snakeFromHeader(header);
                  if (header === 'TAHASIL OFFICE ORG ID') return;
                  if (header === 'TAHASIL') {
                    profileData[key] = tahasil;
                    return;
                  }
                  const val = formValues[key];
                  if (val != null && String(val).trim() !== '') {
                    profileData[key] = val;
                  }
                });
                await revenueLandApi.putProfile(org.id, profileData);
                if (parcelImageFile) {
                  const compressed = await compressImage(parcelImageFile, { maxSizeMB: 0.5 });
                  await organizationsApi.uploadCoverImage(org.id, compressed);
                  setParcelImageFile(null);
                }
                setFormValues({});
                setEditingParcelId(null);
                setParcelImageFile(null);
                await loadParcels(tahasilOrgId);
                setPage(0);
              } catch (err: any) {
                setError(
                  err.message ||
                    tr('Failed to save land parcel', 'ଜମି ପାର୍ସେଲ୍ ସେଭ୍ କରିବାରେ ବିଫଳ'),
                );
              } finally {
                setCreating(false);
              }
            }}
          >
            <div className="md:col-span-2 space-y-1">
              <label className="block text-text">Land parcel name</label>
              <input
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                value={formValues.name || ''}
                onChange={(e) => setFormValues((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            {headers.map((header) => {
              if (header === 'TAHASIL' || header === 'TAHASIL OFFICE ORG ID') return null;
              const key = snakeFromHeader(header);
              return (
                <div key={key} className="space-y-1">
                  <label className="block text-text">{header}</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    value={formValues[key] ?? ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              );
            })}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-text font-medium">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-text file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                onChange={(e) => setParcelImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {creating
                  ? tr('Saving...', 'ସଞ୍ଚୟ ହେଉଛି...')
                  : editingParcelId
                    ? tr('Update land parcel', 'ଜମି ପାର୍ସେଲ୍ ଅପଡେଟ୍ କରନ୍ତୁ')
                    : tr('Save land parcel', 'ଜମି ପାର୍ସେଲ୍ ସେଭ୍ କରନ୍ତୁ')}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-background p-3">
          <h2 className="text-sm font-semibold text-text">
            {tr('Bulk CSV upload', 'ବଲ୍କ CSV ଅପଲୋଡ୍')}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {tr(
              'Upload parcel CSV for this Tahasil. Use',
              'ଏହି ତହସିଲ ପାଇଁ ଜମି ପାର୍ସେଲ୍ CSV ଅପଲୋଡ୍ କରନ୍ତୁ। ବ୍ୟବହାର କରନ୍ତୁ',
            )}{' '}
            {tr(
              'Rows will be linked automatically to this page’s Tahasil.',
              'ଏହି ପୃଷ୍ଠାର ତହସିଲ ସହ ରୋଗୁଡିକ ସ୍ୱୟଂକ୍ରିୟ ଭାବେ ଲିଙ୍କ ହେବ।',
            )}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
              onClick={handleDownloadTemplate}
            >
              {tr('Download CSV template', 'CSV ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ')}
            </button>
            <form className="flex flex-col gap-2 md:flex-row md:items-center" onSubmit={handleBulkUpload}>
              <input name="file" type="file" accept=".csv,text/csv" className="text-xs" />
              <button
                type="submit"
                disabled={uploading}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {uploading
                  ? tr('Uploading...', 'ଅପଲୋଡ୍ ହେଉଛି...')
                  : tr('Upload CSV', 'CSV ଅପଲୋଡ୍ କରନ୍ତୁ')}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-3">
          <h2 className="text-sm font-semibold text-text">
            {tr('Land data table', 'ଜମି ତଥ୍ୟ ତାଲିକା')}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {tr(
              'Linked parcels under this Tahasil office.',
              'ଏହି ତହସିଲ କାର୍ଯ୍ୟାଳୟ ଅଧୀନରେ ଯୋଡାଯାଇଥିବା ପାର୍ସେଲ୍‌ଗୁଡିକ।',
            )}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-2 py-1 text-left font-medium text-text">
                    {tr('SL NO', 'କ୍ରମିକ ସଂଖ୍ୟା')}
                  </th>
                  <th className="px-2 py-1 text-left font-medium text-text">
                    {tr('Name', 'ନାମ')}
                  </th>
                  {headers.filter((h) => h !== 'TAHASIL OFFICE ORG ID').map((header) => (
                    <th key={header} className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                  <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">
                    {tr('Actions', 'କାର୍ଯ୍ୟ')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleParcels.map((org, idx) => {
                  const profile = parcelProfiles[org.id] || {};
                  return (
                    <tr key={org.id} className="border-b border-border/60">
                      <td className="px-2 py-1 text-text-muted">{page * PAGE_SIZE + idx + 1}</td>
                      <td className="px-2 py-1 text-text">{org.name}</td>
                      {headers.filter((h) => h !== 'TAHASIL OFFICE ORG ID').map((header) => {
                        const key = snakeFromHeader(header);
                        const val =
                          header === 'TAHASIL'
                            ? profile[key] ?? tahasilProfile.tahasil ?? tahasilOrg?.name
                            : profile[key];
                        return (
                          <td key={`${org.id}-${key}`} className="px-2 py-1 text-text-muted">
                            {val != null && String(val).trim() !== '' ? String(val) : '—'}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-text-muted whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                            onClick={() => {
                              setEditingParcelId(org.id);
                              setParcelImageFile(null);
                              setError(null);

                              const vals: Record<string, string> = {};
                              vals.name = org.name;

                              headers.forEach((h) => {
                                if (h === 'TAHASIL' || h === 'TAHASIL OFFICE ORG ID') return;
                                const k = snakeFromHeader(h);
                                const pv = profile[k];
                                vals[k] = pv != null && String(pv).trim() !== '' ? String(pv) : '';
                              });

                              setFormValues(vals);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            {tr('Edit', 'ସମ୍ପାଦନା')}
                          </button>
                          <button
                            type="button"
                            disabled={deletingParcelId === org.id}
                            className="rounded border border-red-300 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-60"
                            onClick={() => handleDeleteParcel(org)}
                          >
                            {deletingParcelId === org.id
                              ? tr('Deleting...', 'ଡିଲିଟ୍ ହେଉଛି...')
                              : tr('Delete', 'ଡିଲିଟ୍')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleParcels.length === 0 && (
                  <tr>
                    <td className="px-2 py-2 text-text-muted" colSpan={headers.length + 3}>
                      {tr(
                        'No land parcel data yet.',
                        'ଏ ପର୍ଯ୍ୟନ୍ତ କୌଣସି ଜମି ପାର୍ସେଲ୍ ତଥ୍ୟ ନାହିଁ।',
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {parcelOrgs.length > PAGE_SIZE && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page === 0}
                className="rounded border border-border px-2 py-1 text-xs disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {tr('Prev', 'ପୂର୍ବ')}
              </button>
              <button
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= parcelOrgs.length}
                className="rounded border border-border px-2 py-1 text-xs disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
              >
                {tr('Next', 'ପରବର୍ତ୍ତୀ')}
              </button>
            </div>
          )}
        </section>
      </div>
    </SuperAdminDashboardLayout>
  );
}

