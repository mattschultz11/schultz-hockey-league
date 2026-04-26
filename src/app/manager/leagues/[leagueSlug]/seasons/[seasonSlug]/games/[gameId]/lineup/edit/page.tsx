import { notFound } from "next/navigation";

import EditLineupForm from "@/components/EditLineupForm";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string; gameId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditLineupPage({ params, searchParams }: Props) {
  const [session, { leagueSlug, seasonSlug, gameId }, sp] = await Promise.all([
    auth(),
    params,
    searchParams,
  ]);

  const teamIdRaw = sp.teamId;
  const teamId = typeof teamIdRaw === "string" ? teamIdRaw : null;
  if (!teamId) {
    notFound();
  }

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
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });
  if (!game) notFound();

  const team = await prisma.team.findFirst({
    where: { id: teamId, seasonId: season.id },
    select: {
      id: true,
      name: true,
      manager: { select: { userId: true } },
    },
  });
  if (!team) notFound();

  if (game.homeTeamId !== team.id && game.awayTeamId !== team.id) {
    notFound();
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const isTeamManager = !!session?.user?.id && team.manager?.userId === session.user.id;
  if (!isAdmin && !isTeamManager) {
    notFound();
  }

  const opposingTeamId = game.homeTeamId === team.id ? game.awayTeamId : game.homeTeamId;

  const seasonPlayers = await prisma.player.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      number: true,
      position: true,
      classification: true,
      teamId: true,
      playerRating: true,
      goalieRating: true,
      team: { select: { name: true, abbreviation: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ number: "asc" }, { user: { lastName: "asc" } }],
  });

  const eligiblePlayers = seasonPlayers.filter((p) => p.teamId !== opposingTeamId);
  const rosterPlayers = eligiblePlayers.filter(
    (p) => p.teamId === team.id && p.classification === "ROSTER",
  );
  const availablePlayers = eligiblePlayers.filter(
    (p) => !(p.teamId === team.id && p.classification === "ROSTER"),
  );

  const currentLineup = await prisma.lineup.findMany({
    where: { gameId: game.id, teamId: team.id },
    select: { playerId: true, number: true },
  });
  const initialEntries = currentLineup.map((l) => ({
    playerId: l.playerId,
    number: l.number,
  }));

  const returnHref = `/leagues/${league.slug}/seasons/${season.slug}/games/${game.id}`;
  const opponent = game.homeTeamId === team.id ? game.awayTeam : game.homeTeam;

  return (
    <PageLayout>
      <PageHeader>
        <PageBreadcrumbs
          items={[
            { label: league.name, href: `/leagues/${league.slug}/seasons` },
            { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
            { label: "Games", href: `/leagues/${league.slug}/seasons/${season.slug}/games` },
            { label: `Round ${game.round}`, href: returnHref },
            { label: "Edit Lineup" },
          ]}
        />
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Edit Lineup</h1>
        <p className="text-default-600 mb-6 text-sm">
          {team.name} vs. {opponent?.name ?? "TBD"}
        </p>
        <EditLineupForm
          gameId={game.id}
          teamId={team.id}
          rosterPlayers={rosterPlayers}
          availablePlayers={availablePlayers}
          initialEntries={initialEntries}
          returnHref={returnHref}
        />
      </div>
    </PageLayout>
  );
}
