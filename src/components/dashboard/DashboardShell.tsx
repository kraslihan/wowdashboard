"use client";

import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import type { DashboardTabId } from "@/lib/dashboardTabs";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { CharacterSummary } from "@/lib/armory/characterSummary";
import { AsyncBoundary } from "./AsyncBoundary";
import { CharacterHeader } from "./CharacterHeader";
import { Tabs, type TabItem } from "./Tabs";
import styles from "./DashboardShell.module.css";
import { PvpTab } from "./tabs/PvpTab";
import { AchievementsTab } from "./tabs/AchievementsTab";
import { MountsTab } from "./tabs/MountsTab";
import { ReputationTab } from "./tabs/ReputationTab";

const TABS: TabItem[] = [
  { id: "pvp", label: "PvP Status", href: "/pvp" },
  { id: "achievements", label: "Achievements", href: "/achievements" },
  { id: "mounts", label: "Mounts", href: "/mounts" },
  { id: "reputation", label: "Reputation", href: "/reputation" },
];

interface DashboardShellProps {
  characterRef: CharacterRef;
  activeTab: DashboardTabId;
}

export function DashboardShell({ characterRef, activeTab }: DashboardShellProps) {
  const character = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));

  return (
    <div className={styles.shell}>
      <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
        {(data) => <CharacterHeader character={data} />}
      </AsyncBoundary>

      <Tabs tabs={TABS} activeId={activeTab} />

      <div className={styles.panels}>
        {activeTab === "pvp" && (
          <div role="tabpanel" id="panel-pvp" aria-labelledby="tab-pvp">
            <PvpTab characterRef={characterRef} />
          </div>
        )}

        {activeTab === "achievements" && (
          <div role="tabpanel" id="panel-achievements" aria-labelledby="tab-achievements">
            <AchievementsTab characterRef={characterRef} />
          </div>
        )}

        {activeTab === "mounts" && (
          <div role="tabpanel" id="panel-mounts" aria-labelledby="tab-mounts">
            <MountsTab characterRef={characterRef} />
          </div>
        )}

        {activeTab === "reputation" && (
          <div role="tabpanel" id="panel-reputation" aria-labelledby="tab-reputation">
            <ReputationTab characterRef={characterRef} />
          </div>
        )}
      </div>
    </div>
  );
}
