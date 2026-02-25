export interface WeeklyStat {
  id: string;
  clinicianId: string;
  clinicianName: string;
  weekStart: string;
  followUpRate: number;
  physitrackRate: number;
  appointmentsTotal: number;
}

export interface Clinician {
  id: string;
  name: string;
}
