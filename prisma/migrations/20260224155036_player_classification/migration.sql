-- CreateEnum
CREATE TYPE "Classification" AS ENUM ('ROSTER', 'SUBSTITUTE', 'INJURED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "classification" "Classification" NOT NULL DEFAULT 'ROSTER';

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "classification" "Classification" NOT NULL DEFAULT 'ROSTER';
