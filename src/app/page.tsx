import { redirect } from "next/navigation";
import { characterDashboardPath, DEFAULT_CHARACTER } from "@/lib/character";

export default function Home() {
  redirect(characterDashboardPath(DEFAULT_CHARACTER, "pvp"));
}
