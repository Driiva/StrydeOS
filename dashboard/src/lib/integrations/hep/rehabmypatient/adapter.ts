import type { HEPAdapter, HEPProgramme, HEPIntegrationConfig } from "../types";
import {
  rehabMyPatientFetch,
  testRehabMyPatientConnection,
  type RehabMyPatientConfig,
} from "./client";
import {
  mapRehabMyPatientPlan,
  type RehabMyPatientPlanRow,
} from "./mappers";

export function createRehabMyPatientAdapter(config: HEPIntegrationConfig): HEPAdapter {
  const clientConfig: RehabMyPatientConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  };

  return {
    provider: "rehab_my_patient",

    async testConnection() {
      return testRehabMyPatientConnection(clientConfig);
    },

    async getProgrammes(params): Promise<HEPProgramme[]> {
      const { patientExternalId, dateFrom, dateTo } = params;

      if (!patientExternalId) {
        // RehabMyPatient requires a patient ID to fetch plans
        return [];
      }

      // Fetch all plans for this patient
      const data = await rehabMyPatientFetch<RehabMyPatientPlanRow[] | { data?: RehabMyPatientPlanRow[] }>(
        clientConfig,
        `/patientPlans/${encodeURIComponent(patientExternalId)}`
      );

      // Handle both wrapped { data: [...] } and direct array responses
      const rows = Array.isArray(data) ? data : (data as { data?: RehabMyPatientPlanRow[] }).data ?? [];
      
      let programmes = rows.map(mapRehabMyPatientPlan);

      // Filter by date range if provided
      if (dateFrom || dateTo) {
        programmes = programmes.filter((p) => {
          const assignedDate = new Date(p.assignedAt);
          if (dateFrom && assignedDate < new Date(dateFrom)) return false;
          if (dateTo && assignedDate > new Date(dateTo)) return false;
          return true;
        });
      }

      return programmes;
    },

    async getProgramme(externalId: string): Promise<HEPProgramme> {
      const data = await rehabMyPatientFetch<RehabMyPatientPlanRow | { data?: RehabMyPatientPlanRow }>(
        clientConfig,
        `/patientPlan/${encodeURIComponent(externalId)}`
      );

      // Handle both wrapped { data: {...} } and direct object responses
      const row = (data as { data?: RehabMyPatientPlanRow }).data ?? (data as RehabMyPatientPlanRow);
      return mapRehabMyPatientPlan(row);
    },
  };
}
