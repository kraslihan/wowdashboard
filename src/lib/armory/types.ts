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

// /character (main profile page): gear + stats.overview, used by the Overview tab.
export interface ArmoryItemQuality {
  type: string;
  name: string;
}

export interface ArmoryItemStatEntry {
  type: { type: string; name: string };
  value: number;
  display: {
    display_string: string;
    color?: { r: number; g: number; b: number; a: number };
  };
  is_equip_bonus?: boolean;
}

export interface ArmoryItemEnchantment {
  display_string: string;
  enchantment_id: number;
}

export interface ArmoryItemSocket {
  socket_type: { type: string; name: string };
  item?: { name: string; id: number };
  display_string?: string;
  media?: { content?: { assets?: { key: string; value: string }[] } };
}

export interface ArmoryGearItem {
  id: number;
  name: string;
  quality: ArmoryItemQuality;
  media?: { content?: { assets?: { key: string; value: string }[] } };
  slot: { type: string; name: string };
  inventory_type?: { type: string; name: string };
  item_subclass?: { name: string };
  binding?: { name: string };
  level?: { value: number; display_string: string };
  stats?: ArmoryItemStatEntry[];
  enchantments?: ArmoryItemEnchantment[];
  sockets?: ArmoryItemSocket[];
  durability?: { display_string: string };
  requirements?: {
    level?: { display_string: string };
    playable_classes?: { display_string: string };
  };
  sell_price?: {
    display_strings: { gold: string; silver: string; copper: string };
  };
  transmog?: { display_string: string; item?: { name: string } };
}

export type ArmoryGearSlotKey =
  | "head"
  | "neck"
  | "shoulder"
  | "back"
  | "chest"
  | "shirt"
  | "tabard"
  | "wrist"
  | "hand"
  | "waist"
  | "leg"
  | "foot"
  | "leftFinger"
  | "rightFinger"
  | "leftTrinket"
  | "rightTrinket"
  | "weapon"
  | "offHand";

export type ArmoryGear = Partial<Record<ArmoryGearSlotKey, ArmoryGearItem>>;

export interface ArmoryStatEntry {
  enum: string;
  slug: string;
  value: { type: string; value?: number };
}

export interface ArmoryStats {
  overview?: ArmoryStatEntry[];
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
  gear?: ArmoryGear;
  stats?: ArmoryStats;
  renderRaw?: { url: string };
}

export interface RawArmoryInitialState {
  character: RawArmoryCharacter;
  // On the /pvp sub-page, Blizzard puts `pvp` as a sibling of `character`
  // instead of nesting it under `character.pvp` like the main profile page does.
  pvp?: ArmoryPvp;
  // Present as a sibling of `character` on the /achievements sub-page.
  achievementIndex?: ArmoryAchievementIndex;
}

// /achievements sub-page: achievementIndex.categories
export interface ArmoryAchievementCategory {
  count: number;
  name: string;
  points?: number;
  slug: string;
  total?: number;
  totalPoints?: number;
  url: string;
}

export interface ArmoryAchievementIndex {
  categories: ArmoryAchievementCategory[];
}

// collections/mounts.json
export interface ArmoryMountQuality {
  id: number;
  name: string;
  enum: string;
  slug: string;
}

export interface ArmoryMount {
  id: number;
  name: string;
  quality: ArmoryMountQuality;
  render: { url: string };
  collected: boolean;
}

export interface ArmoryMountsResponse {
  mounts: ArmoryMount[];
  mountsCollected: number;
}

// The mounts BFF endpoint's actual response shape: Blizzard's raw per-mount
// data plus the server-computed Farm List membership flag (joined from
// farm_list_entries — see farmListService.reconcileAndAnnotateFarmList).
export interface ArmoryMountWithFarmList extends ArmoryMount {
  inFarmList: boolean;
}

export interface ArmoryMountsResponseWithFarmList {
  mounts: ArmoryMountWithFarmList[];
  mountsCollected: number;
}

// reputation.json
export interface ArmoryReputationStandingType {
  id?: number;
  name: string;
  enum: string;
  slug: string;
}

export interface ArmoryReputationNode {
  id: string;
  name: string;
  max: boolean;
  maxValue?: number;
  standing?: string;
  standingType?: ArmoryReputationStandingType;
  value?: number;
  reputations?: ArmoryReputationNode[];
}

export interface ArmoryReputationResponse {
  region: string;
  reputations: ArmoryReputationNode[];
}
