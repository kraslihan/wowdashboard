"use client";

import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryReputationNode, ArmoryReputationResponse } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Meter } from "../Meter";
import styles from "./ReputationTab.module.css";

interface ReputationTabProps {
  characterRef: CharacterRef;
}

function isLeaf(node: ArmoryReputationNode): boolean {
  return typeof node.value === "number" && typeof node.maxValue === "number";
}

function FactionRow({ node }: { node: ArmoryReputationNode }) {
  return (
    <Meter
      label={node.name}
      value={node.value ?? 0}
      max={node.maxValue ?? 0}
      valueLabel={node.standing ?? `${node.value ?? 0} / ${node.maxValue ?? 0}`}
      tone={node.max ? "good" : "accent"}
    />
  );
}

function ReputationGroup({ node }: { node: ArmoryReputationNode }) {
  const children = node.reputations ?? [];
  return (
    <details className={styles.group} open>
      <summary className={styles.groupTitle}>{node.name}</summary>
      <div className={styles.groupBody}>
        {children.map((child) =>
          isLeaf(child) ? <FactionRow key={child.id} node={child} /> : <ReputationGroup key={child.id} node={child} />,
        )}
      </div>
    </details>
  );
}

function ReputationContent({ reputation }: { reputation: ArmoryReputationResponse }) {
  return (
    <div className={styles.wrap}>
      {reputation.reputations.map((group) => (
        <ReputationGroup key={group.id} node={group} />
      ))}
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
