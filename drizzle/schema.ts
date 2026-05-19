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
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }).default(0),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default(0),
  avgSubscriptionValue: decimal("avg_subscription_value", { precision: 10, scale: 2 }).default(0),
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
