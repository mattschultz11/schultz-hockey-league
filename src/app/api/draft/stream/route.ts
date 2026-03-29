import type { NextRequest } from "next/server";

import type { DraftEvent } from "@/service/draft/draftBroadcast";
import { registerBroadcast } from "@/service/draft/draftBroadcast";

type Client = {
  controller: ReadableStreamDefaultController;
  seasonId: string;
};

const clients = new Map<string, Set<Client>>();
const encoder = new TextEncoder();

function addClient(seasonId: string, client: Client) {
  if (!clients.has(seasonId)) {
    clients.set(seasonId, new Set());
  }
  clients.get(seasonId)!.add(client);
}

function removeClient(seasonId: string, client: Client) {
  const seasonClients = clients.get(seasonId);
  if (seasonClients) {
    seasonClients.delete(client);
    if (seasonClients.size === 0) {
      clients.delete(seasonId);
    }
  }
}

function broadcast(seasonId: string, event: DraftEvent): void {
  const seasonClients = clients.get(seasonId);
  if (!seasonClients) return;

  const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  for (const client of seasonClients) {
    try {
      client.controller.enqueue(data);
    } catch {
      removeClient(seasonId, client);
    }
  }
}

// Register this module's broadcast function with the service layer
registerBroadcast(broadcast);

export function GET(request: NextRequest) {
  const seasonId = request.nextUrl.searchParams.get("seasonId");

  if (!seasonId) {
    return new Response("Missing seasonId parameter", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const client: Client = { controller, seasonId };
      addClient(seasonId, client);

      // Send initial connected event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", seasonId })}\n\n`),
      );

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        removeClient(seasonId, client);
      });
    },
    cancel() {
      // Stream cancelled — probe and remove dead clients
      for (const [sid, set] of clients) {
        for (const c of set) {
          try {
            c.controller.enqueue(new Uint8Array(0));
          } catch {
            removeClient(sid, c);
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
