import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DEFAULT_CHARACTER } from "@/lib/character";
import { DASHBOARD_TABS, type DashboardTabId } from "@/lib/dashboardTabs";

function isDashboardTab(value: string): value is DashboardTabId {
  return (DASHBOARD_TABS as string[]).includes(value);
}

export default async function TabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;

  if (!isDashboardTab(tab)) {
    notFound();
  }

  return <DashboardShell characterRef={DEFAULT_CHARACTER} activeTab={tab} />;
}
