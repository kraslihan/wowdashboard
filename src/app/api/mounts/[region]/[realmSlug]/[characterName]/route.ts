import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { characterKeyFor, reconcileAndAnnotateFarmList } from "@/lib/armory/farmListService";
import { fetchArmoryJson } from "@/lib/armory/fetchArmoryJson";
import type { ArmoryMountsResponse } from "@/lib/armory/types";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName } = await params;

  try {
    const data = await fetchArmoryJson<ArmoryMountsResponse>(
      { region, realmSlug, characterName },
      "collections/mounts.json",
    );
    // Reconciliation happens right here, in the same flow that just pulled
    // fresh `collected` state from Blizzard: any Farm List entry for a mount
    // this character has since collected is dropped before the response is
    // built, so a collected mount never comes back with inFarmList: true.
    const characterKey = characterKeyFor({ region, realmSlug, characterName });
    const annotated = await reconcileAndAnnotateFarmList(characterKey, data);
    return NextResponse.json(annotated);
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
