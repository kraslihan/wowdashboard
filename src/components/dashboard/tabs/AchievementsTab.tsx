"use client";

import type { CSSProperties } from "react";
import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryAchievementCategory } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { LaurelShieldIcon, ShieldIcon } from "../icons";
import styles from "./AchievementsTab.module.css";

interface AchievementsTabProps {
  characterRef: CharacterRef;
}

function CategoryCard({ category }: { category: ArmoryAchievementCategory }) {
  const hasTotal = typeof category.total === "number" && category.total > 0;
  const pct = hasTotal ? Math.round((category.count / (category.total as number)) * 100) : null;

  return (
    <div className={styles.card}>
      {hasTotal ? (
        <div className={styles.ring} style={{ "--pct": pct } as CSSProperties}>
          <span className={styles.ringValue}>{pct}%</span>
        </div>
      ) : (
        <LaurelShieldIcon className={styles.laurel} />
      )}
      <span className={styles.name}>{category.name}</span>
      <span className={styles.points}>
        <ShieldIcon className={styles.pointIcon} />
        {(category.points ?? category.count).toLocaleString()}
      </span>
    </div>
  );
}

function AchievementsContent({ categories }: { categories: ArmoryAchievementCategory[] }) {
  return (
    <div className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard key={category.slug} category={category} />
      ))}
    </div>
  );
}

export function AchievementsTab({ characterRef }: AchievementsTabProps) {
  const { data, loading, error } = useArmoryResource<ArmoryAchievementCategory[]>(
    armoryApiUrl("achievements", characterRef),
  );
  return (
    <AsyncBoundary loading={loading} error={error} data={data}>
      {(categories) => <AchievementsContent categories={categories} />}
    </AsyncBoundary>
  );
}
