// Pure helpers for the Mount Collection page: faction eligibility, display
// status, aggregate stats, label maps, and the search/filter/sort pipeline.
// Kept free of React so they're trivially testable and reusable.

import type { EnrichedMount, MountFactionRestriction } from "./mountReference";

export type CharacterFactionSlug = "alliance" | "horde";

// A mount is eligible for a character when it carries no faction
// restriction at all, or when its restriction matches the character's own
// faction. Never treat "restricted to the other faction" as "unobtainable" —
// those are different concepts and must stay distinguishable in the UI.
export function isFactionEligible(mountFaction: MountFactionRestriction | null, characterFaction: CharacterFactionSlug): boolean {
  return mountFaction === null || mountFaction === characterFaction;
}

export type MountDisplayStatus = "collected" | "available" | "unobtainable" | "wrong-faction";

// A single prioritized status per mount: collected always wins (a character
// that already owns a mount sees it as collected even if it's also flagged
// unobtainable or faction-restricted). Callers that need to surface the
// unobtainable overlap on a collected mount should check `mount.unobtainable`
// separately (see isLegacyCollected below) rather than folding it into this.
export function getMountDisplayStatus(mount: EnrichedMount, characterFaction: CharacterFactionSlug): MountDisplayStatus {
  if (mount.collected) return "collected";
  if (!isFactionEligible(mount.factionRestriction, characterFaction)) return "wrong-faction";
  if (mount.unobtainable) return "unobtainable";
  return "available";
}

// True when a mount the character already owns is also flagged unobtainable
// (e.g. a removed promotion or a retired event mount) — surfaced as a
// secondary "Legacy" badge alongside the primary Collected status, never as
// a replacement for it.
export function isLegacyCollected(mount: EnrichedMount): boolean {
  return mount.collected && mount.unobtainable;
}

export interface MountCollectionStats {
  totalMounts: number;
  collectedMounts: number;
  unobtainableMounts: number;
  availableToCollect: number;
  wrongFactionMounts: number;
  completionRate: number;
}

// Every mount lands in exactly one bucket: collectedMounts first (it always
// wins), then — for the rest — wrongFactionMounts, unobtainableMounts, or
// availableToCollect. completionRate is collected divided by the mounts this
// character could ever collect (collected + still available), so mounts
// that are wrong-faction or unobtainable-and-never-collected never enter the
// denominator. No subtraction-based math (e.g. total - unobtainable -
// collected) is used anywhere here.
export function calculateMountStats(mounts: EnrichedMount[], characterFaction: CharacterFactionSlug): MountCollectionStats {
  let collectedMounts = 0;
  let unobtainableMounts = 0;
  let availableToCollect = 0;
  let wrongFactionMounts = 0;

  for (const mount of mounts) {
    if (mount.collected) {
      collectedMounts += 1;
      continue;
    }
    if (!isFactionEligible(mount.factionRestriction, characterFaction)) {
      wrongFactionMounts += 1;
    } else if (mount.unobtainable) {
      unobtainableMounts += 1;
    } else {
      availableToCollect += 1;
    }
  }

  const obtainableTotal = collectedMounts + availableToCollect;

  return {
    totalMounts: mounts.length,
    collectedMounts,
    unobtainableMounts,
    availableToCollect,
    wrongFactionMounts,
    completionRate: obtainableTotal > 0 ? collectedMounts / obtainableTotal : 0,
  };
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  drop: "Drop",
  quest: "Quest",
  vendor: "Vendor",
  achievement: "Achievement",
  profession: "Profession",
  promotion: "Promotion",
  trading: "Trading Post",
  currency: "Currency",
  faction: "Reputation",
  treasure: "Treasure",
  other: "Other Source",
};

export function sourceTypeLabel(sourceType: string | null): string {
  if (!sourceType) return "Unknown Source";
  return SOURCE_TYPE_LABELS[sourceType] ?? "Other Source";
}

export const FACTION_LABELS: Record<MountFactionRestriction, string> = {
  alliance: "Alliance",
  horde: "Horde",
};

export function factionLabel(faction: MountFactionRestriction | null): string {
  return faction ? FACTION_LABELS[faction] : "Both Factions";
}

export const STATUS_LABELS: Record<MountDisplayStatus, string> = {
  collected: "Collected",
  available: "To Collect",
  unobtainable: "Unobtainable",
  "wrong-faction": "Wrong Faction",
};

export type CollectionTab = "all" | "collected" | "to-collect" | "unobtainable";

export const TAB_DEFS: { id: CollectionTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "collected", label: "Collected" },
  { id: "to-collect", label: "To Collect" },
  { id: "unobtainable", label: "Unobtainable" },
];

export function matchesTab(status: MountDisplayStatus, tab: CollectionTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "collected":
      return status === "collected";
    case "to-collect":
      return status === "available";
    case "unobtainable":
      return status === "unobtainable";
  }
}

export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase();
}

export function matchesSearch(mount: EnrichedMount, normalizedQuery: string): boolean {
  return normalizedQuery === "" || mount.name.toLowerCase().includes(normalizedQuery);
}

export type SortOption = "name-asc" | "name-desc" | "status";

export const SORT_DEFS: { id: SortOption; label: string }[] = [
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "status", label: "Collection status" },
];

const STATUS_SORT_WEIGHT: Record<MountDisplayStatus, number> = {
  collected: 0,
  available: 1,
  unobtainable: 2,
  "wrong-faction": 3,
};

export function sortMounts(
  mounts: EnrichedMount[],
  sort: SortOption,
  statusOf: (mount: EnrichedMount) => MountDisplayStatus,
): EnrichedMount[] {
  const sorted = [...mounts];
  if (sort === "name-asc") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "name-desc") {
    sorted.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    sorted.sort((a, b) => STATUS_SORT_WEIGHT[statusOf(a)] - STATUS_SORT_WEIGHT[statusOf(b)] || a.name.localeCompare(b.name));
  }
  return sorted;
}

export interface MountFilterState {
  sourceTypes: Set<string>;
  factions: Set<MountFactionRestriction>;
  farmListOnly: boolean;
}

export function createEmptyFilterState(): MountFilterState {
  return { sourceTypes: new Set(), factions: new Set(), farmListOnly: false };
}

export function isFilterStateEmpty(filters: MountFilterState): boolean {
  return filters.sourceTypes.size === 0 && filters.factions.size === 0 && !filters.farmListOnly;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function matchesFilters(mount: EnrichedMount, filters: MountFilterState, farmListIds: Set<number>): boolean {
  if (filters.sourceTypes.size > 0) {
    const key = mount.sourceType ?? "unknown";
    if (!filters.sourceTypes.has(key)) return false;
  }
  if (filters.factions.size > 0) {
    if (!mount.factionRestriction || !filters.factions.has(mount.factionRestriction)) return false;
  }
  if (filters.farmListOnly && !farmListIds.has(mount.id)) return false;
  return true;
}
