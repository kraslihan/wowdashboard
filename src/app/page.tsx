import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DEFAULT_CHARACTER } from "@/lib/character";

export default function Home() {
  return <DashboardShell characterRef={DEFAULT_CHARACTER} />;
}
