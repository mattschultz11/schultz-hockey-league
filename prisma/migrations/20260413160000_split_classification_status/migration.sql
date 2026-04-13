-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED');

-- AlterTable: add status column (default ACTIVE) to Player
ALTER TABLE "Player" ADD COLUMN "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- Backfill status from existing classification values
UPDATE "Player" SET "status" = 'INJURED' WHERE "classification" = 'INJURED';
UPDATE "Player" SET "status" = 'SUSPENDED' WHERE "classification" = 'SUSPENDED';

-- Collapse removed classification values to ROSTER before narrowing the enum
UPDATE "Player" SET "classification" = 'ROSTER' WHERE "classification" IN ('INJURED', 'SUSPENDED');
UPDATE "Registration" SET "classification" = 'ROSTER' WHERE "classification" IN ('INJURED', 'SUSPENDED');

-- Rebuild Classification enum without INJURED/SUSPENDED
ALTER TYPE "Classification" RENAME TO "Classification_old";
CREATE TYPE "Classification" AS ENUM ('ROSTER', 'SUBSTITUTE');
ALTER TABLE "Player"
  ALTER COLUMN "classification" DROP DEFAULT,
  ALTER COLUMN "classification" TYPE "Classification" USING ("classification"::text::"Classification"),
  ALTER COLUMN "classification" SET DEFAULT 'ROSTER';
ALTER TABLE "Registration"
  ALTER COLUMN "classification" DROP DEFAULT,
  ALTER COLUMN "classification" TYPE "Classification" USING ("classification"::text::"Classification"),
  ALTER COLUMN "classification" SET DEFAULT 'ROSTER';
DROP TYPE "Classification_old";
