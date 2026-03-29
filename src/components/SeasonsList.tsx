"use client";

import { Link } from "@heroui/link";
import { Card, CardBody, CardHeader } from "@heroui/react";

import { formatDate } from "@/utils/stringUtils";

type Season = {
  id: string;
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
};

type Props = {
  leagueId: string;
  leagueSlug: string;
  leagueName: string;
  seasons: Season[];
  isAdmin: boolean;
};

export default function SeasonsList({ leagueSlug, seasons }: Props) {
  return (
    <>
      {seasons.length === 0 ? (
        <p className="text-slate-400">No seasons yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link key={season.id} href={`/leagues/${leagueSlug}/seasons/${season.slug}`}>
              <Card className="w-full">
                <CardHeader className="flex-col items-start">
                  <h2 className="text-lg font-semibold">{season.name}</h2>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-default-500 text-sm">
                    {formatDate(season.startDate)} – {formatDate(season.endDate)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
