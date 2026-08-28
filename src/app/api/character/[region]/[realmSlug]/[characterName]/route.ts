import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { pickCharacterSummary } from "@/lib/armory/characterSummary";
import { fetchArmoryInitialState } from "@/lib/armory/fetchInitialState";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName } = await params;

  try {
    const { character } = await fetchArmoryInitialState({ region, realmSlug, characterName });
    return NextResponse.json(pickCharacterSummary(character));
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
