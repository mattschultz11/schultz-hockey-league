-- Standing view: per-team rank within season and goals against.
-- Rank orders (all DESC) by:
--   1. points
--   2. wins
--   3. goal differential (goalsFor - goalsAgainst)
--   4. goalsFor
-- Ties after all four share a rank. View is recomputed on every query.

CREATE VIEW "Standing" AS
WITH team_stats AS (
  SELECT
    t.id AS "teamId",
    t."seasonId",
    COALESCE((
      SELECT SUM(
        CASE
          WHEN g."homeTeamId" = t.id THEN g."homeTeamPoints"
          WHEN g."awayTeamId" = t.id THEN g."awayTeamPoints"
          ELSE 0
        END
      )::int
      FROM "Game" g
      WHERE g."homeTeamId" = t.id OR g."awayTeamId" = t.id
    ), 0) AS points,
    COALESCE((
      SELECT COUNT(*)::int
      FROM "Game" g
      WHERE (g."homeTeamId" = t.id AND g."homeTeamResult" = 'WIN')
         OR (g."awayTeamId" = t.id AND g."awayTeamResult" = 'WIN')
    ), 0) AS wins,
    COALESCE((
      SELECT COUNT(*)::int
      FROM "Goal" go
      WHERE go."teamId" = t.id
    ), 0) AS "goalsFor",
    COALESCE((
      SELECT COUNT(*)::int
      FROM "Goal" go
      INNER JOIN "Game" gg ON gg.id = go."gameId"
      WHERE go."teamId" <> t.id
        AND (gg."homeTeamId" = t.id OR gg."awayTeamId" = t.id)
    ), 0) AS "goalsAgainst"
  FROM "Team" t
)
SELECT
  "teamId",
  RANK() OVER (
    PARTITION BY "seasonId"
    ORDER BY
      points DESC,
      wins DESC,
      ("goalsFor" - "goalsAgainst") DESC,
      "goalsFor" DESC
  )::int AS rank
FROM team_stats;
