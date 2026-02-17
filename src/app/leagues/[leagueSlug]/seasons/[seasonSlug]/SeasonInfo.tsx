"use client";

import { Card, CardBody } from "@heroui/react";

export default function SeasonInfo() {
  return (
    <Card isBlurred className="dark:bg-secondary/10 mb-8 border-none" shadow="sm">
      <CardBody className="p-5">
        <div className="text-default-600 space-y-4">
          <p>
            B/C level spring league. Season runs{" "}
            <strong className="text-default-800">early April to mid-June</strong>. Registration
            closes <strong className="text-default-800">end of March</strong>.
          </p>

          <p>
            The season kicks off with a <strong className="text-default-800">Rate Skate</strong> —
            an evaluation game where captains assess players before the draft. Following the Rate
            Skate, four team captains will draft their rosters for the season.
          </p>

          <div className="flex flex-row flex-wrap justify-between gap-4">
            <div className="min-w-3xs">
              <h3 className="text-default-800 mb-1 font-semibold">Season Format</h3>
              <ul className="list-inside list-disc space-y-0.5">
                <li>1 preseason Rate Skate game</li>
                <li>4 draft-picked teams</li>
                <li>6 regular season games</li>
                <li>2 rounds of playoffs</li>
              </ul>
            </div>

            <div className="min-w-3xs">
              <h3 className="text-default-800 mb-1 font-semibold">Game Details</h3>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Sundays at Arctic Edge, Canton</li>
                <li>~4:00 PM and ~5:15 PM start times</li>
                <li>Three 20-min periods (running clock)</li>
                <li>Officiated by referees</li>
              </ul>
            </div>

            <div className="min-w-3xs">
              <h3 className="text-default-800 mb-1 font-semibold">What&apos;s Included</h3>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Team jerseys for the season</li>
                <li>9 games of ice time</li>
                <li>Post game grill-out</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-default-800 mb-1 font-semibold">Roster Spots</h3>
            <p>
              There are <strong className="text-default-800">44 player spots</strong> and{" "}
              <strong className="text-default-800">4 goalie spots</strong> available. Registering
              does not guarantee a spot in the league — roster selections are made based on
              registration order and skill level balance.
            </p>
          </div>

          <div>
            <h3 className="text-default-800 mb-1 font-semibold">Cost</h3>
            <p>
              Players: ~$180{" "}
              <span className="text-default-600">
                (subject to change pending ice rental confirmation)
              </span>
              <br />
              Goalies: Free to play
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
