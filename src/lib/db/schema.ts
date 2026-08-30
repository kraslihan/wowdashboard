import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Farm List is a relationship between a character and a mount, not a
// property of the mount itself — the same mount can be on one character's
// Farm List and not another's. There is no local `mounts` table to foreign-
// key against: the mount catalog lives entirely in Blizzard's live API plus
// the bundled static reference database (src/lib/armory/mountsDatabase.json),
// neither of which this app owns or replicates in Postgres. Referential
// validity (does this mountId actually exist?) is enforced at the service
// layer against that live/reference data instead of a DB-level FK.
//
// Scoped by `characterKey` — a normalized "region:realmSlug:characterName"
// string (see farmListService.characterKeyFor) — rather than a fabricated
// account/user id, because the app has no auth or account model and no
// stable numeric character id anywhere in its data: CharacterRef
// (region/realmSlug/characterName) is the only identity concept that
// exists today. This keeps the same character (even across a realm with a
// same-named character elsewhere) from colliding, without inventing
// account-level identity the app doesn't actually have.
export const farmListEntries = pgTable(
  "farm_list_entries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    characterKey: text("character_key").notNull(),
    mountId: integer("mount_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Also serves lookups for "all Farm List entries for this character"
    // (leading column) and "is this exact mount on this character's list"
    // (both columns) — the two access patterns the service layer needs.
    uniqueIndex("farm_list_entries_character_mount_idx").on(table.characterKey, table.mountId),
  ],
);
