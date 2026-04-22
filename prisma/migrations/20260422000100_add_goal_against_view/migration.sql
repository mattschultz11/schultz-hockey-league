-- GoalAgainst view: one row per goal, with teamId remapped to the team that was
-- scored against (the opposing team in that game). Excludes goals where the
-- game has no opposing team set.

CREATE VIEW "GoalAgainst" AS
SELECT
  go.id,
  go."createdAt",
  go."updatedAt",
  go."gameId",
  go.period,
  go.time,
  go.strength,
  CASE
    WHEN gg."homeTeamId" = go."teamId" THEN gg."awayTeamId"
    ELSE gg."homeTeamId"
  END AS "teamId",
  go."scorerId",
  go."primaryAssistId",
  go."secondaryAssistId"
FROM "Goal" go
INNER JOIN "Game" gg ON gg.id = go."gameId"
WHERE
  CASE
    WHEN gg."homeTeamId" = go."teamId" THEN gg."awayTeamId"
    ELSE gg."homeTeamId"
  END IS NOT NULL;
