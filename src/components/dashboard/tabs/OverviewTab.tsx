import type { CSSProperties, JSX } from "react";
import type { CharacterSummary, GearItemSummary } from "@/lib/armory/characterSummary";
import type { ArmoryGearSlotKey } from "@/lib/armory/types";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { qualityColorVar } from "@/lib/qualityColor";
import {
  BulbIcon,
  ClockIcon,
  CrosshairIcon,
  CrownIcon,
  DiamondIcon,
  FlaskIcon,
  HeartIcon,
  WrenchIcon,
} from "../icons";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  character: CharacterSummary;
}

// Weapon and off hand are shown separately, below the two-column list, to
// match the real armory's layout.
const LEFT_SLOTS: ArmoryGearSlotKey[] = ["head", "neck", "shoulder", "back", "chest", "shirt", "tabard", "wrist"];
const RIGHT_SLOTS: ArmoryGearSlotKey[] = [
  "hand",
  "waist",
  "leg",
  "foot",
  "leftFinger",
  "rightFinger",
  "leftTrinket",
  "rightTrinket",
];

const SLOT_DISPLAY_NAMES: Record<ArmoryGearSlotKey, string> = {
  head: "Head",
  neck: "Neck",
  shoulder: "Shoulder",
  back: "Back",
  chest: "Chest",
  shirt: "Shirt",
  tabard: "Tabard",
  wrist: "Wrist",
  hand: "Hands",
  waist: "Waist",
  leg: "Legs",
  foot: "Feet",
  leftFinger: "Ring",
  rightFinger: "Ring",
  leftTrinket: "Trinket",
  rightTrinket: "Trinket",
  weapon: "Main Hand",
  offHand: "Off Hand",
};

const STAT_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  health: HeartIcon,
  mana: FlaskIcon,
  intellect: BulbIcon,
  stamina: DiamondIcon,
  "critical-strike": CrosshairIcon,
  haste: ClockIcon,
  mastery: CrownIcon,
  versatility: WrenchIcon,
};

interface StatColors {
  bg: string;
  border: string;
  icon: string;
}

const STAT_COLORS: Record<string, StatColors> = {
  health: { bg: "#1D1517", border: "#4B282D", icon: "#E25C64" },
  mana: { bg: "#141922", border: "#29445F", icon: "#5D9FE8" },
  intellect: { bg: "#191623", border: "#44365D", icon: "#A17BE8" },
  stamina: { bg: "#151C18", border: "#304B39", icon: "#65B77C" },
  "critical-strike": { bg: "#201911", border: "#59401F", icon: "#ECA735" },
  haste: { bg: "#131D20", border: "#28505A", icon: "#55BDD0" },
  mastery: { bg: "#1D1913", border: "#594522", icon: "#D7A83D" },
  versatility: { bg: "#141C1B", border: "#2D4D48", icon: "#62B6A8" },
};

function ItemTooltipContent({ item }: { item: GearItemSummary }) {
  return (
    <>
      <div className={styles.tooltipName}>{item.name}</div>
      {item.itemLevel ? <div className={styles.tooltipItemLevel}>Item Level {item.itemLevel}</div> : null}
      {item.transmogText ? (
        <div className={styles.tooltipTransmog}>
          Transmogrified to:
          <br />
          {item.transmogText}
        </div>
      ) : null}
      {item.bindingText ? <div className={styles.tooltipLine}>{item.bindingText}</div> : null}
      <div className={styles.tooltipLine}>
        <span>{item.slotName}</span>
        {item.subclassName ? <span className={styles.tooltipRight}>{item.subclassName}</span> : null}
      </div>
      {item.stats.map((stat) => (
        <div key={stat.text} className={stat.isBonus ? styles.tooltipStatBonus : styles.tooltipStatLine}>
          {stat.text}
        </div>
      ))}
      {item.enchantText ? <div className={styles.tooltipStatBonus}>{item.enchantText}</div> : null}
      {item.durabilityText || item.requirementsText.length > 0 || item.sellPrice ? (
        <div className={styles.tooltipDivider} />
      ) : null}
      {item.durabilityText ? <div className={styles.tooltipLine}>{item.durabilityText}</div> : null}
      {item.requirementsText.map((text) => (
        <div key={text} className={styles.tooltipLine}>
          {text}
        </div>
      ))}
      {item.sellPrice ? (
        <div className={styles.tooltipLine}>
          Sell Price: <span className={styles.gold}>{item.sellPrice.gold}</span>{" "}
          <span className={styles.silver}>{item.sellPrice.silver}</span>{" "}
          <span className={styles.copper}>{item.sellPrice.copper}</span>
        </div>
      ) : null}
    </>
  );
}

function EmptySlotRow({ slotKey }: { slotKey: ArmoryGearSlotKey }) {
  const slotName = SLOT_DISPLAY_NAMES[slotKey];

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemIconWrapEmpty} />
      <div className={styles.itemText}>
        <span className={styles.itemNameEmpty}>{slotName}</span>
        <span className={styles.itemMetaEmpty}>Not equipped</span>
      </div>
    </div>
  );
}

function GearRow({ item, slotKey }: { item: GearItemSummary; slotKey: ArmoryGearSlotKey }) {
  const style = { "--q": qualityColorVar(item.qualityType) } as CSSProperties;
  const slotLine = [SLOT_DISPLAY_NAMES[slotKey], item.itemLevel ? `Item Level ${item.itemLevel}` : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className={styles.itemRow} style={style}>
      <div className={styles.itemIconWrap}>
        {item.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
          <img src={proxiedImageUrl(item.iconUrl)} alt="" className={styles.itemIcon} />
        ) : null}
      </div>
      <div className={styles.itemText}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.itemSlotLine}>
          {slotLine}
          {item.socketIconUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
            <img key={url} src={proxiedImageUrl(url)} alt="" className={styles.socketIcon} />
          ))}
        </span>
        {item.enchantText ? (
          <span className={styles.itemEnchant}>
            <span className={styles.enchantDot} aria-hidden="true" />
            {item.enchantText}
          </span>
        ) : null}
      </div>

      <div className={styles.tooltip}>
        <ItemTooltipContent item={item} />
      </div>
    </div>
  );
}

function GearColumn({ slots, gear }: { slots: ArmoryGearSlotKey[]; gear: CharacterSummary["gear"] }) {
  return (
    <div className={styles.itemsColumn}>
      {slots.map((slot) => {
        const item = gear[slot];
        return item ? <GearRow key={slot} item={item} slotKey={slot} /> : <EmptySlotRow key={slot} slotKey={slot} />;
      })}
    </div>
  );
}

// A two-handed main-hand weapon occupies the off-hand slot too, so an empty
// off-hand next to one isn't a missing item — it's expected and should read
// that way rather than as an identical "not equipped" slot.
function isTwoHanded(weapon: GearItemSummary | undefined): boolean {
  return weapon?.slotName === "Two-Hand";
}

function WeaponSection({ gear }: { gear: CharacterSummary["gear"] }) {
  const weapon = gear.weapon;
  const offHand = gear.offHand;
  const twoHanded = isTwoHanded(weapon);

  return (
    <div className={styles.weaponSection}>
      <h3 className={styles.subsectionTitle}>Weapons</h3>
      <div className={styles.itemsColumn}>
        {weapon ? (
          <GearRow item={weapon} slotKey="weapon" />
        ) : (
          <EmptySlotRow slotKey="weapon" />
        )}
        {offHand ? (
          <GearRow item={offHand} slotKey="offHand" />
        ) : twoHanded ? (
          <div className={styles.itemRow}>
            <div className={styles.itemIconWrapEmpty} />
            <div className={styles.itemText}>
              <span className={styles.itemNameEmpty}>{SLOT_DISPLAY_NAMES.offHand}</span>
              <span className={styles.itemMetaEmpty}>Two-handed weapon equipped</span>
            </div>
          </div>
        ) : (
          <EmptySlotRow slotKey="offHand" />
        )}
      </div>
    </div>
  );
}

const STAT_GROUPS: { title: string; slugs: string[] }[] = [
  { title: "Resources", slugs: ["health", "mana"] },
  { title: "Primary Attributes", slugs: ["intellect", "stamina"] },
  { title: "Secondary Stats", slugs: ["critical-strike", "haste", "mastery", "versatility"] },
];

function StatTile({ stat }: { stat: CharacterSummary["overviewStats"][number] }) {
  const Icon = STAT_ICONS[stat.slug];
  const colors = STAT_COLORS[stat.slug];
  const style = colors
    ? ({
        "--stat-bg": colors.bg,
        "--stat-border": colors.border,
        "--stat-color": colors.icon,
      } as CSSProperties)
    : undefined;
  return (
    <div className={styles.statTile} style={style}>
      {Icon ? <Icon className={styles.statIcon} /> : null}
      <div className={styles.statValue}>{stat.displayValue}</div>
      <div className={styles.statLabel}>{stat.label}</div>
    </div>
  );
}

export function OverviewTab({ character }: OverviewTabProps) {
  const statsBySlug = new Map(character.overviewStats.map((stat) => [stat.slug, stat]));

  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Equipment</h2>
          <p className={styles.sectionSubtitle}>Equipped items and enhancements</p>
        </div>
        <div className={styles.items}>
          <GearColumn slots={LEFT_SLOTS} gear={character.gear} />
          <GearColumn slots={RIGHT_SLOTS} gear={character.gear} />
        </div>
        <WeaponSection gear={character.gear} />
      </div>

      <div className={styles.right}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Character Stats</h2>
          <p className={styles.sectionSubtitle}>Current attributes and combat ratings</p>
        </div>
        {STAT_GROUPS.map((group) => {
          const stats = group.slugs.map((slug) => statsBySlug.get(slug)).filter((stat): stat is NonNullable<typeof stat> => Boolean(stat));
          if (stats.length === 0) return null;
          return (
            <div key={group.title} className={styles.statGroup}>
              <h3 className={styles.subsectionTitle}>{group.title}</h3>
              <div className={styles.statsGrid}>
                {stats.map((stat) => (
                  <StatTile key={stat.slug} stat={stat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
