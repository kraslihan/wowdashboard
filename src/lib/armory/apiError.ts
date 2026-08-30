import { NextResponse } from "next/server";
import { ArmoryFetchError, ArmoryParseError } from "./errors";
import { FarmListError } from "./farmListService";

export function armoryErrorResponse(error: unknown): NextResponse {
  if (error instanceof FarmListError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ArmoryFetchError) {
    const status = error.status === 404 ? 404 : 502;
    return NextResponse.json({ error: error.message }, { status });
  }
  if (error instanceof ArmoryParseError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  console.error("Unexpected armory BFF error:", error);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
