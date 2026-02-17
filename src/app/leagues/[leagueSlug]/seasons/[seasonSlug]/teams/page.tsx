import { notFound } from "next/navigation";

import DataTable from "@/app/DataTable";
import PageBreadcrumbs from "@/app/PageBreadcrumbs";
import prisma from "@/service/prisma";

type Props = {
  params: Promise<{ leagueSlug: string; seasonSlug: string }>;
};

export default async function TeamsPage({ params }: Props) {
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

  const teams = await prisma.team.findMany({
    where: { seasonId: season.id },
    select: {
      id: true,
      name: true,
      manager: { select: { user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { players: true } },
    },
    orderBy: { name: "asc" },
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "manager", label: "Manager" },
    { key: "players", label: "Players" },
  ];

  const rows = teams.map((team) => ({
    key: team.id,
    name: team.name,
    manager:
      [team.manager?.user.firstName, team.manager?.user.lastName].filter(Boolean).join(" ") || "-",
    players: team._count.players,
  }));

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Teams" },
        ]}
      />
      <DataTable label="Teams" columns={columns} rows={rows} emptyMessage="No teams yet" />
    </>
  );
}
