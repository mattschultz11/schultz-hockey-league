import { notFound } from "next/navigation";

import { auth } from "@/service/auth/authService";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    notFound();
  }
  return <>{children}</>;
}
