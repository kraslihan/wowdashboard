"use client";

import { armoryApiUrl, characterDashboardPath, characterKeyFor, type CharacterRef } from "@/lib/character";
import type { DashboardTabId } from "@/lib/dashboardTabs";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { CharacterSummary } from "@/lib/armory/characterSummary";
import { AsyncBoundary } from "./AsyncBoundary";
import { CharacterHeader } from "./CharacterHeader";
import { Tabs, type TabItem } from "./Tabs";
import styles from "./DashboardShell.module.css";
import { OverviewTab } from "./tabs/OverviewTab";
import { PvpTab } from "./tabs/PvpTab";
import { AchievementsTab } from "./tabs/AchievementsTab";
import { MountsTab } from "./tabs/MountsTab";
import { ReputationTab } from "./tabs/ReputationTab";

const TAB_DEFS: { id: DashboardTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pvp", label: "PvP Status" },
  { id: "achievements", label: "Achievements" },
  { id: "mounts", label: "Mounts" },
  { id: "reputation", label: "Reputation" },
];

interface DashboardShellProps {
  characterRef: CharacterRef;
  activeTab: DashboardTabId;
}

// A tab panel that's simply not the active one still stays mounted (hidden
// via the `hidden` attribute, not removed from the tree) so switching tabs
// never resets a tab's own in-progress state — search text, open filters,
// pagination, scroll position. Only an actual character change should reset
// that state, which happens naturally because the whole shell below remounts
// under a characterKeyFor-based key (see DashboardShell's return).
function TabPanel({ id, active, children }: { id: DashboardTabId; active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={!active}>
      {children}
    </div>
  );
}

export function DashboardShell({ characterRef, activeTab }: DashboardShellProps) {
  const character = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));

  // Every tab panel below stays mounted regardless of which is active (see
  // TabPanel), so each tab's own useArmoryResource call already fires on
  // first render — a separate background-prefetch pass for inactive tabs
  // would just be a redundant duplicate of that.
  const tabs: TabItem[] = TAB_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    href: characterDashboardPath(characterRef, def.id),
  }));

  return (
    // Keyed on the character so switching characters cleanly resets every
    // tab's local state (each tab component remounts fresh) — switching
    // tabs within the same character does not change this key, so nothing
    // here remounts on a tab change.
    <div className={styles.shell} key={characterKeyFor(characterRef)}>
      <div className={styles.navBlock}>
        <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
          {(data) => <CharacterHeader character={data} activeTab={activeTab} activeCharacterRef={characterRef} />}
        </AsyncBoundary>

        <Tabs tabs={tabs} activeId={activeTab} />
      </div>

      <div className={styles.panels}>
        <TabPanel id="overview" active={activeTab === "overview"}>
          <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
            {(data) => <OverviewTab character={data} />}
          </AsyncBoundary>
        </TabPanel>

        <TabPanel id="pvp" active={activeTab === "pvp"}>
          <PvpTab characterRef={characterRef} />
        </TabPanel>

        <TabPanel id="achievements" active={activeTab === "achievements"}>
          <AchievementsTab characterRef={characterRef} />
        </TabPanel>

        <TabPanel id="mounts" active={activeTab === "mounts"}>
          <MountsTab characterRef={characterRef} />
        </TabPanel>

        <TabPanel id="reputation" active={activeTab === "reputation"}>
          <ReputationTab characterRef={characterRef} />
        </TabPanel>
      </div>
    </div>
  );
}
