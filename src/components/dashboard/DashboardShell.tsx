"use client";

import { useEffect } from "react";
import { armoryApiUrl, type ArmoryService, type CharacterRef } from "@/lib/character";
import type { DashboardTabId } from "@/lib/dashboardTabs";
import { prefetchArmoryResource, useArmoryResource } from "@/lib/useArmoryResource";
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

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", href: "/overview" },
  { id: "pvp", label: "PvP Status", href: "/pvp" },
  { id: "achievements", label: "Achievements", href: "/achievements" },
  { id: "mounts", label: "Mounts", href: "/mounts" },
  { id: "reputation", label: "Reputation", href: "/reputation" },
];

// Every tab that fetches its own data (Overview reuses the character
// response, so it isn't listed here).
const TAB_SERVICES: Partial<Record<DashboardTabId, ArmoryService>> = {
  pvp: "pvp",
  achievements: "achievements",
  mounts: "mounts",
  reputation: "reputation",
};

interface DashboardShellProps {
  characterRef: CharacterRef;
  activeTab: DashboardTabId;
}

export function DashboardShell({ characterRef, activeTab }: DashboardShellProps) {
  const character = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));

  // Warm the cache for every tab the user hasn't opened yet, in the
  // background, so switching to it later is instant instead of showing a
  // loading state. The active tab already fetches itself via its own
  // useArmoryResource call.
  useEffect(() => {
    for (const [tabId, service] of Object.entries(TAB_SERVICES) as [DashboardTabId, ArmoryService][]) {
      if (tabId === activeTab) continue;
      prefetchArmoryResource(armoryApiUrl(service, characterRef));
    }
  }, [characterRef, activeTab]);

  return (
    <div className={styles.shell}>
      <div className={styles.navBlock}>
        <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
          {(data) => <CharacterHeader character={data} activeTab={activeTab} />}
        </AsyncBoundary>

        <Tabs tabs={TABS} activeId={activeTab} />
      </div>

      <div className={styles.panels}>
        {activeTab === "overview" && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
              {(data) => <OverviewTab character={data} />}
            </AsyncBoundary>
          </div>
        )}

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
