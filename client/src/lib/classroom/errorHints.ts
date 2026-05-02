export function gatewayErrorHint(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("valsea") || m.includes("api key")) {
    return "Check VALSEA_API_KEY on the machine running the gateway (repo root .env).";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return "The gateway may not be running. Run npm run dev and open GET /health on the gateway port (default 3001). Verify NEXT_PUBLIC_GATEWAY_URL and NEXT_PUBLIC_WS_URL.";
  }
  if (m.includes("microphone") || m.includes("permission") || m.includes("notallowederror")) {
    return "The browser needs microphone permission — check the lock icon in the address bar.";
  }
  if (
    m.includes("websocket") ||
    m.includes("mất kết nối") ||
    m.includes("lost connection") ||
    m.includes("realtime connection")
  ) {
    return "Confirm the WebSocket server is listening (same host/port as REST) and not blocked by a proxy.";
  }
  if (m.includes("kết nối lại") || m.includes("thử lại") || m.includes("reconnect")) {
    return "The gateway is retrying VALSEA (a few times). Keep the mic on or use audio upload if realtime is unstable.";
  }
  if (m.includes("transcript") && (m.includes("trống") || m.includes("empty"))) {
    return "Speak, upload audio, or use Insert demo script before Generate notes.";
  }
  return null;
}
