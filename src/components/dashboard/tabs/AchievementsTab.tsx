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

// Feats of Strength and Legacy are real Blizzard categories the character
// has progress in, but Blizzard never counts them toward Achievement
// Points — the API reflects that by returning `points`/`total` as null for
// them, unlike every scoring category. Grouping on that null, rather than a
// hardcoded slug list, keeps this correct if the API adds another
// non-scoring category later.
function isScoringCategory(category: ArmoryAchievementCategory): boolean {
  return typeof category.points === "number";
}

function CategoryCard({ category, scoring }: { category: ArmoryAchievementCategory; scoring: boolean }) {
  const hasTotal = typeof category.total === "number" && category.total > 0;
  const pct = hasTotal ? Math.round((category.count / (category.total as number)) * 100) : null;

  return (
    <div className={scoring ? styles.card : `${styles.card} ${styles.cardSpecial}`}>
      {hasTotal ? (
        <div className={styles.ring} style={{ "--pct": pct } as CSSProperties}>
          <span className={styles.ringValue}>{pct}%</span>
        </div>
      ) : (
        <LaurelShieldIcon className={styles.laurel} />
      )}
      <span className={styles.name}>{category.name}</span>
      {scoring ? (
        <span className={styles.points}>
          <ShieldIcon className={styles.pointIcon} />
          {(category.points ?? 0).toLocaleString()}
        </span>
      ) : (
        <span className={styles.noPoints}>No Achievement Points</span>
      )}
    </div>
  );
}

function AchievementsContent({ categories }: { categories: ArmoryAchievementCategory[] }) {
  const scoringCategories = categories.filter(isScoringCategory);
  const specialCategories = categories.filter((category) => !isScoringCategory(category));

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Achievement Point Categories</h2>
        <p className={styles.sectionSubtitle}>These categories contribute to your total Achievement Points.</p>
      </div>
      <div className={styles.grid}>
        {scoringCategories.map((category) => (
          <CategoryCard key={category.slug} category={category} scoring />
        ))}
      </div>

      {specialCategories.length > 0 ? (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Special Categories</h2>
            <p className={styles.sectionSubtitle}>These categories do not contribute to your Achievement Points.</p>
          </div>
          <div className={styles.grid}>
            {specialCategories.map((category) => (
              <CategoryCard key={category.slug} category={category} scoring={false} />
            ))}
          </div>
        </>
      ) : null}
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
