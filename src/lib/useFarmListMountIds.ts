"use client";

import { useCallback, useState } from "react";

// Mount favorites ("Farm List") have no server-side home yet, so they're kept
// per-browser in localStorage — good enough until the app has real user
// accounts to persist this against.
const STORAGE_KEY = "wowdashboard:farmListMountIds";

function readStoredIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is number => typeof id === "number")) : new Set();
  } catch {
    return new Set();
  }
}

export function useFarmListMountIds() {
  const [farmListIds, setFarmListIds] = useState<Set<number>>(() => readStoredIds());

  const toggleFarmListMount = useCallback((id: number) => {
    setFarmListIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Storage unavailable (private browsing, quota) — state still works in-memory.
      }
      return next;
    });
  }, []);

  return { farmListIds, toggleFarmListMount };
}
