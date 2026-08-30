// Static per-mount metadata (obtainability, source, faction restriction) that
// Blizzard's own collections API doesn't expose. Built by joining a
// community mount-source export against the live mounts list — see
// mountsDatabase.json. Joined onto the live `ArmoryMount[]` by numeric id.

import mountsDatabaseRaw from "./mountsDatabase.json";
import type { ArmoryMountWithFarmList } from "./types";

export type MountFactionRestriction = "alliance" | "horde";

export interface MountReferenceEntry {
  id: number;
  name: string;
  thumb_url: string | null;
  mount_url: string | null;
  unobtainable: boolean;
  source_name: string | null;
  source_type: string | null;
  source_zone: string | null;
  faction: MountFactionRestriction | null;
}

const mountsDatabase = mountsDatabaseRaw as MountReferenceEntry[];

const mountReferenceById = new Map<number, MountReferenceEntry>(mountsDatabase.map((entry) => [entry.id, entry]));

// ArmoryMount extended with the reference-database fields. Mounts the live
// API returns but the reference database has no row for (shouldn't happen in
// practice — the database was built from the live list — but a new mount
// could ship before the database is refreshed) simply get null/false
// defaults rather than throwing.
export interface EnrichedMount extends ArmoryMountWithFarmList {
  thumbUrl: string | null;
  mountUrl: string | null;
  unobtainable: boolean;
  sourceName: string | null;
  sourceType: string | null;
  sourceZone: string | null;
  factionRestriction: MountFactionRestriction | null;
}

export function enrichMount(mount: ArmoryMountWithFarmList): EnrichedMount {
  const ref = mountReferenceById.get(mount.id);
  return {
    ...mount,
    thumbUrl: ref?.thumb_url ?? null,
    mountUrl: ref?.mount_url ?? null,
    unobtainable: ref?.unobtainable ?? false,
    sourceName: ref?.source_name ?? null,
    sourceType: ref?.source_type ?? null,
    sourceZone: ref?.source_zone ?? null,
    factionRestriction: ref?.faction ?? null,
  };
}

export function enrichMounts(mounts: ArmoryMountWithFarmList[]): EnrichedMount[] {
  return mounts.map(enrichMount);
}

// Used server-side (e.g. Farm List add validation) where only the
// obtainability flag is needed, without enriching a full ArmoryMount.
// Mounts absent from the reference database default to obtainable, same as
// enrichMount's fallback.
export function isMountUnobtainable(mountId: number): boolean {
  return mountReferenceById.get(mountId)?.unobtainable ?? false;
}

// Grid thumbnails favor the small, purpose-cropped image; the detail view
// favors the live API's render (most reliably up to date) and falls back to
// the reference database's images if that's missing.
export function gridImageUrl(mount: EnrichedMount): string | null {
  return mount.thumbUrl || mount.mountUrl || mount.render.url || null;
}

export function detailImageUrl(mount: EnrichedMount): string | null {
  return mount.render.url || mount.mountUrl || mount.thumbUrl || null;
}
