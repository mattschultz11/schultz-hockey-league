"use client";

import { Button } from "@heroui/react";
import NextLink from "next/link";

import PageBreadcrumbs from "@/components/PageBreadcrumbs";

import PageHeader from "./PageHeader";

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
    <PageHeader>
      <PageBreadcrumbs items={[{ label: "Leagues", href: "/leagues" }, { label: league.name }]} />
      {isAdmin && (
        <Button
          as={NextLink}
          href={`/admin/leagues/${league.slug}/seasons/new`}
          color="primary"
          size="sm"
        >
          New Season
        </Button>
      )}
    </PageHeader>
  );
}
