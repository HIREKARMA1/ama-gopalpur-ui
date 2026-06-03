/** Education school sub-departments (legacy school CSV + PS portfolio). */
export const EDUCATION_SCHOOL_SUB_DEPTS = ['PS', 'UPS', 'HS', 'HSS'] as const;
export type EducationSchoolSubDept = (typeof EDUCATION_SCHOOL_SUB_DEPTS)[number];

/** Sub-departments that share the degree-college portfolio CSV and UI (no placement tab). */
export const DEGREE_COLLEGE_LIKE_SUB_DEPTS = ['DEGREE_COLLEGE', 'SSS'] as const;

/** Sub-departments that use the engineering-style public portfolio website. */
export const ENGINEERING_PORTFOLIO_SUB_DEPTS = [
  'ENGINEERING_COLLEGE',
  'UNIVERSITY',
  'DEGREE_COLLEGE',
  'ITI',
  'SSS',
] as const;

export function isEducationSchoolSubDept(value: string): value is EducationSchoolSubDept {
  return (EDUCATION_SCHOOL_SUB_DEPTS as readonly string[]).includes(value);
}

export function isDegreeCollegeLike(subDept: string | null | undefined): boolean {
  const u = (subDept || '').toUpperCase();
  return (DEGREE_COLLEGE_LIKE_SUB_DEPTS as readonly string[]).includes(u);
}

export function isEngineeringPortfolioSubDept(subDept: string | null | undefined): boolean {
  const u = (subDept || '').toUpperCase();
  return (ENGINEERING_PORTFOLIO_SUB_DEPTS as readonly string[]).includes(u);
}
