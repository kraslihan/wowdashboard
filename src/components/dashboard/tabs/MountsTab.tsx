"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { useArmoryResource } from "@/lib/useArmoryResource";
import { useFarmListMountIds } from "@/lib/useFarmListMountIds";
import type { CharacterSummary } from "@/lib/armory/characterSummary";
import type { ArmoryMountsResponse } from "@/lib/armory/types";
import { enrichMounts, gridImageUrl, detailImageUrl, type EnrichedMount, type MountFactionRestriction } from "@/lib/armory/mountReference";
import {
  calculateMountStats,
  createEmptyFilterState,
  factionLabel,
  formatCount,
  formatPercent,
  getMountDisplayStatus,
  isFilterStateEmpty,
  isLegacyCollected,
  matchesFilters,
  matchesSearch,
  matchesTab,
  normalizeSearchText,
  pluralize,
  sortMounts,
  sourceTypeLabel,
  SORT_DEFS,
  STATUS_LABELS,
  TAB_DEFS,
  type CharacterFactionSlug,
  type CollectionTab,
  type MountDisplayStatus,
  type MountFilterState,
  type SortOption,
} from "@/lib/armory/mountCollection";
import { AsyncBoundary } from "../AsyncBoundary";
import { Drawer } from "../Drawer";
import { CheckIcon, FilterIcon, ImageOffIcon, LockIcon, NoEntryIcon, SearchIcon, SortIcon, StarIcon } from "../icons";
import styles from "./MountsTab.module.css";

interface MountsTabProps {
  characterRef: CharacterRef;
}

const PAGE_SIZE = 60;
const UNKNOWN_SOURCE_KEY = "unknown";
const FACTION_OPTIONS: MountFactionRestriction[] = ["alliance", "horde"];

function MountImage({
  candidates,
  alt,
  className,
  placeholderClassName,
}: {
  candidates: (string | null)[];
  alt: string;
  className?: string;
  placeholderClassName?: string;
}) {
  const validCandidates = useMemo(() => candidates.filter((url): url is string => Boolean(url)), [candidates]);
  const [index, setIndex] = useState(0);
  const src = index < validCandidates.length ? validCandidates[index] : null;

  if (!src) {
    return (
      <div className={placeholderClassName} role="img" aria-label={alt}>
        <ImageOffIcon />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
    <img
      src={proxiedImageUrl(src)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}

function StatusBadge({ status, compact }: { status: MountDisplayStatus; compact?: boolean }) {
  if (status === "collected") {
    return (
      <span className={`${styles.badge} ${styles.badgeCollected}`}>
        <CheckIcon />
        {!compact && STATUS_LABELS.collected}
      </span>
    );
  }
  if (status === "unobtainable") {
    return (
      <span className={`${styles.badge} ${styles.badgeUnobtainable}`}>
        <LockIcon />
        {!compact && STATUS_LABELS.unobtainable}
      </span>
    );
  }
  if (status === "wrong-faction") {
    return (
      <span className={`${styles.badge} ${styles.badgeWrongFaction}`}>
        <NoEntryIcon />
        {!compact && STATUS_LABELS["wrong-faction"]}
      </span>
    );
  }
  return null;
}

function MountCard({
  mount,
  status,
  legacy,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  mount: EnrichedMount;
  status: MountDisplayStatus;
  legacy: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const caption =
    status === "unobtainable"
      ? STATUS_LABELS.unobtainable
      : status === "wrong-faction"
        ? `${factionLabel(mount.factionRestriction)} Only`
        : legacy
          ? "Legacy"
          : null;

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      data-status={status}
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

      {status !== "available" ? (
        <span className={styles.cardStatus} title={`${mount.name}: ${STATUS_LABELS[status]}`}>
          <StatusBadge status={status} compact />
          <span className={styles.srOnly}>{STATUS_LABELS[status]}</span>
        </span>
      ) : null}

      <div className={styles.imageWrap}>
        <MountImage
          candidates={[gridImageUrl(mount)]}
          alt={mount.name}
          className={styles.image}
          placeholderClassName={styles.imagePlaceholder}
        />
      </div>
      <span className={styles.name}>{mount.name}</span>
      {caption ? <span className={styles.cardCaption}>{caption}</span> : null}
    </div>
  );
}

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

function MountsContent({
  mountsResponse,
  characterFaction,
}: {
  mountsResponse: ArmoryMountsResponse;
  characterFaction: CharacterFactionSlug;
}) {
  const enriched = useMemo(() => enrichMounts(mountsResponse.mounts), [mountsResponse.mounts]);
  const statusById = useMemo(() => {
    const map = new Map<number, MountDisplayStatus>();
    for (const mount of enriched) {
      map.set(mount.id, getMountDisplayStatus(mount, characterFaction));
    }
    return map;
  }, [enriched, characterFaction]);
  const statusOf = useCallback(
    (mount: EnrichedMount): MountDisplayStatus => statusById.get(mount.id) ?? "available",
    [statusById],
  );

  const stats = useMemo(() => calculateMountStats(enriched, characterFaction), [enriched, characterFaction]);

  const [tab, setTab] = useState<CollectionTab>("collected");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [filters, setFilters] = useState<MountFilterState>(() => createEmptyFilterState());
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedMount, setSelectedMount] = useState<EnrichedMount | null>(null);
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

  const tabCounts = useMemo(() => {
    const counts: Record<CollectionTab, number> = { all: 0, collected: 0, "to-collect": 0, unobtainable: 0 };
    for (const mount of enriched) {
      const status = statusOf(mount);
      for (const def of TAB_DEFS) {
        if (matchesTab(status, def.id)) counts[def.id] += 1;
      }
    }
    return counts;
  }, [enriched, statusOf]);

  const availableSourceTypes = useMemo(() => {
    const keys = new Set<string>();
    for (const mount of enriched) keys.add(mount.sourceType ?? UNKNOWN_SOURCE_KEY);
    return [...keys].sort((a, b) =>
      sourceTypeLabel(a === UNKNOWN_SOURCE_KEY ? null : a).localeCompare(sourceTypeLabel(b === UNKNOWN_SOURCE_KEY ? null : b)),
    );
  }, [enriched]);

  const byTab = useMemo(() => enriched.filter((mount) => matchesTab(statusOf(mount), tab)), [enriched, statusOf, tab]);
  const byFilters = useMemo(
    () => byTab.filter((mount) => matchesFilters(mount, filters, farmListIds)),
    [byTab, filters, farmListIds],
  );
  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);
  const searched = useMemo(() => byFilters.filter((mount) => matchesSearch(mount, normalizedQuery)), [byFilters, normalizedQuery]);
  const filtered = useMemo(() => sortMounts(searched, sort, statusOf), [searched, sort, statusOf]);
  const visible = filtered.slice(0, visibleCount);

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (query) {
      chips.push({ key: "query", label: `Search: "${query}"`, onRemove: () => setQuery("") });
    }
    for (const sourceType of filters.sourceTypes) {
      chips.push({
        key: `source-${sourceType}`,
        label: sourceTypeLabel(sourceType === UNKNOWN_SOURCE_KEY ? null : sourceType),
        onRemove: () =>
          setFilters((prev) => {
            const next = new Set(prev.sourceTypes);
            next.delete(sourceType);
            return { ...prev, sourceTypes: next };
          }),
      });
    }
    for (const faction of filters.factions) {
      chips.push({
        key: `faction-${faction}`,
        label: factionLabel(faction),
        onRemove: () =>
          setFilters((prev) => {
            const next = new Set(prev.factions);
            next.delete(faction);
            return { ...prev, factions: next };
          }),
      });
    }
    if (filters.farmListOnly) {
      chips.push({ key: "farm-list", label: "Farm List", onRemove: () => setFilters((prev) => ({ ...prev, farmListOnly: false })) });
    }
    return chips;
  }, [query, filters]);

  function resetPagination() {
    setVisibleCount(PAGE_SIZE);
  }

  function handleTabChange(next: CollectionTab) {
    setTab(next);
    resetPagination();
  }

  function toggleSourceTypeFilter(sourceType: string) {
    setFilters((prev) => {
      const next = new Set(prev.sourceTypes);
      if (next.has(sourceType)) next.delete(sourceType);
      else next.add(sourceType);
      return { ...prev, sourceTypes: next };
    });
    resetPagination();
  }

  function toggleFactionFilter(faction: MountFactionRestriction) {
    setFilters((prev) => {
      const next = new Set(prev.factions);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return { ...prev, factions: next };
    });
    resetPagination();
  }

  function clearAllFilters() {
    setFilters(createEmptyFilterState());
    setQuery("");
    resetPagination();
  }

  const selectedStatus = selectedMount ? statusOf(selectedMount) : null;
  const selectedLegacy = selectedMount ? isLegacyCollected(selectedMount) : false;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mount Collection</h2>
        <p className={styles.subtitle}>
          Every mount your character can collect, cross-referenced against known sources and obtainability so you know exactly
          what&apos;s still worth chasing.
        </p>
      </div>

      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressPercent}>{formatPercent(stats.completionRate)}</span>
          <span className={styles.progressLabel}>of collectible mounts obtained</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${stats.completionRate * 100}%` }} />
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatCount(stats.totalMounts)}</span>
          <span className={styles.statLabel}>{pluralize(stats.totalMounts, "Total Mount", "Total Mounts")}</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statValue} ${styles.statValueGood}`}>{formatCount(stats.collectedMounts)}</span>
          <span className={styles.statLabel}>Collected</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statValue} ${styles.statValueGold}`}>{formatCount(stats.availableToCollect)}</span>
          <span className={styles.statLabel}>Available to Collect</span>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.statValue} ${styles.statValueMuted}`}>{formatCount(stats.unobtainableMounts)}</span>
          <span className={styles.statLabel}>Unobtainable</span>
        </div>
      </div>

      <div className={styles.tabGroup} role="tablist" aria-label="Collection status">
        {TAB_DEFS.map((def) => (
          <button
            key={def.id}
            type="button"
            role="tab"
            aria-selected={tab === def.id}
            className={styles.tabButton}
            data-active={tab === def.id}
            onClick={() => handleTabChange(def.id)}
          >
            {def.label} <span className={styles.tabCount}>{formatCount(tabCounts[def.id])}</span>
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search mounts..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPagination();
            }}
            className={styles.search}
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setQuery("");
                resetPagination();
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
            data-active={!isFilterStateEmpty(filters)}
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
              <span className={styles.dropdownGroupLabel}>Source Type</span>
              <div className={styles.dropdownScrollGroup}>
                {availableSourceTypes.map((sourceType) => (
                  <label key={sourceType} className={styles.dropdownCheckOption}>
                    <input
                      type="checkbox"
                      checked={filters.sourceTypes.has(sourceType)}
                      onChange={() => toggleSourceTypeFilter(sourceType)}
                    />
                    {sourceTypeLabel(sourceType === UNKNOWN_SOURCE_KEY ? null : sourceType)}
                  </label>
                ))}
              </div>

              <span className={styles.dropdownGroupLabel}>Faction</span>
              {FACTION_OPTIONS.map((faction) => (
                <label key={faction} className={styles.dropdownCheckOption}>
                  <input type="checkbox" checked={filters.factions.has(faction)} onChange={() => toggleFactionFilter(faction)} />
                  {factionLabel(faction)}
                </label>
              ))}

              <span className={styles.dropdownGroupLabel}>Other</span>
              <label className={styles.dropdownCheckOption}>
                <input
                  type="checkbox"
                  checked={filters.farmListOnly}
                  onChange={(event) => {
                    setFilters((prev) => ({ ...prev, farmListOnly: event.target.checked }));
                    resetPagination();
                  }}
                />
                Farm List only
              </label>
            </div>
          ) : null}
        </div>

        <div className={styles.dropdown} ref={sortRef}>
          <button
            type="button"
            className={styles.dropdownTrigger}
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

      {activeChips.length > 0 ? (
        <div className={styles.chipRow}>
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" className={styles.chip} onClick={chip.onRemove}>
              {chip.label}
              <span aria-hidden="true"> ×</span>
            </button>
          ))}
          <button type="button" className={styles.chipClear} onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {tab === "collected"
            ? "You haven't collected any mounts in this view yet."
            : "No mounts match your search and filters."}
        </p>
      ) : (
        <div className={styles.grid}>
          {visible.map((mount) => (
            <MountCard
              key={mount.id}
              mount={mount}
              status={statusOf(mount)}
              legacy={isLegacyCollected(mount)}
              isFavorite={farmListIds.has(mount.id)}
              onSelect={() => setSelectedMount(mount)}
              onToggleFavorite={() => toggleFarmListMount(mount.id)}
            />
          ))}
        </div>
      )}

      {visibleCount < filtered.length ? (
        <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Load more ({formatCount(filtered.length - visibleCount)} remaining)
        </button>
      ) : null}

      {selectedMount && selectedStatus ? (
        <Drawer onClose={() => setSelectedMount(null)} titleId="mount-detail-name">
          <h2 id="mount-detail-name" className={styles.detailName}>
            {selectedMount.name}
          </h2>

          <div className={styles.detailBadgeRow}>
            <StatusBadge status={selectedStatus} />
            {selectedLegacy ? <span className={`${styles.badge} ${styles.badgeLegacy}`}>Legacy</span> : null}
          </div>

          <div className={styles.detailImageWrap}>
            <MountImage
              candidates={[detailImageUrl(selectedMount)]}
              alt={selectedMount.name}
              className={styles.detailImage}
              placeholderClassName={styles.detailImagePlaceholder}
            />
          </div>

          <dl className={styles.detailFacts}>
            <div className={styles.detailFact}>
              <dt>Source</dt>
              <dd>{sourceTypeLabel(selectedMount.sourceType)}</dd>
            </div>
            {selectedMount.sourceName ? (
              <div className={styles.detailFact}>
                <dt>Details</dt>
                <dd>{selectedMount.sourceName}</dd>
              </div>
            ) : null}
            {selectedMount.sourceZone ? (
              <div className={styles.detailFact}>
                <dt>Zone</dt>
                <dd>{selectedMount.sourceZone}</dd>
              </div>
            ) : null}
            {selectedMount.factionRestriction ? (
              <div className={styles.detailFact}>
                <dt>Faction</dt>
                <dd data-faction={selectedMount.factionRestriction}>{factionLabel(selectedMount.factionRestriction)} Only</dd>
              </div>
            ) : null}
          </dl>

          <button
            type="button"
            className={styles.detailFavoriteButton}
            data-active={farmListIds.has(selectedMount.id)}
            onClick={() => toggleFarmListMount(selectedMount.id)}
          >
            <StarIcon filled={farmListIds.has(selectedMount.id)} />
            {farmListIds.has(selectedMount.id) ? "On Farm List" : "Add to Farm List"}
          </button>
        </Drawer>
      ) : null}
    </div>
  );
}

export function MountsTab({ characterRef }: MountsTabProps) {
  const mounts = useArmoryResource<ArmoryMountsResponse>(armoryApiUrl("mounts", characterRef));
  const character = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));

  const loading = mounts.loading || character.loading;
  const error = mounts.error ?? character.error;
  const data = mounts.data && character.data ? { mounts: mounts.data, character: character.data } : null;

  return (
    <AsyncBoundary loading={loading} error={error} data={data}>
      {({ mounts, character }) => (
        <MountsContent mountsResponse={mounts} characterFaction={character.faction.slug as CharacterFactionSlug} />
      )}
    </AsyncBoundary>
  );
}
