// Maps a Blizzard item/mount quality type (POOR, COMMON, UNCOMMON, RARE,
// EPIC, LEGENDARY, ARTIFACT, HEIRLOOM) to one of the existing --quality-*
// CSS custom properties, as a ready-to-use `var(...)` string.
export function qualityColorVar(qualityType: string | undefined): string {
  switch (qualityType) {
    case "UNCOMMON":
      return "var(--quality-uncommon)";
    case "RARE":
    case "HEIRLOOM":
      return "var(--quality-rare)";
    case "EPIC":
      return "var(--quality-epic)";
    case "LEGENDARY":
    case "ARTIFACT":
      return "var(--quality-legendary)";
    default:
      return "var(--quality-common)";
  }
}
