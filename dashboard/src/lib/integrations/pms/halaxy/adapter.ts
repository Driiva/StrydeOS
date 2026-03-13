import type { PMSAdapter, PMSAppointment, PMSPatient, PMSClinician, InsuranceInfo } from "@/types/pms";
import type { AppointmentStatus } from "@/types";
import { halaxyFetch, halaxyFetchAll, testHalaxyConnection, type HalaxyConfig } from "./client";
import {
  mapHalaxyAppointment,
  mapHalaxyPractitioner,
  mapHalaxyPatient,
  type HalaxyAppointmentResource,
  type HalaxyPractitionerResource,
  type HalaxyPatientResource,
} from "./mappers";

export function createHalaxyAdapter(config: HalaxyConfig): PMSAdapter {
  return {
    provider: "halaxy",

    async testConnection() {
      return testHalaxyConnection(config);
    },

    async getAppointments(params) {
      const { clinicianExternalId, dateFrom, dateTo } = params;

      // FHIR date filter: date=ge{from}&date=le{to}
      const filters: string[] = [
        `date=ge${dateFrom}`,
        `date=le${dateTo}`,
        "_count=100",
      ];

      if (clinicianExternalId) {
        filters.push(`practitioner=${encodeURIComponent(clinicianExternalId)}`);
      }

      const path = `/fhir/Appointment?${filters.join("&")}`;
      const resources = await halaxyFetchAll<HalaxyAppointmentResource>(config, path);
      return resources.map(mapHalaxyAppointment);
    },

    async getPatient(externalId: string): Promise<PMSPatient> {
      const resource = await halaxyFetch<HalaxyPatientResource>(
        config,
        `/fhir/Patient/${encodeURIComponent(externalId)}`
      );
      return mapHalaxyPatient(resource);
    },

    async createAppointment(params) {
      // FHIR Appointment resource for creation
      const body = {
        resourceType: "Appointment",
        status: "booked",
        start: params.dateTime,
        end: params.endTime,
        comment: params.notes,
        participant: [
          {
            actor: { reference: `Practitioner/${params.clinicianExternalId}` },
            status: "accepted",
          },
          {
            actor: { reference: `Patient/${params.patientExternalId}` },
            status: "accepted",
          },
        ],
      };

      const created = await halaxyFetch<HalaxyAppointmentResource>(
        config,
        "/fhir/Appointment",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      return { externalId: String(created.id ?? "") };
    },

    async updateAppointmentStatus(externalId: string, status: AppointmentStatus) {
      // FHIR uses PATCH with status field update
      const fhirStatus =
        status === "completed" ? "fulfilled" :
        status === "cancelled" ? "cancelled" :
        status === "dna" ? "noshow" :
        "booked";

      try {
        await halaxyFetch(
          config,
          `/fhir/Appointment/${encodeURIComponent(externalId)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ resourceType: "Appointment", status: fhirStatus }),
          }
        );
      } catch {
        // No-op if FHIR PATCH not supported on this resource
      }
    },

    async getClinicians(): Promise<PMSClinician[]> {
      const resources = await halaxyFetchAll<HalaxyPractitionerResource>(
        config,
        "/fhir/Practitioner?_count=100&active=true"
      );
      return resources.map(mapHalaxyPractitioner);
    },

    async getInsuranceInfo(_patientExternalId: string): Promise<InsuranceInfo | null> {
      // Halaxy stores insurance/coverage on FHIR Coverage resources
      // Not exposed in the core appointment sync path — return null for now
      return null;
    },
  };
}
