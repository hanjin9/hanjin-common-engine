/**
 * Socket.io 실시간 통신 모듈
 * 
 * 한진 공통 엔진의 실시간 알림 및 업데이트를 Socket.io를 통해 구현합니다.
 * - 실시간 알림 발송
 * - 구독 상태 업데이트 브로드캐스트
 * - 결제 완료 실시간 알림
 * - 사용자 온라인 상태 추적
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verify } from "jsonwebtoken";

let io: SocketIOServer;

/**
 * Socket.io 초기화
 * 
 * @param httpServer HTTP 서버 인스턴스
 */
export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // 미들웨어: JWT 토큰 검증
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as any;
      socket.data.userId = decoded.id;
      socket.data.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // 연결 이벤트
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    const userEmail = socket.data.userEmail;

    console.log(`[Socket.io] User ${userId} connected: ${socket.id}`);

    // 사용자 룸에 조인
    socket.join(`user:${userId}`);

    // 연결 이벤트 브로드캐스트
    io.emit("user:connected", { userId, socketId: socket.id });

    // 연결 해제 이벤트
    socket.on("disconnect", () => {
      console.log(`[Socket.io] User ${userId} disconnected: ${socket.id}`);
      io.emit("user:disconnected", { userId });
    });

    // 핑 이벤트 (연결 상태 확인)
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  console.log("[Socket.io] Initialized successfully");
  return io;
}

/**
 * 특정 사용자에게 알림 발송
 * 
 * @param userId 사용자 ID
 * @param type 알림 유형
 * @param data 알림 데이터
 */
export function notifyUser(
  userId: number,
  type: string,
  data: Record<string, any>
) {
  if (!io) {
    console.warn("[Socket.io] Not initialized");
    return;
  }

  io.to(`user:${userId}`).emit("notification", {
    type,
    data,
    timestamp: new Date(),
  });

  console.log(`[Socket.io] Notification sent to user ${userId}: ${type}`);
}

/**
 * 모든 사용자에게 브로드캐스트
 * 
 * @param type 이벤트 유형
 * @param data 이벤트 데이터
 */
export function broadcastToAll(
  type: string,
  data: Record<string, any>
) {
  if (!io) {
    console.warn("[Socket.io] Not initialized");
    return;
  }

  io.emit(type, {
    data,
    timestamp: new Date(),
  });

  console.log(`[Socket.io] Broadcast sent: ${type}`);
}

/**
 * 구독 상태 업데이트 브로드캐스트
 * 
 * @param subscriptionId 구독 ID
 * @param status 구독 상태
 * @param userId 사용자 ID
 */
export function broadcastSubscriptionUpdate(
  subscriptionId: number,
  status: string,
  userId: number
) {
  notifyUser(userId, "subscription:updated", {
    subscriptionId,
    status,
  });
}

/**
 * 결제 완료 알림
 * 
 * @param userId 사용자 ID
 * @param amount 결제 금액
 * @param currency 통화
 * @param planName 요금제명
 */
export function notifyPaymentSuccess(
  userId: number,
  amount: number,
  currency: string,
  planName: string
) {
  notifyUser(userId, "payment:success", {
    amount,
    currency,
    planName,
  });
}

/**
 * 결제 실패 알림
 * 
 * @param userId 사용자 ID
 * @param reason 실패 사유
 * @param planName 요금제명
 */
export function notifyPaymentFailure(
  userId: number,
  reason: string,
  planName: string
) {
  notifyUser(userId, "payment:failure", {
    reason,
    planName,
  });
}

/**
 * 구독 만료 알림
 * 
 * @param userId 사용자 ID
 * @param daysUntilExpiry 만료까지 남은 일수
 * @param planName 요금제명
 */
export function notifySubscriptionExpiring(
  userId: number,
  daysUntilExpiry: number,
  planName: string
) {
  notifyUser(userId, "subscription:expiring", {
    daysUntilExpiry,
    planName,
  });
}

/**
 * 관리자 알림
 * 
 * @param type 알림 유형
 * @param data 알림 데이터
 */
export function notifyAdmins(
  type: string,
  data: Record<string, any>
) {
  if (!io) {
    console.warn("[Socket.io] Not initialized");
    return;
  }

  io.to("admins").emit("admin:notification", {
    type,
    data,
    timestamp: new Date(),
  });

  console.log(`[Socket.io] Admin notification sent: ${type}`);
}

/**
 * 신규 가입자 알림 (관리자용)
 * 
 * @param userId 사용자 ID
 * @param email 이메일
 * @param name 이름
 */
export function notifyNewUserSignup(
  userId: number,
  email: string,
  name: string
) {
  notifyAdmins("user:signup", {
    userId,
    email,
    name,
  });
}

/**
 * 신규 결제 알림 (관리자용)
 * 
 * @param paymentId 결제 ID
 * @param userId 사용자 ID
 * @param amount 결제 금액
 * @param currency 통화
 */
export function notifyNewPayment(
  paymentId: number,
  userId: number,
  amount: number,
  currency: string
) {
  notifyAdmins("payment:new", {
    paymentId,
    userId,
    amount,
    currency,
  });
}

/**
 * 결제 실패 알림 (관리자용)
 * 
 * @param paymentId 결제 ID
 * @param userId 사용자 ID
 * @param reason 실패 사유
 */
export function notifyPaymentFailureAdmin(
  paymentId: number,
  userId: number,
  reason: string
) {
  notifyAdmins("payment:failed", {
    paymentId,
    userId,
    reason,
  });
}

/**
 * 온라인 사용자 목록 조회
 */
export function getOnlineUsers() {
  if (!io) {
    return [];
  }

  const sockets = io.sockets.sockets;
  const onlineUsers: any[] = [];

  sockets.forEach((socket) => {
    if (socket.data.userId) {
      onlineUsers.push({
        userId: socket.data.userId,
        socketId: socket.id,
        connectedAt: socket.handshake.time,
      });
    }
  });

  return onlineUsers;
}

/**
 * 특정 사용자가 온라인인지 확인
 * 
 * @param userId 사용자 ID
 */
export function isUserOnline(userId: number) {
  if (!io) {
    return false;
  }

  const sockets = io.sockets.sockets;
  for (const socket of Array.from(sockets.values())) {
    if (socket.data.userId === userId) {
      return true;
    }
  }

  return false;
}

/**
 * 특정 사용자의 소켓 ID 조회
 * 
 * @param userId 사용자 ID
 */
export function getUserSocketIds(userId: number) {
  if (!io) {
    return [];
  }

  const sockets = io.sockets.sockets;
  const socketIds: string[] = [];

  sockets.forEach((socket) => {
    if (socket.data.userId === userId) {
      socketIds.push(socket.id);
    }
  });

  return socketIds;
}

/**
 * 소켓 서버 종료
 */
export async function closeSocket() {
  if (io) {
    await io.close();
    console.log("[Socket.io] Closed");
  }
}

export { SocketIOServer, Socket };
