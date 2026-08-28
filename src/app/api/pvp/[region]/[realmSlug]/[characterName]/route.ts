import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { pickPvpSummary } from "@/lib/armory/characterSummary";
import { fetchArmoryInitialState } from "@/lib/armory/fetchInitialState";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName } = await params;

  try {
    const initialState = await fetchArmoryInitialState({
      region,
      realmSlug,
      characterName,
      tab: "pvp",
    });
    return NextResponse.json(pickPvpSummary(initialState));
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
