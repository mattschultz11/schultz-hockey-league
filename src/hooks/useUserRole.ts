"use client";

import { useSession } from "next-auth/react";

import type { Role } from "@/service/prisma";

export type UserRoleInfo = {
  role: Role | undefined;
  isAdmin: boolean;
  isManager: boolean;
  isPlayer: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
};

/**
 * Client-side hook to access the current user's role and role-based flags.
 * Use this to conditionally render UI elements based on user permissions.
 *
 * @example
 * ```tsx
 * function DraftBoard() {
 *   const { isAdmin, isManager } = useUserRole();
 *
 *   return (
 *     <div>
 *       {(isAdmin || isManager) && <DraftPickButton />}
 *       {isAdmin && <OverrideButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUserRole(): UserRoleInfo {
  const { data: session, status } = useSession();

  const role = session?.user?.role as Role | undefined;

  return {
    role,
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isPlayer: role === "PLAYER",
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
