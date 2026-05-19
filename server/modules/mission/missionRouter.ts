/**
 * missionRouter.ts — 미션 관리 tRPC 라우터
 * - 미션 CRUD (생성/수정/삭제/목록)
 * - 건강 10단계별 미션 조회
 * - 즉석 발송 (notifyOwner 활용)
 * - 완료 현황 통계
 */
import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  missions, missionCompletions, healthSteps, missionStepLinks
} from "../../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { notifyOwner } from "../../_core/notification";
import { storagePut } from "../../storage";
import { invokeLLM } from "../../_core/llm";
import { nanoid } from "nanoid";

export const missionRouter = router({
  // ─── 건강 10단계 목록 ──────────────────────────────────────────────────────
  getHealthSteps: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
    const steps = await db
      .select()
      .from(healthSteps)
      .orderBy(healthSteps.sortOrder);
    return steps;
  }),

  // ─── 미션 목록 (전체 또는 단계별) ─────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      projectSlug: z.string().default("all"),
      healthStepId: z.number().optional(),
      missionType: z.enum(["scheduled", "optional", "all"]).default("all"),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const offset = (input.page - 1) * input.pageSize;

      if (input.healthStepId) {
        // 특정 단계의 미션만 조회
        const linked = await db
          .select({ missionId: missionStepLinks.missionId })
          .from(missionStepLinks)
          .where(eq(missionStepLinks.healthStepId, input.healthStepId));
        const ids = linked.map((l: { missionId: number }) => l.missionId);
        if (!ids.length) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };

        const items = await db
          .select()
          .from(missions)
          .where(sql`${missions.id} IN (${ids.join(",")})`)
          .orderBy(missions.sortOrder, missions.createdAt)
          .limit(input.pageSize)
          .offset(offset);
        return { items, total: items.length, page: input.page, pageSize: input.pageSize };
      }

      const conditions = [];
      if (input.projectSlug !== "all") conditions.push(eq(missions.projectSlug, input.projectSlug));
      if (input.missionType !== "all") conditions.push(eq(missions.missionType, input.missionType));

      const items = await db
        .select()
        .from(missions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(missions.sortOrder, missions.createdAt)
        .limit(input.pageSize)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(missions)
        .where(conditions.length ? and(...conditions) : undefined);

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  // ─── 미션 생성 ─────────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectSlug: z.string().default("all"),
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      missionType: z.enum(["scheduled", "optional"]).default("optional"),
      category: z.enum(["breathing", "exercise", "sleep", "nutrition", "meditation", "quiz", "custom"]).default("custom"),
      pointsReward: z.number().min(0).default(10),
      scheduledTime: z.string().optional(),
      scheduledDays: z.string().optional(),
      durationMinutes: z.number().min(1).default(10),
      isActive: z.boolean().default(true),
      healthStepId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { healthStepId, ...missionData } = input;
      const [result] = await db.insert(missions).values({
        ...missionData,
        createdBy: ctx.user.openId,
      });
      const newId = (result as any).insertId as number;

      // 건강 단계 연결
      if (healthStepId) {
        await db.insert(missionStepLinks).values({
          missionId: newId,
          healthStepId,
          sortOrder: 0,
        });
      }
      return { id: newId, success: true };
    }),

  // ─── 미션 수정 ─────────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      missionType: z.enum(["scheduled", "optional"]).optional(),
      category: z.enum(["breathing", "exercise", "sleep", "nutrition", "meditation", "quiz", "custom"]).optional(),
      pointsReward: z.number().min(0).optional(),
      scheduledTime: z.string().optional(),
      scheduledDays: z.string().optional(),
      durationMinutes: z.number().min(1).optional(),
      isActive: z.boolean().optional(),
      healthStepId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, healthStepId, ...updateData } = input;
      await db.update(missions).set(updateData).where(eq(missions.id, id));

      if (healthStepId !== undefined) {
        await db.delete(missionStepLinks).where(eq(missionStepLinks.missionId, id));
        if (healthStepId > 0) {
          await db.insert(missionStepLinks).values({ missionId: id, healthStepId, sortOrder: 0 });
        }
      }
      return { success: true };
    }),

  // ─── 미션 삭제 ─────────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(missionStepLinks).where(eq(missionStepLinks.missionId, input.id));
      await db.delete(missions).where(eq(missions.id, input.id));
      return { success: true };
    }),

  // ─── 즉석 발송 ─────────────────────────────────────────────────────────────
  sendInstant: protectedProcedure
    .input(z.object({
      missionId: z.number(),
      projectSlug: z.string().default("all"),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [mission] = await db
        .select()
        .from(missions)
        .where(eq(missions.id, input.missionId));

      if (!mission) throw new Error("미션을 찾을 수 없습니다");

      const message = input.customMessage
        ?? `🎯 새 미션이 도착했습니다!\n\n**${mission.title}**\n${mission.description ?? ""}\n\n⏱ 소요 시간: ${mission.durationMinutes}분\n🏆 보상: ${mission.pointsReward}P`;

      await notifyOwner({
        title: `[미션 발송] ${mission.title}`,
        content: message,
      });

      return { success: true, missionTitle: mission.title };
    }),

  // ─── 완료 현황 통계 ────────────────────────────────────────────────────────
  getCompletionStats: protectedProcedure
    .input(z.object({ projectSlug: z.string().default("all") }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMissions] = await db.select({ count: count() }).from(missions)
        .where(input.projectSlug !== "all" ? eq(missions.projectSlug, input.projectSlug) : undefined);

      const [activeMissions] = await db.select({ count: count() }).from(missions)
        .where(and(
          eq(missions.isActive, true),
          input.projectSlug !== "all" ? eq(missions.projectSlug, input.projectSlug) : undefined,
        ));

      const [todayCompletions] = await db.select({ count: count() }).from(missionCompletions)
        .where(sql`${missionCompletions.completedAt} >= ${today}`);

      const recentCompletions = await db
        .select({
          id: missionCompletions.id,
          userId: missionCompletions.userId,
          missionId: missionCompletions.missionId,
          pointsAwarded: missionCompletions.pointsAwarded,
          completedAt: missionCompletions.completedAt,
          missionTitle: missions.title,
          category: missions.category,
        })
        .from(missionCompletions)
        .leftJoin(missions, eq(missionCompletions.missionId, missions.id))
        .orderBy(desc(missionCompletions.completedAt))
        .limit(10);

      return {
        totalMissions: totalMissions.count,
        activeMissions: activeMissions.count,
        todayCompletions: todayCompletions.count,
        recentCompletions,
      };
    }),

  // ─── 단계별 미션 수 요약 ───────────────────────────────────────────────────
  getStepMissionCounts: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
    const steps = await db.select().from(healthSteps).orderBy(healthSteps.sortOrder);
    const result = await Promise.all(steps.map(async (step) => {
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(missionStepLinks)
        .where(eq(missionStepLinks.healthStepId, step.id));
      return { ...step, missionCount: cnt };
    }));
    return result;
  }),

  // ─── AI 미션 자동 생성 (GLWA 이식) ────────────────────────────────────────
  generate: protectedProcedure
    .input(z.object({
      period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      healthStepId: z.number().optional(),
      count: z.number().min(1).max(10).default(3),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const periodDays: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };
      const days = periodDays[input.period] || 1;
      const dueDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      const pointRewards: Record<string, number> = { daily: 10, weekly: 50, monthly: 200 };
      const reward = pointRewards[input.period] || 10;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 건강 수련 미션 전문가입니다. 사용자에게 맞는 건강 미션을 JSON 형식으로 생성해주세요." },
            { role: "user", content: `${input.period} 주기의 건강 미션 ${input.count}개를 생성해주세요. 카테고리: breathing, exercise, sleep, nutrition, meditation 중 선택. JSON 형식: {"missions":[{"title":"...","description":"...","category":"...","difficulty":"beginner|intermediate|advanced"}]}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "missions", strict: true,
              schema: {
                type: "object",
                properties: { missions: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" }, difficulty: { type: "string" } }, required: ["title", "description", "category", "difficulty"], additionalProperties: false } } },
                required: ["missions"], additionalProperties: false,
              },
            },
          },
        });
        const parsed = JSON.parse(response.choices[0].message.content as string);
        const generatedMissions = parsed.missions || [];
        for (const m of generatedMissions) {
          const [result] = await db.insert(missions).values({
            title: m.title, description: m.description,
            category: m.category as any,
            pointsReward: reward,
            missionType: input.period === "daily" ? "scheduled" : "optional",
            isActive: true,
            createdBy: ctx.user.openId,
          });
          if (input.healthStepId) {
            const newId = (result as any).insertId as number;
            await db.insert(missionStepLinks).values({ missionId: newId, healthStepId: input.healthStepId, sortOrder: 0 });
          }
        }
      } catch {
        // LLM 실패 시 기본 미션 생성
        await db.insert(missions).values({ title: "5분 복식호흡 훈련", description: "편안한 자세에서 5분간 복식호흡을 실시하세요.", category: "breathing", pointsReward: reward, missionType: "scheduled", isActive: true, createdBy: ctx.user.openId });
        await db.insert(missions).values({ title: "10분 스트레칭 루틴", description: "목, 어깨, 허리를 중심으로 10분간 스트레칭을 실시하세요.", category: "exercise", pointsReward: reward, missionType: "scheduled", isActive: true, createdBy: ctx.user.openId });
      }
      return { success: true, dueDate };
    }),

  // ─── 미션 완료 인증 (사진 + 포인트 페이백) ────────────────────────────────
  submit: protectedProcedure
    .input(z.object({
      missionId: z.number(),
      photoBase64: z.string().optional(),
      photoContentType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const completionRate = Math.floor(Math.random() * 30) + 70;
      const paybackRate = Math.round((completionRate / 100) * 50); // 기본 50% 페이백

      let photoUrl: string | undefined;
      if (input.photoBase64) {
        try {
          const buffer = Buffer.from(input.photoBase64, "base64");
          const ext = (input.photoContentType || "image/jpeg").split("/")[1] || "jpg";
          const key = `mission-photos/${ctx.user.openId}/${input.missionId}-${nanoid(8)}.${ext}`;
          const { url } = await storagePut(key, buffer, input.photoContentType || "image/jpeg");
          photoUrl = url;
        } catch (e) {
          console.warn("[Mission] Photo upload failed:", e);
        }
      }

      // 완료 기록 저장
      await db.insert(missionCompletions).values({
        userId: String(ctx.user.id),
        missionId: input.missionId,
        pointsAwarded: paybackRate,
        feedbackContent: photoUrl ? `photo:${photoUrl}` : null,
        completedAt: new Date(),
      });

      try {
        await notifyOwner({
          title: `✅ 미션 인증 완료`,
          content: `회원: ${ctx.user.name || "미입력"}\n미션ID: ${input.missionId}\n완수율: ${completionRate}%\n페이백: ${paybackRate}P${photoUrl ? `\n인증사진: ${photoUrl}` : ""}`,
        });
      } catch (e) {
        console.warn("[Mission] Notification failed:", e);
      }
      return { success: true, completionRate, paybackRate, photoUrl };
    }),

  // ─── 필수 미션 인증 (회사 부여 미션 사진 제출) ────────────────────────────
  submitRequiredMission: protectedProcedure
    .input(z.object({
      missionTitle: z.string(),
      difficulty: z.string().optional(),
      photoBase64: z.string(),
      photoContentType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      let photoUrl = "";
      try {
        const buffer = Buffer.from(input.photoBase64, "base64");
        const ext = (input.photoContentType || "image/jpeg").split("/")[1] || "jpg";
        const key = `required-mission-photos/${ctx.user.openId}/${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.photoContentType || "image/jpeg");
        photoUrl = url;
      } catch (e) {
        console.warn("[RequiredMission] Photo upload failed:", e);
      }
      try {
        await notifyOwner({
          title: `📸 필수 미션 인증 제출`,
          content: `회원: ${ctx.user.name || "미입력"}\n미션: ${input.missionTitle}\n난이도: ${input.difficulty || "일반"}${photoUrl ? `\n인증사진: ${photoUrl}` : ""}\n\n관리자 페이지에서 확인 후 승인해주세요.`,
        });
      } catch (e) {
        console.warn("[RequiredMission] Notification failed:", e);
      }
      return { success: true, photoUrl };
    }),
});
