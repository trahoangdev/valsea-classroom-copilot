import type { BackendToFrontend } from "@/lib/classroom/types";

export type GatewayHandlers = {
  onOpen?: () => void;
  /** Fires for this socket only; use `ev` to inspect code / wasClean (browser). */
  onClose?: (ev: CloseEvent) => void;
  onTransportError?: () => void;
  onMessage: (msg: BackendToFrontend) => void;
};

export function connectGateway(url: string, handlers: GatewayHandlers): WebSocket {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    handlers.onOpen?.();
  };

  ws.onclose = (ev) => {
    handlers.onClose?.(ev);
  };

  ws.onerror = () => {
    handlers.onTransportError?.();
  };

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(String(ev.data)) as BackendToFrontend;
      handlers.onMessage(data);
    } catch {
      /* ignore malformed */
    }
  };

  return ws;
}

export function sendJson(ws: WebSocket | null, payload: object): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
