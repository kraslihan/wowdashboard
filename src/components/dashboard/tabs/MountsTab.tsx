"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryMountsResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Meter } from "../Meter";
import styles from "./MountsTab.module.css";

interface MountsTabProps {
  characterRef: CharacterRef;
}

const PAGE_SIZE = 60;

function qualityColor(slug: string): string {
  switch (slug) {
    case "uncommon":
      return "var(--quality-uncommon)";
    case "rare":
      return "var(--quality-rare)";
    case "epic":
      return "var(--quality-epic)";
    case "legendary":
      return "var(--quality-legendary)";
    default:
      return "var(--quality-common)";
  }
}

function MountsContent({ mounts }: { mounts: ArmoryMountsResponse }) {
  const [query, setQuery] = useState("");
  const [collectedOnly, setCollectedOnly] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mounts.mounts.filter((mount) => {
      if (collectedOnly && !mount.collected) return false;
      if (q && !mount.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mounts.mounts, query, collectedOnly]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className={styles.wrap}>
      <Meter
        label="Mounts collected"
        value={mounts.mountsCollected}
        max={mounts.mounts.length}
        tone={mounts.mountsCollected >= mounts.mounts.length ? "good" : "accent"}
      />

      <div className={styles.controls}>
        <input
          type="search"
          placeholder="Search mounts…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className={styles.search}
        />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={collectedOnly}
            onChange={(event) => {
              setCollectedOnly(event.target.checked);
              setVisibleCount(PAGE_SIZE);
            }}
          />
          Collected only
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No mounts match this filter.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((mount) => (
            <div
              key={mount.id}
              className={styles.card}
              data-collected={mount.collected}
              style={{ "--quality-color": qualityColor(mount.quality.slug) } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image */}
              <img src={mount.render.url} alt={mount.name} loading="lazy" className={styles.image} />
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
