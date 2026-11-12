// All CUNY campuses. `id` is stored in the DB; never rename an existing id.

export const BOROUGHS = [
  "Manhattan",
  "Bronx",
  "Brooklyn",
  "Queens",
  "Staten Island",
] as const;

export type Borough = (typeof BOROUGHS)[number];

export const CAMPUSES = [
  { id: "baruch", name: "Baruch College", borough: "Manhattan" },
  { id: "bmcc", name: "Borough of Manhattan Community College", borough: "Manhattan" },
  { id: "bcc", name: "Bronx Community College", borough: "Bronx" },
  { id: "brooklyn", name: "Brooklyn College", borough: "Brooklyn" },
  { id: "csi", name: "College of Staten Island", borough: "Staten Island" },
  { id: "journalism", name: "Craig Newmark Graduate School of Journalism", borough: "Manhattan" },
  { id: "gc", name: "CUNY Graduate Center", borough: "Manhattan" },
  { id: "sph", name: "CUNY Graduate School of Public Health and Health Policy", borough: "Manhattan" },
  { id: "slu", name: "CUNY School of Labor and Urban Studies", borough: "Manhattan" },
  { id: "law", name: "CUNY School of Law", borough: "Queens" },
  { id: "sps", name: "CUNY School of Professional Studies", borough: "Manhattan" },
  { id: "med", name: "CUNY School of Medicine", borough: "Manhattan" },
  { id: "guttman", name: "Guttman Community College", borough: "Manhattan" },
  { id: "hostos", name: "Hostos Community College", borough: "Bronx" },
  { id: "hunter", name: "Hunter College", borough: "Manhattan" },
  { id: "jjay", name: "John Jay College of Criminal Justice", borough: "Manhattan" },
  { id: "kbcc", name: "Kingsborough Community College", borough: "Brooklyn" },
  { id: "laguardia", name: "LaGuardia Community College", borough: "Queens" },
  { id: "lehman", name: "Lehman College", borough: "Bronx" },
  { id: "macaulay", name: "Macaulay Honors College", borough: "Manhattan" },
  { id: "mec", name: "Medgar Evers College", borough: "Brooklyn" },
  { id: "citytech", name: "New York City College of Technology", borough: "Brooklyn" },
  { id: "qc", name: "Queens College", borough: "Queens" },
  { id: "qcc", name: "Queensborough Community College", borough: "Queens" },
  { id: "ccny", name: "The City College of New York", borough: "Manhattan" },
  { id: "york", name: "York College", borough: "Queens" },
] as const satisfies readonly { id: string; name: string; borough: Borough }[];

export type Campus = (typeof CAMPUSES)[number];
export type CampusId = Campus["id"];

export const CAMPUS_IDS = CAMPUSES.map((c) => c.id) as CampusId[];

export function isCampusId(value: unknown): value is CampusId {
  return CAMPUS_IDS.includes(value as CampusId);
}

export function getCampus(id: string | undefined): Campus | undefined {
  return CAMPUSES.find((c) => c.id === id);
}

// Display name; never throws for a missing or unknown campus.
export function campusName(id: string | undefined): string {
  return getCampus(id)?.name ?? "Campus not set";
}
