import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

import type { Strength } from "@/graphql/generated";
import { formatEnum, playerName } from "@/utils/stringUtils";

import TeamName from "./TeamName";

type GameTeam = {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type GoalPlayer = {
  id: string;
  number: number | null;
  user: { firstName: string | null; lastName: string | null };
};

type Goal = {
  id: string;
  period: number;
  time: number;
  strength: Strength;
  teamId: string;
  scorer: GoalPlayer;
  primaryAssist: GoalPlayer | null;
  secondaryAssist: GoalPlayer | null;
};

type Props = {
  goals: Goal[];
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

function playerLabel(player: GoalPlayer) {
  const num = player.number != null ? `#${player.number} ` : "";
  return `${num}${playerName(player)}`;
}

function assistLabels(goal: Goal) {
  return [goal.primaryAssist, goal.secondaryAssist]
    .filter((a): a is GoalPlayer => a != null)
    .map((a) => playerLabel(a));
}

export default function GameGoalsList({ goals, homeTeam, awayTeam }: Props) {
  const periods = [...new Set(goals.map((g) => g.period))].sort((a, b) => a - b);
  const teamsById = new Map<string, GameTeam>();
  if (homeTeam) teamsById.set(homeTeam.id, homeTeam);
  if (awayTeam) teamsById.set(awayTeam.id, awayTeam);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Goals</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {periods.map((period) => (
          <div key={period} className="flex flex-col gap-2">
            <h3 className="text-default-600 text-xs font-medium tracking-wide uppercase">
              {periodLabel(period)} Period
            </h3>
            <ul className="flex flex-col gap-2">
              {goals
                .filter((g) => g.period === period)
                .map((goal) => {
                  const team = teamsById.get(goal.teamId);
                  const assists = assistLabels(goal);
                  return (
                    <li
                      key={goal.id}
                      className="bg-default-100 flex items-start gap-3 rounded-lg p-3"
                    >
                      <span className="text-default-600 w-10 shrink-0 font-mono text-sm">
                        {formatTime(goal.time)}
                      </span>
                      <div className="flex w-20 shrink-0">
                        {team && <TeamName team={team} className="text-sm" />}
                      </div>
                      <div className="flex flex-grow flex-col">
                        <span className="text-foreground font-semibold">
                          {playerLabel(goal.scorer)}
                        </span>
                        {assists.length > 0 && (
                          <span className="text-default-600 text-sm">
                            Assists: {assists.join(", ")}
                          </span>
                        )}
                      </div>
                      {goal.strength !== "EVEN" && (
                        <Chip size="sm" variant="flat" color="warning">
                          {formatEnum(goal.strength)}
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
