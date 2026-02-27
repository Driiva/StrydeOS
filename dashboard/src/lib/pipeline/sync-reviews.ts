import type { Firestore } from "firebase-admin/firestore";
import { GooglePlacesClient, type GoogleReview } from "@/lib/integrations/reviews/google/client";
import type { StageResult } from "./types";

/**
 * Stage 7: Sync Google Business Profile reviews into Firestore.
 *
 * Fetches reviews from the Google Places API, deduplicates by publishTime,
 * and attempts to match clinician mentions by name keyword search.
 */
export async function syncReviews(
  db: Firestore,
  clinicId: string,
  apiKey: string,
  placeId: string,
  clinicianMap: Map<string, string>
): Promise<StageResult> {
  const start = Date.now();
  const errors: string[] = [];
  let count = 0;

  try {
    const client = new GooglePlacesClient(apiKey);
    const reviews = await client.getPlaceReviews(placeId);

    // Load clinician names for mention matching
    const cliniciansSnap = await db
      .collection("clinics")
      .doc(clinicId)
      .collection("clinicians")
      .get();
    const clinicianNames = cliniciansSnap.docs.map((d) => ({
      id: d.id,
      name: (d.data().name as string) ?? "",
      firstName: ((d.data().name as string) ?? "").split(" ")[0].toLowerCase(),
      lastName: ((d.data().name as string) ?? "")
        .split(" ")
        .slice(1)
        .join(" ")
        .toLowerCase(),
    }));

    function findMentionedClinician(text: string): string | undefined {
      const lower = text.toLowerCase();
      for (const c of clinicianNames) {
        if (
          lower.includes(c.name.toLowerCase()) ||
          (c.firstName.length > 2 && lower.includes(c.firstName)) ||
          (c.lastName.length > 2 && lower.includes(c.lastName))
        ) {
          return c.id;
        }
      }
      return undefined;
    }

    const reviewsRef = db
      .collection("clinics")
      .doc(clinicId)
      .collection("reviews");

    // Load existing review publish times for dedup
    const existingSnap = await reviewsRef.get();
    const existingDates = new Set(
      existingSnap.docs.map((d) => d.data().date as string)
    );

    const batch = db.batch();

    for (const review of reviews) {
      const publishDate = review.publishTime
        ? new Date(review.publishTime).toISOString()
        : new Date().toISOString();

      // Skip if we already have a review with this exact publish time
      if (existingDates.has(publishDate)) continue;

      const reviewText =
        review.text?.text ?? review.originalText?.text ?? undefined;
      const clinicianMentioned = reviewText
        ? findMentionedClinician(reviewText)
        : undefined;

      const docRef = reviewsRef.doc();
      batch.set(docRef, {
        platform: "google" as const,
        rating: review.rating,
        reviewText,
        date: publishDate,
        clinicianMentioned: clinicianMentioned ?? null,
        authorName: review.authorAttribution?.displayName ?? null,
        verified: true,
      });
      count++;
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  return {
    stage: "sync-reviews",
    ok: errors.length === 0,
    count,
    errors,
    durationMs: Date.now() - start,
  };
}
