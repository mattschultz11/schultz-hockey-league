"use client";

import { ApolloProvider } from "@apollo/client/react";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { getApolloClient } from "@/lib/apolloClient";

import { NavProvider } from "./NavContext";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const client = getApolloClient();
  const router = useRouter();

  return (
    <SessionProvider session={session}>
      <ApolloProvider client={client}>
        <HeroUIProvider navigate={router.push}>
          <NavProvider>{children}</NavProvider>
        </HeroUIProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
