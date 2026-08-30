"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { useArmoryResource } from "@/lib/useArmoryResource";
import { useFarmListMountIds } from "@/lib/useFarmListMountIds";
import type { ArmoryMount, ArmoryMountsResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Modal } from "../Modal";
import { CheckIcon, FilterIcon, SearchIcon, SortIcon, StarIcon } from "../icons";
import styles from "./MountsTab.module.css";

interface MountsTabProps {
  characterRef: CharacterRef;
}

const PAGE_SIZE = 60;

type MountFilter = "collected" | "missing" | "all";
type SortOption = "name-asc" | "name-desc" | "collected";

const FILTER_DEFS: { id: MountFilter; label: string }[] = [
  { id: "collected", label: "Collected" },
  { id: "missing", label: "Missing" },
  { id: "all", label: "All" },
];

const SORT_DEFS: { id: SortOption; label: string }[] = [
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "collected", label: "Collected status" },
];

function sortMounts(list: ArmoryMount[], sort: SortOption | null): ArmoryMount[] {
  if (!sort) return list;
  const sorted = [...list];
  if (sort === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
  else sorted.sort((a, b) => Number(b.collected) - Number(a.collected) || a.name.localeCompare(b.name));
  return sorted;
}

function MountCard({
  mount,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  mount: ArmoryMount;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      data-collected={mount.collected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <button
        type="button"
        className={styles.favoriteButton}
        data-active={isFavorite}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={isFavorite ? `Remove ${mount.name} from farm list` : `Add ${mount.name} to farm list`}
      >
        <StarIcon filled={isFavorite} />
      </button>

      {mount.collected ? (
        <span className={styles.collectedBadge} aria-label="Collected">
          <CheckIcon />
        </span>
      ) : null}

      <div className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image */}
        <img src={proxiedImageUrl(mount.render.url)} alt={mount.name} loading="lazy" className={styles.image} />
      </div>
      <span className={styles.name}>{mount.name}</span>
    </div>
  );
}

function MountsContent({ mounts }: { mounts: ArmoryMountsResponse }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MountFilter>("collected");
  const [sort, setSort] = useState<SortOption | null>(null);
  const [farmListOnly, setFarmListOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedMount, setSelectedMount] = useState<ArmoryMount | null>(null);
  const { farmListIds, toggleFarmListMount } = useFarmListMountIds();

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (filterRef.current && !filterRef.current.contains(target)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const totalCount = mounts.mounts.length;
  const collectedCount = mounts.mountsCollected;
  const missingCount = totalCount - collectedCount;
  const percentComplete = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;
  const filterCounts: Record<MountFilter, number> = {
    collected: collectedCount,
    missing: missingCount,
    all: totalCount,
  };

  const byFilter = useMemo(() => {
    if (filter === "collected") return mounts.mounts.filter((mount) => mount.collected);
    if (filter === "missing") return mounts.mounts.filter((mount) => !mount.collected);
    return mounts.mounts;
  }, [mounts.mounts, filter]);

  const byFarmList = useMemo(() => {
    if (!farmListOnly) return byFilter;
    return byFilter.filter((mount) => farmListIds.has(mount.id));
  }, [byFilter, farmListOnly, farmListIds]);

  const bySearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? byFarmList.filter((mount) => mount.name.toLowerCase().includes(q)) : byFarmList;
  }, [byFarmList, query]);

  const filtered = useMemo(() => sortMounts(bySearch, sort), [bySearch, sort]);

  const visible = filtered.slice(0, visibleCount);

  function handleFilterChange(next: MountFilter) {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <div className={styles.summaryStats}>
          <span>
            <span className={styles.summaryCollected}>{collectedCount.toLocaleString()}</span> Collected
          </span>
          <span className={styles.summaryDot}>•</span>
          <span>
            <span className={styles.summaryMissing}>{missingCount.toLocaleString()}</span> Missing
          </span>
          <span className={styles.summaryDot}>•</span>
          <span>
            <span className={styles.summaryPercent}>{percentComplete.toFixed(1)}%</span> Complete
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percentComplete}%` }} />
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup} role="group" aria-label="Filter mounts">
          {FILTER_DEFS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.filterButton}
              data-active={filter === f.id}
              onClick={() => handleFilterChange(f.id)}
            >
              {f.label} <span className={styles.filterCount}>{filterCounts[f.id].toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search mounts..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className={styles.search}
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setQuery("");
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className={styles.dropdown} ref={filterRef}>
          <button
            type="button"
            className={styles.dropdownTrigger}
            data-active={farmListOnly}
            aria-expanded={filterOpen}
            onClick={() => {
              setFilterOpen((open) => !open);
              setSortOpen(false);
            }}
          >
            <FilterIcon />
            Filter
          </button>
          {filterOpen ? (
            <div className={styles.dropdownPanel}>
              <label className={styles.dropdownCheckOption}>
                <input
                  type="checkbox"
                  checked={farmListOnly}
                  onChange={(event) => {
                    setFarmListOnly(event.target.checked);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
                Farm List
              </label>
            </div>
          ) : null}
        </div>

        <div className={styles.dropdown} ref={sortRef}>
          <button
            type="button"
            className={styles.dropdownTrigger}
            data-active={sort !== null}
            aria-expanded={sortOpen}
            onClick={() => {
              setSortOpen((open) => !open);
              setFilterOpen(false);
            }}
          >
            <SortIcon />
            Sort
          </button>
          {sortOpen ? (
            <div className={styles.dropdownPanel}>
              {SORT_DEFS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.dropdownOption}
                  data-active={sort === option.id}
                  onClick={() => {
                    setSort(option.id);
                    setSortOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No mounts match this filter.</p>
      ) : (
        <div className={styles.grid}>
          {visible.map((mount) => (
            <MountCard
              key={mount.id}
              mount={mount}
              isFavorite={farmListIds.has(mount.id)}
              onSelect={() => setSelectedMount(mount)}
              onToggleFavorite={() => toggleFarmListMount(mount.id)}
            />
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
