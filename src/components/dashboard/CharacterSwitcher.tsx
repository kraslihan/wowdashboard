"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  armoryApiUrl,
  characterDashboardPath,
  characterKeyFor,
  KNOWN_CHARACTERS,
  type CharacterRef,
} from "@/lib/character";
import type { CharacterSummary } from "@/lib/armory/characterSummary";
import type { DashboardTabId } from "@/lib/dashboardTabs";
import { useArmoryResource } from "@/lib/useArmoryResource";
import { CheckIcon, ChevronDownIcon, FactionEmblem } from "./icons";
import styles from "./CharacterSwitcher.module.css";

function capitalize(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

function CharacterOption({
  characterRef,
  isActive,
  onSelect,
}: {
  characterRef: CharacterRef;
  isActive: boolean;
  onSelect: () => void;
}) {
  // Each option fetches its own character summary (realm/faction/class) so
  // same-named characters on different realms are told apart by more than
  // just a name — this reuses the shared armory cache, so it's already
  // warm once any tab for that character has loaded.
  const { data } = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));
  const factionSlug = data?.faction.slug === "alliance" || data?.faction.slug === "horde" ? data.faction.slug : null;
  const specClass = data ? [data.spec?.name, data.class.name].filter(Boolean).join(" ") : null;
  const metaText = data
    ? [data.realm.name, data.faction.name, specClass].filter(Boolean).join(" • ")
    : capitalize(characterRef.realmSlug.replace(/-/g, " "));

  return (
    <button
      type="button"
      className={styles.option}
      data-active={isActive}
      onClick={onSelect}
      aria-current={isActive ? "true" : undefined}
    >
      {factionSlug ? (
        <FactionEmblem faction={factionSlug} className={styles.optionFaction} data-faction={factionSlug} />
      ) : (
        <span className={styles.optionFactionPlaceholder} aria-hidden="true" />
      )}
      <span className={styles.optionText}>
        <span className={styles.optionName}>{data?.name ?? capitalize(characterRef.characterName)}</span>
        <span className={styles.optionMeta}>{metaText}</span>
      </span>
      {isActive ? <CheckIcon className={styles.optionCheck} /> : null}
    </button>
  );
}

export function CharacterSwitcher({
  activeCharacterRef,
  activeTab,
}: {
  activeCharacterRef: CharacterRef;
  activeTab: DashboardTabId;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Nothing to switch between — don't show a dropdown for a single character.
  if (KNOWN_CHARACTERS.length <= 1) return null;

  function handleSelect(ref: CharacterRef) {
    setOpen(false);
    // Switching to the character already shown is a no-op — no navigation,
    // no state reset.
    if (characterKeyFor(ref) === characterKeyFor(activeCharacterRef)) return;
    // The current tab carries over: only the character segment of the URL
    // changes, so e.g. staying on Mounts while switching characters keeps
    // showing Mounts for the newly selected character.
    router.push(characterDashboardPath(ref, activeTab));
  }

  return (
    <div className={styles.switcher} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch character"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDownIcon className={styles.triggerIcon} />
      </button>
      {open ? (
        <div className={styles.panel} role="listbox" aria-label="Characters">
          {KNOWN_CHARACTERS.map((ref) => (
            <CharacterOption
              key={characterKeyFor(ref)}
              characterRef={ref}
              isActive={characterKeyFor(ref) === characterKeyFor(activeCharacterRef)}
              onSelect={() => handleSelect(ref)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
