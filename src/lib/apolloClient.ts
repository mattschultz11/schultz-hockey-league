import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

let clientSingleton: ApolloClient | undefined;

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: "/api/graphql",
      credentials: "same-origin",
    }),
    cache: new InMemoryCache({
      typePolicies: {
        User: { keyFields: ["id"] },
        League: { keyFields: ["id"] },
        Season: { keyFields: ["id"] },
        Team: { keyFields: ["id"] },
        Player: { keyFields: ["id"] },
        Game: { keyFields: ["id"] },
        Goal: { keyFields: ["id"] },
        Penalty: { keyFields: ["id"] },
        DraftPick: { keyFields: ["id"] },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
    },
  });
}

export function getApolloClient() {
  if (typeof window === "undefined") {
    return createApolloClient();
  }

  if (!clientSingleton) {
    clientSingleton = createApolloClient();
  }

  return clientSingleton;
}
