"use client";

import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryPvp, ArmoryPvpBracket, ArmoryShuffleSpec } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { ChevronIcon, HexagonIcon } from "../icons";
import styles from "./PvpTab.module.css";

interface PvpTabProps {
  characterRef: CharacterRef;
}

const ARENA_BATTLEGROUND_KEYS = [
  { key: "2v2" as const, title: "2v2", subtitle: "Arena" },
  { key: "3v3" as const, title: "3v3", subtitle: "Arena" },
  { key: "battlegrounds" as const, title: "10v10", subtitle: "Battlegrounds" },
];

function BracketTile({
  title,
  subtitle,
  bracket,
}: {
  title: string;
  subtitle: string;
  bracket: ArmoryPvpBracket;
}) {
  return (
    <div className={styles.tile}>
      {bracket.tier.icon?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image
        <img src={bracket.tier.icon.url} alt="" className={styles.tileArt} />
      ) : (
        <div className={styles.tileArtPlaceholder} />
      )}
      <span className={styles.tileTitle}>{title}</span>
      <span className={styles.tileSubtitle}>{subtitle}</span>
      <span className={styles.tileMeta}>
        {bracket.rating > 0 ? `${bracket.rating} CR` : (bracket.tier.name ?? "Unranked")}
      </span>
    </div>
  );
}

function bestShuffleSpec(specs: ArmoryShuffleSpec[]): ArmoryShuffleSpec | null {
  return specs.reduce<ArmoryShuffleSpec | null>((best, spec) => (!best || spec.rating > best.rating ? spec : best), null);
}

function PvpContent({ pvp }: { pvp: ArmoryPvp }) {
  const shuffle = bestShuffleSpec(pvp.ratings.shuffle?.specs ?? []);
  const blitz = pvp.ratings.blitz;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Player vs Player</h2>
      <div className={styles.grid}>
        <div className={styles.badge}>
          <HexagonIcon className={styles.badgeIcon} />
          <span className={styles.badgeLabel}>Honor</span>
          <span className={styles.badgeValue}>Level {pvp.prestige?.honorLevel ?? 0}</span>
        </div>
        <div className={styles.badge}>
          <ChevronIcon className={styles.badgeIcon} />
          <span className={styles.badgeLabel}>Honorable Kills</span>
          <span className={styles.badgeValue}>{pvp.honorableKills?.value ?? 0}</span>
        </div>

        {ARENA_BATTLEGROUND_KEYS.map(({ key, title, subtitle }) => {
          const bracket = pvp.ratings[key];
          return bracket ? <BracketTile key={key} title={title} subtitle={subtitle} bracket={bracket} /> : null;
        })}

        {shuffle ? <BracketTile title="Solo Shuffle" subtitle="Arena" bracket={shuffle} /> : null}
        {blitz ? <BracketTile title="Battleground Blitz" subtitle="Battlegrounds" bracket={blitz} /> : null}
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
