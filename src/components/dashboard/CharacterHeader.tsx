import type { CharacterSummary } from "@/lib/armory/characterSummary";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { CrossedSwordsIcon, ShieldIcon } from "./icons";
import styles from "./CharacterHeader.module.css";

interface CharacterHeaderProps {
  character: CharacterSummary;
}

export function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <header className={styles.header}>
      {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image, no remote-pattern config needed */}
      <img src={proxiedImageUrl(character.avatar.url)} alt={`${character.name} avatar`} className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.topRow}>
          <span className={styles.name}>{character.name}</span>
          <span className={styles.divider} aria-hidden="true">
            |
          </span>
          <span className={styles.stat}>
            <ShieldIcon className={styles.statIcon} />
            {character.achievement.toLocaleString()}
          </span>
          <span className={styles.stat}>
            <CrossedSwordsIcon className={styles.statIcon} />
            {character.averageItemLevel} ILVL
          </span>
        </div>
        <div className={styles.bottomRow}>
          <span>{character.level}</span>
          <span>{character.race.name}</span>
          {character.spec ? <span>{character.spec.name}</span> : null}
          <span>{character.class.name}</span>
          {character.guild ? <span className={styles.guild}>‹{character.guild.name}›</span> : null}
          <span>{character.realm.name}</span>
        </div>
      </div>
    </header>
  );
}
