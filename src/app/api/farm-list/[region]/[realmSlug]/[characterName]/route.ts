import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { addMountToFarmList, characterKeyFor } from "@/lib/armory/farmListService";
import { fetchArmoryJson } from "@/lib/armory/fetchArmoryJson";
import type { ArmoryMountsResponse } from "@/lib/armory/types";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName } = await params;

  let mountId: unknown;
  try {
    const body: unknown = await request.json();
    mountId = (body as { mountId?: unknown } | null)?.mountId;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON with a numeric mountId." }, { status: 400 });
  }
  if (typeof mountId !== "number" || !Number.isFinite(mountId)) {
    return NextResponse.json({ error: "Request body must be JSON with a numeric mountId." }, { status: 400 });
  }

  try {
    // Validated against the same live Blizzard response the mounts page
    // itself reads (collected, existence) plus the static reference
    // database (unobtainable) — never against whatever the client claims.
    const mountsResponse = await fetchArmoryJson<ArmoryMountsResponse>(
      { region, realmSlug, characterName },
      "collections/mounts.json",
    );
    const characterKey = characterKeyFor({ region, realmSlug, characterName });
    await addMountToFarmList(characterKey, mountId, mountsResponse.mounts);
    return NextResponse.json({ mountId, inFarmList: true });
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
