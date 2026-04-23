"use client";

import { Button, Link } from "@heroui/react";

import PageBreadcrumbs from "./PageBreadcrumbs";
import PageHeader from "./PageHeader";

type Props = {
  season: {
    id: string;
    slug: string;
    name: string;
  };
  league: {
    id: string;
    slug: string;
    name: string;
  };
  isAdmin?: boolean;
};

export default function GamesHeader({ season, league, isAdmin }: Props) {
  const newGameHref = `/admin/leagues/${league.slug}/seasons/${season.slug}/games/new`;

  return (
    <PageHeader>
      <PageBreadcrumbs
        items={[
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Games" },
        ]}
      />
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button as={Link} href={newGameHref} color="primary">
            New Game
          </Button>
        </div>
      )}
    </PageHeader>
  );
}
