export type DraftEvent = {
  type: "pick_update";
  seasonId: string;
  pick: {
    id: string;
    overall: number;
    round: number;
    pick: number;
    teamId: string | null;
    playerId: string | null;
  };
};

type BroadcastFn = (seasonId: string, event: DraftEvent) => void;

let broadcastFn: BroadcastFn = () => {
  // No-op until SSE route registers itself
};

export function registerBroadcast(fn: BroadcastFn): void {
  broadcastFn = fn;
}

export function broadcastDraftUpdate(seasonId: string, event: DraftEvent): void {
  broadcastFn(seasonId, event);
}
