"use client";

import { Button, Link } from "@heroui/react";

import PageBreadcrumbs from "./PageBreadcrumbs";

type Props = {
  season: {
    info: string | null;
    id: string;
    slug: string;
    name: string;
    startDate: Date;
    endDate: Date;
    sundays: boolean;
    mondays: boolean;
    tuesdays: boolean;
    wednesdays: boolean;
    thursdays: boolean;
    fridays: boolean;
    saturdays: boolean;
  };
  league: {
    id: string;
    slug: string;
    name: string;
  };
  isAdmin?: boolean;
};

export default function RegistrationHeader({ season, league, isAdmin }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <PageBreadcrumbs
        items={[
          { label: "Leagues", href: "/leagues" },
          { label: league.name, href: `/leagues/${league.slug}/seasons` },
          { label: season.name },
        ]}
      />
      {isAdmin && (
        <Button
          as={Link}
          href={`/admin/leagues/${league.slug}/seasons/${season.slug}/registrations`}
          color="primary"
          size="sm"
          className="align-end"
        >
          Registrations
        </Button>
      )}
    </div>
  );
}
