/**
 * 멀티 프로젝트 관리 DB 스키마
 * 
 * 한진 공통 엔진의 멀티 프로젝트 관리 시스템을 위한 데이터베이스 스키마입니다.
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import {
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  decimal,
  boolean,
  json,
  mysqlTable,
} from "drizzle-orm/mysql-core";

/**
 * 프로젝트 테이블
 * 
 * 6개 프로젝트: 장부관리사, 스포츠회복사, 로또, GLWA, 숨호흡, 랜딩
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // 프로젝트명
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL slug
  description: text("description"), // 프로젝트 설명
  status: mysqlEnum("status", ["active", "inactive", "archived"]).default("active").notNull(),
  type: mysqlEnum("type", ["saas", "service", "platform", "community"]).notNull(),
  
  // 프로젝트 설정
  config: json("config"), // 프로젝트별 설정 (JSON)
  apiKey: varchar("apiKey", { length: 255 }).unique(), // API 키
  webhookUrl: varchar("webhookUrl", { length: 512 }), // Webhook URL
  
  // 구독 설정
  stripeAccountId: varchar("stripeAccountId", { length: 255 }), // Stripe 계정 ID
  stripePriceIds: json("stripePriceIds"), // Stripe 가격 ID 목록 (JSON)
  
  // 통계
  totalUsers: int("totalUsers").default(0),
  activeSubscriptions: int("activeSubscriptions").default(0),
  monthlyRevenue: decimal("monthlyRevenue", { precision: 12, scale: 2 }).default("0"),
  
  // 메타데이터
  logo: varchar("logo", { length: 512 }), // 로고 URL
  website: varchar("website", { length: 512 }), // 웹사이트 URL
  contactEmail: varchar("contactEmail", { length: 320 }), // 연락처 이메일
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * 프로젝트 멤버 테이블
 */
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "manager", "member"]).notNull(),
  permissions: json("permissions"), // 커스텀 권한 (JSON)
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * 구독 플랜 테이블
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // 플랜명 (예: Pro, Enterprise)
  description: text("description"),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull().unique(),
  
  // 가격 정보
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "yearly", "one-time"]).notNull(),
  
  // 기능 정보
  features: json("features"), // 포함된 기능 (JSON)
  usageLimit: json("usageLimit"), // 사용량 제한 (JSON)
  
  // 상태
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * 구독 테이블
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  
  // Stripe 정보
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull(),
  
  // 구독 상태
  status: mysqlEnum("status", [
    "active",
    "past_due",
    "canceled",
    "expired",
    "paused",
  ]).default("active").notNull(),
  
  // 기간
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  canceledAt: timestamp("canceledAt"),
  
  // 자동 갱신
  autoRenew: boolean("autoRenew").default(true).notNull(),
  
  // 메타데이터
  metadata: json("metadata"), // 추가 정보 (JSON)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * 결제 기록 테이블
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  
  // Stripe 정보
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }).unique(),
  
  // 결제 정보
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "succeeded",
    "failed",
    "refunded",
    "canceled",
  ]).default("pending").notNull(),
  
  // 결제 방법
  paymentMethod: mysqlEnum("paymentMethod", [
    "card",
    "bank_transfer",
    "wallet",
    "other",
  ]).notNull(),
  
  // 환불 정보
  refundedAmount: decimal("refundedAmount", { precision: 12, scale: 2 }).default("0"),
  refundReason: varchar("refundReason", { length: 255 }),
  
  // 실패 정보
  failureReason: varchar("failureReason", { length: 255 }),
  failureCode: varchar("failureCode", { length: 50 }),
  
  // 메타데이터
  metadata: json("metadata"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * 프로젝트 통계 테이블
 */
export const projectStats = mysqlTable("project_stats", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  
  // 사용자 통계
  totalUsers: int("totalUsers").default(0),
  activeUsers: int("activeUsers").default(0),
  newUsersThisMonth: int("newUsersThisMonth").default(0),
  churnedUsersThisMonth: int("churnedUsersThisMonth").default(0),
  
  // 구독 통계
  activeSubscriptions: int("activeSubscriptions").default(0),
  canceledSubscriptions: int("canceledSubscriptions").default(0),
  expiredSubscriptions: int("expiredSubscriptions").default(0),
  
  // 매출 통계
  monthlyRevenue: decimal("monthlyRevenue", { precision: 12, scale: 2 }).default("0"),
  yearlyRevenue: decimal("yearlyRevenue", { precision: 12, scale: 2 }).default("0"),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  
  // 전환율
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0"),
  retentionRate: decimal("retentionRate", { precision: 5, scale: 2 }).default("0"),
  churnRate: decimal("churnRate", { precision: 5, scale: 2 }).default("0"),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectStats = typeof projectStats.$inferSelect;
export type InsertProjectStats = typeof projectStats.$inferInsert;

/**
 * 감사 로그 테이블
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  userId: int("userId"),
  
  // 작업 정보
  action: varchar("action", { length: 255 }).notNull(),
  resource: varchar("resource", { length: 255 }).notNull(),
  resourceId: varchar("resourceId", { length: 255 }),
  
  // 변경 정보
  changes: json("changes"), // 변경 내용 (JSON)
  
  // IP 및 User-Agent
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Webhook 이벤트 테이블
 */
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  
  // 이벤트 정보
  eventType: varchar("eventType", { length: 255 }).notNull(),
  payload: json("payload").notNull(),
  
  // 전송 상태
  status: mysqlEnum("status", ["pending", "sent", "failed", "retrying"]).default("pending").notNull(),
  
  // 재시도 정보
  retryCount: int("retryCount").default(0),
  nextRetryAt: timestamp("nextRetryAt"),
  lastError: text("lastError"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * 알림 설정 테이블
 */
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  
  // 알림 유형별 설정
  emailOnNewUser: boolean("emailOnNewUser").default(true),
  emailOnPayment: boolean("emailOnPayment").default(true),
  emailOnSubscriptionExpiry: boolean("emailOnSubscriptionExpiry").default(true),
  emailOnPaymentFailure: boolean("emailOnPaymentFailure").default(true),
  emailOnWeeklyReport: boolean("emailOnWeeklyReport").default(true),
  
  // 인앱 알림
  inAppNotifications: boolean("inAppNotifications").default(true),
  
  // 푸시 알림
  pushNotifications: boolean("pushNotifications").default(false),
  
  // 슬랙 연동
  slackWebhook: varchar("slackWebhook", { length: 512 }),
  slackNotifications: boolean("slackNotifications").default(false),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;
