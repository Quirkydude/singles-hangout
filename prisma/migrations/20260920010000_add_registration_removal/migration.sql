-- Adds soft removal. A removed registration is kept in the table (so the
-- unique phone number stays taken and they cannot register again) but is
-- excluded from the capacity count and treated as invalid everywhere.
--
-- Purely additive: no existing row or column is touched.

ALTER TABLE "Registration"
  ADD COLUMN "removed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "removedAt" TIMESTAMP(3),
  ADD COLUMN "removedReason" TEXT;

CREATE INDEX "Registration_removed_idx" ON "Registration"("removed");
