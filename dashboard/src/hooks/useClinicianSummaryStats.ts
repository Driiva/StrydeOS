"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useClinicians } from "@/hooks/useClinicians";
import { getDemoLatestWeekStats } from "@/hooks/useDemoData";
import type { WeeklyStats, Clinician } from "@/types";

export interface ClinicianSummaryRow {
  clinicianId: string;
  clinicianName: string;
  stats: WeeklyStats;
}

/**
 * Returns the latest weekly stats for each active clinician.
 * Falls back to demo data when Firestore is unavailable or empty.
 */
export function useClinicianSummaryStats(): {
  rows: ClinicianSummaryRow[];
  usedDemo: boolean;
  loading: boolean;
} {
  const { user } = useAuth();
  const { clinicians, loading: cliniciansLoading } = useClinicians();
  const [rows, setRows] = useState<ClinicianSummaryRow[]>([]);
  const [usedDemo, setUsedDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const clinicId = user?.clinicId ?? null;

  useEffect(() => {
    if (cliniciansLoading) return;

    if (!db || !clinicId || clinicians.length === 0) {
      setRows(getDemoLatestWeekStats());
      setUsedDemo(true);
      setLoading(false);
      return;
    }

    const activeClinicians = clinicians.filter((c: Clinician) => c.active);
    if (activeClinicians.length === 0) {
      setRows(getDemoLatestWeekStats());
      setUsedDemo(true);
      setLoading(false);
      return;
    }

    // Subscribe to latest week stats for each active clinician
    const latestByClinicianId: Record<string, WeeklyStats> = {};
    let resolvedCount = 0;
    const unsubs: Array<() => void> = [];

    function tryFlush() {
      resolvedCount++;
      if (resolvedCount < activeClinicians.length) return;

      const built: ClinicianSummaryRow[] = activeClinicians
        .filter((c: Clinician) => latestByClinicianId[c.id])
        .map((c: Clinician) => ({
          clinicianId: c.id,
          clinicianName: latestByClinicianId[c.id].clinicianName,
          stats: latestByClinicianId[c.id],
        }));

      if (built.length === 0) {
        setRows(getDemoLatestWeekStats());
        setUsedDemo(true);
      } else {
        setRows(built);
        setUsedDemo(false);
      }
      setLoading(false);
    }

    for (const clinician of activeClinicians) {
      const q = query(
        collection(db!, "clinics", clinicId, "metrics_weekly"),
        where("clinicianId", "==", clinician.id),
        orderBy("weekStart", "desc"),
        limit(1)
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const doc = snap.docs[0];
            latestByClinicianId[clinician.id] = { id: doc.id, ...doc.data() } as WeeklyStats;
          }
          tryFlush();
        },
        () => {
          tryFlush();
        }
      );

      unsubs.push(unsub);
    }

    return () => unsubs.forEach((u) => u());
  }, [clinicId, clinicians, cliniciansLoading]);

  return { rows, usedDemo, loading };
}
