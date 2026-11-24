// Academic standing options shown in profile setup.
export const ACADEMIC_YEARS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Extended / Graduating Senior",
  "Master’s Student",
  "Non-Degree / Visiting Student",
  "High School / Dual Enrollment",
  "Doctoral / PhD Student",
  "Second-Degree Undergraduate",
  "ePermit Student",
  "Advanced Certificate / Post-Master’s",
  "Post-Baccalaureate (Post-Bacc)",
  "Non-Degree Graduate",
] as const;

export function isAcademicYear(value: unknown): value is (typeof ACADEMIC_YEARS)[number] {
  return (ACADEMIC_YEARS as readonly unknown[]).includes(value);
}
