-- Combine Game.date + Game.time into a single Game.datetime column.
-- `date` stored midnight wall-clock of the game day; `time` stored HH:MM:SS on the 1970-01-01 anchor.
-- The combined wall-clock is just date::date + time::time.

ALTER TABLE "Game" ADD COLUMN "datetime" TIMESTAMP(3);

UPDATE "Game"
SET "datetime" = ("date"::date + "time"::time)::timestamp(3);

ALTER TABLE "Game" ALTER COLUMN "datetime" SET NOT NULL;

ALTER TABLE "Game" DROP COLUMN "date";
ALTER TABLE "Game" DROP COLUMN "time";
