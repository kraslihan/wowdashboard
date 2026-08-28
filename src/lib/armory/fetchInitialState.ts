import { ARMORY_BASE_URL, buildArmoryCharacterPath, type ArmoryCharacterRef } from "./armoryUrl";
import { ArmoryFetchError, ArmoryParseError } from "./errors";
import type { RawArmoryInitialState } from "./types";

const INITIAL_STATE_MARKER = "var characterProfileInitialState = ";

export type ArmoryTab = "pvp";

export interface ArmoryCharacterTabRef extends ArmoryCharacterRef {
  tab?: ArmoryTab;
}

function buildArmoryUrl(ref: ArmoryCharacterTabRef): string {
  const path = [buildArmoryCharacterPath(ref), ref.tab].filter(Boolean).join("/");
  return `${ARMORY_BASE_URL}/${path}`;
}

/**
 * Blizzard embeds the character data as `var characterProfileInitialState = {...};`
 * inside a <script> tag rather than as a clean JSON document, so we locate the
 * object by scanning for balanced braces instead of relying on a regex (which
 * breaks on nested braces/strings) or JSON.parse-with-guessed-end.
 */
function extractBalancedJsonObject(text: string): string {
  if (text[0] !== "{") {
    throw new ArmoryParseError("Expected armory initial-state payload to start with '{'");
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(0, i + 1);
      }
    }
  }

  throw new ArmoryParseError("Unterminated armory initial-state JSON object");
}

function extractInitialState(html: string): RawArmoryInitialState {
  const markerIndex = html.indexOf(INITIAL_STATE_MARKER);
  if (markerIndex === -1) {
    throw new ArmoryParseError("characterProfileInitialState marker not found in armory response");
  }

  const jsonStart = markerIndex + INITIAL_STATE_MARKER.length;
  const jsonText = extractBalancedJsonObject(html.slice(jsonStart));

  try {
    return JSON.parse(jsonText) as RawArmoryInitialState;
  } catch {
    throw new ArmoryParseError("Failed to parse armory initial-state JSON");
  }
}

export async function fetchArmoryInitialState(ref: ArmoryCharacterTabRef): Promise<RawArmoryInitialState> {
  const url = buildArmoryUrl(ref);

  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (compatible; WowDashboardBFF/1.0)",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new ArmoryFetchError(`Character not found: ${ref.realmSlug}/${ref.characterName}`, 404);
  }
  if (!response.ok) {
    throw new ArmoryFetchError(`Armory request failed with status ${response.status}`, response.status);
  }

  const html = await response.text();
  return extractInitialState(html);
}
