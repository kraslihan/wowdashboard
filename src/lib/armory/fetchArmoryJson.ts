import { ARMORY_BASE_URL, buildArmoryCharacterPath, type ArmoryCharacterRef } from "./armoryUrl";
import { ArmoryFetchError } from "./errors";

/**
 * Fetches one of the armory's own `*.json` sub-resources (e.g. collections/mounts.json,
 * reputation.json) directly — unlike the HTML profile pages, these already respond with
 * clean JSON, so no scraping/extraction is needed.
 */
export async function fetchArmoryJson<T>(ref: ArmoryCharacterRef, jsonPath: string): Promise<T> {
  const url = `${ARMORY_BASE_URL}/${buildArmoryCharacterPath(ref)}/${jsonPath}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 (compatible; WowDashboardBFF/1.0)",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new ArmoryFetchError(`Character not found: ${ref.realmSlug}/${ref.characterName}`, 404);
  }
  if (!response.ok) {
    throw new ArmoryFetchError(`Armory request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
