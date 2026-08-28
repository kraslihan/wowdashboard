export const ARMORY_BASE_URL = "https://worldofwarcraft.blizzard.com";
export const ARMORY_LOCALE = process.env.WOW_ARMORY_LOCALE ?? "en-gb";
export const ARMORY_EXPANSION = process.env.WOW_ARMORY_EXPANSION ?? "worldsoul";

export interface ArmoryCharacterRef {
  region: string;
  realmSlug: string;
  characterName: string;
}

export function buildArmoryCharacterPath({ region, realmSlug, characterName }: ArmoryCharacterRef): string {
  return [
    ARMORY_LOCALE,
    ARMORY_EXPANSION,
    region,
    "armory",
    "character",
    realmSlug,
    characterName.toLowerCase(),
  ].join("/");
}
