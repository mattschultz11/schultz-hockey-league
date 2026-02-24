import { redirect } from "next/navigation";

import CreateLeagueForm from "@/components/CreateLeagueForm";
import { auth } from "@/service/auth/authService";

export default async function AdminCreateLeaguePage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-semibold text-white">New League</h1>
      <CreateLeagueForm />
    </div>
  );
}
