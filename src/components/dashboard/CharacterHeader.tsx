"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { CharacterSummary } from "@/lib/armory/characterSummary";
import type { DashboardTabId } from "@/lib/dashboardTabs";
import { proxiedImageUrl } from "@/lib/imageProxy";
import { CrossedSwordsIcon, FactionEmblem, ShieldIcon } from "./icons";
import styles from "./CharacterHeader.module.css";

interface CharacterHeaderProps {
  character: CharacterSummary;
  activeTab: DashboardTabId;
}

const FACTION_LABELS: Record<string, string> = {
  alliance: "Alliance",
  horde: "Horde",
};

function joinNonEmpty(parts: (string | null | undefined)[], separator: string): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(separator);
}

function StatAction({
  href,
  active,
  ariaLabel,
  icon,
  value,
  label,
}: {
  href: string;
  active: boolean;
  ariaLabel: string;
  icon: ReactNode;
  value: string;
  label: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.statAction}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        if (!active) router.push(href);
      }}
    >
      <span className={styles.statValueRow}>
        {icon}
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </button>
  );
}

export function CharacterHeader({ character, activeTab }: CharacterHeaderProps) {
  const specClassText = joinNonEmpty([character.spec?.name, character.class.name], " ");
  const metaLine = joinNonEmpty([`Level ${character.level}`, character.race.name, specClassText], " • ");
  const hasRealm = Boolean(character.realm.name);

  const factionSlug = character.faction.slug === "alliance" || character.faction.slug === "horde" ? character.faction.slug : null;

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external Blizzard-hosted image, no remote-pattern config needed */}
        <img
          src={proxiedImageUrl(character.avatar.url)}
          alt={`${character.name} avatar`}
          className={styles.avatar}
          data-faction={factionSlug ?? undefined}
        />
        <div className={styles.details}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{character.name}</span>
            {factionSlug ? (
              <span
                className={styles.factionMark}
                data-faction={factionSlug}
                role="img"
                aria-label={`${FACTION_LABELS[factionSlug]} character`}
                title={`${FACTION_LABELS[factionSlug]} character`}
              >
                <FactionEmblem faction={factionSlug} />
              </span>
            ) : null}
          </div>
          {metaLine ? <span className={styles.metaLine}>{metaLine}</span> : null}
          {hasRealm || character.guild ? (
            <span className={styles.locationLine}>
              {hasRealm ? character.realm.name : null}
              {hasRealm && character.guild ? (
                <span className={styles.locationDot} aria-hidden="true">
                  {" "}
                  •{" "}
                </span>
              ) : null}
              {character.guild ? <span className={styles.guildName}>‹{character.guild.name}›</span> : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.quickStats}>
        <StatAction
          href="/achievements"
          active={activeTab === "achievements"}
          ariaLabel="View achievements"
          icon={<ShieldIcon className={styles.statIcon} />}
          value={character.achievement.toLocaleString()}
          label="Achievement Points"
        />
        <StatAction
          href="/overview"
          active={activeTab === "overview"}
          ariaLabel="View item level details"
          icon={<CrossedSwordsIcon className={styles.statIcon} />}
          value={String(character.averageItemLevel)}
          label="Item Level"
        />
      </div>
    </header>
  );
}
