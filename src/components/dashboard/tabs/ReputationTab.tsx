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

function FactionRow({ node, accent }: { node: ArmoryReputationNode; accent: "guild" | "default" }) {
  const value = node.value ?? 0;
  const max = node.maxValue ?? 0;
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{node.name}</span>
      <div className={styles.barTrack} data-accent={accent}>
        <div className={styles.barFill} style={{ width: `${percent}%` }} />
        <span className={styles.barValue}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <span className={styles.rowStanding} data-accent={accent}>
        {node.standing}
      </span>
    </div>
  );
}

function ReputationGroup({ node }: { node: ArmoryReputationNode }) {
  const children = node.reputations ?? [];
  const accent = node.id === "guild" ? "guild" : "default";

  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>{node.name}</h3>
      <div className={styles.groupBody}>
        {children.map((child) =>
          isLeaf(child) ? (
            <FactionRow key={child.id} node={child} accent={accent} />
          ) : (
            <ReputationGroup key={child.id} node={child} />
          ),
        )}
      </div>
    </section>
  );
}

function ReputationContent({ reputation }: { reputation: ArmoryReputationResponse }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => filterTree(reputation.reputations, query), [reputation.reputations, query]);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <input
          type="search"
          placeholder="Reputation, category, or standing"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.search}
        />
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
