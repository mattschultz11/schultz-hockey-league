import { Option, pipe } from "effect";
import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql/schema";
import { auth, getRequestId, getSessionUser } from "@/service/auth/authService";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

const yoga = createYoga<Record<string, unknown>, ServerContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: async ({ request }) => {
    const session = await auth();
    const user = await pipe(session, Option.fromNullable, getSessionUser);

    return {
      prisma,
      requestId: getRequestId(request),
      user,
    };
  },
  fetchAPI: { Response, Request, Headers },
  graphiql: process.env.NODE_ENV !== "production",
});

export const { handleRequest } = yoga;

export { handleRequest as GET, handleRequest as OPTIONS, handleRequest as POST };

export const runtime = "nodejs";
export const revalidate = 0;
