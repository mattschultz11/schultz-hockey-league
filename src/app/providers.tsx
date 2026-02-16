"use client";

import { ApolloProvider } from "@apollo/client/react";
import { HeroUIProvider } from "@heroui/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { getApolloClient } from "@/lib/apolloClient";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const client = getApolloClient();

  return (
    <SessionProvider session={session}>
      <ApolloProvider client={client}>
        <HeroUIProvider>{children}</HeroUIProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
