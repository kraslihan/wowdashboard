import { addFarmListEntry, getFarmListMountIds, removeFarmListEntries, removeFarmListEntry } from "@/lib/db/farmListRepository";
import type { CharacterRef } from "@/lib/character";
import { isMountUnobtainable } from "./mountReference";
import type { ArmoryMount, ArmoryMountsResponse, ArmoryMountsResponseWithFarmList } from "./types";

// Farm List rows are keyed by this normalized string rather than a
// fabricated account/user id — see the comment on farmListEntries in
// src/lib/db/schema.ts for why. Two characters that happen to share a name
// on different realms (or the same realm/region entirely) never collide.
export function characterKeyFor(ref: CharacterRef): string {
  return `${ref.region}:${ref.realmSlug}:${ref.characterName}`.toLowerCase();
}

export type FarmListErrorCode = "MOUNT_NOT_FOUND" | "COLLECTED_MOUNT_CANNOT_BE_FARMED" | "UNOBTAINABLE_MOUNT_CANNOT_BE_FARMED";

export class FarmListError extends Error {
  constructor(
    public readonly code: FarmListErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FarmListError";
  }
}

// Adding to the Farm List is validated against the live mount list, not
// whatever the client claims — `collected`/existence come from Blizzard's
// current response, `unobtainable` from the bundled reference database.
// Faction is deliberately not checked here: accounts commonly have
// characters on both factions, and a mount restricted to the other faction
// is still a legitimate Farm List entry (to farm on that other character) —
// see the Mounts page's own display-status logic for the same reasoning.
export async function addMountToFarmList(characterKey: string, mountId: number, liveMounts: ArmoryMount[]): Promise<void> {
  const mount = liveMounts.find((candidate) => candidate.id === mountId);
  if (!mount) {
    throw new FarmListError("MOUNT_NOT_FOUND", `Mount ${mountId} was not found in this character's mount list.`, 404);
  }
  if (mount.collected) {
    throw new FarmListError("COLLECTED_MOUNT_CANNOT_BE_FARMED", "This mount is already collected, so it can't be farmed.", 409);
  }
  if (isMountUnobtainable(mountId)) {
    throw new FarmListError(
      "UNOBTAINABLE_MOUNT_CANNOT_BE_FARMED",
      "This mount can no longer be obtained, so it can't be added to the Farm List.",
      409,
    );
  }

  await addFarmListEntry(characterKey, mountId);
}

export async function removeMountFromFarmList(characterKey: string, mountId: number): Promise<void> {
  // Removal has no business rules to check — a Farm List entry can always
  // be taken off, regardless of the mount's current state — and is
  // idempotent: removing something already absent is a normal, silent no-op.
  await removeFarmListEntry(characterKey, mountId);
}

// The single place that joins Farm List state onto a mounts response:
// first drops any Farm List entries for mounts this character has since
// collected (the "auto-remove on collect" rule), then annotates every
// mount with its current inFarmList flag from one Set-membership check
// per mount — no per-mount DB query, so this stays O(1) DB round trips
// regardless of mount count.
export async function reconcileAndAnnotateFarmList(
  characterKey: string,
  mountsResponse: ArmoryMountsResponse,
): Promise<ArmoryMountsResponseWithFarmList> {
  const collectedMountIds = mountsResponse.mounts.filter((mount) => mount.collected).map((mount) => mount.id);

  await removeFarmListEntries(characterKey, collectedMountIds);

  const farmListMountIds = await getFarmListMountIds(characterKey);

  return {
    mounts: mountsResponse.mounts.map((mount) => ({ ...mount, inFarmList: farmListMountIds.has(mount.id) })),
    mountsCollected: mountsResponse.mountsCollected,
  };
}
