"use client";

import { Button } from "@heroui/react";
import NextLink from "next/link";

import PageBreadcrumbs from "../PageBreadcrumbs";

type Props = {
  isAdmin: boolean;
};

export default function LeaguesHeader({ isAdmin }: Props) {
  return (
    <div className="flex items-center justify-between">
      <PageBreadcrumbs items={[{ label: "Leagues" }]} />
      {isAdmin && (
        <Button as={NextLink} href="/admin/leagues/new" color="primary">
          New League
        </Button>
      )}
    </div>
  );
}
