/**
 * missionScheduler.ts — Heartbeat 기반 미션 스케줄러 핸들러
 *
 * 규칙:
 * - setInterval / node-cron 절대 금지
 * - Heartbeat HTTP cron: platform이 /api/scheduled/* 로 POST
 * - 배포 후에만 실제 동작 (개발환경에서는 핸들러만 등록)
 */
import type { Request, Response } from "express";
import { sdk } from "../../_core/sdk";
import { getDb } from "../../db";
import { missions, missionCompletions } from "../../../drizzle/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { notifyOwner } from "../../_core/notification";

// ─── 일일 미션 자동 발송 핸들러 ──────────────────────────────────────────────
export async function handleDailyMissionPush(req: Request, res: Response) {
  try {
    // Heartbeat 인증
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "Cron only endpoint" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, error: "DB not available" });

    // 오늘 요일 (0=일, 1=월, ..., 6=토)
    const today = new Date();
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const todayName = dayNames[today.getDay()];

    // 활성 미션 조회
    const activeMissions = await db
      .select()
      .from(missions)
      .where(eq(missions.isActive, true));

    // 오늘 발송할 미션 필터링 (scheduledDays에 오늘 요일 포함)
    const todayMissions = activeMissions.filter(m => {
      if (!m.scheduledDays) return true; // 날짜 제한 없으면 매일
      return m.scheduledDays.toLowerCase().includes(todayName);
    });

    // 관리자에게 발송 알림
    const missionTitles = todayMissions.map(m => m.title).join(", ");
    await notifyOwner({
      title: `[일일 미션 발송] ${today.toLocaleDateString("ko-KR")}`,
      content: `오늘의 미션 ${todayMissions.length}개 발송 완료:\n${missionTitles || "없음"}`,
    });

    return res.json({
      success: true,
      sent: todayMissions.length,
      missions: todayMissions.map(m => ({ id: m.id, title: m.title })),
      timestamp: today.toISOString(),
    });
  } catch (error) {
    console.error("[DailyMissionPush] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// ─── 주간 미션 리포트 핸들러 ─────────────────────────────────────────────────
export async function handleWeeklyMissionReport(req: Request, res: Response) {
  try {
    // Heartbeat 인증
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "Cron only endpoint" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ success: false, error: "DB not available" });

    // 최근 7일 완료 건수 집계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completionStats = await db
      .select({ cnt: count(missionCompletions.id) })
      .from(missionCompletions)
      .where(gte(missionCompletions.completedAt, sevenDaysAgo));

    const totalCompletions = Number(completionStats[0]?.cnt ?? 0);

    // 미션별 완료 통계
    const missionStats = await db
      .select({
        missionId: missionCompletions.missionId,
        cnt: count(missionCompletions.id),
      })
      .from(missionCompletions)
      .where(gte(missionCompletions.completedAt, sevenDaysAgo))
      .groupBy(missionCompletions.missionId)
      .orderBy(sql`count(${missionCompletions.id}) DESC`)
      .limit(5);

    // 주간 리포트 발송
    const reportContent = [
      `📊 주간 미션 리포트 (${sevenDaysAgo.toLocaleDateString("ko-KR")} ~ ${new Date().toLocaleDateString("ko-KR")})`,
      ``,
      `✅ 총 완료 건수: ${totalCompletions}건`,
      ``,
      `🏆 TOP 5 미션:`,
      ...missionStats.map((s, i) => `  ${i + 1}. 미션 ID ${s.missionId}: ${s.cnt}회 완료`),
    ].join("\n");

    await notifyOwner({
      title: `[주간 미션 리포트] ${new Date().toLocaleDateString("ko-KR")}`,
      content: reportContent,
    });

    return res.json({
      success: true,
      totalCompletions,
      topMissions: missionStats,
      reportPeriod: {
        from: sevenDaysAgo.toISOString(),
        to: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[WeeklyMissionReport] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
