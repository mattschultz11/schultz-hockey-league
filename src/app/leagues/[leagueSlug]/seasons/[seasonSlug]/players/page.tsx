import { notFound } from "next/navigation";

import DataTable from "@/app/DataTable";
import PageBreadcrumbs from "@/app/PageBreadcrumbs";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function PlayersPage({ params }: Props) {
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

  const players = await prisma.player.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      number: true,
      position: true,
      user: { select: { firstName: true, lastName: true } },
      team: { select: { name: true } },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "team", label: "Team" },
    { key: "position", label: "Position" },
    { key: "number", label: "#" },
  ];

  const rows = players.map((player) => ({
    key: player.id,
    name: [player.user.firstName, player.user.lastName].filter(Boolean).join(" ") || "-",
    team: player.team?.name ?? "-",
    position: player.position ?? "-",
    number: player.number ?? "-",
  }));

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Players" },
        ]}
      />
      <DataTable label="Players" columns={columns} rows={rows} emptyMessage="No players yet" />
    </>
  );
}
