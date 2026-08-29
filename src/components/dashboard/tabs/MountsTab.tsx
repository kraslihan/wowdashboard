"use client";

import { useMemo, useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryMountsResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import styles from "./MountsTab.module.css";

interface MountsTabProps {
  characterRef: CharacterRef;
}

const PAGE_SIZE = 60;

function MountsContent({ mounts }: { mounts: ArmoryMountsResponse }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const collected = useMemo(() => mounts.mounts.filter((mount) => mount.collected), [mounts.mounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? collected.filter((mount) => mount.name.toLowerCase().includes(q)) : collected;
  }, [collected, query]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <span className={styles.badge}>{mounts.mountsCollected} Mounts Collected</span>
        <input
          type="search"
          placeholder="Mount name"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className={styles.search}
        />
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No mounts match this search.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((mount) => (
            <div key={mount.id} className={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image */}
              <img
                src={proxiedImageUrl(mount.render.url)}
                alt={mount.name}
                loading="lazy"
                className={styles.image}
              />
              <span className={styles.name}>{mount.name}</span>
            </div>
          ))}
        </div>
      )}

      {visibleCount < filtered.length ? (
        <button
          type="button"
          className={styles.loadMore}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Load more ({filtered.length - visibleCount} remaining)
        </button>
      ) : null}
    </div>
  );
}

export function MountsTab({ characterRef }: MountsTabProps) {
  const { data, loading, error } = useArmoryResource<ArmoryMountsResponse>(armoryApiUrl("mounts", characterRef));
  return (
    <AsyncBoundary loading={loading} error={error} data={data}>
      {(mounts) => <MountsContent mounts={mounts} />}
    </AsyncBoundary>
  );
}
