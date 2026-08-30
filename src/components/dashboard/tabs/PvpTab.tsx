"use client";

import type { CSSProperties } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryPvp, ArmoryPvpBracket, ArmoryShuffleSpec } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { ChevronIcon, HexagonIcon } from "../icons";
import styles from "./PvpTab.module.css";

interface PvpTabProps {
  characterRef: CharacterRef;
}

interface ListRow {
  key: string;
  name: string;
  category: string | null;
  ratingText: string;
  iconUrl: string | null;
}

// Each PvP mode gets a low-intensity identity color (a barely-tinted
// background, a matching border, and an icon ring) so modes are easy to tell
// apart at a glance, without turning the cards into solid color blocks.
interface ModeColors {
  bg: string;
  border: string;
  icon: string;
}

const MODE_COLORS: Record<string, ModeColors> = {
  "2v2": { bg: "#121A22", border: "#2A4560", icon: "#4FA8E8" }, // blue
  "3v3": { bg: "#171423", border: "#43346B", icon: "#A78BFA" }, // purple
  battlegrounds: { bg: "#1D1517", border: "#4B282D", icon: "#D97C82" }, // soft red
  shuffle: { bg: "#101B1F", border: "#254A54", icon: "#7DD3E0" }, // ice blue
  blitz: { bg: "#10201C", border: "#1F5449", icon: "#3FCDB0" }, // turquoise
};

function ratingText(bracket: ArmoryPvpBracket | undefined): string {
  if (!bracket || bracket.rating <= 0) return "Unranked";
  return String(bracket.rating);
}

function bestShuffleSpec(specs: ArmoryShuffleSpec[]): ArmoryShuffleSpec | null {
  return specs.reduce<ArmoryShuffleSpec | null>((best, spec) => (!best || spec.rating > best.rating ? spec : best), null);
}

function buildCareerRows(pvp: ArmoryPvp): ListRow[] {
  return [
    {
      key: "honor",
      name: "Honor",
      category: null,
      ratingText: `Level ${pvp.prestige?.honorLevel ?? 0}`,
      iconUrl: null,
    },
    {
      key: "honorable-kills",
      name: "Honorable Kills",
      category: null,
      ratingText: String(pvp.honorableKills?.value ?? 0),
      iconUrl: null,
    },
  ];
}

function buildRatingRows(pvp: ArmoryPvp): ListRow[] {
  const twoV2 = pvp.ratings["2v2"];
  const threeV3 = pvp.ratings["3v3"];
  const battlegrounds = pvp.ratings.battlegrounds;
  const blitz = pvp.ratings.blitz;
  const shuffle = bestShuffleSpec(pvp.ratings.shuffle?.specs ?? []);

  return [
    { key: "2v2", name: "2v2", category: "Arena", ratingText: ratingText(twoV2), iconUrl: twoV2?.tier.icon?.url ?? null },
    { key: "3v3", name: "3v3", category: "Arena", ratingText: ratingText(threeV3), iconUrl: threeV3?.tier.icon?.url ?? null },
    {
      key: "battlegrounds",
      name: "10v10",
      category: "Battlegrounds",
      ratingText: ratingText(battlegrounds),
      iconUrl: battlegrounds?.tier.icon?.url ?? null,
    },
    {
      key: "shuffle",
      name: "Solo Shuffle",
      category: "Arena",
      ratingText: shuffle ? ratingText(shuffle) : "Unranked",
      iconUrl: shuffle?.tier.icon?.url ?? null,
    },
    {
      key: "blitz",
      name: "Battleground Blitz",
      category: "Battlegrounds",
      ratingText: ratingText(blitz),
      iconUrl: blitz?.tier.icon?.url ?? null,
    },
  ];
}

interface HistoryRow {
  key: string;
  label: string;
  games: number;
  wins: number;
  // The character's main spec gets a subtle highlight in the history table.
  highlight?: boolean;
}

function buildHistoryRows(pvp: ArmoryPvp): HistoryRow[] {
  const rows: HistoryRow[] = [
    { key: "2v2", label: "2v2", games: pvp.ratings["2v2"]?.total ?? 0, wins: pvp.ratings["2v2"]?.winCount ?? 0 },
    { key: "3v3", label: "3v3", games: pvp.ratings["3v3"]?.total ?? 0, wins: pvp.ratings["3v3"]?.winCount ?? 0 },
    {
      key: "battlegrounds",
      label: "10v10",
      games: pvp.ratings.battlegrounds?.total ?? 0,
      wins: pvp.ratings.battlegrounds?.winCount ?? 0,
    },
  ];

  for (const spec of pvp.ratings.shuffle?.specs ?? []) {
    rows.push({
      key: `shuffle-${spec.specialization.id}`,
      label: `Solo Shuffle (${spec.specialization.name})`,
      games: spec.total,
      wins: spec.winCount,
      highlight: spec.specialization.name === "Fire",
    });
  }

  rows.push({
    key: "blitz",
    label: "Battleground Blitz",
    games: pvp.ratings.blitz?.total ?? 0,
    wins: pvp.ratings.blitz?.winCount ?? 0,
  });

  return rows;
}

function winPercentText(games: number, wins: number): string {
  if (games <= 0) return "—";
  return `${Math.round((wins / games) * 100)}%`;
}

function winsClass(wins: number): string {
  return wins > 0 ? styles.winsPositive : styles.winsZero;
}

function winPercentClass(games: number, wins: number): string {
  if (games <= 0) return styles.winPctNone;
  const pct = (wins / games) * 100;
  if (pct >= 60) return styles.winPctGood;
  if (pct >= 40) return styles.winPctMid;
  return styles.winPctLow;
}

function ListItemRow({ row }: { row: ListRow }) {
  const modeColors = MODE_COLORS[row.key];
  const style = modeColors
    ? ({
        "--mode-bg": modeColors.bg,
        "--mode-border": modeColors.border,
        "--mode-icon": modeColors.icon,
      } as CSSProperties)
    : undefined;
  const isUnranked = row.ratingText === "Unranked";

  return (
    <div className={styles.listRow} style={style}>
      <div className={styles.listIconWrap}>
        {row.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
          <img src={proxiedImageUrl(row.iconUrl)} alt="" className={styles.listIcon} />
        ) : row.key === "honor" ? (
          <HexagonIcon className={styles.listIconFallback} />
        ) : row.key === "honorable-kills" ? (
          <ChevronIcon className={styles.listIconFallback} />
        ) : null}
      </div>
      <div className={styles.listNameWrap}>
        <span className={styles.listName}>{row.name}</span>
        {row.category ? <span className={styles.listCategory}>{row.category}</span> : null}
      </div>
      <span className={isUnranked ? styles.listRatingMuted : styles.listRating}>{row.ratingText}</span>
    </div>
  );
}

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  return (
    <div className={styles.historyPanel}>
      <div className={styles.historyHeader}>
        <span className={styles.historyTitle}>Seasonal Match History</span>
        <span className={styles.historyCol}>Games</span>
        <span className={styles.historyCol}>Wins</span>
        <span className={styles.historyCol}>Win %</span>
      </div>
      {rows.map((row, index) => (
        <div
          key={row.key}
          className={styles.historyRow}
          data-alt={index % 2 === 1}
          data-highlight={row.highlight === true}
        >
          <span className={styles.historyLabel}>
            <span className={styles.historyLabelText}>{row.label}</span>
            {row.highlight ? <span className={styles.currentSpecBadge}>Current Spec</span> : null}
          </span>
          <span className={styles.historyValue}>{row.games}</span>
          <span className={winsClass(row.wins)}>{row.wins}</span>
          <span className={winPercentClass(row.games, row.wins)}>{winPercentText(row.games, row.wins)}</span>
        </div>
      ))}
    </div>
  );
}

function PvpContent({ pvp }: { pvp: ArmoryPvp }) {
  const careerRows = buildCareerRows(pvp);
  const ratingRows = buildRatingRows(pvp);
  const historyRows = buildHistoryRows(pvp);

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Player vs Player</h2>
      <div className={styles.layout}>
        <div className={styles.listWrap}>
          <h3 className={styles.listGroupTitle}>Career</h3>
          {careerRows.map((row) => (
            <ListItemRow key={row.key} row={row} />
          ))}
          <h3 className={styles.listGroupTitle}>Current Ratings</h3>
          {ratingRows.map((row) => (
            <ListItemRow key={row.key} row={row} />
          ))}
        </div>
        <div className={styles.historyWrap}>
          <HistoryTable rows={historyRows} />
        </div>
      </div>
    </section>
  );
}

export function PvpTab({ characterRef }: PvpTabProps) {
  const { data, loading, error } = useArmoryResource<ArmoryPvp>(armoryApiUrl("pvp", characterRef));
  return (
    <AsyncBoundary loading={loading} error={error} data={data}>
      {(pvp) => <PvpContent pvp={pvp} />}
    </AsyncBoundary>
  );
}
