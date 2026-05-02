export function gatewayErrorHint(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("valsea") || m.includes("api key")) {
    return "Kiểm tra VALSEA_API_KEY trên máy chạy gateway (.env ở root repo).";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return "Gateway có thể chưa chạy. Chạy npm run dev và mở GET /health trên cổng gateway (mặc định 3001). Kiểm tra NEXT_PUBLIC_GATEWAY_URL và NEXT_PUBLIC_WS_URL.";
  }
  if (m.includes("microphone") || m.includes("permission") || m.includes("notallowederror")) {
    return "Trình duyệt cần quyền microphone — kiểm tra biểu tượng khóa trên thanh địa chỉ.";
  }
  if (m.includes("websocket") || m.includes("mất kết nối")) {
    return "Xác nhận server WebSocket đang lắng nghe (cùng host/cổng với REST) và không bị chặn bởi proxy.";
  }
  if (m.includes("transcript") && m.includes("trống")) {
    return "Nói thử, tải audio, hoặc dùng nút chèn kịch bản demo trước khi Tạo ghi chú.";
  }
  return null;
}
