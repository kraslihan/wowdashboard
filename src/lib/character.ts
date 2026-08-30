export interface CharacterRef {
  region: string;
  realmSlug: string;
  characterName: string;
}

// Normalized identity key — region + realm + character name is the only
// stable identity this app has (Blizzard's armory response carries no
// account/character id, only slugs — see the Character Switch research).
// Lowercased so casing differences never split one character into two rows
// of Farm List data or two switcher entries.
export function characterKeyFor(ref: CharacterRef): string {
  return `${ref.region}:${ref.realmSlug}:${ref.characterName}`.toLowerCase();
}

// Fixed, hand-maintained character list — not user-editable in the app.
// New characters are added here (by pasting the character's Armory URL)
// when asked, not through a self-service "add character" flow.
export const KNOWN_CHARACTERS: CharacterRef[] = [
  { region: "eu", realmSlug: "twisting-nether", characterName: "kfy" },
  { region: "eu", realmSlug: "ravencrest", characterName: "kfy" },
];

export const DEFAULT_CHARACTER: CharacterRef = KNOWN_CHARACTERS[0];

export function findKnownCharacter(region: string, realmSlug: string, characterName: string): CharacterRef | undefined {
  const key = characterKeyFor({ region, realmSlug, characterName });
  return KNOWN_CHARACTERS.find((candidate) => characterKeyFor(candidate) === key);
}

export type ArmoryService = "character" | "pvp" | "achievements" | "mounts" | "reputation";

export function armoryApiUrl(service: ArmoryService, ref: CharacterRef): string {
  return `/api/${service}/${ref.region}/${ref.realmSlug}/${ref.characterName}`;
}

export function farmListApiUrl(ref: CharacterRef, mountId?: number): string {
  const base = `/api/farm-list/${ref.region}/${ref.realmSlug}/${ref.characterName}`;
  return mountId === undefined ? base : `${base}/${mountId}`;
}

export function characterDashboardPath(ref: CharacterRef, tab: string): string {
  return `/${ref.region}/${ref.realmSlug}/${ref.characterName}/${tab}`;
}
