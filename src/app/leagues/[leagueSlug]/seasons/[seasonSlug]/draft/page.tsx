import { notFound } from "next/navigation";

import DataTable from "@/app/DataTable";
import PageBreadcrumbs from "@/app/PageBreadcrumbs";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function DraftPage({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;

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

  const picks = await prisma.draftPick.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      overall: true,
      round: true,
      pick: true,
      team: { select: { name: true } },
      player: { select: { user: { select: { firstName: true, lastName: true } } } },
      playerRating: true,
      goalieRating: true,
    },
    orderBy: { overall: "asc" },
  });

  const columns = [
    { key: "overall", label: "#" },
    { key: "round", label: "Round" },
    { key: "pick", label: "Pick" },
    { key: "team", label: "Team" },
    { key: "player", label: "Player" },
    { key: "rating", label: "Rating" },
  ];

  const rows = picks.map((dp) => ({
    key: dp.id,
    overall: dp.overall,
    round: dp.round,
    pick: dp.pick,
    team: dp.team?.name ?? "-",
    player: [dp.player?.user.firstName, dp.player?.user.lastName].filter(Boolean).join(" ") || "-",
    rating: dp.playerRating ?? dp.goalieRating ?? "-",
  }));

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Draft" },
        ]}
      />
      <DataTable
        label="Draft picks"
        columns={columns}
        rows={rows}
        emptyMessage="No draft picks yet"
      />
    </>
  );
}
