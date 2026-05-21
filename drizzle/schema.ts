import { mysqlTable, varchar, int, text, timestamp, boolean, mysqlEnum, decimal, json, datetime } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// 멀티테넌트 프로젝트 테이블
// ============================================================================

/**
 * 프로젝트 테이블 (7개 프로젝트)
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("owner_id").notNull(),
  projectType: mysqlEnum("project_type", [
    "glwa_franchise",
    "glwa_community",
    "breathing",
    "sports_recovery",
    "accounting",
    "lottery",
    "landing",
  ]).notNull(),
  ownershipStatus: mysqlEnum("ownership_status", [
    "hanjin",
    "client_pending",
    "client_active",
  ])
    .default("hanjin")
    .notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * 프로젝트 멤버 테이블
 */
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  role: mysqlEnum("role", ["admin", "manager", "user"])
    .default("user")
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * 프로젝트 인증 설정 테이블
 */
export const projectAuthConfig = mysqlTable("project_auth_config", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull().unique(),
  authProvider: mysqlEnum("auth_provider", [
    "manus",
    "supabase",
    "auth0",
    "custom",
  ])
    .default("manus")
    .notNull(),
  oauthGoogleEnabled: boolean("oauth_google_enabled").default(false),
  oauthKakaoEnabled: boolean("oauth_kakao_enabled").default(false),
  oauthGoogleClientId: varchar("oauth_google_client_id", { length: 255 }),
  oauthKakaoClientId: varchar("oauth_kakao_client_id", { length: 255 }),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  stripePublishableKey: varchar("stripe_publishable_key", { length: 255 }),
  emailProvider: mysqlEnum("email_provider", [
    "resend",
    "sendgrid",
    "custom",
  ])
    .default("resend")
    .notNull(),
  emailFromAddress: varchar("email_from_address", { length: 255 }),
  emailFromName: varchar("email_from_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectAuthConfig = typeof projectAuthConfig.$inferSelect;
export type InsertProjectAuthConfig = typeof projectAuthConfig.$inferInsert;

/**
 * 프로젝트 구독 플랜 테이블
 */
export const projectSubscriptionPlans = mysqlTable("project_subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  billingPeriod: mysqlEnum("billing_period", ["monthly", "yearly"])
    .default("monthly")
    .notNull(),
  features: json("features"),
  isActive: boolean("is_active").default(true),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectSubscriptionPlan = typeof projectSubscriptionPlans.$inferSelect;
export type InsertProjectSubscriptionPlan = typeof projectSubscriptionPlans.$inferInsert;

/**
 * 프로젝트 구독 테이블
 */
export const projectSubscriptions = mysqlTable("project_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  planId: int("plan_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  status: mysqlEnum("status", [
    "active",
    "paused",
    "cancelled",
    "expired",
  ])
    .default("active")
    .notNull(),
  currentPeriodStart: datetime("current_period_start"),
  currentPeriodEnd: datetime("current_period_end"),
  cancelledAt: datetime("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectSubscription = typeof projectSubscriptions.$inferSelect;
export type InsertProjectSubscription = typeof projectSubscriptions.$inferInsert;

/**
 * 프로젝트 결제 테이블
 */
export const projectPayments = mysqlTable("project_payments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  subscriptionId: int("subscription_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", [
    "pending",
    "succeeded",
    "failed",
    "refunded",
  ])
    .default("pending")
    .notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectPayment = typeof projectPayments.$inferSelect;
export type InsertProjectPayment = typeof projectPayments.$inferInsert;

/**
 * 프로젝트 통계 테이블
 */
export const projectStatistics = mysqlTable("project_statistics", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull().unique(),
  totalUsers: int("total_users").default(0),
  activeSubscriptions: int("active_subscriptions").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default('0'),
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }).default('0'),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default('0'),
  avgSubscriptionValue: decimal("avg_subscription_value", { precision: 10, scale: 2 }).default('0'),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectStatistic = typeof projectStatistics.$inferSelect;
export type InsertProjectStatistic = typeof projectStatistics.$inferInsert;

/**
 * 프로젝트 감사 로그 테이블
 */
export const projectAuditLogs = mysqlTable("project_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id"),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }),
  resourceId: int("resource_id"),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProjectAuditLog = typeof projectAuditLogs.$inferSelect;
export type InsertProjectAuditLog = typeof projectAuditLogs.$inferInsert;

/**
 * 프로젝트 Webhook 이벤트 테이블
 */
export const projectWebhookEvents = mysqlTable("project_webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  eventType: varchar("event_type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processed",
    "failed",
    "retry",
  ])
    .default("pending")
    .notNull(),
  retryCount: int("retry_count").default(0),
  errorMessage: text("error_message"),
  processedAt: datetime("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ProjectWebhookEvent = typeof projectWebhookEvents.$inferSelect;
export type InsertProjectWebhookEvent = typeof projectWebhookEvents.$inferInsert;

/**
 * 프로젝트 알림 설정 테이블
 */
export const projectNotificationSettings = mysqlTable("project_notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull().unique(),
  emailOnNewUser: boolean("email_on_new_user").default(true),
  emailOnPaymentSuccess: boolean("email_on_payment_success").default(true),
  emailOnPaymentFailed: boolean("email_on_payment_failed").default(true),
  emailOnSubscriptionCancelled: boolean("email_on_subscription_cancelled").default(true),
  emailOnSubscriptionExpiring: boolean("email_on_subscription_expiring").default(true),
  adminEmailRecipients: json("admin_email_recipients"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ProjectNotificationSettings = typeof projectNotificationSettings.$inferSelect;
export type InsertProjectNotificationSettings = typeof projectNotificationSettings.$inferInsert;

// ============================================================================
// 관계 정의
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  projectMembers: many(projectMembers),
  projectSubscriptions: many(projectSubscriptions),
  projectPayments: many(projectPayments),
  projectAuditLogs: many(projectAuditLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  authConfig: one(projectAuthConfig),
  subscriptionPlans: many(projectSubscriptionPlans),
  subscriptions: many(projectSubscriptions),
  payments: many(projectPayments),
  statistics: one(projectStatistics),
  auditLogs: many(projectAuditLogs),
  webhookEvents: many(projectWebhookEvents),
  notificationSettings: one(projectNotificationSettings),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectAuthConfigRelations = relations(projectAuthConfig, ({ one }) => ({
  project: one(projects, {
    fields: [projectAuthConfig.projectId],
    references: [projects.id],
  }),
}));

export const projectSubscriptionPlansRelations = relations(
  projectSubscriptionPlans,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectSubscriptionPlans.projectId],
      references: [projects.id],
    }),
    subscriptions: many(projectSubscriptions),
  })
);

export const projectSubscriptionsRelations = relations(
  projectSubscriptions,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectSubscriptions.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(projectSubscriptionPlans, {
      fields: [projectSubscriptions.planId],
      references: [projectSubscriptionPlans.id],
    }),
    payments: many(projectPayments),
  })
);

export const projectPaymentsRelations = relations(projectPayments, ({ one }) => ({
  project: one(projects, {
    fields: [projectPayments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectPayments.userId],
    references: [users.id],
  }),
  subscription: one(projectSubscriptions, {
    fields: [projectPayments.subscriptionId],
    references: [projectSubscriptions.id],
  }),
}));

export const projectStatisticsRelations = relations(projectStatistics, ({ one }) => ({
  project: one(projects, {
    fields: [projectStatistics.projectId],
    references: [projects.id],
  }),
}));

export const projectAuditLogsRelations = relations(projectAuditLogs, ({ one }) => ({
  project: one(projects, {
    fields: [projectAuditLogs.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectAuditLogs.userId],
    references: [users.id],
  }),
}));

export const projectWebhookEventsRelations = relations(projectWebhookEvents, ({ one }) => ({
  project: one(projects, {
    fields: [projectWebhookEvents.projectId],
    references: [projects.id],
  }),
}));

export const projectNotificationSettingsRelations = relations(
  projectNotificationSettings,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectNotificationSettings.projectId],
      references: [projects.id],
    }),
  })
);

// ============================================================================
// GLWA 웰니스 앱 - 관리자 대시보드 필수 테이블 (glwa-wellness-app에서 이식)
// ============================================================================

// ─── 멤버십 등급 정의 테이블 (11단계) ────────────────────────────────────
export const membershipTiers = mysqlTable("membership_tiers", {
  id: int("id").autoincrement().primaryKey(),
  tier: mysqlEnum("tier", [
    "bronze", "silver", "gold", "emerald", "green_emerald",
    "sapphire", "blue_sapphire", "diamond", "blue_diamond", "platinum", "black_platinum",
  ]).notNull().unique(),
  nameKo: varchar("name_ko", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  pointThreshold: int("point_threshold").notNull(),
  monthlyFee: int("monthly_fee").default(0),
  annualFee: int("annual_fee").default(0),
  benefits: json("benefits"),
  badgeIcon: varchar("badge_icon", { length: 255 }),
  colorCode: varchar("color_code", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = typeof membershipTiers.$inferInsert;

// ─── 사용자 멤버십 현황 테이블 ──────────────────────────────────────────
export const userMemberships = mysqlTable("user_memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  projectId: int("project_id"),
  tier: mysqlEnum("tier", [
    "bronze", "silver", "gold", "emerald", "green_emerald",
    "sapphire", "blue_sapphire", "diamond", "blue_diamond", "platinum", "black_platinum",
  ]).default("bronze").notNull(),
  currentPoints: int("current_points").default(0).notNull(),
  totalPointsEarned: int("total_points_earned").default(0).notNull(),
  totalPointsUsed: int("total_points_used").default(0).notNull(),
  isActive: boolean("is_active").default(true),
  upgradedAt: timestamp("upgraded_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type UserMembership = typeof userMemberships.$inferSelect;
export type InsertUserMembership = typeof userMemberships.$inferInsert;

// ─── 포인트 거래 내역 테이블 ────────────────────────────────────────────
export const pointsTransactions = mysqlTable("points_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  type: mysqlEnum("type", ["earn", "use", "expire", "admin_adjust"]).notNull(),
  points: int("points").notNull(),
  balanceAfter: int("balance_after").notNull(),
  reason: varchar("reason", { length: 255 }),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: int("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;

// ─── 사용자 지갑 테이블 ─────────────────────────────────────────────────
export const userWallets = mysqlTable("user_wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  projectId: int("project_id"),
  balance: int("balance").default(0).notNull(),
  currency: varchar("currency", { length: 10 }).default("KRW").notNull(),
  totalDeposited: int("total_deposited").default(0).notNull(),
  totalWithdrawn: int("total_withdrawn").default(0).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = typeof userWallets.$inferInsert;

// ─── 지갑 거래 내역 테이블 ──────────────────────────────────────────────
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("wallet_id").notNull(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["deposit", "withdraw", "transfer_in", "transfer_out", "refund"]).notNull(),
  amount: int("amount").notNull(),
  balanceAfter: int("balance_after").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  externalTxId: varchar("external_tx_id", { length: 255 }),
  status: mysqlEnum("wallet_tx_status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// ─── 관리자 알림 설정 테이블 ────────────────────────────────────────────
export const adminNotificationSettings = mysqlTable("admin_notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("admin_user_id").notNull(),
  category: mysqlEnum("notif_category", ["urgent", "important", "normal", "low"]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  pipeline: mysqlEnum("pipeline", ["instant", "batch_6h", "daily", "weekly"]).default("instant").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AdminNotificationSetting = typeof adminNotificationSettings.$inferSelect;
export type InsertAdminNotificationSetting = typeof adminNotificationSettings.$inferInsert;

// ─── 관리자 알림 로그 테이블 ────────────────────────────────────────────
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("notif_log_category", ["urgent", "important", "normal", "low"]).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content"),
  metadata: json("metadata"),
  isRead: boolean("is_read").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

// ─── 관리자 활동 로그 테이블 ────────────────────────────────────────────
export const adminActivityLog = mysqlTable("admin_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("admin_user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: int("target_id"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AdminActivityLogEntry = typeof adminActivityLog.$inferSelect;
export type InsertAdminActivityLogEntry = typeof adminActivityLog.$inferInsert;

// ─── 운영자 모니터링 테이블 (이상 감지/알림) ────────────────────────────
export const operatorMonitoring = mysqlTable("operator_monitoring", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  alertType: mysqlEnum("alert_type", ["warning", "info", "recommendation"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  actionRequired: boolean("action_required").default(false).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type OperatorMonitoringEntry = typeof operatorMonitoring.$inferSelect;
export type InsertOperatorMonitoringEntry = typeof operatorMonitoring.$inferInsert;

// ─── 회원 진행 단계 테이블 (수련 단계 추적) ─────────────────────────────
export const tieredProgress = mysqlTable("tiered_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  projectId: int("project_id"),
  currentStage: int("current_stage").default(1),
  daysCompleted: int("days_completed").default(0),
  hanJinLevel: int("han_jin_level").default(0),
  sleepQuality: int("sleep_quality").default(50),
  nutritionBalance: int("nutrition_balance").default(50),
  activityLevel: int("activity_level").default(50),
  heartHealth: int("heart_health").default(50),
  stressLevel: int("stress_level").default(50),
  overallWellness: int("overall_wellness").default(50),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type TieredProgress = typeof tieredProgress.$inferSelect;
export type InsertTieredProgress = typeof tieredProgress.$inferInsert;

// ─── 쿠폰 테이블 ────────────────────────────────────────────────────────
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id"),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  discountType: mysqlEnum("discount_type", ["percentage", "fixed"]).notNull(),
  discountValue: int("discount_value").notNull(),
  minOrderAmount: int("min_order_amount").default(0),
  maxDiscountAmount: int("max_discount_amount"),
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").default(0),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ─── 이벤트 테이블 ──────────────────────────────────────────────────────
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("event_type", ["challenge", "promotion", "webinar", "offline", "online"]).notNull(),
  status: mysqlEnum("event_status", ["draft", "active", "ended", "cancelled"]).default("draft").notNull(),
  maxParticipants: int("max_participants"),
  currentParticipants: int("current_participants").default(0),
  rewardPoints: int("reward_points").default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ─── 이벤트 참여 테이블 ─────────────────────────────────────────────────
export const eventParticipations = mysqlTable("event_participations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  userId: int("user_id").notNull(),
  status: mysqlEnum("participation_status", ["joined", "completed", "cancelled"]).default("joined").notNull(),
  rewardClaimed: boolean("reward_claimed").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
export type EventParticipation = typeof eventParticipations.$inferSelect;
export type InsertEventParticipation = typeof eventParticipations.$inferInsert;


// ============================================================================
// AI 피드백 엔진 + 생체 데이터 수집 테이블
// ============================================================================

/**
 * 사용자 피드백 프로필 (개인 메모리 엔진 기반)
 */
export const userFeedbackProfiles = mysqlTable("user_feedback_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  projectId: int("project_id"),
  // 성격 유형
  personalityType: mysqlEnum("personality_type", [
    "active", "careful", "social", "independent", "balanced"
  ]).default("balanced"),
  // 동기 유발 요소
  motivationFactors: text("motivation_factors"), // JSON array
  // 강점/개선점
  strengths: text("strengths"), // JSON array
  improvements: text("improvements"), // JSON array
  // 선호 언어
  preferredLanguage: varchar("preferred_language", { length: 8 }).default("ko"),
  // 피드백 수신 등급 (1=기본, 2=프리미엄, 3=VIP)
  feedbackTier: int("feedback_tier").default(1),
  // 총 피드백 수신 횟수
  totalFeedbackCount: int("total_feedback_count").default(0),
  // 마지막 AI 분석 시각
  lastAnalyzedAt: timestamp("last_analyzed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type UserFeedbackProfile = typeof userFeedbackProfiles.$inferSelect;
export type InsertUserFeedbackProfile = typeof userFeedbackProfiles.$inferInsert;

/**
 * 생체 데이터 기록 테이블
 * dataSource: 'self'=자체수집(마이크/가속도계), 'google_fit', 'apple_health', 'samsung_health', 'manual'
 */
export const biodataRecords = mysqlTable("biodata_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  // 데이터 출처 (플랫폼 구분)
  dataSource: mysqlEnum("data_source", [
    "self", "google_fit", "apple_health", "samsung_health", "manual"
  ]).default("self").notNull(),
  // 측정 유형
  dataType: mysqlEnum("data_type", [
    "heart_rate",       // 심박수 (카메라 rPPG)
    "breathing_rate",   // 호흡수 (마이크)
    "breathing_quality",// 호흡 질 (마이크 패턴 분석)
    "sleep_duration",   // 수면 시간 (가속도계)
    "sleep_quality",    // 수면 질 (마이크 수면 중 분석)
    "sleep_start",      // 수면 시작 시각
    "sleep_end",        // 수면 종료 시각
    "snoring_detected", // 코골이 감지
    "steps",            // 걸음 수
    "voice_energy",     // 목소리 에너지 (컨디션)
    "voice_stress",     // 목소리 스트레스 지수
    "stress_level",     // 스트레스 지수 (종합)
    "body_temperature", // 체온 (사용자 입력)
    "weight",           // 체중 (사용자 입력)
    "mood",             // 기분 (사용자 입력 1-10)
    "energy_level"      // 에너지 레벨 (종합)
  ]).notNull(),
  // 수치 값
  value: varchar("value", { length: 64 }).notNull(), // 숫자 또는 JSON
  unit: varchar("unit", { length: 32 }), // bpm, /min, hours, steps, score 등
  // 정확도 (0-100)
  accuracy: int("accuracy").default(70),
  // 측정 시각
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
  // 측정 기간 (수면 등 장시간 측정 시)
  durationSeconds: int("duration_seconds"),
  // 원본 데이터 (분석용)
  rawData: text("raw_data"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type BiodataRecord = typeof biodataRecords.$inferSelect;
export type InsertBiodataRecord = typeof biodataRecords.$inferInsert;

/**
 * 피드백 로그 테이블 (3단계 피드백 기록)
 */
export const feedbackLogs = mysqlTable("feedback_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  // 피드백 단계 (1=즉시, 2=심화/프리미엄, 3=VIP)
  feedbackTier: int("feedback_tier").default(1).notNull(),
  // 피드백 유형
  feedbackType: mysqlEnum("feedback_type", [
    "activity",    // 활동 완료 피드백
    "daily",       // 일일 건강 피드백
    "sleep",       // 수면 분석 피드백
    "breathing",   // 호흡 분석 피드백
    "mission",     // 미션 완료 피드백
    "weekly",      // 주간 리포트 피드백
    "vip_coaching" // VIP 1:1 코칭
  ]).notNull(),
  // 트리거 (어떤 데이터로 피드백 생성됐는지)
  triggerType: varchar("trigger_type", { length: 64 }),
  triggerData: text("trigger_data"), // JSON
  // AI 생성 피드백 내용
  feedbackContent: text("feedback_content").notNull(),
  feedbackSummary: varchar("feedback_summary", { length: 500 }),
  // 다국어 피드백
  language: varchar("language", { length: 8 }).default("ko"),
  // 포인트 지급 여부
  pointsAwarded: int("points_awarded").default(0),
  // 사용자 반응 (읽음/좋아요/싫어요)
  userReaction: mysqlEnum("user_reaction", ["none", "liked", "disliked", "read"]).default("none"),
  // TTS 음성 URL (생성된 경우)
  ttsAudioUrl: text("tts_audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type FeedbackLog = typeof feedbackLogs.$inferSelect;
export type InsertFeedbackLog = typeof feedbackLogs.$inferInsert;

/**
 * 대화 히스토리 테이블 (AI 채팅 기록)
 */
export const conversationHistory = mysqlTable("conversation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  // 세션 ID (대화 묶음)
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  // 역할 (user/assistant)
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  // 감정 분석 결과
  detectedEmotion: mysqlEnum("detected_emotion", [
    "positive", "negative", "tired", "neutral", "excited", "anxious"
  ]).default("neutral"),
  // 언어
  language: varchar("language", { length: 8 }).default("ko"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ConversationHistory = typeof conversationHistory.$inferSelect;
export type InsertConversationHistory = typeof conversationHistory.$inferInsert;

/**
 * 일일 미션 테이블 (AI 지시 + 추적)
 */
export const dailyMissions = mysqlTable("daily_missions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  // 미션 날짜
  missionDate: varchar("mission_date", { length: 10 }).notNull(), // YYYY-MM-DD
  // 미션 유형
  missionType: mysqlEnum("mission_type", [
    "breathing",   // 호흡 운동
    "exercise",    // 신체 운동
    "meditation",  // 명상
    "nutrition",   // 영양/식단
    "sleep",       // 수면 준비
    "quiz",        // 건강 퀴즈
    "measurement"  // 건강 측정
  ]).notNull(),
  // AI 생성 미션 내용
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  instructions: text("instructions"), // JSON 단계별 지시사항
  // 난이도 (1=쉬움, 2=보통, 3=어려움)
  difficulty: int("difficulty").default(1),
  // 예상 소요 시간 (분)
  estimatedMinutes: int("estimated_minutes").default(10),
  // 완료 여부
  status: mysqlEnum("mission_status", ["pending", "in_progress", "completed", "skipped"]).default("pending"),
  completedAt: timestamp("completed_at"),
  // 완료 데이터 (측정값 등)
  completionData: text("completion_data"), // JSON
  // 포인트 보상
  rewardPoints: int("reward_points").default(10),
  pointsEarned: int("points_earned").default(0),
  // 알림 발송 여부
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type DailyMission = typeof dailyMissions.$inferSelect;
export type InsertDailyMission = typeof dailyMissions.$inferInsert;

/**
 * 수면 세션 테이블 (수면 감지 + 분석 결과)
 */
export const sleepSessions = mysqlTable("sleep_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"),
  // 수면 시작/종료
  sleepStart: timestamp("sleep_start").notNull(),
  sleepEnd: timestamp("sleep_end"),
  // 총 수면 시간 (분)
  totalMinutes: int("total_minutes"),
  // 수면 질 점수 (0-100)
  qualityScore: int("quality_score"),
  // 호흡 분석 결과
  avgBreathingRate: varchar("avg_breathing_rate", { length: 16 }), // 회/분
  breathingRegularity: int("breathing_regularity"), // 0-100
  snoringDetected: boolean("snoring_detected").default(false),
  snoringMinutes: int("snoring_minutes").default(0),
  // 움직임 분석
  movementCount: int("movement_count").default(0),
  // 수면 단계 추정 (JSON)
  sleepStages: text("sleep_stages"), // [{stage: 'light'|'deep'|'rem', startMin: 0, endMin: 30}]
  // 감지 방법
  detectionMethod: mysqlEnum("detection_method", [
    "accelerometer", "microphone", "both", "manual"
  ]).default("both"),
  // AI 피드백 생성 여부
  feedbackGenerated: boolean("feedback_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SleepSession = typeof sleepSessions.$inferSelect;
export type InsertSleepSession = typeof sleepSessions.$inferInsert;

/**
 * 헬스 플랫폼 연동 설정 테이블
 */
export const healthPlatformConnections = mysqlTable("health_platform_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  // 플랫폼
  platform: mysqlEnum("platform", [
    "google_fit", "apple_health", "samsung_health", "garmin", "fitbit"
  ]).notNull(),
  // 연동 상태
  status: mysqlEnum("connection_status", ["connected", "disconnected", "pending"]).default("pending"),
  // 접근 토큰 (암호화 저장)
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  // 동기화 설정
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  // 동기화할 데이터 유형
  syncDataTypes: text("sync_data_types"), // JSON array: ['steps', 'sleep', 'heart_rate']
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type HealthPlatformConnection = typeof healthPlatformConnections.$inferSelect;
export type InsertHealthPlatformConnection = typeof healthPlatformConnections.$inferInsert;

// ============================================================================
// 프로젝트별 멤버십 단계 테이블 (동적 확장 가능 구조)
// - GLWA: 최대 10단계 (현재 8단계, 언제든 확장 가능)
// - 숨호흡 MVP: 4단계 독립 멤버십 (GLWA 자식 앱, 나중에 연동 가능)
// - 기타 프로젝트: 각자 독립 단계 설정
// ============================================================================

/**
 * 프로젝트별 멤버십 단계 정의 테이블
 * - 각 프로젝트가 독립적으로 2~10단계 멤버십을 정의할 수 있음
 * - GLWA는 현재 8단계이지만 최대 10단계까지 row 추가만으로 확장 가능
 * - 숨호흡 앱은 parentProjectSlug = 'glwa' 로 연결 관계 명시
 */
export const projectMembershipTiers = mysqlTable("project_membership_tiers", {
  id: int("id").autoincrement().primaryKey(),
  // 어느 프로젝트의 멤버십 단계인지
  projectSlug: varchar("project_slug", { length: 64 }).notNull(),
  // 단계 순서 (1부터 시작, 최대 10)
  tierOrder: int("tier_order").notNull(),
  // 단계 키 (코드에서 사용)
  tierKey: varchar("tier_key", { length: 64 }).notNull(),
  // 단계 표시 이름 (한국어/영어 혼용 가능)
  tierLabel: varchar("tier_label", { length: 128 }).notNull(),
  // 단계 색상 (HEX)
  tierColor: varchar("tier_color", { length: 16 }).default("#94a3b8"),
  // 포인트 임계값 (자동 승급 기준)
  pointThreshold: int("point_threshold").default(0).notNull(),
  // 연회비 (원, 0이면 무료)
  annualFeeKrw: int("annual_fee_krw").default(0),
  // 혜택 목록 (JSON 배열)
  benefits: text("benefits"), // JSON: ["혜택1", "혜택2"]
  // 자동 승급 여부 (false = 관리자 수동 승급)
  autoUpgrade: boolean("auto_upgrade").default(false),
  // 활성화 여부 (비활성화 시 해당 단계 숨김)
  isActive: boolean("is_active").default(true),
  // 부모 프로젝트 연결 (숨호흡 → glwa 등)
  parentProjectSlug: varchar("parent_project_slug", { length: 64 }),
  // 부모 프로젝트 단계 매핑 (나중에 통합 시 사용)
  parentTierKey: varchar("parent_tier_key", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ProjectMembershipTier = typeof projectMembershipTiers.$inferSelect;
export type InsertProjectMembershipTier = typeof projectMembershipTiers.$inferInsert;

/**
 * 프로젝트별 사용자 멤버십 테이블
 * - 사용자가 여러 프로젝트에 각각 다른 멤버십 단계를 가질 수 있음
 * - 숨호흡 앱에서 gold 단계 → GLWA에서 silver 단계 (별개)
 */
export const projectUserMemberships = mysqlTable("project_user_memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull(),
  // 현재 단계 키
  currentTierKey: varchar("current_tier_key", { length: 64 }).notNull(),
  // 현재 포인트 (해당 프로젝트 내 포인트)
  currentPoints: int("current_points").default(0),
  // 누적 획득 포인트
  totalPointsEarned: int("total_points_earned").default(0),
  // 누적 사용 포인트
  totalPointsUsed: int("total_points_used").default(0),
  // 연회비 납부 여부
  annualFeePaid: boolean("annual_fee_paid").default(false),
  // 연회비 납부일
  annualFeePaidAt: timestamp("annual_fee_paid_at"),
  // 단계 변경일
  tierChangedAt: timestamp("tier_changed_at").defaultNow(),
  // 단계 변경 사유 (관리자 메모)
  tierChangeReason: text("tier_change_reason"),
  // 활성 여부
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ProjectUserMembership = typeof projectUserMemberships.$inferSelect;
export type InsertProjectUserMembership = typeof projectUserMemberships.$inferInsert;

// ─── Membership Policy History (멤버십 정책 변경 이력) ────────────────────────
// 관리자가 단계별 정책(혜택/연회비/포인트 임계값/색상 등)을 수정할 때마다 이력 기록
export const membershipPolicyHistory = mysqlTable("membership_policy_history", {
  id: int("id").autoincrement().primaryKey(),
  projectSlug: varchar("project_slug", { length: 100 }).notNull(),
  tierKey: varchar("tier_key", { length: 50 }).notNull(),
  tierLabel: varchar("tier_label", { length: 100 }).notNull(),
  changedBy: varchar("changed_by", { length: 255 }).notNull(), // 관리자 userId
  changedByName: varchar("changed_by_name", { length: 255 }),  // 관리자 이름
  changeType: mysqlEnum("change_type", [
    "benefits_update",    // 혜택 목록 수정
    "fee_update",         // 연회비/구독료 수정
    "point_threshold",    // 포인트 임계값 수정
    "color_update",       // 단계 색상 수정
    "label_update",       // 단계명 수정
    "status_toggle",      // 활성/비활성 전환
    "policy_note",        // 정책 메모 추가
    "full_update",        // 전체 업데이트
  ]).notNull(),
  previousValue: text("previous_value"),  // 변경 전 값 (JSON)
  newValue: text("new_value").notNull(),  // 변경 후 값 (JSON)
  changeNote: text("change_note"),        // 변경 사유/메모
  effectiveDate: timestamp("effective_date"),  // 적용 일자 (null=즉시 적용)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MembershipPolicyHistory = typeof membershipPolicyHistory.$inferSelect;
export type InsertMembershipPolicyHistory = typeof membershipPolicyHistory.$inferInsert;

// ─── 멤버십 카피라이팅 문구 테이블 ──────────────────────────────────────────
// 관리자가 앱/웹 멤버십 소개 페이지의 문구를 직접 편집
export const membershipCopy = mysqlTable("membership_copy", {
  id: int("id").autoincrement().primaryKey(),
  projectSlug: varchar("project_slug", { length: 50 }).notNull(), // 'glwa' | 'breathing-app' | 'global'
  copyKey: varchar("copy_key", { length: 100 }).notNull(),        // 'main_slogan' | 'sub_slogan' | 'intro_text' | 'tier_{key}_tagline'
  copyText: text("copy_text").notNull(),                          // 실제 문구
  copyType: varchar("copy_type", { length: 30 }).default("text"), // 'text' | 'html' | 'markdown'
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  updatedBy: varchar("updated_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});


// ─── 수면 추적 설정 테이블 ──────────────────────────────────────────────────
// 기본값: enabled=true (자동 체크 ON), 사용자가 원하면 optOut 가능
export const sleepTrackingSettings = mysqlTable("sleep_tracking_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().unique(),
  // 자동 수면 체크 활성화 여부 (기본값 true = 자동 ON)
  autoTrackEnabled: boolean("auto_track_enabled").default(true).notNull(),
  // 옵트아웃 여부 (true = 사용자가 명시적으로 거부)
  optedOut: boolean("opted_out").default(false).notNull(),
  // 옵트아웃 일시
  optedOutAt: timestamp("opted_out_at"),
  // 수면 감지 시작 시간 (기본 22:00)
  sleepStartHour: int("sleep_start_hour").default(22).notNull(),
  // 수면 감지 종료 시간 (기본 08:00)
  sleepEndHour: int("sleep_end_hour").default(8).notNull(),
  // 최소 수면 시간 (분 단위, 기본 30분)
  minSleepMinutes: int("min_sleep_minutes").default(30).notNull(),
  // 알림 허용 여부
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  // 마지막 자동 수면 기록 일시
  lastAutoRecordedAt: timestamp("last_auto_recorded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SleepTrackingSettings = typeof sleepTrackingSettings.$inferSelect;
export type InsertSleepTrackingSettings = typeof sleepTrackingSettings.$inferInsert;

// ─── 수면 기록 테이블 ────────────────────────────────────────────────────────
// 자동/수동 수면 기록 저장
export const sleepRecords = mysqlTable("sleep_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  // 수면 시작 시간
  sleepStart: timestamp("sleep_start").notNull(),
  // 수면 종료 시간
  sleepEnd: timestamp("sleep_end"),
  // 수면 시간 (분)
  durationMinutes: int("duration_minutes"),
  // 기록 방식: 'auto' = 자동 감지, 'manual' = 사용자 직접 입력
  recordType: mysqlEnum("record_type", ["auto", "manual"]).default("auto").notNull(),
  // 수면 품질 점수 (1~10, null = 미평가)
  qualityScore: int("quality_score"),
  // 수면 메모
  notes: text("notes"),
  // 연동 앱 ('self' | 'apple_health' | 'samsung_health' | 'google_fit')
  dataSource: varchar("data_source", { length: 50 }).default("self").notNull(),
  // 포인트 적립 여부
  pointsAwarded: int("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SleepRecord = typeof sleepRecords.$inferSelect;
export type InsertSleepRecord = typeof sleepRecords.$inferInsert;

// project_registry, stripe_subscriptions, stripe_payments
export const projectRegistry = mysqlTable("project_registry", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  projectType: mysqlEnum("project_type", ["membership", "subscription", "community"]).default("subscription").notNull(),
  parentSlug: varchar("parent_slug", { length: 64 }),
  maxTiers: int("max_tiers").default(10),
  bioTrackingEnabled: boolean("bio_tracking_enabled").default(false),
  aiFeedbackLevel: mysqlEnum("ai_feedback_level", ["none", "basic", "full"]).default("none"),
  stripeProductId: varchar("stripe_product_id", { length: 128 }),
  icon: varchar("icon", { length: 256 }),
  themeColor: varchar("theme_color", { length: 16 }).default("#6366f1"),
  sortOrder: int("sort_order").default(99),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ProjectRegistry = typeof projectRegistry.$inferSelect;
export type InsertProjectRegistry = typeof projectRegistry.$inferInsert;

export const stripeSubscriptions = mysqlTable("stripe_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  stripePriceId: varchar("stripe_price_id", { length: 128 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing", "incomplete"]).default("incomplete"),
  tierKey: varchar("tier_key", { length: 64 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

export const stripePayments = mysqlTable("stripe_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 128 }),
  amountKrw: int("amount_krw"),
  currency: varchar("currency", { length: 8 }).default("krw"),
  status: mysqlEnum("status", ["succeeded", "pending", "failed", "refunded"]).default("pending"),
  description: varchar("description", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type StripePayment = typeof stripePayments.$inferSelect;
export type InsertStripePayment = typeof stripePayments.$inferInsert;

// ─── 미션 관리 시스템 ──────────────────────────────────────────────────────────

// ─── 미션 관리 시스템 ──────────────────────────────────────────────────────────
export const missions = mysqlTable("missions", {
  id: int("id").autoincrement().primaryKey(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull().default("all"),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  missionType: mysqlEnum("mission_type", ["scheduled", "optional"]).default("optional").notNull(),
  category: mysqlEnum("category", ["breathing", "exercise", "sleep", "nutrition", "meditation", "quiz", "custom"]).default("custom").notNull(),
  pointsReward: int("points_reward").default(10).notNull(),
  scheduledTime: varchar("scheduled_time", { length: 8 }),
  scheduledDays: varchar("scheduled_days", { length: 32 }),
  durationMinutes: int("duration_minutes").default(10),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: int("sort_order").default(99),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

export const missionCompletions = mysqlTable("mission_completions", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("mission_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull().default("all"),
  pointsAwarded: int("points_awarded").default(0).notNull(),
  feedbackSent: boolean("feedback_sent").default(false).notNull(),
  feedbackContent: text("feedback_content"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});
export type MissionCompletion = typeof missionCompletions.$inferSelect;
export type InsertMissionCompletion = typeof missionCompletions.$inferInsert;

// ─── 관리자 발송 이벤트 (스케줄/즉석 발송) ────────────────────────────────────
export const adminEvents = mysqlTable("admin_events", {
  id: int("id").autoincrement().primaryKey(),
  projectSlug: varchar("project_slug", { length: 64 }).notNull().default("all"),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  sendType: mysqlEnum("send_type", ["scheduled", "instant", "recurring"]).default("instant").notNull(),
  targetAudience: mysqlEnum("target_audience", ["all", "top_1pct", "top_5pct", "top_10pct", "bottom_20pct", "inactive"]).default("all").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  recurringCron: varchar("recurring_cron", { length: 64 }),
  sendStatus: mysqlEnum("send_status", ["draft", "scheduled", "sending", "sent", "canceled"]).default("draft").notNull(),
  sentAt: timestamp("sent_at"),
  sentCount: int("sent_count").default(0),
  openCount: int("open_count").default(0),
  createdBy: varchar("created_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type AdminEvent = typeof adminEvents.$inferSelect;
export type InsertAdminEvent = typeof adminEvents.$inferInsert;

// ─── GLWA 건강 10단계 정의 ─────────────────────────────────────────────────────
export const healthSteps = mysqlTable("health_steps", {
  id: int("id").autoincrement().primaryKey(),
  stepNumber: int("step_number").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(),
  iconName: varchar("icon_name", { length: 64 }),
  colorHex: varchar("color_hex", { length: 7 }).default("#3b82f6"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type HealthStep = typeof healthSteps.$inferSelect;
export type InsertHealthStep = typeof healthSteps.$inferInsert;

// ─── 미션-건강단계 연결 ────────────────────────────────────────────────────────
export const missionStepLinks = mysqlTable("mission_step_links", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("mission_id").notNull(),
  healthStepId: int("health_step_id").notNull(),
  sortOrder: int("sort_order").default(0),
});
export type MissionStepLink = typeof missionStepLinks.$inferSelect;

// ─── 이벤트-미션 양방향 연동 ──────────────────────────────────────────────────
export const eventMissionLinks = mysqlTable("event_mission_links", {
  id: int("id").autoincrement().primaryKey(),
  adminEventId: int("admin_event_id").notNull(),
  missionId: int("mission_id").notNull(),
  bonusPoints: int("bonus_points").default(0).notNull(),
  requiredCompletions: int("required_completions").default(1).notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type EventMissionLink = typeof eventMissionLinks.$inferSelect;
export type InsertEventMissionLink = typeof eventMissionLinks.$inferInsert;
