"use client";

import { Button, Link } from "@heroui/react";
import { Predicate } from "effect";

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
  draftPicks: {
    id: string;
    playerId: string | null;
  }[];
  isAdmin?: boolean;
};

export default function DraftHeader({ season, league, draftPicks, isAdmin }: Props) {
  const basePath = `/leagues/${league.slug}/seasons/${season.slug}`;
  const hasDraft = draftPicks.length > 0;
  const hasRemainingPicks = draftPicks.some((draftPick) =>
    Predicate.isNullable(draftPick.playerId),
  );

  return (
    <PageHeader>
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name, href: basePath },
          { label: "Draft" },
        ]}
      />
      {hasRemainingPicks && (
        <Button
          as={Link}
          href={`${basePath}/draft/live`}
          color="primary"
          size="sm"
          className="align-end"
        >
          Live Draft
        </Button>
      )}
      {isAdmin && !hasDraft && (
        <Button
          as={Link}
          href={`/admin${basePath}/draft/new`}
          color="primary"
          size="sm"
          className="align-end"
        >
          Create Draft
        </Button>
      )}
    </PageHeader>
  );
}
