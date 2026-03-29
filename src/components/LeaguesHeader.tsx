"use client";

import { Button } from "@heroui/react";
import NextLink from "next/link";

import PageBreadcrumbs from "./PageBreadcrumbs";
import PageHeader from "./PageHeader";

type Props = {
  isAdmin: boolean;
};

export default function LeaguesHeader({ isAdmin }: Props) {
  return (
    <PageHeader>
      <PageBreadcrumbs items={[{ label: "Leagues" }]} />
      {isAdmin && (
        <Button as={NextLink} href="/admin/leagues/new" color="primary" size="sm">
          New League
        </Button>
      )}
    </PageHeader>
  );
}
