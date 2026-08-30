"use client";

import { farmListApiUrl, type CharacterRef } from "./character";

// One-time migration for the pre-database Farm List, which lived entirely
// in this localStorage key (see the old useFarmListMountIds hook, now
// removed). Runs once per browser: posts each locally-remembered mount id
// to the real add endpoint (which validates it server-side — anything no
// longer eligible, e.g. since collected or gone unobtainable, is simply
// rejected and dropped rather than migrated), then clears the old key so
// this never runs again. Safe to call every time the Mounts tab mounts;
// it no-ops immediately once migration has happened.
const OLD_STORAGE_KEY = "wowdashboard:farmListMountIds";
const MIGRATED_FLAG_KEY = "wowdashboard:farmListMigratedV1";

function readOldFarmListIds(): number[] {
  try {
    const raw = window.localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

// Returns true if at least one legacy entry was successfully migrated —
// callers use this to know whether previously-cached mount data needs
// refreshing to reflect the newly-migrated Farm List membership.
export async function migrateLegacyFarmListOnce(characterRef: CharacterRef): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(MIGRATED_FLAG_KEY)) return false;

  const legacyIds = readOldFarmListIds();
  if (legacyIds.length === 0) {
    window.localStorage.setItem(MIGRATED_FLAG_KEY, "true");
    window.localStorage.removeItem(OLD_STORAGE_KEY);
    return false;
  }

  const results = await Promise.all(
    legacyIds.map((mountId) =>
      fetch(farmListApiUrl(characterRef), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mountId }),
      })
        .then((response) => response.ok)
        .catch(() => false),
    ),
  );

  window.localStorage.setItem(MIGRATED_FLAG_KEY, "true");
  window.localStorage.removeItem(OLD_STORAGE_KEY);
  return results.some(Boolean);
}
