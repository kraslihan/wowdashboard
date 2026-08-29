"use client";

import { useMemo, useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryMount, ArmoryMountsResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Modal } from "../Modal";
import styles from "./MountsTab.module.css";

interface MountsTabProps {
  characterRef: CharacterRef;
}

const PAGE_SIZE = 60;

type MountFilter = "collected" | "missing" | "all";

const FILTERS: { id: MountFilter; label: string }[] = [
  { id: "collected", label: "Collected" },
  { id: "missing", label: "Missing" },
  { id: "all", label: "All" },
];

function MountsContent({ mounts }: { mounts: ArmoryMountsResponse }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MountFilter>("collected");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedMount, setSelectedMount] = useState<ArmoryMount | null>(null);

  const byFilter = useMemo(() => {
    if (filter === "collected") return mounts.mounts.filter((mount) => mount.collected);
    if (filter === "missing") return mounts.mounts.filter((mount) => !mount.collected);
    return mounts.mounts;
  }, [mounts.mounts, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? byFilter.filter((mount) => mount.name.toLowerCase().includes(q)) : byFilter;
  }, [byFilter, query]);

  const visible = filtered.slice(0, visibleCount);

  function handleFilterChange(next: MountFilter) {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <span className={styles.badge}>
          {mounts.mountsCollected} / {mounts.mounts.length} Mounts Collected
        </span>
        <div className={styles.filterGroup} role="group" aria-label="Filter mounts">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.filterButton}
              data-active={filter === f.id}
              onClick={() => handleFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
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
        <p className={styles.empty}>No mounts match this filter.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((mount) => (
            <button
              key={mount.id}
              type="button"
              className={styles.card}
              data-collected={mount.collected}
              onClick={() => setSelectedMount(mount)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image */}
              <img
                src={proxiedImageUrl(mount.render.url)}
                alt={mount.name}
                loading="lazy"
                className={styles.image}
              />
              <span className={styles.name}>{mount.name}</span>
            </button>
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

      {selectedMount ? (
        <Modal onClose={() => setSelectedMount(null)}>
          <h2 className={styles.detailName}>{selectedMount.name}</h2>
          {!selectedMount.collected ? <span className={styles.detailMissing}>Not Collected</span> : null}
          <div className={styles.detailImageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image */}
            <img
              src={proxiedImageUrl(selectedMount.render.url)}
              alt={selectedMount.name}
              className={styles.detailImage}
            />
          </div>
        </Modal>
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
