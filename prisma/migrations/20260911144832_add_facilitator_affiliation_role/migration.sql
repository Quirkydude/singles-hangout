-- Replace the single `isMember` boolean with a richer set of answers:
--   isFacilitator : whether they are facilitating the event
--   affiliation   : Habitat Assembly | Other COP Assembly | Non-COP
--   role          : Organizer | Protocol Member | Participant
--
-- NOTE: this migration intentionally does NOT drop any rows. Existing
-- registrations are preserved and their old `isMember` answer is carried
-- over into `affiliation`.

-- AlterTable: add the new columns. `isFacilitator` needs a default so the
-- column can be added as NOT NULL to a table that already has rows.
ALTER TABLE "Registration"
  ADD COLUMN "isFacilitator" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "affiliation" TEXT,
  ADD COLUMN "role" TEXT;

-- DataMigration: the old question was "Are you a youth at Habitat Assembly?"
-- A "yes" maps unambiguously onto the new Habitat Assembly affiliation.
-- A "no" only told us they were not Habitat; it did not tell us whether they
-- attend another COP assembly or none at all, so those rows are left NULL
-- ("Not specified") rather than guessed at.
UPDATE "Registration"
  SET "affiliation" = 'Habitat Assembly'
  WHERE "isMember" = true;

-- DropColumn: the old field is now fully superseded by `affiliation`.
ALTER TABLE "Registration" DROP COLUMN "isMember";