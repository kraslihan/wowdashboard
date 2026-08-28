export interface CharacterRef {
  region: string;
  realmSlug: string;
  characterName: string;
}

// Single-character MVP: the dashboard always shows this character for now.
export const DEFAULT_CHARACTER: CharacterRef = {
  region: "eu",
  realmSlug: "twisting-nether",
  characterName: "kfy",
};

export type ArmoryService = "character" | "pvp" | "achievements" | "mounts" | "reputation";

export function armoryApiUrl(service: ArmoryService, ref: CharacterRef): string {
  return `/api/${service}/${ref.region}/${ref.realmSlug}/${ref.characterName}`;
}
