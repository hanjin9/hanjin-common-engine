/**
 * 감사 로깅 시스템
 * 
 * 모든 중요한 작업을 로깅하여 감사 추적을 가능하게 합니다.
 * - 사용자 인증 로그
 * - 결제 관련 로그
 * - 구독 관련 로그
 * - 관리자 작업 로그
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { getDb } from "../../db";

/**
 * 감사 로그 레벨
 */
export enum AuditLogLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

/**
 * 감사 로그 카테고리
 */
export enum AuditLogCategory {
  AUTH = "AUTH",
  PAYMENT = "PAYMENT",
  SUBSCRIPTION = "SUBSCRIPTION",
  USER = "USER",
  PROJECT = "PROJECT",
  ADMIN = "ADMIN",
  WEBHOOK = "WEBHOOK",
  EMAIL = "EMAIL",
}

/**
 * 감사 로그 인터페이스
 */
export interface AuditLog {
  id?: number;
  category: AuditLogCategory;
  level: AuditLogLevel;
  userId?: number;
  projectId?: number;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

/**
 * 감사 로그 기록
 */
export async function logAudit(log: AuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit Log] Database not available");
    return;
  }

  try {
    const auditLog = {
      ...log,
      timestamp: log.timestamp || new Date(),
    };

    // 실제 구현에서는 audit_logs 테이블에 삽입
    // await db.insert(auditLogs).values(auditLog);

    console.log(
      `[Audit Log] ${auditLog.category} - ${auditLog.action}: ${auditLog.description}`
    );

    return auditLog;
  } catch (error) {
    console.error("[Audit Log] Error logging audit:", error);
    // 감사 로그 실패는 시스템을 중단하지 않음
  }
}

/**
 * 사용자 로그인 로그
 */
export async function logUserLogin(
  userId: number,
  ipAddress?: string,
  userAgent?: string
) {
  return logAudit({
    category: AuditLogCategory.AUTH,
    level: AuditLogLevel.INFO,
    userId,
    action: "LOGIN",
    description: `User ${userId} logged in`,
    metadata: { ipAddress, userAgent },
    ipAddress,
    userAgent,
  });
}

/**
 * 사용자 로그아웃 로그
 */
export async function logUserLogout(
  userId: number,
  ipAddress?: string,
  userAgent?: string
) {
  return logAudit({
    category: AuditLogCategory.AUTH,
    level: AuditLogLevel.INFO,
    userId,
    action: "LOGOUT",
    description: `User ${userId} logged out`,
    metadata: { ipAddress, userAgent },
    ipAddress,
    userAgent,
  });
}

/**
 * 결제 성공 로그
 */
export async function logPaymentSuccess(
  userId: number,
  projectId: number,
  paymentIntentId: string,
  amount: number,
  currency: string
) {
  return logAudit({
    category: AuditLogCategory.PAYMENT,
    level: AuditLogLevel.INFO,
    userId,
    projectId,
    action: "PAYMENT_SUCCESS",
    description: `Payment successful: ${amount} ${currency}`,
    metadata: {
      paymentIntentId,
      amount,
      currency,
    },
  });
}

/**
 * 결제 실패 로그
 */
export async function logPaymentFailure(
  userId: number,
  projectId: number,
  paymentIntentId: string,
  amount: number,
  currency: string,
  failureReason: string
) {
  return logAudit({
    category: AuditLogCategory.PAYMENT,
    level: AuditLogLevel.WARNING,
    userId,
    projectId,
    action: "PAYMENT_FAILURE",
    description: `Payment failed: ${failureReason}`,
    metadata: {
      paymentIntentId,
      amount,
      currency,
      failureReason,
    },
  });
}

/**
 * 구독 생성 로그
 */
export async function logSubscriptionCreated(
  userId: number,
  projectId: number,
  subscriptionId: string,
  planName: string,
  price: number,
  currency: string
) {
  return logAudit({
    category: AuditLogCategory.SUBSCRIPTION,
    level: AuditLogLevel.INFO,
    userId,
    projectId,
    action: "SUBSCRIPTION_CREATED",
    description: `Subscription created: ${planName}`,
    metadata: {
      subscriptionId,
      planName,
      price,
      currency,
    },
  });
}

/**
 * 구독 취소 로그
 */
export async function logSubscriptionCanceled(
  userId: number,
  projectId: number,
  subscriptionId: string,
  planName: string,
  cancellationReason?: string
) {
  return logAudit({
    category: AuditLogCategory.SUBSCRIPTION,
    level: AuditLogLevel.INFO,
    userId,
    projectId,
    action: "SUBSCRIPTION_CANCELED",
    description: `Subscription canceled: ${planName}`,
    metadata: {
      subscriptionId,
      planName,
      cancellationReason,
    },
  });
}

/**
 * Webhook 수신 로그
 */
export async function logWebhookReceived(
  projectId: number,
  webhookType: string,
  eventId: string,
  status: "success" | "failure"
) {
  return logAudit({
    category: AuditLogCategory.WEBHOOK,
    level: status === "success" ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
    projectId,
    action: "WEBHOOK_RECEIVED",
    description: `Webhook received: ${webhookType}`,
    metadata: {
      webhookType,
      eventId,
      status,
    },
  });
}

/**
 * 이메일 발송 로그
 */
export async function logEmailSent(
  email: string,
  emailType: string,
  projectId?: number,
  status: "success" | "failure" = "success"
) {
  return logAudit({
    category: AuditLogCategory.EMAIL,
    level: status === "success" ? AuditLogLevel.INFO : AuditLogLevel.WARNING,
    projectId,
    action: "EMAIL_SENT",
    description: `Email sent to ${email}: ${emailType}`,
    metadata: {
      email,
      emailType,
      status,
    },
  });
}

/**
 * 관리자 작업 로그
 */
export async function logAdminAction(
  adminUserId: number,
  projectId: number,
  action: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logAudit({
    category: AuditLogCategory.ADMIN,
    level: AuditLogLevel.INFO,
    userId: adminUserId,
    projectId,
    action,
    description,
    metadata,
  });
}

/**
 * 에러 로그
 */
export async function logError(
  category: AuditLogCategory,
  action: string,
  error: Error,
  metadata?: Record<string, any>
) {
  return logAudit({
    category,
    level: AuditLogLevel.ERROR,
    action,
    description: `Error: ${error.message}`,
    metadata: {
      ...metadata,
      errorStack: error.stack,
    },
  });
}

/**
 * 감사 로그 조회
 */
export async function getAuditLogs(
  filters?: {
    category?: AuditLogCategory;
    level?: AuditLogLevel;
    userId?: number;
    projectId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit Log] Database not available");
    return [];
  }

  try {
    // 실제 구현에서는 audit_logs 테이블에서 조회
    // const query = db.select().from(auditLogs);
    // if (filters?.category) {
    //   query.where(eq(auditLogs.category, filters.category));
    // }
    // ... 기타 필터링

    console.log("[Audit Log] Retrieving audit logs");
    return [];
  } catch (error) {
    console.error("[Audit Log] Error retrieving audit logs:", error);
    throw error;
  }
}

/**
 * 감사 로그 통계
 */
export async function getAuditLogStats(
  projectId?: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit Log] Database not available");
    return null;
  }

  try {
    // 실제 구현에서는 audit_logs 테이블에서 통계 조회
    // const stats = await db
    //   .select({
    //     category: auditLogs.category,
    //     level: auditLogs.level,
    //     count: count(),
    //   })
    //   .from(auditLogs)
    //   .groupBy(auditLogs.category, auditLogs.level);

    console.log("[Audit Log] Retrieving audit log statistics");

    return {
      totalLogs: 0,
      byCategory: {},
      byLevel: {},
      byDate: {},
    };
  } catch (error) {
    console.error("[Audit Log] Error retrieving audit log statistics:", error);
    throw error;
  }
}
