"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

import PageBreadcrumbs from "./PageBreadcrumbs";
import PageHeader from "./PageHeader";

type Props = {
  league: {
    slug: string;
    name: string;
  };
  season: {
    slug: string;
    name: string;
  };
  team: {
    slug: string;
    name: string;
  };
  isAdmin?: boolean;
};

export default function TeamHeader({ league, season, team, isAdmin }: Props) {
  return (
    <PageHeader>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Teams", href: `/leagues/${league.slug}/seasons/${season.slug}/teams` },
          { label: team.name },
        ]}
      />
      {isAdmin && (
        <Button
          as={Link}
          href={`/admin/leagues/${league.slug}/seasons/${season.slug}/teams/${team.slug}/edit`}
          color="primary"
          size="sm"
        >
          Edit Team
        </Button>
      )}
    </PageHeader>
  );
}
