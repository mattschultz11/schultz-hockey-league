import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

import type { PenaltyCategory, PenaltyType } from "@/graphql/generated";
import { formatEnum, playerName } from "@/utils/stringUtils";

import TeamName from "./TeamName";

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
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function periodLabel(period: number) {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "3rd";
  return "OT";
}

function playerLabel(player: PenaltyPlayer) {
  const num = player.number != null ? `#${player.number} ` : "";
  return `${num}${playerName(player)}`;
}

export default function GamePenaltiesList({ penalties, homeTeam, awayTeam }: Props) {
  const periods = [...new Set(penalties.map((p) => p.period))].sort((a, b) => a - b);
  const teamsById = new Map<string, GameTeam>();
  if (homeTeam) teamsById.set(homeTeam.id, homeTeam);
  if (awayTeam) teamsById.set(awayTeam.id, awayTeam);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Penalties</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {periods.map((period) => (
          <div key={period} className="flex flex-col gap-2">
            <h3 className="text-default-600 text-xs font-medium tracking-wide uppercase">
              {periodLabel(period)} Period
            </h3>
            <ul className="flex flex-col gap-2">
              {penalties
                .filter((p) => p.period === period)
                .map((penalty) => {
                  const team = teamsById.get(penalty.teamId);
                  return (
                    <li
                      key={penalty.id}
                      className="bg-default-100 flex items-start gap-3 rounded-lg p-3"
                    >
                      <span className="text-default-600 w-10 shrink-0 font-mono text-sm">
                        {formatTime(penalty.time)}
                      </span>
                      <div className="flex w-20 shrink-0">
                        {team && <TeamName team={team} className="text-sm" />}
                      </div>
                      <div className="flex flex-grow flex-col">
                        <span className="text-foreground font-semibold">
                          {playerLabel(penalty.player)}
                        </span>
                        <span className="text-default-600 text-sm">
                          {formatEnum(penalty.type)} · {penalty.minutes} min
                        </span>
                      </div>
                      {penalty.category !== "MINOR" && (
                        <Chip size="sm" variant="flat" color="danger">
                          {formatEnum(penalty.category)}
                        </Chip>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
