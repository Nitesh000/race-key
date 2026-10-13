import type { ClientMessage, ServerMessage } from "@race-key/shared";
import PartySocket from "partysocket";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "closed";

type Handlers = {
  onMessage: (msg: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
};

async function fetchTicket() {
  const res = await fetch("/api/race/ticket", { cache: "no-store" });
  if (!res.ok) throw new Error(`ticket request failed with ${res.status}`);
  return ((await res.json()) as { ticket: string }).ticket;
}

export class RaceConnection {
  private socket: PartySocket;
  private offset = 0;
  private bestRtt = Infinity;
  private opened = false;
  private hiddenAt = 0;
  private cleanup: () => void;

  constructor(host: string, roomId: string, handlers: Handlers) {
    const url = new URL(host);
    this.socket = new PartySocket({
      host: url.host,
      protocol: url.protocol === "https:" ? "wss" : "ws",
      party: "race-room",
      room: roomId,
      query: async () => ({ ticket: await fetchTicket() }),
      maxReconnectionDelay: 3000,
      minReconnectionDelay: 300,
      shouldReconnectOnClose: (e) => e.code < 4000,
    });
    handlers.onStatus("connecting");
    this.socket.addEventListener("open", () => {
      handlers.onStatus("open");
      this.opened = true;
      this.bestRtt = Infinity;
      for (let i = 0; i < 3; i++)
        setTimeout(() => this.send({ t: "ping", at: Date.now() }), i * 400);
    });
    this.socket.addEventListener("close", (e) => {
      handlers.onStatus(e.code >= 4000 ? "closed" : this.opened ? "reconnecting" : "connecting");
    });
    const onOffline = () => {
      handlers.onStatus("reconnecting");
      this.socket.reconnect();
    };
    const onOnline = () => this.socket.reconnect();
    const onVisibility = () => {
      if (document.hidden) {
        this.hiddenAt = Date.now();
      } else if (this.hiddenAt && Date.now() - this.hiddenAt > 5000) {
        this.socket.reconnect();
      }
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    this.cleanup = () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    this.socket.addEventListener("message", (e) => {
      const msg = JSON.parse(String(e.data)) as ServerMessage;
      if (msg.t === "pong") return this.syncClock(msg.at, msg.now);
      if (msg.t === "welcome" || msg.t === "room") {
        if (this.bestRtt === Infinity) this.offset = msg.now - Date.now();
      }
      handlers.onMessage(msg);
    });
  }

  private syncClock(sentAt: number, serverNow: number) {
    const rtt = Date.now() - sentAt;
    if (rtt > this.bestRtt) return;
    this.bestRtt = rtt;
    this.offset = serverNow + rtt / 2 - Date.now();
  }

  serverNow() {
    return Date.now() + this.offset;
  }

  toPerf(serverTime: number) {
    return performance.now() + (serverTime - this.serverNow());
  }

  send(msg: ClientMessage) {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg));
  }

  close() {
    this.cleanup();
    this.socket.close();
  }
}
