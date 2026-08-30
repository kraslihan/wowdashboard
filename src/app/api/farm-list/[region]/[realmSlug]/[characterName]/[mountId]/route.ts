import { NextRequest, NextResponse } from "next/server";
import { armoryErrorResponse } from "@/lib/armory/apiError";
import { characterKeyFor, removeMountFromFarmList } from "@/lib/armory/farmListService";

interface RouteContext {
  params: Promise<{ region: string; realmSlug: string; characterName: string; mountId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { region, realmSlug, characterName, mountId: mountIdParam } = await params;

  const mountId = Number(mountIdParam);
  if (!Number.isFinite(mountId)) {
    return NextResponse.json({ error: "mountId must be numeric." }, { status: 400 });
  }

  try {
    const characterKey = characterKeyFor({ region, realmSlug, characterName });
    await removeMountFromFarmList(characterKey, mountId);
    return NextResponse.json({ mountId, inFarmList: false });
  } catch (error) {
    return armoryErrorResponse(error);
  }
}
