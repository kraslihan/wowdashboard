"use client";

import { useMemo, useState } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryReputationNode, ArmoryReputationResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import styles from "./ReputationTab.module.css";

interface ReputationTabProps {
  characterRef: CharacterRef;
}

function isLeaf(node: ArmoryReputationNode): boolean {
  return typeof node.value === "number" && typeof node.maxValue === "number";
}

function filterTree(nodes: ArmoryReputationNode[], query: string): ArmoryReputationNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  const result: ArmoryReputationNode[] = [];

  for (const node of nodes) {
    if (isLeaf(node)) {
      const matches = node.name.toLowerCase().includes(q) || (node.standing?.toLowerCase().includes(q) ?? false);
      if (matches) result.push(node);
      continue;
    }

    const children = node.reputations ?? [];
    const selfMatches = node.name.toLowerCase().includes(q);
    const filteredChildren = selfMatches ? children : filterTree(children, query);
    if (selfMatches || filteredChildren.length > 0) {
      result.push({ ...node, reputations: filteredChildren });
    }
  }

  return result;
}

// A reputation's standing text maps to one tier of a consistent color scale
// (matching WoW's own standing meaning) so the same standing always reads
// the same color everywhere, instead of one color per expansion/category.
type StandingTier = "neutral" | "friendly" | "honored" | "revered" | "exalted" | "renown" | "other";

function standingTier(standing: string | undefined): StandingTier {
  if (!standing) return "other";
  if (/^renown/i.test(standing)) return "renown";
  if (standing === "Exalted") return "exalted";
  if (standing === "Revered") return "revered";
  if (standing === "Honored") return "honored";
  if (standing === "Friendly") return "friendly";
  if (standing === "Neutral") return "neutral";
  return "other";
}

function countLeaves(nodes: ArmoryReputationNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (isLeaf(node)) count += 1;
    else count += countLeaves(node.reputations ?? []);
  }
  return count;
}

function FactionRow({ node }: { node: ArmoryReputationNode }) {
  const value = node.value ?? 0;
  const max = node.maxValue ?? 0;
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const tier = standingTier(node.standing);

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel} title={node.name}>
        {node.name}
      </span>
      <div className={styles.barTrack} data-tier={tier}>
        <div className={styles.barFill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.rowValue}>
        {value.toLocaleString()} / {max.toLocaleString()}
      </span>
      <span className={styles.rowStanding} data-tier={tier}>
        {node.standing}
      </span>
    </div>
  );
}

function ReputationGroup({ node }: { node: ArmoryReputationNode }) {
  const children = node.reputations ?? [];
  const leafCount = countLeaves(children);

  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <h3 className={styles.groupTitle}>{node.name}</h3>
        <span className={styles.groupCount}>{leafCount}</span>
      </div>
      <div className={styles.groupBody}>
        {children.map((child) => (isLeaf(child) ? <FactionRow key={child.id} node={child} /> : <ReputationGroup key={child.id} node={child} />))}
      </div>
    </section>
  );
}

function ReputationContent({ reputation }: { reputation: ArmoryReputationResponse }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => filterTree(reputation.reputations, query), [reputation.reputations, query]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Reputation</h2>
          <p className={styles.sectionSubtitle}>Standing with factions across every expansion</p>
        </div>
        <div className={styles.searchWrap}>
          <input
            type="search"
            placeholder="Reputation, category, or standing"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className={styles.empty}>No reputations match this search.</p>
      ) : (
        groups.map((group) => <ReputationGroup key={group.id} node={group} />)
      )}
    </div>
  );
}

export function ReputationTab({ characterRef }: ReputationTabProps) {
  const { data, loading, error } = useArmoryResource<ArmoryReputationResponse>(
    armoryApiUrl("reputation", characterRef),
  );
  return (
    <AsyncBoundary loading={loading} error={error} data={data}>
      {(reputation) => <ReputationContent reputation={reputation} />}
    </AsyncBoundary>
  );
}
