import { ArmoryParseError } from "./errors";
import type {
  ArmoryAchievementCategory,
  ArmoryFaction,
  ArmoryPvp,
  ArmoryRealm,
  RawArmoryCharacter,
  RawArmoryInitialState,
} from "./types";

// Only the paths requested for the "character" BFF service:
// achievement, averageItemLevel, class.name, faction, guild.name, level,
// name, race.name, realm, region, spec.name, avatar.url
export interface CharacterSummary {
  achievement: number;
  averageItemLevel: number;
  class: { name: string };
  faction: ArmoryFaction;
  guild: { name: string } | null;
  level: number;
  name: string;
  race: { name: string };
  realm: ArmoryRealm;
  region: string;
  spec: { name: string } | null;
  avatar: { url: string };
}

export function pickCharacterSummary(character: RawArmoryCharacter): CharacterSummary {
  return {
    achievement: character.achievement,
    averageItemLevel: character.averageItemLevel,
    class: { name: character.class.name },
    faction: character.faction,
    guild: character.guild ? { name: character.guild.name } : null,
    level: character.level,
    name: character.name,
    race: { name: character.race.name },
    realm: character.realm,
    region: character.region,
    spec: character.spec ? { name: character.spec.name } : null,
    avatar: { url: character.avatar.url },
  };
}

// The "pvp" BFF service: all elements of the pvp data, as-is.
// Blizzard nests this under `character.pvp` on the main profile page, but
// puts it as a sibling of `character` on the /pvp sub-page — check both.
export function pickPvpSummary(initialState: RawArmoryInitialState): ArmoryPvp {
  const pvp = initialState.pvp ?? initialState.character.pvp;
  if (!pvp) {
    throw new ArmoryParseError("Character has no pvp data in armory response");
  }
  return pvp;
}

// The "achievements" BFF service: the achievementIndex.categories array.
// `achievementIndex` itself is not an array — it's `{ categories: [...] }` —
// so we return that inner array directly.
export function pickAchievementCategories(initialState: RawArmoryInitialState): ArmoryAchievementCategory[] {
  const categories = initialState.achievementIndex?.categories;
  if (!categories) {
    throw new ArmoryParseError("Character has no achievementIndex data in armory response");
  }
  return categories;
}
