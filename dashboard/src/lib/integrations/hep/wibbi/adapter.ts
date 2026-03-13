import type { HEPAdapter, HEPProgramme, HEPIntegrationConfig } from "../types";
import { WibbiClient, testWibbiConnection, type WibbiClientConfig } from "./client";
import { mapWibbiProgramme, type WibbiProgrammeRow } from "./mappers";

export function createWibbiAdapter(config: HEPIntegrationConfig): HEPAdapter {
  const clientConfig: WibbiClientConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  };

  const client = new WibbiClient(clientConfig);

  return {
    provider: "wibbi",

    async testConnection() {
      return testWibbiConnection(clientConfig);
    },

    async getProgrammes(params): Promise<HEPProgramme[]> {
      const { patientExternalId, dateFrom, dateTo } = params;

      const queryParams = new URLSearchParams();
      if (patientExternalId) queryParams.set("patient_id", patientExternalId);
      if (dateFrom) queryParams.set("from", dateFrom);
      if (dateTo) queryParams.set("to", dateTo);

      const qs = queryParams.toString();
      const path = `/api/v1/programmes${qs ? `?${qs}` : ""}`;

      const data = await client.request<
        WibbiProgrammeRow[] | { data?: WibbiProgrammeRow[]; programmes?: WibbiProgrammeRow[] }
      >(path);

      const rows = Array.isArray(data)
        ? data
        : (data as { data?: WibbiProgrammeRow[] }).data ??
          (data as { programmes?: WibbiProgrammeRow[] }).programmes ??
          [];

      return rows.map(mapWibbiProgramme);
    },

    async getProgramme(externalId: string): Promise<HEPProgramme> {
      const data = await client.request<
        WibbiProgrammeRow | { data?: WibbiProgrammeRow; programme?: WibbiProgrammeRow }
      >(`/api/v1/programmes/${encodeURIComponent(externalId)}`);

      const row =
        (data as { data?: WibbiProgrammeRow }).data ??
        (data as { programme?: WibbiProgrammeRow }).programme ??
        (data as WibbiProgrammeRow);

      return mapWibbiProgramme(row);
    },
  };
}
