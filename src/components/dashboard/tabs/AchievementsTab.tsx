"use client";

import { armoryApiUrl, type CharacterRef } from "@/lib/character";
import { useArmoryResource } from "@/lib/useArmoryResource";
import type { ArmoryAchievementCategory } from "@/lib/armory/types";
import { AsyncBoundary } from "../AsyncBoundary";
import { Meter } from "../Meter";
import { StatTile } from "../StatTile";
import styles from "./AchievementsTab.module.css";

interface AchievementsTabProps {
  characterRef: CharacterRef;
}

function AchievementsContent({ categories }: { categories: ArmoryAchievementCategory[] }) {
  const totalCount = categories.reduce((sum, category) => sum + category.count, 0);
  const totalPoints = categories.reduce((sum, category) => sum + (category.points ?? 0), 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.kpis}>
        <StatTile label="Achievements earned" value={totalCount.toLocaleString()} />
        <StatTile label="Points earned" value={totalPoints.toLocaleString()} />
        <StatTile label="Categories" value={String(categories.length)} />
      </div>

      <div className={styles.list}>
        {categories.map((category) =>
          typeof category.total === "number" ? (
            <Meter
              key={category.slug}
              label={category.name}
              value={category.count}
              max={category.total}
              valueLabel={`${category.count} / ${category.total}${
                category.points !== undefined && category.totalPoints !== undefined
                  ? ` · ${category.points}/${category.totalPoints} pts`
                  : ""
              }`}
              tone={category.count >= category.total ? "good" : "accent"}
            />
          ) : (
            <div key={category.slug} className={styles.rowNoTotal}>
              <span>{category.name}</span>
              <span className={styles.rowCount}>{category.count}</span>
            </div>
          ),
        )}
      </div>
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
