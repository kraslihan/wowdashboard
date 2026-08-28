"use client";

import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryPvp, ArmoryPvpBracket, ArmoryShuffleSpec } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Meter } from "../Meter";
import { StatTile } from "../StatTile";
import styles from "./PvpTab.module.css";

interface PvpTabProps {
  characterRef: CharacterRef;
}

const BRACKETS: { key: "2v2" | "3v3" | "battlegrounds" | "blitz"; label: string }[] = [
  { key: "2v2", label: "2v2 Arena" },
  { key: "3v3", label: "3v3 Arena" },
  { key: "battlegrounds", label: "Rated Battlegrounds" },
  { key: "blitz", label: "Blitz" },
];

function BracketCard({ label, bracket }: { label: string; bracket: ArmoryPvpBracket }) {
  const winRate = bracket.total > 0 ? Math.round(bracket.winLoss * 100) : 0;
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{label}</span>
        {bracket.tier.name ? <span className={styles.tier}>{bracket.tier.name}</span> : null}
      </div>
      <div className={styles.rating}>{bracket.rating}</div>
      <Meter
        label="Win rate"
        value={bracket.winCount}
        max={bracket.total}
        valueLabel={
          bracket.total > 0 ? `${bracket.winCount}W / ${bracket.lossCount}L (${winRate}%)` : "No games played"
        }
      />
    </div>
  );
}

function ShuffleCard({ spec }: { spec: ArmoryShuffleSpec }) {
  const winRate = spec.total > 0 ? Math.round(spec.winLoss * 100) : 0;
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{spec.specialization.name}</span>
        {spec.tier.name ? <span className={styles.tier}>{spec.tier.name}</span> : null}
      </div>
      <div className={styles.rating}>{spec.rating}</div>
      <Meter
        label="Win rate"
        value={spec.winCount}
        max={spec.total}
        valueLabel={spec.total > 0 ? `${spec.winCount}W / ${spec.lossCount}L (${winRate}%)` : "No games played"}
      />
    </div>
  );
}

function PvpContent({ pvp }: { pvp: ArmoryPvp }) {
  const shuffleSpecs = pvp.ratings.shuffle?.specs ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.kpis}>
        <StatTile label="Honor level" value={String(pvp.prestige?.honorLevel ?? 0)} />
        <StatTile label="Honorable kills" value={String(pvp.honorableKills?.value ?? 0)} />
      </div>

      <div className={styles.cards}>
        {BRACKETS.map(({ key, label }) => {
          const bracket = pvp.ratings[key];
          return bracket ? <BracketCard key={key} label={label} bracket={bracket} /> : null;
        })}
      </div>

      {shuffleSpecs.length > 0 ? (
        <div>
          <h2 className={styles.sectionTitle}>Solo Shuffle</h2>
          <div className={styles.cards}>
            {shuffleSpecs.map((spec) => (
              <ShuffleCard key={spec.specialization.id} spec={spec} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
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
