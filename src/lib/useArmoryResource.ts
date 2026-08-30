"use client";

import { useEffect, useState } from "react";

interface ArmoryResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Keyed by request URL so switching tabs back and forth doesn't re-fetch,
// and so a background prefetch and an on-screen hook requesting the same
// URL share one in-flight request instead of firing twice.
const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

function resourceStateFor<T>(url: string): ArmoryResourceState<T> {
  return cache.has(url)
    ? { data: cache.get(url) as T, error: null, loading: false }
    : { data: null, error: null, loading: true };
}

async function fetchAndCache<T>(url: string): Promise<T> {
  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T>;

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Request failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    })
    .then((data) => {
      cache.set(url, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, request);
  return request;
}

export function useArmoryResource<T>(url: string): ArmoryResourceState<T> {
  const [requestedUrl, setRequestedUrl] = useState(url);
  const [state, setState] = useState<ArmoryResourceState<T>>(() => resourceStateFor<T>(url));

  // Adjust state during render when the url prop changes, instead of in an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect.
  if (url !== requestedUrl) {
    setRequestedUrl(url);
    setState(resourceStateFor<T>(url));
  }

  useEffect(() => {
    if (cache.has(url)) return;

    let cancelled = false;

    fetchAndCache<T>(url)
      .then((data) => {
        if (cancelled) return;
        setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ data: null, error: error instanceof Error ? error.message : "Unknown error", loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

// Warms the cache for a URL without subscribing any component to it — used
// to prefetch tabs the user hasn't opened yet, so switching to them later
// hits the cache instead of showing a loading state.
export function prefetchArmoryResource(url: string): void {
  if (cache.has(url) || inFlight.has(url)) return;
  void fetchAndCache(url).catch(() => {
    // Swallow prefetch failures — the tab's own useArmoryResource call will
    // retry and surface the error normally if/when the user visits it.
  });
}

// Drops a URL's cached response so the next mount of a useArmoryResource
// subscriber for it fetches fresh data instead of reusing stale cache.
// Clearing the cache alone doesn't nudge an already-mounted subscriber to
// refetch (its effect only re-runs when the `url` argument changes) — pair
// this with remounting that subscriber (e.g. a changed React `key`) when a
// background write (like the Farm List migration) needs its result reflected
// immediately instead of on the next natural navigation.
export function invalidateArmoryResource(url: string): void {
  cache.delete(url);
}
