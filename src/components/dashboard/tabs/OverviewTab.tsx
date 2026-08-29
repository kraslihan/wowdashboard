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

const LEFT_SLOTS: ArmoryGearSlotKey[] = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "shirt",
  "tabard",
  "wrist",
  "weapon",
  "offHand",
];
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

export function OverviewTab({ character }: OverviewTabProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <div className={styles.items}>
          <GearColumn slots={LEFT_SLOTS} gear={character.gear} />
          <GearColumn slots={RIGHT_SLOTS} gear={character.gear} />
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.statsGrid}>
          {character.overviewStats.map((stat) => {
            const Icon = STAT_ICONS[stat.slug];
            return (
              <div key={stat.slug} className={styles.statTile}>
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
