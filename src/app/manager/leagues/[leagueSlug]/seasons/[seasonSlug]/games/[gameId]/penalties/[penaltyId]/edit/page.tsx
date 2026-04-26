import { notFound } from "next/navigation";

import EditPenaltyForm from "@/components/EditPenaltyForm";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{
    leagueSlug: string;
    seasonSlug: string;
    gameId: string;
    penaltyId: string;
  }>;
};

export default async function EditPenaltyPage({ params }: Props) {
  const [session, { leagueSlug, seasonSlug, gameId, penaltyId }] = await Promise.all([
    auth(),
    params,
  ]);

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!league) notFound();

  const season = await prisma.season.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: seasonSlug } },
    select: { id: true, name: true, slug: true },
  });
  if (!season) notFound();

  const game = await prisma.game.findFirst({
    where: { id: gameId, seasonId: season.id },
    select: {
      id: true,
      round: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  if (!game) notFound();

  const penalty = await prisma.penalty.findFirst({
    where: { id: penaltyId, gameId: game.id },
    select: {
      id: true,
      period: true,
      time: true,
      teamId: true,
      playerId: true,
      category: true,
      type: true,
      minutes: true,
    },
  });
  if (!penalty) notFound();

  const team = await prisma.team.findUnique({
    where: { id: penalty.teamId },
    select: {
      id: true,
      name: true,
      manager: { select: { userId: true } },
    },
  });
  if (!team) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const isTeamManager = !!session?.user?.id && team.manager?.userId === session.user.id;
  if (!isAdmin && !isTeamManager) notFound();

  const lineup = await prisma.lineup.findMany({
    where: { gameId: game.id, teamId: team.id },
    select: {
      player: {
        select: {
          id: true,
          number: true,
          position: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { player: { number: "asc" } },
  });
  const lineupPlayers = lineup.map((l) => l.player);

  const returnHref = `/leagues/${league.slug}/seasons/${season.slug}/games/${game.id}`;

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Games", href: `/leagues/${league.slug}/seasons/${season.slug}/games` },
            {
              label: `${game.awayTeam?.name} @ ${game.homeTeam?.name} (${game.round})`,
              href: returnHref,
            },
            { label: "Edit Penalty" },
          ]}
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Edit Penalty</h1>
        <p className="text-default-600 mb-6 text-sm">{team.name}</p>
        <EditPenaltyForm
          gameId={game.id}
          teamId={team.id}
          lineupPlayers={lineupPlayers}
          penalty={penalty}
          returnHref={returnHref}
        />
      </div>
    </PageLayout>
  );
}
