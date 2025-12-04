import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = performance.now();
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const build = {
    version: process.env.npm_package_version ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? "unknown",
    buildTime: process.env.BUILD_TIME ?? process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE ?? "unknown",
  };

  const logOutcome = (
    level: "info" | "error",
    payload: Record<string, string | number | boolean>,
  ) => {
    const message = JSON.stringify({ requestId, ...payload });

    console[level](`[health] ${message}`);
  };

  try {
    // Verify database connectivity.
    await prisma.$queryRaw`SELECT 1`;

    const durationMs = Math.round(performance.now() - started);
    logOutcome("info", { status: "ok", db: "ok", durationMs });

    return NextResponse.json(
      {
        status: "ok",
        db: "ok",
        requestId,
        responseTimeMs: durationMs,
        build,
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
        },
      },
    );
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    const message = error instanceof Error ? error.message : "Unknown error";
    logOutcome("error", { status: "error", db: "unhealthy", durationMs, message });

    return NextResponse.json(
      {
        status: "error",
        db: "unhealthy",
        requestId,
        responseTimeMs: durationMs,
        error: message,
        build,
      },
      {
        status: 503,
        headers: {
          "x-request-id": requestId,
        },
      },
    );
  }
}
