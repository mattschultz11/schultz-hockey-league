import { notFound } from "next/navigation";

import GamesTable from "@/components/GamesTable";
import { findNextUpcomingId } from "@/components/gameStatus";
import PageLayout from "@/components/PageLayout";
import TeamGamesHeader from "@/components/TeamGamesHeader";
import prisma from "@/service/prisma";

const TEAM_GAMES_CEILING = 100;

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; teamSlug: string }>;
};

export default async function TeamGamesPage({ params }: Props) {
  const { leagueSlug, seasonSlug, teamSlug } = await params;

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!league) {
    notFound();
  }

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, name: true, slug: true },
  });

  if (!season) {
    notFound();
  }

  const team = await prisma.team.findUnique({
    where: { seasonId_slug: { seasonId: season.id, slug: teamSlug } },
    select: { id: true, name: true, slug: true },
  });

  if (!team) {
    notFound();
  }

  const games = await prisma.game.findMany({
    where: {
      seasonId: season.id,
      OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
    },
    select: {
      id: true,
      round: true,
      datetime: true,
      location: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      homeTeamResult: true,
      awayTeamResult: true,
    },
    orderBy: { datetime: "asc" },
    take: TEAM_GAMES_CEILING,
  });

  const nextUpId = findNextUpcomingId(games);

  return (
    <PageLayout>
      <TeamGamesHeader league={league} season={season} team={team} />
      <GamesTable league={league} season={season} games={games} nextUpId={nextUpId} />
    </PageLayout>
  );
}
