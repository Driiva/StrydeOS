"use client";

import { useState, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_SEQUENCES } from "@/types/comms";
import type { CommsSequenceConfig } from "@/types/comms";

export interface SequenceWithStats extends CommsSequenceConfig {
  sent: number;
  opened: number;
  clicked: number;
  rebooked: number;
}

interface FirestoreSequenceDoc {
  enabled: Record<string, boolean>;
}

export function useSequences() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEFAULT_SEQUENCES.map((s) => [s.type, s.enabled]))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !clinicId) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "clinics", clinicId, "settings", "comms_sequences");
    const unsub: Unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreSequenceDoc;
          setEnabledMap((prev) => ({ ...prev, ...data.enabled }));
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [clinicId]);

  const toggleSequence = useCallback(
    async (type: string, newEnabled: boolean) => {
      // Optimistic update
      setEnabledMap((prev) => ({ ...prev, [type]: newEnabled }));

      if (!db || !clinicId) return;

      const ref = doc(db, "clinics", clinicId, "settings", "comms_sequences");
      try {
        const snap = await getDoc(ref);
        const existing = snap.exists() ? (snap.data() as FirestoreSequenceDoc).enabled ?? {} : {};
        await setDoc(ref, { enabled: { ...existing, [type]: newEnabled } }, { merge: true });
      } catch {
        // Revert on failure
        setEnabledMap((prev) => ({ ...prev, [type]: !newEnabled }));
      }
    },
    [clinicId]
  );

  const sequences: SequenceWithStats[] = DEFAULT_SEQUENCES.map((s) => ({
    ...s,
    enabled: enabledMap[s.type] ?? s.enabled,
    sent: 0,
    opened: 0,
    clicked: 0,
    rebooked: 0,
  }));

  return { sequences, toggleSequence, loading };
}
