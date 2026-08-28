"use client";

import { useEffect, useState } from "react";

interface ArmoryResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Keyed by request URL so switching tabs back and forth doesn't re-fetch.
const cache = new Map<string, unknown>();

function resourceStateFor<T>(url: string): ArmoryResourceState<T> {
  return cache.has(url)
    ? { data: cache.get(url) as T, error: null, loading: false }
    : { data: null, error: null, loading: true };
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

    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed with status ${response.status}`);
        }
        return (await response.json()) as T;
      })
      .then((data) => {
        if (cancelled) return;
        cache.set(url, data);
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
