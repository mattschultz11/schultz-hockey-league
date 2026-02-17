import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

import LeaguesHeader from "./LeaguesHeader";
import LeaguesList from "./LeaguesList";

export default async function LeaguesPage() {
  const [leagues, session] = await Promise.all([
    prisma.league.findMany({
      select: { id: true, slug: true, name: true, description: true, skillLevel: true },
      orderBy: { name: "asc" },
    }),
    auth(),
  ]);

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <>
      <LeaguesHeader isAdmin={isAdmin} />
      <LeaguesList leagues={leagues} />
    </>
  );
}
