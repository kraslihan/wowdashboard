"use client";

import { useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
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

const TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "pvp", label: "PvP Dashboard" },
  { id: "achievements", label: "Achievements" },
  { id: "mounts", label: "Mounts" },
  { id: "reputations", label: "Reputations" },
];

interface DashboardShellProps {
  characterRef: CharacterRef;
}

export function DashboardShell({ characterRef }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const character = useArmoryResource<CharacterSummary>(armoryApiUrl("character", characterRef));

  return (
    <div className={styles.shell}>
      <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
        {(data) => <CharacterHeader character={data} />}
      </AsyncBoundary>

      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <div className={styles.panels}>
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={activeTab !== "overview"}>
          <AsyncBoundary loading={character.loading} error={character.error} data={character.data}>
            {(data) => <OverviewTab character={data} />}
          </AsyncBoundary>
        </div>

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

        {activeTab === "reputations" && (
          <div role="tabpanel" id="panel-reputations" aria-labelledby="tab-reputations">
            <ReputationTab characterRef={characterRef} />
          </div>
        )}
      </div>
    </div>
  );
}
