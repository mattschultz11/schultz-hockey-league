import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import clsx from "clsx";

import type { Strength } from "@/graphql/generated";
import { playerName } from "@/utils/stringUtils";

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
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function periodLabel(period: number) {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "3rd";
  return "OT";
}

function abbreviateStrength(strength: Strength) {
  switch (strength) {
    case "EVEN":
      return "EVEN";
    case "POWERPLAY":
      return "PP";
    case "SHORTHANDED":
      return "SH";
    case "EMPTY_NET":
      return "EN";
  }
}

export default function GameGoalsList({ goals, homeTeam, awayTeam }: Props) {
  const periods = [...new Set(goals.map((g) => g.period))].sort((a, b) => a - b);
  const homeTeamGoals = goals.filter((goal) => goal.teamId === homeTeam?.id);
  const awayTeamGoals = goals.filter((goal) => goal.teamId === awayTeam?.id);

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="w-full text-center text-lg font-semibold">Goals</h2>
        </CardHeader>
        <CardBody>
          <p className="text-default-500 text-center text-sm">No goals</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="w-full text-center text-lg font-semibold">Goals</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {periods.map((period) => {
          const periodGoals = goals
            .filter((g) => g.period === period)
            .sort((a, b) => b.time - a.time);
          const periodHomeGoals = periodGoals.filter((goal) => goal.teamId === homeTeam?.id);
          const periodAwayGoals = periodGoals.filter((goal) => goal.teamId === awayTeam?.id);
          return (
            <div key={period} className="flex flex-col gap-2">
              <div className="flex justify-center gap-8">
                <div className="font-mono">{periodHomeGoals.length}</div>
                <h3 className="text-default-600 w-25 text-center text-base font-medium tracking-wide uppercase">
                  {periodLabel(period)} Period
                </h3>
                <div className="font-mono">{periodAwayGoals.length}</div>
              </div>
              <ul className="flex flex-col gap-2">
                {periodGoals.map((goal) => {
                  const assists = [goal.primaryAssist, goal.secondaryAssist].filter(
                    (a): a is GoalPlayer => a != null,
                  );
                  return (
                    <li
                      key={goal.id}
                      className={clsx("bg-default-100 flex items-center gap-4 rounded-lg p-3", {
                        "flex-row-reverse": goal.teamId === awayTeam?.id,
                      })}
                    >
                      <span className="text-default-600 w-10 shrink-0 font-mono text-sm whitespace-nowrap">
                        {formatTime(goal.time)}
                      </span>
                      <span className="flex flex-col">
                        <span className="flex gap-2">
                          {goal.scorer.number != null && (
                            <span className="text-default-600">#{goal.scorer.number}</span>
                          )}
                          <span className="font-semibold">{playerName(goal.scorer)}</span>
                        </span>
                        {assists.length > 0 && (
                          <span className="text-default-500 flex gap-4 text-sm">
                            {assists.map((player) => (
                              <span key={player.id} className="flex gap-2">
                                {player.number != null && <span>#{player.number}</span>}
                                <span className="font-semibold">{playerName(player)}</span>
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                      {goal.strength !== "EVEN" && (
                        <Chip size="sm" variant="flat" color="warning">
                          {abbreviateStrength(goal.strength)}
                        </Chip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <div className="flex justify-center gap-8">
          <div className="font-mono">{homeTeamGoals.length}</div>
          <h3 className="text-default-600 w-25 text-center text-base font-medium tracking-wide uppercase">
            Final
          </h3>
          <div className="font-mono">{awayTeamGoals.length}</div>
        </div>
      </CardBody>
    </Card>
  );
}
