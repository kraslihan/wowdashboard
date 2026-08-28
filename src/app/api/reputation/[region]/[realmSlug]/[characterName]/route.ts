import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { fetchArmoryJson } from "@/lib/armory/fetchArmoryJson";
import type { ArmoryReputationResponse } from "@/lib/armory/types";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName } = await params;

  try {
    const data = await fetchArmoryJson<ArmoryReputationResponse>(
      { region, realmSlug, characterName },
      "reputation.json",
    );
    return NextResponse.json(data);
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
