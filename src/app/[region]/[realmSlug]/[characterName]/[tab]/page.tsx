import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { findKnownCharacter } from "@/lib/character";
import { DASHBOARD_TABS, type DashboardTabId } from "@/lib/dashboardTabs";

function isDashboardTab(value: string): value is DashboardTabId {
  return (DASHBOARD_TABS as string[]).includes(value);
}

export default async function CharacterTabPage({
  params,
}: {
  params: Promise<{ region: string; realmSlug: string; characterName: string; tab: string }>;
}) {
  const { region, realmSlug, characterName, tab } = await params;

  if (!isDashboardTab(tab)) {
    notFound();
  }

  // Only the fixed, hand-maintained character list is servable — an
  // unrecognized region/realm/name in the URL 404s rather than silently
  // fetching an arbitrary Blizzard character.
  const characterRef = findKnownCharacter(region, realmSlug, characterName);
  if (!characterRef) {
    notFound();
  }

  return <DashboardShell characterRef={characterRef} activeTab={tab} />;
}
