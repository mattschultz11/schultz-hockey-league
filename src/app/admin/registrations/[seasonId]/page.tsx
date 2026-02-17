import { redirect } from "next/navigation";

import { auth } from "@/service/auth/authService";
import prisma from "@/service/prisma";

import RegistrationsTable from "./RegistrationsTable";

type Props = {
  params: Promise<{ seasonId: string }>;
};

export default async function AdminRegistrationsPage({ params }: Props) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { seasonId } = await params;

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      name: true,
      registrations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!season) {
    redirect("/");
  }

  return (
    <div className="py-8">
      <h1 className="mb-2 text-3xl font-semibold text-white">Registrations</h1>
      <p className="text-default-600 mb-8 text-lg">{season.name}</p>
      <RegistrationsTable registrations={season.registrations} />
    </div>
  );
}
