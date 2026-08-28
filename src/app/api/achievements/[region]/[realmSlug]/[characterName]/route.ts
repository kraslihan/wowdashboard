import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { pickAchievementCategories } from "@/lib/armory/characterSummary";
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
      tab: "achievements",
    });
    return NextResponse.json(pickAchievementCategories(initialState));
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
