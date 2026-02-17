"use client";

import { Button } from "@heroui/react";
import NextLink from "next/link";

import PageBreadcrumbs from "@/app/PageBreadcrumbs";

type SeasonsHeaderProps = {
  league: {
    name: string;
    id: string;
    slug: string;
  };
  isAdmin: boolean;
};

export default function SeasonsHeader({ league, isAdmin }: SeasonsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <PageBreadcrumbs items={[{ label: "Leagues", href: "/leagues" }, { label: league.name }]} />
      {isAdmin && (
        <Button as={NextLink} href={`/admin/seasons/new?leagueId=${league.id}`} color="primary">
          New Season
        </Button>
      )}
    </div>
  );
}
