import { notFound } from "next/navigation";

import GamesTable from "@/components/GamesTable";
import { FINALIZED_GAME_WHERE, findNextUpcomingId } from "@/components/gameStatus";
import PageLayout from "@/components/PageLayout";
import TeamHeader from "@/components/TeamHeader";
import TeamLogo from "@/components/TeamLogo";
import TeamName from "@/components/TeamName";
import TeamPlayersTable from "@/components/TeamPlayersTable";
import TeamStatsCard from "@/components/TeamStatsCard";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; teamSlug: string }>;
};

export default async function TeamGamesPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug, teamSlug }] = await Promise.all([auth(), params]);

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
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      standing: true,
      homeGames: {
        select: {
          id: true,
          round: true,
          datetime: true,
          location: true,
          homeTeam: true,
          awayTeam: true,
          homeTeamResult: true,
          homeTeamPoints: true,
          awayTeamResult: true,
          awayTeamPoints: true,
        },
      },
      awayGames: {
        select: {
          id: true,
          round: true,
          datetime: true,
          location: true,
          homeTeam: true,
          awayTeam: true,
          homeTeamResult: true,
          homeTeamPoints: true,
          awayTeamPoints: true,
          awayTeamResult: true,
        },
      },
      _count: { select: { goals: true, goalsAgainst: true } },
      penalties: { select: { minutes: true } },
      players: {
        select: {
          id: true,
          number: true,
          position: true,
          playerRating: true,
          goalieRating: true,
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          draftPick: { select: { round: true } },
          penalties: { where: FINALIZED_GAME_WHERE, select: { id: true, minutes: true } },
          _count: {
            select: {
              goals: { where: FINALIZED_GAME_WHERE },
              primaryAssists: { where: FINALIZED_GAME_WHERE },
              secondaryAssists: { where: FINALIZED_GAME_WHERE },
              lineups: { where: FINALIZED_GAME_WHERE },
            },
          },
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const games = team.homeGames.concat(team.awayGames);
  const nextUpId = findNextUpcomingId(games);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <PageLayout>
      <TeamHeader league={league} season={season} team={team} isAdmin={isAdmin} />
      <div className="flex flex-col items-center justify-center gap-2">
        <TeamLogo team={team} width={150} height={150} />
        <TeamName team={team} as="h1" className="text-4xl font-extrabold tracking-widest" />
      </div>
      <TeamStatsCard team={team} />

      <TeamPlayersTable players={team.players} league={league} season={season} />
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-white">Schedule</h2>
        <GamesTable
          league={league}
          season={season}
          games={games}
          nextUpIds={nextUpId ? [nextUpId] : []}
        />
      </section>
    </PageLayout>
  );
}
