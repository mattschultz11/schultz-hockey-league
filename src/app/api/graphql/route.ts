import { createYoga } from "graphql-yoga";
import { schema } from "@/graphql/schema";
import { prisma } from "@/lib/prisma";
import { Option, pipe } from "effect";

function resolveCurrentUser(request: Request) {
  return pipe(
    request.headers.get("x-user-id"),
    Option.fromNullable,
    Option.map((id) => prisma.user.findUnique({ where: { id } })),
    Option.getOrUndefined,
  );
}

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: async ({ request }) => ({
    prisma,
    currentUser: await resolveCurrentUser(request),
  }),
  fetchAPI: { Response, Request, Headers },
  graphiql: process.env.NODE_ENV !== "production",
});

export const { handleRequest } = yoga;

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };

export const runtime = "nodejs";
export const revalidate = 0;
