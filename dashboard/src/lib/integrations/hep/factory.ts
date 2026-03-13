import type { HEPAdapter, HEPIntegrationConfig } from "./types";
import { createPhysitrackAdapter } from "./physitrack/adapter";
import { createRehabMyPatientAdapter } from "./rehabmypatient/adapter";
import { createWibbiAdapter } from "./wibbi/adapter";

export function createHEPAdapter(config: HEPIntegrationConfig): HEPAdapter {
  switch (config.provider) {
    case "physitrack":
      return createPhysitrackAdapter(config);
    case "rehab_my_patient":
      return createRehabMyPatientAdapter(config);
    case "wibbi":
      return createWibbiAdapter(config);
    default:
      throw new Error(`Unknown HEP provider: ${config.provider}`);
  }
}
