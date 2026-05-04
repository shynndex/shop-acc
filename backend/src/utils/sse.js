// Map lưu trữ các kết nối: userId -> Response object
const clients = new Map();

/**
 * Thêm client vào danh sách lắng nghe
 * @param {string} userId - ID của user
 * @param {Response} res - Express response object
 * @param {Request} req - Express request object (để bắt sự kiện close)
 */

export const addSSEClient = (userId, res, req) => {
  // Cấu hình header chuẩn cho SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache,no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  // Gửi ping đầu tiên để giữ kết nối
  res.write(": connected\n\n");

  clients.set(userId, res);

  // Cleanup khi client đóng kết nối
  const cleanup = () => {
    if (clients.get(userId) === res) {
      clients.delete(userId);
      console.log(`[SSE] Client disconnected: ${userId}`);
    }

    req.removeListener("close", cleanup);
    req.removeListener("end", cleanup);
  };
  req.on("close", cleanup);
  req.on("end", cleanup);

  // Heartbeat: gửi comment mỗi 30s để giữ kết nối qua proxy/load balancer
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": heartbeat\n\n");
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
};

/**
 * Gửi event tới một user cụ thể
 * @param {string} userId - ID của user cần thông báo
 * @param {string} eventName - Tên event (VD: "deposit_updated")
 * @param {Object} data - Dữ liệu gửi đi
 */

export const sendSSE = (userId, eventName, data) => {
  const client = clients.get(userId);

  if (client && !client.writableEnded) {
    try {
      client.write(`id:${Date.now()}\n`);
      client.write(`event:${eventName}\n`);
      client.write(`data:${JSON.stringify(data)}\n\n`);
      console.log(`[SSE] Event sent to ${userId}: ${eventName}`);
      return true;
    } catch (error) {
      console.error(`[SSE] Error sending to ${userId}:`, error);
      clients.delete(userId); // Xóa client lỗi
      return false;
    }
  }
  return false;
};

/**
 * Gửi event tới tất cả user đang kết nối (dùng cho broadcast)
 */

export const broadcastSSE = (eventName, data) => {
  let sendCount = 0;
  for (const [userId, client] of clients.entries()) {
    if (!client.writableEnded) {
      try {
        client.write(`id:${Date.now()}\n`);
        client.write(`event:${eventName}\n`);
        client.write(`data:${JSON.stringify(data)}\n\n`);
        sendCount++;
      } catch (error) {
        console.error(`[SSE] Error sending to ${userId}:`, error);
        clients.delete(userId); // Xóa client lỗi
      }
    }
  }
  console.log(`[SSE] Broadcast sent ${sendCount} messages`);
  return sendCount;
};

/**
 * Kiểm tra user có đang kết nối SSE không
 */

export const hasSSEClient = (userId) => {
  return clients.has(userId);
};

/**
 * Đếm số client đang kết nối (dùng cho monitoring)
 */

export const getSSEStats = () => ({
  totalClients: clients.size,
  clientIds: Array.from(clients.keys()),
});
