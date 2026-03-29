"use client";

import { Link } from "@heroui/link";
import { Card, CardBody, CardHeader } from "@heroui/react";

type League = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  skillLevel: string | null;
};

type Props = {
  leagues: League[];
};

export default function LeaguesList({ leagues }: Props) {
  return (
    <>
      {leagues.length === 0 ? (
        <p className="text-slate-400">No leagues yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.slug}`}>
              <Card className="w-full">
                <CardHeader className="flex-col items-start">
                  <h2 className="text-lg font-semibold">{league.name}</h2>
                  {league.skillLevel && (
                    <p className="text-default-500 text-sm">{league.skillLevel}</p>
                  )}
                </CardHeader>
                {league.description && (
                  <CardBody className="pt-0">
                    <p className="text-default-500 text-sm">{league.description}</p>
                  </CardBody>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
