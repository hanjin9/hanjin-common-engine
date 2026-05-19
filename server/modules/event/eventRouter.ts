/**
 * eventRouter.ts — 이벤트 관리 tRPC 라우터
 * - 이벤트 CRUD (생성/수정/삭제/목록)
 * - 즉석 발송 + 예약 발송
 * - 미션 연동 (이벤트↔미션 양방향)
 * - 발송 통계
 */
import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import { adminEvents, eventMissionLinks, missions } from "../../../drizzle/schema";
import { eq, desc, count, and, gte, sql } from "drizzle-orm";
import { notifyOwner } from "../../_core/notification";

export const eventRouter = router({
  // ─── 이벤트 목록 ───────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      projectSlug: z.string().default("all"),
      sendStatus: z.enum(["draft", "scheduled", "sending", "sent", "canceled", "all"]).default("all"),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const offset = (input.page - 1) * input.pageSize;
      const conditions = [];
      if (input.projectSlug !== "all") conditions.push(eq(adminEvents.projectSlug, input.projectSlug));
      if (input.sendStatus !== "all") conditions.push(eq(adminEvents.sendStatus, input.sendStatus));

      const items = await db
        .select()
        .from(adminEvents)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(adminEvents.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(adminEvents)
        .where(conditions.length ? and(...conditions) : undefined);

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  // ─── 이벤트 생성 ───────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectSlug: z.string().default("all"),
      title: z.string().min(1).max(256),
      content: z.string().min(1),
      sendType: z.enum(["scheduled", "instant", "recurring"]).default("instant"),
      targetAudience: z.enum(["all", "top_1pct", "top_5pct", "top_10pct", "bottom_20pct", "inactive"]).default("all"),
      scheduledAt: z.number().optional(), // UTC timestamp ms
      recurringCron: z.string().optional(),
      linkedMissionIds: z.array(z.object({
        missionId: z.number(),
        bonusPoints: z.number().default(0),
        requiredCompletions: z.number().default(1),
        isRequired: z.boolean().default(false),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { linkedMissionIds, scheduledAt, ...eventData } = input;

      const [result] = await db.insert(adminEvents).values({
        ...eventData,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        sendStatus: input.sendType === "instant" ? "draft" : "scheduled",
        createdBy: ctx.user.openId,
      });
      const newId = (result as any).insertId as number;

      // 미션 연동
      if (linkedMissionIds?.length) {
        await db.insert(eventMissionLinks).values(
          linkedMissionIds.map(lm => ({
            adminEventId: newId,
            missionId: lm.missionId,
            bonusPoints: lm.bonusPoints,
            requiredCompletions: lm.requiredCompletions,
            isRequired: lm.isRequired,
          }))
        );
      }

      // 즉석 발송이면 바로 발송
      if (input.sendType === "instant") {
        await notifyOwner({ title: `[이벤트] ${input.title}`, content: input.content });
        await db.update(adminEvents)
          .set({ sendStatus: "sent", sentAt: new Date(), sentCount: 1 })
          .where(eq(adminEvents.id, newId));
      }

      return { id: newId, success: true };
    }),

  // ─── 이벤트 수정 ───────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(256).optional(),
      content: z.string().optional(),
      sendType: z.enum(["scheduled", "instant", "recurring"]).optional(),
      targetAudience: z.enum(["all", "top_1pct", "top_5pct", "top_10pct", "bottom_20pct", "inactive"]).optional(),
      scheduledAt: z.number().optional(),
      recurringCron: z.string().optional(),
      sendStatus: z.enum(["draft", "scheduled", "sending", "sent", "canceled"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, scheduledAt, ...updateData } = input;
      await db.update(adminEvents).set({
        ...updateData,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      }).where(eq(adminEvents.id, id));
      return { success: true };
    }),

  // ─── 이벤트 삭제 ───────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(eventMissionLinks).where(eq(eventMissionLinks.adminEventId, input.id));
      await db.delete(adminEvents).where(eq(adminEvents.id, input.id));
      return { success: true };
    }),

  // ─── 즉석 발송 ─────────────────────────────────────────────────────────────
  sendInstant: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      targetAudience: z.enum(["all", "top_1pct", "top_5pct", "top_10pct", "bottom_20pct", "inactive"]).default("all"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      let eventId = input.id;

      if (!eventId) {
        if (!input.title || !input.content) throw new Error("제목과 내용을 입력하세요");
        const [result] = await db.insert(adminEvents).values({
          title: input.title,
          content: input.content,
          sendType: "instant",
          targetAudience: input.targetAudience,
          sendStatus: "sent",
          sentAt: new Date(),
          sentCount: 1,
          createdBy: ctx.user.openId,
        });
        eventId = (result as any).insertId as number;
      }

      const [event] = await db.select().from(adminEvents).where(eq(adminEvents.id, eventId));
      if (!event) throw new Error("이벤트를 찾을 수 없습니다");

      await notifyOwner({ title: `[이벤트] ${event.title}`, content: event.content });
      await db.update(adminEvents)
        .set({ sendStatus: "sent", sentAt: new Date(), sentCount: (event.sentCount ?? 0) + 1 })
        .where(eq(adminEvents.id, eventId));

      return { success: true, eventTitle: event.title };
    }),

  // ─── 이벤트 연결 미션 조회 ─────────────────────────────────────────────────
  getLinkedMissions: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const links = await db
        .select({
          linkId: eventMissionLinks.id,
          bonusPoints: eventMissionLinks.bonusPoints,
          requiredCompletions: eventMissionLinks.requiredCompletions,
          isRequired: eventMissionLinks.isRequired,
          missionId: missions.id,
          missionTitle: missions.title,
          category: missions.category,
          pointsReward: missions.pointsReward,
          durationMinutes: missions.durationMinutes,
        })
        .from(eventMissionLinks)
        .leftJoin(missions, eq(eventMissionLinks.missionId, missions.id))
        .where(eq(eventMissionLinks.adminEventId, input.eventId));
      return links;
    }),

  // ─── 이벤트 통계 요약 ──────────────────────────────────────────────────────
  getStats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [total] = await db.select({ count: count() }).from(adminEvents);
    const [scheduled] = await db.select({ count: count() }).from(adminEvents)
      .where(eq(adminEvents.sendStatus, "scheduled"));
    const [sentToday] = await db.select({ count: count() }).from(adminEvents)
      .where(and(eq(adminEvents.sendStatus, "sent"), gte(adminEvents.sentAt, todayStart)));
    const [drafts] = await db.select({ count: count() }).from(adminEvents)
      .where(eq(adminEvents.sendStatus, "draft"));

    const upcoming = await db
      .select()
      .from(adminEvents)
      .where(and(eq(adminEvents.sendStatus, "scheduled"), sql`${adminEvents.scheduledAt} > NOW()`))
      .orderBy(adminEvents.scheduledAt)
      .limit(5);

    return {
      total: total.count,
      scheduled: scheduled.count,
      sentToday: sentToday.count,
      drafts: drafts.count,
      upcoming,
    };
  }),
});
