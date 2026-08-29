import { ArmoryParseError } from "./errors";
import type {
  ArmoryAchievementCategory,
  ArmoryFaction,
  ArmoryGearItem,
  ArmoryGearSlotKey,
  ArmoryPvp,
  ArmoryRealm,
  ArmoryStatEntry,
  RawArmoryCharacter,
  RawArmoryInitialState,
} from "./types";

export interface GearItemStat {
  text: string;
  isBonus: boolean;
}

export interface GearItemSummary {
  id: number;
  name: string;
  qualityType: string;
  qualityName: string;
  iconUrl: string | null;
  itemLevel: number | null;
  slotName: string;
  subclassName: string | null;
  bindingText: string | null;
  requirementsText: string[];
  stats: GearItemStat[];
  durabilityText: string | null;
  sellPrice: { gold: string; silver: string; copper: string } | null;
  transmogText: string | null;
  enchantText: string | null;
  socketIconUrls: string[];
}

export interface OverviewStat {
  slug: string;
  label: string;
  displayValue: string;
}

// Only the paths requested for the "character" BFF service:
// achievement, averageItemLevel, class.name, faction, guild.name, level,
// name, race.name, realm, region, spec.name, avatar.url — plus, for the
// Overview tab, the character's full-body render, equipped gear, and
// stats.overview.
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
  renderUrl: string | null;
  gear: Partial<Record<ArmoryGearSlotKey, GearItemSummary>>;
  overviewStats: OverviewStat[];
}

function extractIconUrl(media: ArmoryGearItem["media"]): string | null {
  return media?.content?.assets?.find((asset) => asset.key === "icon")?.value ?? null;
}

function pickGearItem(item: ArmoryGearItem): GearItemSummary {
  return {
    id: item.id,
    name: item.name,
    qualityType: item.quality.type,
    qualityName: item.quality.name,
    iconUrl: extractIconUrl(item.media),
    itemLevel: item.level?.value ?? null,
    slotName: item.inventory_type?.name ?? item.slot.name,
    subclassName: item.item_subclass?.name ?? null,
    bindingText: item.binding?.name ?? null,
    requirementsText: [item.requirements?.level?.display_string, item.requirements?.playable_classes?.display_string].filter(
      (text): text is string => Boolean(text),
    ),
    stats: (item.stats ?? []).map((stat) => ({
      text: stat.display.display_string,
      isBonus: Boolean(stat.is_equip_bonus),
    })),
    durabilityText: item.durability?.display_string ?? null,
    sellPrice: item.sell_price ? { ...item.sell_price.display_strings } : null,
    transmogText: item.transmog?.item?.name ?? null,
    enchantText: item.enchantments?.[0]?.display_string ?? null,
    socketIconUrls: (item.sockets ?? []).map((socket) => extractIconUrl(socket.media)).filter((url): url is string => Boolean(url)),
  };
}

function pickGear(character: RawArmoryCharacter): Partial<Record<ArmoryGearSlotKey, GearItemSummary>> {
  const gear = character.gear ?? {};
  const result: Partial<Record<ArmoryGearSlotKey, GearItemSummary>> = {};
  for (const key of Object.keys(gear) as ArmoryGearSlotKey[]) {
    const item = gear[key];
    if (item) result[key] = pickGearItem(item);
  }
  return result;
}

const OVERVIEW_STAT_LABELS: Record<string, string> = {
  HEALTH: "Health",
  MANA: "Mana",
  INTELLECT: "Intellect",
  STAMINA: "Stamina",
  CRITICALSTRIKE: "Critical Strike",
  HASTE: "Haste",
  MASTERY: "Mastery",
  VERSATILITY: "Versatility",
};

function formatOverviewStatValue(entry: ArmoryStatEntry): string {
  const value = entry.value.value ?? 0;
  if (entry.value.type === "PERCENTAGE") {
    return `${Math.round(value)}%`;
  }
  return Math.round(value).toLocaleString();
}

function pickOverviewStats(character: RawArmoryCharacter): OverviewStat[] {
  const entries = character.stats?.overview ?? [];
  return entries.map((entry) => ({
    slug: entry.slug,
    label: OVERVIEW_STAT_LABELS[entry.enum] ?? entry.enum,
    displayValue: formatOverviewStatValue(entry),
  }));
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
    renderUrl: character.renderRaw?.url ?? null,
    gear: pickGear(character),
    overviewStats: pickOverviewStats(character),
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
