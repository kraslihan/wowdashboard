"use client";

import { useCallback, useRef, useState } from "react";
import { farmListApiUrl, type CharacterRef } from "./character";
import type { EnrichedMount } from "./armory/mountReference";

interface FarmListErrorBody {
  error?: string;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as FarmListErrorBody | null;
  return body?.error ?? fallback;
}

// The BFF response (mount.inFarmList, refetched on load/tab change) is the
// source of truth — this hook only layers a small set of optimistic
// overrides on top of it for mounts with an in-flight or just-completed
// mutation, so the UI updates instantly without waiting for a full mounts
// refetch. A failed mutation clears its override, falling back to the
// last-known server truth.
export function useFarmListMutations(characterRef: CharacterRef) {
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  // Synchronous guard against duplicate requests from rapid double-clicks —
  // state updates are batched/async, so only a ref is safe to check-and-set
  // before the first `await`.
  const inFlightRef = useRef<Set<number>>(new Set());

  const isInFarmList = useCallback((mount: EnrichedMount): boolean => overrides.get(mount.id) ?? mount.inFarmList, [overrides]);
  const isPending = useCallback((mountId: number): boolean => pendingIds.has(mountId), [pendingIds]);

  const mutate = useCallback(
    async (mountId: number, nextValue: boolean) => {
      if (inFlightRef.current.has(mountId)) return;
      inFlightRef.current.add(mountId);
      setPendingIds(new Set(inFlightRef.current));
      setOverrides((prev) => new Map(prev).set(mountId, nextValue));
      setError(null);

      try {
        const response = nextValue
          ? await fetch(farmListApiUrl(characterRef), {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ mountId }),
            })
          : await fetch(farmListApiUrl(characterRef, mountId), { method: "DELETE" });

        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, nextValue ? "Couldn't add this mount to your Farm List." : "Couldn't remove this mount from your Farm List."),
          );
        }
      } catch (err) {
        // Roll back: drop the optimistic override so the mount falls back
        // to the last-known server truth.
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(mountId);
          return next;
        });
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        inFlightRef.current.delete(mountId);
        setPendingIds(new Set(inFlightRef.current));
      }
    },
    [characterRef],
  );

  const addToFarmList = useCallback((mountId: number) => void mutate(mountId, true), [mutate]);
  const removeFromFarmList = useCallback((mountId: number) => void mutate(mountId, false), [mutate]);
  const clearError = useCallback(() => setError(null), []);

  return { isInFarmList, isPending, addToFarmList, removeFromFarmList, error, clearError };
}
