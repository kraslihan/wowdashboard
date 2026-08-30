import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { farmListEntries } from "@/lib/db/schema";
import {
  addMountToFarmList,
  characterKeyFor,
  FarmListError,
  reconcileAndAnnotateFarmList,
  removeMountFromFarmList,
} from "./farmListService";
import type { ArmoryMount, ArmoryMountsResponse } from "./types";

const TEST_KEY = "test:vitest:service";

function mount(overrides: Partial<ArmoryMount> & { id: number }): ArmoryMount {
  return {
    name: `Mount ${overrides.id}`,
    quality: { id: 1, name: "Common", enum: "COMMON", slug: "common" },
    render: { url: "https://example.test/render.jpg" },
    collected: false,
    ...overrides,
  };
}

async function cleanup() {
  await db.delete(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY));
}

beforeEach(cleanup);
afterEach(cleanup);

describe("characterKeyFor", () => {
  it("normalizes region/realm/character into one lowercase key", () => {
    expect(characterKeyFor({ region: "EU", realmSlug: "Twisting-Nether", characterName: "Kfy" })).toBe(
      "eu:twisting-nether:kfy",
    );
  });

  it("keeps same-named characters on different realms distinct", () => {
    const a = characterKeyFor({ region: "eu", realmSlug: "twisting-nether", characterName: "kfy" });
    const b = characterKeyFor({ region: "eu", realmSlug: "ravencrest", characterName: "kfy" });
    expect(a).not.toBe(b);
  });
});

describe("addMountToFarmList", () => {
  // A mount id in the bundled reference database (src/lib/armory/mountsDatabase.json)
  // that is real and known to be obtainable, so the "eligible" path is exercised
  // against actual reference data rather than a fabricated id.
  const ELIGIBLE_MOUNT_ID = 899; // Abyss Worm — not unobtainable in the reference db

  it("adds an eligible mount", async () => {
    const liveMounts = [mount({ id: ELIGIBLE_MOUNT_ID, collected: false })];
    await addMountToFarmList(TEST_KEY, ELIGIBLE_MOUNT_ID, liveMounts);

    const rows = await db.select().from(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY));
    expect(rows.map((r) => r.mountId)).toEqual([ELIGIBLE_MOUNT_ID]);
  });

  it("rejects a mount that isn't in the live mount list", async () => {
    await expect(addMountToFarmList(TEST_KEY, 987654321, [])).rejects.toMatchObject({
      code: "MOUNT_NOT_FOUND",
      status: 404,
    } satisfies Partial<FarmListError>);
  });

  it("rejects a collected mount", async () => {
    const liveMounts = [mount({ id: ELIGIBLE_MOUNT_ID, collected: true })];
    await expect(addMountToFarmList(TEST_KEY, ELIGIBLE_MOUNT_ID, liveMounts)).rejects.toMatchObject({
      code: "COLLECTED_MOUNT_CANNOT_BE_FARMED",
      status: 409,
    } satisfies Partial<FarmListError>);
  });

  it("rejects an unobtainable mount", async () => {
    // 1596 (Amalgam of Rage) is flagged unobtainable in the reference database.
    const liveMounts = [mount({ id: 1596, collected: false })];
    await expect(addMountToFarmList(TEST_KEY, 1596, liveMounts)).rejects.toMatchObject({
      code: "UNOBTAINABLE_MOUNT_CANNOT_BE_FARMED",
      status: 409,
    } satisfies Partial<FarmListError>);
  });
});

describe("removeMountFromFarmList", () => {
  it("removing something never added does not throw", async () => {
    await expect(removeMountFromFarmList(TEST_KEY, 111222333)).resolves.not.toThrow();
  });
});

describe("reconcileAndAnnotateFarmList", () => {
  it("annotates inFarmList from current Farm List membership", async () => {
    const liveMounts = [mount({ id: 899, collected: false }), mount({ id: 900, collected: false })];
    await addMountToFarmList(TEST_KEY, 899, liveMounts);

    const response: ArmoryMountsResponse = { mounts: liveMounts, mountsCollected: 0 };
    const result = await reconcileAndAnnotateFarmList(TEST_KEY, response);

    const byId = new Map(result.mounts.map((m) => [m.id, m.inFarmList]));
    expect(byId.get(899)).toBe(true);
    expect(byId.get(900)).toBe(false);
  });

  it("auto-removes a Farm List entry once its mount is collected, and reports inFarmList: false", async () => {
    const liveMountsBeforeCollection = [mount({ id: 899, collected: false })];
    await addMountToFarmList(TEST_KEY, 899, liveMountsBeforeCollection);
    expect((await db.select().from(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY)))).toHaveLength(1);

    // The character has since collected the mount — the next mounts response
    // reflects that.
    const liveMountsAfterCollection: ArmoryMount[] = [mount({ id: 899, collected: true })];
    const response: ArmoryMountsResponse = { mounts: liveMountsAfterCollection, mountsCollected: 1 };
    const result = await reconcileAndAnnotateFarmList(TEST_KEY, response);

    expect(result.mounts[0].inFarmList).toBe(false);
    const rowsAfter = await db.select().from(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY));
    expect(rowsAfter).toHaveLength(0);
  });

  it("does not touch a Farm List entry for a mount that is still uncollected", async () => {
    const liveMounts = [mount({ id: 899, collected: false }), mount({ id: 900, collected: true })];
    await addMountToFarmList(TEST_KEY, 899, liveMounts);

    const response: ArmoryMountsResponse = { mounts: liveMounts, mountsCollected: 1 };
    await reconcileAndAnnotateFarmList(TEST_KEY, response);

    const rows = await db.select().from(farmListEntries).where(eq(farmListEntries.characterKey, TEST_KEY));
    expect(rows.map((r) => r.mountId)).toEqual([899]);
  });
});
