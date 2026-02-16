import { Option, pipe } from "effect";
import { GraphQLError } from "graphql";
import { createYoga, maskError } from "graphql-yoga";

import { schema } from "@/graphql/schema";
import { auth, getRequestId, getSessionUser } from "@/service/auth/authService";
import { ConflictError, NotFoundError, ServiceError, ValidationError } from "@/service/errors";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";
import { isProduction } from "@/utils/envUtils";

// Subclass checks must come before the base ServiceError catch-all
function handleMaskError(error: unknown, message: string) {
  if (error instanceof GraphQLError) {
    const original = error.originalError;
    if (original instanceof ValidationError) {
      return new GraphQLError(original.message, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    if (original instanceof NotFoundError) {
      return new GraphQLError(original.message, {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (original instanceof ConflictError) {
      return new GraphQLError(original.message, {
        extensions: { code: "CONFLICT" },
      });
    }
    if (original instanceof ServiceError) {
      return new GraphQLError(original.message, {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
    }
  }

  return maskError(error, message);
}

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
  graphiql: !isProduction(),
  maskedErrors: {
    maskError: handleMaskError,
  },
});

export const { handleRequest } = yoga;

export { handleRequest as GET, handleRequest as OPTIONS, handleRequest as POST };

export const runtime = "nodejs";
export const revalidate = 0;
