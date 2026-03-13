export interface HEPProgramme {
  externalId: string;
  patientExternalId: string;
  name: string;
  exerciseCount: number;
  assignedAt: string;
  completionPercent: number;
  lastAccessedAt?: string;
  deepLink?: string;
}

export interface HEPAdapter {
  provider: "physitrack" | "rehab_my_patient" | "wibbi";

  testConnection(): Promise<{ ok: boolean; error?: string }>;

  getProgrammes(params: {
    patientExternalId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<HEPProgramme[]>;

  getProgramme(externalId: string): Promise<HEPProgramme>;
}

export interface HEPIntegrationConfig {
  provider: "physitrack" | "rehab_my_patient" | "wibbi";
  apiKey: string;
  clinicId?: string;
  baseUrl?: string;
}
