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
      </div>
      <div className={styles.tooltip}>
        <div className={styles.tooltipEmptyLine}>{slotName} (empty slot)</div>
      </div>
    </div>
  );
}

function GearRow({ item }: { item: GearItemSummary }) {
  const style = { "--q": qualityColorVar(item.qualityType) } as CSSProperties;

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
        <span className={styles.itemMeta}>
          {item.itemLevel ?? ""}
          {item.socketIconUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
            <img key={url} src={proxiedImageUrl(url)} alt="" className={styles.socketIcon} />
          ))}
          {item.enchantText ? <span className={styles.itemEnchant}>{item.enchantText}</span> : null}
        </span>
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
        return item ? <GearRow key={slot} item={item} /> : <EmptySlotRow key={slot} slotKey={slot} />;
      })}
    </div>
  );
}

function WeaponIconBox({ item, slotKey }: { item: GearItemSummary | undefined; slotKey: ArmoryGearSlotKey }) {
  if (!item) {
    return (
      <div className={styles.weaponIconWrap}>
        <div className={styles.weaponIconEmpty} />
        <div className={styles.tooltip}>
          <div className={styles.tooltipEmptyLine}>{SLOT_DISPLAY_NAMES[slotKey]} (empty slot)</div>
        </div>
      </div>
    );
  }

  const style = { "--q": qualityColorVar(item.qualityType) } as CSSProperties;

  return (
    <div className={styles.weaponIconWrap} style={style}>
      {item.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
        <img src={proxiedImageUrl(item.iconUrl)} alt="" className={styles.weaponIcon} />
      ) : null}
      <div className={styles.tooltip}>
        <ItemTooltipContent item={item} />
      </div>
    </div>
  );
}

function WeaponSection({ gear }: { gear: CharacterSummary["gear"] }) {
  const weapon = gear.weapon;
  const offHand = gear.offHand;
  const style = weapon ? ({ "--q": qualityColorVar(weapon.qualityType) } as CSSProperties) : undefined;

  return (
    <div className={styles.weaponSection}>
      <div className={styles.weaponIcons}>
        {/* Name, enchant, item level, and the main-hand icon share one hover
          area so hovering the text reveals the same tooltip as the icon. */}
        <div className={styles.weaponPrimary} style={style}>
          <div className={styles.weaponText}>
            {weapon ? (
              <>
                <span className={styles.weaponName}>{weapon.name}</span>
                {weapon.enchantText ? <span className={styles.weaponEnchant}>{weapon.enchantText}</span> : null}
              </>
            ) : (
              <span className={styles.itemNameEmpty}>{SLOT_DISPLAY_NAMES.weapon}</span>
            )}
          </div>
          {weapon?.itemLevel ? <span className={styles.weaponLevel}>{weapon.itemLevel}</span> : null}
          <div className={styles.weaponIconWrap}>
            {weapon?.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
              <img src={proxiedImageUrl(weapon.iconUrl)} alt="" className={styles.weaponIcon} />
            ) : (
              <div className={styles.weaponIconEmpty} />
            )}
          </div>
          <div className={styles.tooltip}>
            {weapon ? (
              <ItemTooltipContent item={weapon} />
            ) : (
              <div className={styles.tooltipEmptyLine}>{SLOT_DISPLAY_NAMES.weapon} (empty slot)</div>
            )}
          </div>
        </div>

        <WeaponIconBox item={offHand} slotKey="offHand" />
      </div>
    </div>
  );
}

export function OverviewTab({ character }: OverviewTabProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <div className={styles.items}>
          <GearColumn slots={LEFT_SLOTS} gear={character.gear} />
          <GearColumn slots={RIGHT_SLOTS} gear={character.gear} />
        </div>
        <WeaponSection gear={character.gear} />
      </div>

      <div className={styles.right}>
        <div className={styles.statsGrid}>
          {character.overviewStats.map((stat) => {
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
              <div key={stat.slug} className={styles.statTile} style={style}>
                {Icon ? <Icon className={styles.statIcon} /> : null}
                <div className={styles.statValue}>{stat.displayValue}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
