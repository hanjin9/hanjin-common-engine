/**
 * copyRouter.ts
 * 멤버십 카피라이팅 문구 관리 tRPC 라우터
 * - 관리자가 앱/웹 멤버십 소개 페이지 문구를 직접 편집
 * - 초기 시드 데이터: GLWA 10단계 + 숨호흡 앱 문구
 */
import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../../_core/trpc';
import { getDb } from '../../db';
import { membershipCopy } from '../../../drizzle/schema';
import { eq, and, asc } from 'drizzle-orm';

// ─── GLWA 초기 카피 시드 데이터 ──────────────────────────────────────────────
const GLWA_COPY_SEED = [
  // 전체 슬로건
  { copyKey: 'main_slogan',    copyText: '당신의 건강이 곧 당신의 등급입니다.',                                    sortOrder: 1 },
  { copyKey: 'sub_slogan',     copyText: '20년 더 젊게. 10단계의 여정.',                                          sortOrder: 2 },
  { copyKey: 'intro_text',     copyText: 'GLWA VIP 멤버십 — 건강 수련 기간과 활동으로 승급하는 10단계 프리미엄 건강 클럽', sortOrder: 3 },
  { copyKey: 'cta_button',     copyText: '지금 시작하기',                                                         sortOrder: 4 },
  { copyKey: 'cta_sub',        copyText: '무료로 Bronze 단계에서 시작하세요',                                      sortOrder: 5 },
  // 단계별 태그라인
  { copyKey: 'tier_bronze_tagline',        copyText: '건강 수련의 시작. 첫 걸음을 내딛다.',          sortOrder: 11 },
  { copyKey: 'tier_silver_tagline',        copyText: '꾸준함이 만드는 변화.',                        sortOrder: 12 },
  { copyKey: 'tier_gold_tagline',          copyText: '건강이 습관이 된 사람들.',                     sortOrder: 13 },
  { copyKey: 'tier_emerald_tagline',       copyText: '몸과 마음의 균형을 찾다.',                     sortOrder: 14 },
  { copyKey: 'tier_green_emerald_tagline', copyText: '자연과 함께하는 건강 수련.',                   sortOrder: 15 },
  { copyKey: 'tier_sapphire_tagline',      copyText: '깊이 있는 수련의 경지.',                       sortOrder: 16 },
  { copyKey: 'tier_blue_sapphire_tagline', copyText: '건강 수련의 진정한 고수.',                     sortOrder: 17 },
  { copyKey: 'tier_diamond_tagline',       copyText: '흔들리지 않는 건강의 기반.',                   sortOrder: 18 },
  { copyKey: 'tier_blue_diamond_tagline',  copyText: '최고를 향한 마지막 관문.',                     sortOrder: 19 },
  { copyKey: 'tier_platinum_tagline',      copyText: 'GLWA 최고 등급. 건강 수련의 완성.',            sortOrder: 20 },
  { copyKey: 'tier_black_platinum_tagline',copyText: '전설의 영역. (Coming Soon)',                   sortOrder: 21 },
];

const BREATHING_COPY_SEED = [
  { copyKey: 'main_slogan',  copyText: '숨 하나로 시작하는 건강 혁명.',                  sortOrder: 1 },
  { copyKey: 'sub_slogan',   copyText: '매일 3분, 당신의 몸이 달라집니다.',              sortOrder: 2 },
  { copyKey: 'intro_text',   copyText: '숨호흡 — 과학적 호흡법으로 스트레스를 해소하고 활력을 되찾는 건강 앱', sortOrder: 3 },
  { copyKey: 'cta_button',   copyText: '무료로 시작하기',                                sortOrder: 4 },
];

export const copyRouter = router({
  /**
   * 공개: 프로젝트별 카피 문구 조회 (앱/웹 표시용)
   */
  getByProject: publicProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const rows = await db
        .select()
        .from(membershipCopy)
        .where(and(
          eq(membershipCopy.projectSlug, input.projectSlug),
          eq(membershipCopy.isActive, true)
        ))
        .orderBy(asc(membershipCopy.sortOrder));
      // copyKey → copyText 맵으로 반환
      return Object.fromEntries(rows.map(r => [r.copyKey, r.copyText]));
    }),

  /**
   * 관리자: 전체 카피 목록 조회 (편집 UI용)
   */
  adminGetAll: adminProcedure
    .input(z.object({ projectSlug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return db
        .select()
        .from(membershipCopy)
        .where(eq(membershipCopy.projectSlug, input.projectSlug))
        .orderBy(asc(membershipCopy.sortOrder));
    }),

  /**
   * 관리자: 카피 문구 수정
   */
  adminUpdate: adminProcedure
    .input(z.object({
      id: z.number(),
      copyText: z.string().min(1),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db
        .update(membershipCopy)
        .set({
          copyText: input.copyText,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          updatedBy: ctx.user.name ?? ctx.user.openId,
          updatedAt: new Date(),
        })
        .where(eq(membershipCopy.id, input.id));
      return { success: true };
    }),

  /**
   * 관리자: 카피 문구 추가
   */
  adminCreate: adminProcedure
    .input(z.object({
      projectSlug: z.string(),
      copyKey: z.string().min(1),
      copyText: z.string().min(1),
      sortOrder: z.number().default(99),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const result = await db.insert(membershipCopy).values({
        projectSlug: input.projectSlug,
        copyKey: input.copyKey,
        copyText: input.copyText,
        sortOrder: input.sortOrder,
        updatedBy: ctx.user.name ?? ctx.user.openId,
      });
      return { success: true, insertId: (result as { insertId?: number }).insertId };
    }),

  /**
   * 관리자: 초기 시드 데이터 삽입
   */
  adminSeedCopy: adminProcedure
    .input(z.object({
      projectSlug: z.enum(['glwa', 'breathing-app']),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      // 이미 있으면 스킵 (force=true면 삭제 후 재삽입)
      const existing = await db
        .select({ id: membershipCopy.id })
        .from(membershipCopy)
        .where(eq(membershipCopy.projectSlug, input.projectSlug))
        .limit(1);
      if (existing.length > 0 && !input.force) {
        return { skipped: true, message: `${input.projectSlug} 카피 데이터가 이미 존재합니다.` };
      }
      const seed = input.projectSlug === 'glwa' ? GLWA_COPY_SEED : BREATHING_COPY_SEED;
      const rows = seed.map(s => ({
        projectSlug: input.projectSlug,
        copyKey: s.copyKey,
        copyText: s.copyText,
        sortOrder: s.sortOrder,
        updatedBy: 'system_seed',
      }));
      await db.insert(membershipCopy).values(rows);
      return { skipped: false, inserted: rows.length, message: `${input.projectSlug} 카피 ${rows.length}개 삽입 완료` };
    }),
});

export default copyRouter;
