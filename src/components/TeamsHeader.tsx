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

export default function TeamsHeader({ season, league, isAdmin }: Props) {
  return (
    <PageHeader>
      <PageBreadcrumbs
        items={[
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: `/leagues/${league.slug}/seasons/${season.slug}` },
          { label: "Teams" },
        ]}
      />
      {isAdmin && (
        <Button
          as={Link}
          href={`/admin/leagues/${league.slug}/seasons/${season.slug}/teams/new`}
          color="primary"
          size="sm"
          className="align-end"
        >
          Add Team
        </Button>
      )}
    </PageHeader>
  );
}
