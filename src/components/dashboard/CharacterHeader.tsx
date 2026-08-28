import type { CharacterSummary } from "@/lib/armory/characterSummary";
import styles from "./CharacterHeader.module.css";

interface CharacterHeaderProps {
  character: CharacterSummary;
}

export function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <header className={styles.header}>
      {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image, no remote-pattern config needed */}
      <img src={character.avatar.url} alt={`${character.name} avatar`} className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{character.name}</h1>
          <span className={styles.realm}>
            {character.realm.name} ({character.region.toUpperCase()})
          </span>
        </div>
        <div className={styles.meta}>
          <span>Level {character.level}</span>
          <span aria-hidden="true">·</span>
          <span>
            {character.race.name} {character.class.name}
          </span>
          {character.spec ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{character.spec.name}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{character.faction.name}</span>
          {character.guild ? (
            <>
              <span aria-hidden="true">·</span>
              <span>&lt;{character.guild.name}&gt;</span>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
