import LeaguesHeader from "@/components/LeaguesHeader";
import LeaguesList from "@/components/LeaguesList";
import PageLayout from "@/components/PageLayout";
import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

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
    <PageLayout>
      <LeaguesHeader isAdmin={isAdmin} />
      <LeaguesList leagues={leagues} />
    </PageLayout>
  );
}
