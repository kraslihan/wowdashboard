import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./client";
import {
  addFarmListEntry,
  getFarmListMountIds,
  isMountInFarmList,
  removeFarmListEntries,
  removeFarmListEntry,
} from "./farmListRepository";
import { farmListEntries } from "./schema";

// Integration tests against the real (Neon) database configured via
// DATABASE_URL — a dedicated character key keeps this suite's rows
// isolated from real Farm List data, and every test cleans up after
// itself so re-runs never accumulate rows.
const TEST_KEY = "test:vitest:repository";
const OTHER_TEST_KEY = "test:vitest:repository-other";

async function cleanup() {
  await db.delete(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY));
  await db.delete(farmListEntries).where(eq(farmListEntries.characterKey, OTHER_TEST_KEY));
}

beforeEach(cleanup);
afterEach(cleanup);

describe("farmListRepository", () => {
  it("writes an entry that a fresh read can see", async () => {
    await addFarmListEntry(TEST_KEY, 111);
    const ids = await getFarmListMountIds(TEST_KEY);
    expect(ids.has(111)).toBe(true);
  });

  it("does not duplicate a row when the same mount is added twice", async () => {
    await addFarmListEntry(TEST_KEY, 222);
    await addFarmListEntry(TEST_KEY, 222);

    const rows = await db
      .select()
      .from(farmListEntries)
      .where(and(eq(farmListEntries.characterKey, TEST_KEY), eq(farmListEntries.mountId, 222)));
    expect(rows).toHaveLength(1);
  });

  it("lets two different scopes hold the same mount independently", async () => {
    await addFarmListEntry(TEST_KEY, 333);
    await addFarmListEntry(OTHER_TEST_KEY, 333);

    expect(await isMountInFarmList(TEST_KEY, 333)).toBe(true);
    expect(await isMountInFarmList(OTHER_TEST_KEY, 333)).toBe(true);

    await removeFarmListEntry(TEST_KEY, 333);
    expect(await isMountInFarmList(TEST_KEY, 333)).toBe(false);
    expect(await isMountInFarmList(OTHER_TEST_KEY, 333)).toBe(true);
  });

  it("removing an entry that doesn't exist is a silent no-op", async () => {
    await expect(removeFarmListEntry(TEST_KEY, 999)).resolves.not.toThrow();
  });

  it("bulk-removes only the requested mount ids for the given scope", async () => {
    await addFarmListEntry(TEST_KEY, 1);
    await addFarmListEntry(TEST_KEY, 2);
    await addFarmListEntry(TEST_KEY, 3);
    await addFarmListEntry(OTHER_TEST_KEY, 2);

    const removed = await removeFarmListEntries(TEST_KEY, [1, 2]);
    expect(removed.sort()).toEqual([1, 2]);

    const remaining = await getFarmListMountIds(TEST_KEY);
    expect(remaining).toEqual(new Set([3]));
    // The other scope's identical mount id is untouched.
    expect(await isMountInFarmList(OTHER_TEST_KEY, 2)).toBe(true);
  });

  it("bulk-remove with an empty id list is a no-op, not an error", async () => {
    await addFarmListEntry(TEST_KEY, 42);
    const removed = await removeFarmListEntries(TEST_KEY, []);
    expect(removed).toEqual([]);
    expect(await isMountInFarmList(TEST_KEY, 42)).toBe(true);
  });
});
