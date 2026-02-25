"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { WeeklyStat, Clinician } from "./types";

export function useWeeklyStats() {
  const [allStats, setAllStats] = useState<WeeklyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinician, setSelectedClinician] = useState<string>("all");

  useEffect(() => {
    const q = query(
      collection(db, "weeklyStats"),
      orderBy("weekStart", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: WeeklyStat[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<WeeklyStat, "id">),
        }));
        setAllStats(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const clinicians = useMemo<Clinician[]>(() => {
    const map = new Map<string, string>();
    for (const s of allStats) {
      if (s.clinicianId && !map.has(s.clinicianId)) {
        map.set(s.clinicianId, s.clinicianName || s.clinicianId);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allStats]);

  const stats = useMemo(() => {
    if (selectedClinician === "all") {
      const byWeek = new Map<string, WeeklyStat[]>();
      for (const s of allStats) {
        const existing = byWeek.get(s.weekStart) || [];
        existing.push(s);
        byWeek.set(s.weekStart, existing);
      }

      return Array.from(byWeek.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([weekStart, entries]) => ({
          id: `agg-${weekStart}`,
          clinicianId: "all",
          clinicianName: "All Clinicians",
          weekStart,
          followUpRate:
            entries.reduce((sum, e) => sum + e.followUpRate, 0) / entries.length,
          physitrackRate:
            entries.reduce((sum, e) => sum + e.physitrackRate, 0) / entries.length,
          appointmentsTotal: entries.reduce(
            (sum, e) => sum + e.appointmentsTotal,
            0
          ),
        }));
    }

    return allStats
      .filter((s) => s.clinicianId === selectedClinician)
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-6);
  }, [allStats, selectedClinician]);

  return { stats, clinicians, selectedClinician, setSelectedClinician, loading, error };
}
