import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import clsx from "clsx";
import Link from "next/link";

import type { PenaltyCategory, PenaltyType } from "@/graphql/generated";
import { formatEnum, playerName } from "@/utils/stringUtils";

type GameTeam = {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type PenaltyPlayer = {
  id: string;
  number: number | null;
  user: { firstName: string | null; lastName: string | null };
};

type Penalty = {
  id: string;
  period: number;
  time: number;
  teamId: string;
  category: PenaltyCategory;
  type: PenaltyType;
  minutes: number;
  player: PenaltyPlayer;
};

type Props = {
  penalties: Penalty[];
  homeTeam: GameTeam | null;
  awayTeam: GameTeam | null;
  homeAddPenaltyHref?: string;
  awayAddPenaltyHref?: string;
  penaltyEditHrefBase?: string;
  editableTeamIds?: string[];
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function periodLabel(period: number) {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "3rd";
  if (period === 4) return "OT";
  return "SO";
}

function AddPenaltyButton({ href }: { href: string }) {
  return (
    <Button
      as={Link}
      href={href}
      size="sm"
      variant="solid"
      color="warning"
      className="h-6 min-w-0 px-2"
    >
      + Penalty
    </Button>
  );
}

function HeaderRow({
  homeAddPenaltyHref,
  awayAddPenaltyHref,
}: {
  homeAddPenaltyHref?: string;
  awayAddPenaltyHref?: string;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex flex-1 justify-start">
        {homeAddPenaltyHref && <AddPenaltyButton href={homeAddPenaltyHref} />}
      </div>
      <h2 className="text-lg font-semibold">Penalties</h2>
      <div className="flex flex-1 justify-end">
        {awayAddPenaltyHref && <AddPenaltyButton href={awayAddPenaltyHref} />}
      </div>
    </div>
  );
}

export default function GamePenaltiesList({
  penalties,
  homeTeam,
  awayTeam,
  homeAddPenaltyHref,
  awayAddPenaltyHref,
  penaltyEditHrefBase,
  editableTeamIds,
}: Props) {
  const editableSet = new Set(editableTeamIds);
  const editHrefFor = (penalty: Penalty) =>
    penaltyEditHrefBase && editableSet.has(penalty.teamId)
      ? `${penaltyEditHrefBase}/${penalty.id}/edit`
      : null;
  const periods = [...new Set(penalties.map((p) => p.period))].sort((a, b) => a - b);
  const homeTeamPenalties = penalties.filter((p) => p.teamId === homeTeam?.id);
  const awayTeamPenalties = penalties.filter((p) => p.teamId === awayTeam?.id);
  const homeTeamPenMins = homeTeamPenalties.reduce((total, p) => total + p.minutes, 0);
  const awayTeamPenMins = awayTeamPenalties.reduce((total, p) => total + p.minutes, 0);

  if (penalties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <HeaderRow
            homeAddPenaltyHref={homeAddPenaltyHref}
            awayAddPenaltyHref={awayAddPenaltyHref}
          />
        </CardHeader>
        <CardBody>
          <p className="text-default-500 text-center text-sm">No penalties</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <HeaderRow
          homeAddPenaltyHref={homeAddPenaltyHref}
          awayAddPenaltyHref={awayAddPenaltyHref}
        />
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {periods.map((period) => {
          const periodPenalties = penalties
            .filter((p) => p.period === period)
            .sort((a, b) => b.time - a.time);
          const periodHomePenalties = periodPenalties.filter((p) => p.teamId === homeTeam?.id);
          const periodAwayPenalties = periodPenalties.filter((p) => p.teamId === awayTeam?.id);

          return (
            <div key={period} className="flex flex-col gap-2">
              <div className="flex justify-center gap-8">
                <div className="font-mono">{periodHomePenalties.length}</div>
                <h3 className="text-default-600 w-25 text-center text-base font-medium tracking-wide uppercase">
                  {periodLabel(period)} Period
                </h3>
                <div className="font-mono">{periodAwayPenalties.length}</div>
              </div>
              <ul className="flex flex-col gap-2">
                {periodPenalties.map((penalty) => {
                  const editHref = editHrefFor(penalty);
                  const rowClass = clsx("bg-default-100 flex items-center gap-4 rounded-lg p-3", {
                    "flex-row-reverse": penalty.teamId === awayTeam?.id,
                    "hover:bg-default-200 cursor-pointer transition-colors": !!editHref,
                  });
                  const content = (
                    <>
                      <span className="text-default-600 w-10 shrink-0 font-mono text-sm whitespace-nowrap">
                        {formatTime(penalty.time)}
                      </span>
                      <span className="flex flex-col">
                        <span className="flex gap-2">
                          {penalty.player.number != null && (
                            <span className="text-default-600">#{penalty.player.number}</span>
                          )}
                          <span className="font-semibold">{playerName(penalty.player)}</span>
                        </span>
                        <span className="text-default-500 text-sm">
                          {formatEnum(penalty.type)} · {penalty.minutes} min
                        </span>
                      </span>
                      {penalty.category !== "MINOR" && (
                        <Chip size="sm" variant="flat" color="danger">
                          {formatEnum(penalty.category)}
                        </Chip>
                      )}
                    </>
                  );
                  return (
                    <li key={penalty.id}>
                      {editHref ? (
                        <Link href={editHref} className={rowClass}>
                          {content}
                        </Link>
                      ) : (
                        <div className={rowClass}>{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <div className="flex justify-center gap-8">
          <div className="font-mono">
            ({homeTeamPenMins} MIN) {homeTeamPenalties.length}
          </div>
          <h3 className="text-default-600 w-25 text-center text-base font-medium tracking-wide uppercase">
            Final
          </h3>
          <div className="font-mono">
            {awayTeamPenalties.length} ({awayTeamPenMins} MIN)
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
