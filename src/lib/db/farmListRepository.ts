import { and, eq, inArray } from "drizzle-orm";
import { db } from "./client";
import { farmListEntries } from "./schema";

// Pure DB access for farm_list_entries — no business rules here (those live
// in farmListService.ts). Every write is idempotent: callers can retry
// freely (double-clicks, network retries) without producing duplicate rows
// or erroring on an already-absent row.

export async function getFarmListMountIds(characterKey: string): Promise<Set<number>> {
  const rows = await db
    .select({ mountId: farmListEntries.mountId })
    .from(farmListEntries)
    .where(eq(farmListEntries.characterKey, characterKey));
  return new Set(rows.map((row) => row.mountId));
}

export async function isMountInFarmList(characterKey: string, mountId: number): Promise<boolean> {
  const rows = await db
    .select({ mountId: farmListEntries.mountId })
    .from(farmListEntries)
    .where(and(eq(farmListEntries.characterKey, characterKey), eq(farmListEntries.mountId, mountId)))
    .limit(1);
  return rows.length > 0;
}

export async function addFarmListEntry(characterKey: string, mountId: number): Promise<void> {
  await db
    .insert(farmListEntries)
    .values({ characterKey, mountId })
    .onConflictDoNothing({ target: [farmListEntries.characterKey, farmListEntries.mountId] });
}

export async function removeFarmListEntry(characterKey: string, mountId: number): Promise<void> {
  await db.delete(farmListEntries).where(and(eq(farmListEntries.characterKey, characterKey), eq(farmListEntries.mountId, mountId)));
}

// Bulk-deletes farm_list_entries for the given character among the given
// mount ids (used by reconciliation to drop entries for mounts that just
// became collected) and returns which of those ids actually had an entry
// removed, so callers can log/verify without a second query.
export async function removeFarmListEntries(characterKey: string, mountIds: number[]): Promise<number[]> {
  if (mountIds.length === 0) return [];
  const removed = await db
    .delete(farmListEntries)
    .where(and(eq(farmListEntries.characterKey, characterKey), inArray(farmListEntries.mountId, mountIds)))
    .returning({ mountId: farmListEntries.mountId });
  return removed.map((row) => row.mountId);
}
