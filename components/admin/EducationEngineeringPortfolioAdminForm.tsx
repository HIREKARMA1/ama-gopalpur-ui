'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type EngineeringFormFields = Record<string, string>;

type SectionId =
  | 'hero'
  | 'about'
  | 'admin'
  | 'facilities'
  | 'programmes'
  | 'faculty'
  | 'research'
  | 'placement'
  | 'clubs'
  | 'gallery'
  | 'contact';

const SECTION_ROWS: { id: SectionId; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'admin', label: 'Leadership' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'programmes', label: 'Departments & Programmes' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'research', label: 'Research & MoUs' },
  { id: 'placement', label: 'Placement' },
  { id: 'clubs', label: 'Student Life' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
];

const KEY = {
  name: 'name_of_college',
  block: 'block_ulb',
  gp: 'gp_ward',
  village: 'village',
  institutionId: 'institution_id',
  established: 'established_year',
  campusArea: 'campus_area_acres',
  affiliatingUniversity: 'affiliating_university',
  autonomous: 'autonomous',
  autonomousSince: 'autonomous_since_year',
  collegeType: 'college_type',
  pinCode: 'pin_code',
  latitude: 'latitude',
  longitude: 'longitude',
  principalName: 'principal_name',
  principalContact: 'principal_contact',
  principalEmail: 'principal_email',
  hmName: 'name_of_hm',
  hmMessage: 'headmaster_message_en',
  hmQualification: 'hm_qualification',
  hmPeriodFrom: 'hm_period_from',
  hmPeriodTo: 'hm_period_to',
  hmPeriodCurrent: 'hm_period_currently_continuing',
  hmContact: 'headmaster_contact',
  hmEmail: 'headmaster_email',
  visionText: 'vision_text_en',
  missionText: 'mission_text_en',
  collegePhone: 'college_phone',
  collegeEmail: 'college_email',
  website: 'website',
  aicte: 'aicte_approval',
  naac: 'naac',
  nba: 'nba',
  nirf: 'nirf_ranking',
  aariia: 'aariia_atal_ranking',
  btechCount: 'b_tech_branches_count',
  mtechCount: 'm_tech_programmes_count',
  phd: 'ph_d',
  departments: 'departments',
  departmentProgrammeCardsJson: 'department_programme_cards_json',
  studentLifeCardsJson: 'student_life_cards_json',
  placementCell: 'placement_cell',
  placementOfficerName: 'placement_officer_name',
  placementOfficerContact: 'placement_officer_contact',
  placementOfficerEmail: 'placement_officer_email',
  placementOfficerQualification: 'placement_officer_qualification',
  placementOfficerPhoto: 'placement_officer_photo',
  placementOfficerExpFrom: 'placement_officer_experience_from',
  placementOfficerExpTo: 'placement_officer_experience_to',
  placementPartners: 'placement_partners',
  placementDescription: 'placement_description',
  placementPct: 'placement_percentage_last_year',
  highestPackage: 'highest_package_lpa',
  internship: 'internship',
  nss: 'nss',
  ncc: 'ncc',
  robotics: 'robotics_club',
  cultural: 'cultural_clubs',
  sports: 'sports_and_athletics_fascility',
  emagazine: 'e_magazine',
  innovation: 'innovation_and_startup_fascility',
  researchCount: 'research_projects_count',
  patentsCount: 'patents_count',
  mouCount: 'mou_count',
  centreOfExcellence: 'centre_of_excellence_comma_separated',
  incubation: 'incubation_centre',
  deans: 'name_of_deans_pic_fic_oic_registrar',
  description: 'description',
  adminCardsJson: 'engineering_admin_cards_json',
  heroTagline: 'hero_primary_tagline_en',
  hero1: 'hero_slide_1',
  hero2: 'hero_slide_2',
  hero3: 'hero_slide_3',
  aboutImage: 'about_image',
  principalPhoto: 'headmaster_photo',
  facilityCardsJson: 'facility_cards_json',
  facultyCardsJson: 'faculty_cards_json',
  photoGalleryJson: 'photo_gallery_json',
} as const;

function parseRows(raw: string): Record<string, string>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, string>[]) : [];
  } catch {
    return [];
  }
}

function rowsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows);
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadPsPortfolioAsset(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
  label,
  organizationId,
  assetType,
  url,
  onUrl,
}: {
  label: string;
  organizationId: number | null;
  assetType: string;
  url: string;
  onUrl: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <span className="block text-[11px] text-text">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png"
        disabled={!organizationId || busy}
        className="block w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !organizationId) return;
          setBusy(true);
          setErr(null);
          try {
            onUrl(await uploadAsset(organizationId, f, assetType));
          } catch (ex: unknown) {
            setErr(ex instanceof Error ? ex.message : 'Upload failed');
          } finally {
            setBusy(false);
          }
        }}
      />
      {err ? <p className="text-[10px] text-red-600">{err}</p> : null}
      {url ? (
        <div className="flex items-center gap-2">
          <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" />
          <button
            type="button"
            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100"
            onClick={() => onUrl('')}
          >
            Remove image
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SectionBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

export function EducationEngineeringPortfolioAdminForm({
  organizationId,
  values,
  setValues,
  profileImageControl,
  institutionLabel = 'College',
  headRoleLabel = 'Principal',
}: {
  organizationId: number | null;
  values: EngineeringFormFields;
  setValues: Dispatch<SetStateAction<EngineeringFormFields>>;
  profileImageControl?: ReactNode;
  institutionLabel?: string;
  headRoleLabel?: string;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const patch = (p: Record<string, string | undefined>) =>
    setValues((prev) => {
      const next: EngineeringFormFields = { ...prev };
      Object.entries(p).forEach(([k, v]) => {
        if (typeof v === 'string') next[k] = v;
      });
      return next;
    });

  const facilityRows = useMemo(() => parseRows(values[KEY.facilityCardsJson] || ''), [values]);
  const departmentProgrammeRows = useMemo(() => parseRows(values[KEY.departmentProgrammeCardsJson] || ''), [values]);
  const studentLifeRows = useMemo(() => parseRows(values[KEY.studentLifeCardsJson] || ''), [values]);
  const facultyRows = useMemo(() => parseRows(values[KEY.facultyCardsJson] || ''), [values]);
  const galleryRows = useMemo(() => parseRows(values[KEY.photoGalleryJson] || ''), [values]);
  const adminRows = useMemo(() => parseRows(values[KEY.adminCardsJson] || ''), [values]);

  return (
    <div className="md:col-span-2 space-y-3 rounded-md border border-border bg-background-muted/40 p-3">
      <p className="text-[11px] text-text-muted">
        Engineering portfolio fields are grouped section-wise (like Health). Save once all sections are updated.
      </p>
      <div className="rounded border border-border bg-muted/30 p-2">
        <div className="flex max-h-[8.5rem] flex-col gap-1 overflow-y-auto sm:max-h-none sm:flex-row sm:flex-wrap">
          {SECTION_ROWS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`rounded border px-2 py-1 text-[10px] sm:text-[11px] ${
                activeSection === s.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-text'
              }`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'hero' ? (
        <SectionBox title="Hero">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-text">{institutionLabel} name</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.name] || ''} onChange={(e) => patch({ [KEY.name]: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">Hero tagline</label>
              <textarea rows={2} className="w-full rounded border border-border px-2 py-1" value={values[KEY.heroTagline] || ''} onChange={(e) => patch({ [KEY.heroTagline]: e.target.value })} />
            </div>
            <ImgSlot label="Hero slide 1" organizationId={organizationId} assetType="ps_hero_slide" url={values[KEY.hero1] || ''} onUrl={(v) => patch({ [KEY.hero1]: v })} />
            <ImgSlot label="Hero slide 2" organizationId={organizationId} assetType="ps_hero_slide" url={values[KEY.hero2] || ''} onUrl={(v) => patch({ [KEY.hero2]: v })} />
            <ImgSlot label="Hero slide 3" organizationId={organizationId} assetType="ps_hero_slide" url={values[KEY.hero3] || ''} onUrl={(v) => patch({ [KEY.hero3]: v })} />
            {profileImageControl ? <div className="md:col-span-2">{profileImageControl}</div> : null}
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'about' ? (
        <SectionBox title={`About ${institutionLabel}`}>
          <div className="grid gap-2 md:grid-cols-2">
            <ImgSlot label="About image" organizationId={organizationId} assetType="ps_about_campus" url={values[KEY.aboutImage] || ''} onUrl={(v) => patch({ [KEY.aboutImage]: v })} />
            <div className="space-y-1">
              <label className="block text-text">Established year</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.established] || ''} onChange={(e) => patch({ [KEY.established]: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Campus area (acres)</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.campusArea] || ''} onChange={(e) => patch({ [KEY.campusArea]: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">{institutionLabel} type</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.collegeType] || ''} onChange={(e) => patch({ [KEY.collegeType]: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">Description</label>
              <textarea rows={3} className="w-full rounded border border-border px-2 py-1" value={values[KEY.description] || ''} onChange={(e) => patch({ [KEY.description]: e.target.value })} />
            </div>

            <div className="md:col-span-2 mt-2 border-t border-border pt-2">
              <h5 className="text-[11px] font-semibold text-text">{headRoleLabel} Section (About)</h5>
              <p className="text-[10px] text-text-muted">Add {headRoleLabel.toLowerCase()} details, message, and vision/mission for the About block.</p>
            </div>
            <div className="space-y-1">
              <label className="block text-text">{headRoleLabel} name</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.hmName] || ''} onChange={(e) => patch({ [KEY.hmName]: e.target.value })} />
            </div>
            <ImgSlot
              label={`${headRoleLabel} image`}
              organizationId={organizationId}
              assetType="ps_headmaster_photo"
              url={values[KEY.principalPhoto] || ''}
              onUrl={(v) => patch({ [KEY.principalPhoto]: v })}
            />
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">{headRoleLabel} message</label>
              <textarea rows={3} className="w-full rounded border border-border px-2 py-1" value={values[KEY.hmMessage] || ''} onChange={(e) => patch({ [KEY.hmMessage]: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Qualification</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.hmQualification] || ''} onChange={(e) => patch({ [KEY.hmQualification]: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Period (From)</label>
              <input
                type="date"
                className="w-full rounded border border-border px-2 py-1"
                value={values[KEY.hmPeriodFrom] || ''}
                onChange={(e) => patch({ [KEY.hmPeriodFrom]: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Period (To)</label>
              <input
                type="date"
                className="w-full rounded border border-border px-2 py-1"
                value={values[KEY.hmPeriodTo] || ''}
                onChange={(e) => patch({ [KEY.hmPeriodTo]: e.target.value })}
                disabled={String(values[KEY.hmPeriodCurrent] || '').toLowerCase() === 'true'}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Period status</label>
              <label className="inline-flex items-center gap-2 rounded border border-border px-2 py-1">
                <input
                  type="checkbox"
                  checked={String(values[KEY.hmPeriodCurrent] || '').toLowerCase() === 'true'}
                  onChange={(e) =>
                    patch({
                      [KEY.hmPeriodCurrent]: e.target.checked ? 'true' : 'false',
                      ...(e.target.checked ? { [KEY.hmPeriodTo]: '' } : {}),
                    })
                  }
                />
                <span className="text-[11px] text-text">Currently continuing</span>
              </label>
            </div>
            <div className="space-y-1">
              <label className="block text-text">Contact</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.hmContact] || ''} onChange={(e) => patch({ [KEY.hmContact]: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-text">Email</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[KEY.hmEmail] || ''} onChange={(e) => patch({ [KEY.hmEmail]: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">Vision</label>
              <textarea rows={2} className="w-full rounded border border-border px-2 py-1" value={values[KEY.visionText] || ''} onChange={(e) => patch({ [KEY.visionText]: e.target.value })} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-text">Mission</label>
              <textarea rows={3} className="w-full rounded border border-border px-2 py-1" value={values[KEY.missionText] || ''} onChange={(e) => patch({ [KEY.missionText]: e.target.value })} />
            </div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'admin' ? (
        <SectionBox title="Leadership and Administration">
          <p className="mb-2 text-[10px] text-text-muted">
            Add each leadership person separately (Principal, Deans, PIC, FIC, OIC, Registrar, etc.).
          </p>
          <div className="space-y-2">
            {(adminRows.length ? adminRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[120px_1fr_1fr_1fr_1fr_1fr_auto] md:items-end">
                <ImgSlot
                  label="Photo"
                  organizationId={organizationId}
                  assetType="ps_admin_deo"
                  url={row.image || row.photo || ''}
                  onUrl={(v) => {
                    const next = [...arr];
                    next[i] = { ...row, image: v };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <input
                  className="rounded border border-border px-2 py-1"
                  placeholder="Name"
                  value={row.name || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, name: e.target.value };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <input
                  className="rounded border border-border px-2 py-1"
                  placeholder="Designation"
                  value={row.designation || row.role || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, designation: e.target.value };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <input
                  className="rounded border border-border px-2 py-1"
                  placeholder="Department affiliation"
                  value={row.department_affiliation || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, department_affiliation: e.target.value };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <input
                  className="rounded border border-border px-2 py-1"
                  placeholder="Contact"
                  value={row.contact || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, contact: e.target.value };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <input
                  className="rounded border border-border px-2 py-1"
                  placeholder="Email"
                  value={row.email || ''}
                  onChange={(e) => {
                    const next = [...arr];
                    next[i] = { ...row, email: e.target.value };
                    patch({ [KEY.adminCardsJson]: rowsToJson(next) });
                  }}
                />
                <button
                  type="button"
                  className="text-[10px] text-red-600"
                  onClick={() => patch({ [KEY.adminCardsJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded border border-border px-2 py-1 text-[11px]"
              onClick={() =>
                patch({
                  [KEY.adminCardsJson]: rowsToJson([
                    ...adminRows,
                    { name: '', designation: '', department_affiliation: '', contact: '', email: '', image: '' },
                  ]),
                })
              }
            >
              + Add more
            </button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'facilities' ? (
        <SectionBox title="Campus Facilities">
          <div className="space-y-2">
            {(facilityRows.length ? facilityRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[140px_1fr_1fr_auto] md:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_facility" url={row.image || ''} onUrl={(v) => {
                  const next = [...arr]; next[i] = { ...row, image: v }; patch({ [KEY.facilityCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, title: e.target.value }; patch({ [KEY.facilityCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, description: e.target.value }; patch({ [KEY.facilityCardsJson]: rowsToJson(next) });
                }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [KEY.facilityCardsJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [KEY.facilityCardsJson]: rowsToJson([...facilityRows, { image: '', title: '', description: '' }]) })}>+ Add facility</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'programmes' ? (
        <SectionBox title="Departments and Programmes">
          <div className="space-y-2">
            {(departmentProgrammeRows.length ? departmentProgrammeRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[120px_1fr_1fr_1fr_1fr_auto] md:items-end">
                <ImgSlot label="Department photo" organizationId={organizationId} assetType="ps_facility" url={row.image || row.photo || ''} onUrl={(v) => {
                  const next = [...arr]; next[i] = { ...row, image: v }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Department name" value={row.department_name || row.name || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, department_name: e.target.value }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Bachelors programmes / intake" value={row.bachelors_programmes || row.btech_branch_intake || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, bachelors_programmes: e.target.value }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Masters programmes / intake" value={row.masters_programmes || row.mtech_branch_intake || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, masters_programmes: e.target.value }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="PhD programmes / intake" value={row.phd_programmes || row.phd || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, phd_programmes: e.target.value }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                }} />
                <div className="space-y-1 md:col-span-3">
                  <input
                    className="w-full rounded border border-border px-2 py-1"
                    placeholder="Description"
                    maxLength={180}
                    value={row.description || ''}
                    onChange={(e) => {
                      const next = [...arr]; next[i] = { ...row, description: e.target.value }; patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(next) });
                    }}
                  />
                  <p className="text-[10px] text-text-muted">{`${String(row.description || '').length}/180`}</p>
                </div>
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [KEY.departmentProgrammeCardsJson]: rowsToJson([...departmentProgrammeRows, { image: '', department_name: '', bachelors_programmes: '', masters_programmes: '', phd_programmes: '', description: '' }]) })}>+ Add department/programme</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'faculty' ? (
        <SectionBox title="Faculty Overview">
          <div className="space-y-2">
            {(facultyRows.length ? facultyRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_faculty" url={row.photo || ''} onUrl={(v) => {
                    const next = [...arr]; next[i] = { ...row, photo: v }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                  }} />
                </div>
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Name" value={row.name || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, name: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Department" value={row.subject || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, subject: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Qualification" value={row.qualification || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, qualification: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Designation" value={row.designation || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, designation: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Contact" value={row.contact || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, contact: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Email" value={row.email || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, email: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input type="date" className="w-full min-w-0 rounded border border-border px-2 py-1" placeholder="Experience from" value={row.experience_from || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, experience_from: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                }} />
                <input
                  type="date"
                  className="w-full min-w-0 rounded border border-border px-2 py-1"
                  placeholder="Experience to"
                  value={row.experience_to || ''}
                  disabled={String(row.experience_currently_working || '').toLowerCase() === 'true'}
                  onChange={(e) => {
                    const next = [...arr]; next[i] = { ...row, experience_to: e.target.value }; patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                  }}
                />
                <label className="inline-flex min-h-9 items-center gap-2 rounded border border-border px-2 py-1 text-[11px] text-text">
                  <input
                    type="checkbox"
                    checked={String(row.experience_currently_working || '').toLowerCase() === 'true'}
                    onChange={(e) => {
                      const next = [...arr];
                      next[i] = {
                        ...row,
                        experience_currently_working: e.target.checked ? 'true' : 'false',
                        ...(e.target.checked ? { experience_to: '' } : {}),
                      };
                      patch({ [KEY.facultyCardsJson]: rowsToJson(next) });
                    }}
                  />
                  Currently working
                </label>
                <button type="button" className="justify-self-start text-[10px] text-red-600" onClick={() => patch({ [KEY.facultyCardsJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [KEY.facultyCardsJson]: rowsToJson([...facultyRows, { photo: '', name: '', subject: '', qualification: '', designation: '', contact: '', email: '', experience_from: '', experience_to: '', experience_currently_working: 'false' }]) })}>+ Add faculty</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'research' ? (
        <SectionBox title="Research, Innovation, and MoUs">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1"><label className="block text-text">Research projects count</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.researchCount] || ''} onChange={(e) => patch({ [KEY.researchCount]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Patents count</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.patentsCount] || ''} onChange={(e) => patch({ [KEY.patentsCount]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">MoU count</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.mouCount] || ''} onChange={(e) => patch({ [KEY.mouCount]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Centre of excellence (comma separated)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.centreOfExcellence] || ''} onChange={(e) => patch({ [KEY.centreOfExcellence]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Incubation centre (YES/NO)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.incubation] || ''} onChange={(e) => patch({ [KEY.incubation]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Innovation and startup facility (YES/NO)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.innovation] || ''} onChange={(e) => patch({ [KEY.innovation]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'placement' ? (
        <SectionBox title="Training and Placement">
          <div className="grid gap-2 md:grid-cols-2">
            <ImgSlot
              label="Placement officer photo"
              organizationId={organizationId}
              assetType="ps_admin_deo"
              url={values[KEY.placementOfficerPhoto] || ''}
              onUrl={(v) => patch({ [KEY.placementOfficerPhoto]: v })}
            />
            <div className="space-y-1"><label className="block text-text">Placement officer name</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerName] || ''} onChange={(e) => patch({ [KEY.placementOfficerName]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement officer qualification</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerQualification] || ''} onChange={(e) => patch({ [KEY.placementOfficerQualification]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement officer contact</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerContact] || ''} onChange={(e) => patch({ [KEY.placementOfficerContact]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement officer email</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerEmail] || ''} onChange={(e) => patch({ [KEY.placementOfficerEmail]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Experience (From)</label><input type="date" className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerExpFrom] || ''} onChange={(e) => patch({ [KEY.placementOfficerExpFrom]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Experience (To)</label><input type="date" className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementOfficerExpTo] || ''} onChange={(e) => patch({ [KEY.placementOfficerExpTo]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement percentage (last year)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.placementPct] || ''} onChange={(e) => patch({ [KEY.placementPct]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Highest package (LPA)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.highestPackage] || ''} onChange={(e) => patch({ [KEY.highestPackage]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement partners</label><input className="w-full rounded border border-border px-2 py-1" placeholder="Comma separated" value={values[KEY.placementPartners] || ''} onChange={(e) => patch({ [KEY.placementPartners]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'clubs' ? (
        <SectionBox title="Clubs, Activities, and Student Life">
          <div className="space-y-2">
            {(studentLifeRows.length ? studentLifeRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[140px_1fr_1fr_auto] md:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_facility" url={row.image || ''} onUrl={(v) => {
                  const next = [...arr]; next[i] = { ...row, image: v }; patch({ [KEY.studentLifeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title of activity/club" value={row.title || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, title: e.target.value }; patch({ [KEY.studentLifeCardsJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, description: e.target.value }; patch({ [KEY.studentLifeCardsJson]: rowsToJson(next) });
                }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [KEY.studentLifeCardsJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [KEY.studentLifeCardsJson]: rowsToJson([...studentLifeRows, { image: '', title: '', description: '' }]) })}>+ Add student life card</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'gallery' ? (
        <SectionBox title="Gallery">
          <div className="space-y-2">
            {(galleryRows.length ? galleryRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[120px_1fr_1fr_1fr_auto] md:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_gallery" url={row.image || ''} onUrl={(v) => {
                  const next = [...arr]; next[i] = { ...row, image: v }; patch({ [KEY.photoGalleryJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, title: e.target.value }; patch({ [KEY.photoGalleryJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Category" value={row.category || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, category: e.target.value }; patch({ [KEY.photoGalleryJson]: rowsToJson(next) });
                }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => {
                  const next = [...arr]; next[i] = { ...row, description: e.target.value }; patch({ [KEY.photoGalleryJson]: rowsToJson(next) });
                }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [KEY.photoGalleryJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [KEY.photoGalleryJson]: rowsToJson([...galleryRows, { image: '', title: '', category: '', description: '' }]) })}>+ Add gallery item</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'contact' ? (
        <SectionBox title="Contact and Location">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1"><label className="block text-text">Block / ULB</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.block] || ''} onChange={(e) => patch({ [KEY.block]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">GP / Ward</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.gp] || ''} onChange={(e) => patch({ [KEY.gp]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Village</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.village] || ''} onChange={(e) => patch({ [KEY.village]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Institution ID</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.institutionId] || ''} onChange={(e) => patch({ [KEY.institutionId]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Pin code</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.pinCode] || ''} onChange={(e) => patch({ [KEY.pinCode]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Latitude</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.latitude] || ''} onChange={(e) => patch({ [KEY.latitude]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Longitude</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.longitude] || ''} onChange={(e) => patch({ [KEY.longitude]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">{institutionLabel} phone</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.collegePhone] || ''} onChange={(e) => patch({ [KEY.collegePhone]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">{institutionLabel} email</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.collegeEmail] || ''} onChange={(e) => patch({ [KEY.collegeEmail]: e.target.value })} /></div>
            <div className="space-y-1 md:col-span-2"><label className="block text-text">Website</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.website] || ''} onChange={(e) => patch({ [KEY.website]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">AICTE approval (YES/NO)</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.aicte] || ''} onChange={(e) => patch({ [KEY.aicte]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">NAAC</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.naac] || ''} onChange={(e) => patch({ [KEY.naac]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">NBA</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.nba] || ''} onChange={(e) => patch({ [KEY.nba]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">NIRF ranking</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.nirf] || ''} onChange={(e) => patch({ [KEY.nirf]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">AARIIA-ATAL ranking</label><input className="w-full rounded border border-border px-2 py-1" value={values[KEY.aariia] || ''} onChange={(e) => patch({ [KEY.aariia]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}
    </div>
  );
}

