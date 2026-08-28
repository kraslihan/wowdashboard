// Types for the subset of Blizzard's embedded `characterProfileInitialState`
// JSON blob (found in a <script> tag on the armory character pages) that we
// actually care about. This is not the full shape Blizzard sends — only the
// fields our BFF endpoints read.

export interface ArmoryRealm {
  name: string;
  slug: string;
}

export interface ArmoryClass {
  name: string;
}

export interface ArmoryFaction {
  id: number;
  name: string;
  enum: string;
  slug: string;
}

export interface ArmoryGuild {
  name: string;
}

export interface ArmoryRace {
  name: string;
}

export interface ArmorySpec {
  name: string;
}

export interface ArmoryAvatar {
  url: string;
}

export interface ArmoryPvpTier {
  id: number;
  name?: string;
  icon?: { url: string };
}

export interface ArmoryPvpBracket {
  winCount: number;
  lossCount: number;
  total: number;
  rating: number;
  winLoss: number;
  tier: ArmoryPvpTier;
}

export interface ArmoryShuffleSpec extends ArmoryPvpBracket {
  specialization: {
    id: number;
    name: string;
    enum: string;
    slug: string;
  };
}

export interface ArmoryPvp {
  honorableKills?: { tier: number; value: number };
  prestige?: { honorLevel: number };
  ratings: {
    "2v2"?: ArmoryPvpBracket;
    "3v3"?: ArmoryPvpBracket;
    battlegrounds?: ArmoryPvpBracket;
    blitz?: ArmoryPvpBracket;
    shuffle?: { specs: ArmoryShuffleSpec[] };
    [bracket: string]: unknown;
  };
}

export interface RawArmoryCharacter {
  achievement: number;
  averageItemLevel: number;
  class: ArmoryClass;
  faction: ArmoryFaction;
  guild?: ArmoryGuild | null;
  level: number;
  name: string;
  race: ArmoryRace;
  realm: ArmoryRealm;
  region: string;
  spec?: ArmorySpec | null;
  avatar: ArmoryAvatar;
  pvp?: ArmoryPvp;
}

export interface RawArmoryInitialState {
  character: RawArmoryCharacter;
  // On the /pvp sub-page, Blizzard puts `pvp` as a sibling of `character`
  // instead of nesting it under `character.pvp` like the main profile page does.
  pvp?: ArmoryPvp;
}
