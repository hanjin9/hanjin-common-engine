import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { getDb } from "../../db";
import {
  i18nTranslations,
  mobileApiTokens,
  externalHealthConnections,
} from "../../../drizzle/schema";
import { eq, desc, and, count } from "drizzle-orm";
import crypto from "crypto";

export const globalRouter = router({
  // 다국어 번역 목록
  getTranslations: protectedProcedure
    .input(
      z.object({
        locale: z.string().optional(),
        namespace: z.string().optional(),
        approvedOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.locale) conditions.push(eq(i18nTranslations.locale, input.locale));
      if (input.namespace) conditions.push(eq(i18nTranslations.namespace, input.namespace));
      if (input.approvedOnly) conditions.push(eq(i18nTranslations.isApproved, true));

      return await (await getDb())!
        .select()
        .from(i18nTranslations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(i18nTranslations.locale, i18nTranslations.namespace, i18nTranslations.key);
    }),

  // 번역 추가/수정
  upsertTranslation: protectedProcedure
    .input(
      z.object({
        locale: z.string(),
        namespace: z.string(),
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await (await getDb())!
        .select()
        .from(i18nTranslations)
        .where(
          and(
            eq(i18nTranslations.locale, input.locale),
            eq(i18nTranslations.namespace, input.namespace),
            eq(i18nTranslations.key, input.key)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await (await getDb())!
          .update(i18nTranslations)
          .set({ value: input.value, isApproved: false })
          .where(eq(i18nTranslations.id, existing[0].id));
        return { id: existing[0].id, updated: true };
      } else {
        const [translation] = await (await getDb())!
          .insert(i18nTranslations)
          .values({ ...input, isApproved: false })
          .$returningId();
        return { id: translation.id, updated: false };
      }
    }),

  // 번역 승인
  approveTranslation: protectedProcedure
    .input(z.object({ translationId: z.number() }))
    .mutation(async ({ input }) => {
      await (await getDb())!
        .update(i18nTranslations)
        .set({ isApproved: true })
        .where(eq(i18nTranslations.id, input.translationId));
      return { success: true };
    }),

  // 지원 언어 목록
  getSupportedLocales: protectedProcedure.query(async () => {
    const locales = await (await getDb())!
      .selectDistinct({ locale: i18nTranslations.locale })
      .from(i18nTranslations);
    return locales.map((l) => l.locale);
  }),

  // 모바일 API 토큰 목록
  getMobileTokens: protectedProcedure.query(async ({ ctx }) => {
    return await (await getDb())!
      .select()
      .from(mobileApiTokens)
      .where(
        and(
          eq(mobileApiTokens.userId, ctx.user.id),
          eq(mobileApiTokens.isActive, true)
        )
      )
      .orderBy(desc(mobileApiTokens.lastUsedAt));
  }),

  // 모바일 API 토큰 생성
  createMobileToken: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["ios", "android"]),
        appVersion: z.string().optional(),
        deviceInfo: z.record(z.string(), z.unknown()).optional(),
        expiresInDays: z.number().default(365),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

      const [mobileToken] = await (await getDb())!
        .insert(mobileApiTokens)
        .values({
          userId: ctx.user.id,
          token,
          platform: input.platform,
          appVersion: input.appVersion,
          deviceInfo: input.deviceInfo,
          isActive: true,
          expiresAt,
        })
        .$returningId();

      return { id: mobileToken.id, token, expiresAt };
    }),

  // 모바일 API 토큰 폐기
  revokeMobileToken: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(mobileApiTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(mobileApiTokens.id, input.tokenId),
            eq(mobileApiTokens.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // 외부 헬스 플랫폼 연동 목록
  getHealthConnections: protectedProcedure.query(async ({ ctx }) => {
    return await (await getDb())!
      .select()
      .from(externalHealthConnections)
      .where(
        and(
          eq(externalHealthConnections.userId, ctx.user.id),
          eq(externalHealthConnections.isActive, true)
        )
      )
      .orderBy(externalHealthConnections.platform);
  }),

  // 외부 헬스 플랫폼 연동 추가
  addHealthConnection: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["apple_health", "google_fit", "samsung_health", "garmin_connect", "strava"]),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: z.date().optional(),
        scope: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 기존 연동 비활성화
      await (await getDb())!
        .update(externalHealthConnections)
        .set({ isActive: false })
        .where(
          and(
            eq(externalHealthConnections.userId, ctx.user.id),
            eq(externalHealthConnections.platform, input.platform)
          )
        );

      const [connection] = await (await getDb())!
        .insert(externalHealthConnections)
        .values({
          userId: ctx.user.id,
          ...input,
          isActive: true,
        })
        .$returningId();

      return connection;
    }),

  // 외부 헬스 플랫폼 연동 해제
  removeHealthConnection: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(externalHealthConnections)
        .set({ isActive: false })
        .where(
          and(
            eq(externalHealthConnections.id, input.connectionId),
            eq(externalHealthConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // 헬스 데이터 동기화 (마지막 동기화 시간 업데이트)
  syncHealthData: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await (await getDb())!
        .update(externalHealthConnections)
        .set({ lastSyncAt: new Date() })
        .where(
          and(
            eq(externalHealthConnections.id, input.connectionId),
            eq(externalHealthConnections.userId, ctx.user.id)
          )
        );
      return { success: true, syncedAt: new Date() };
    }),

  // 글로벌 설정 요약
  getGlobalSummary: protectedProcedure.query(async () => {
    const [translationCount] = await (await getDb())!.select({ count: count() }).from(i18nTranslations);
    const [approvedCount] = await (await getDb())!
      .select({ count: count() })
      .from(i18nTranslations)
      .where(eq(i18nTranslations.isApproved, true));
    const [activeTokens] = await (await getDb())!
      .select({ count: count() })
      .from(mobileApiTokens)
      .where(eq(mobileApiTokens.isActive, true));
    const [healthConnections] = await (await getDb())!
      .select({ count: count() })
      .from(externalHealthConnections)
      .where(eq(externalHealthConnections.isActive, true));

    return {
      totalTranslations: translationCount.count,
      approvedTranslations: approvedCount.count,
      activeMobileTokens: activeTokens.count,
      activeHealthConnections: healthConnections.count,
    };
  }),
});
