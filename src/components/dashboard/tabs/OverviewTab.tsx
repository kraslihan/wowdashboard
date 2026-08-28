import type { CharacterSummary } from "@/lib/armory/characterSummary";
import { StatTile } from "../StatTile";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  character: CharacterSummary;
}

export function OverviewTab({ character }: OverviewTabProps) {
  return (
    <section className={styles.grid}>
      <StatTile label="Average item level" value={String(character.averageItemLevel)} />
      <StatTile label="Achievement points" value={character.achievement.toLocaleString()} />
      <StatTile label="Character level" value={String(character.level)} />
      <StatTile label="Class" value={character.class.name} hint={character.spec?.name} />
      <StatTile label="Race" value={character.race.name} />
      <StatTile label="Faction" value={character.faction.name} />
      <StatTile label="Guild" value={character.guild?.name ?? "No guild"} />
      <StatTile label="Realm" value={`${character.realm.name} (${character.region.toUpperCase()})`} />
    </section>
  );
}
