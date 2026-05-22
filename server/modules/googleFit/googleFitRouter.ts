import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db";
import { wearableConnections, realtimeBioData } from "../../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

const GOOGLE_FIT_CLIENT_ID = process.env.GOOGLE_FIT_CLIENT_ID ?? "";
const GOOGLE_FIT_CLIENT_SECRET = process.env.GOOGLE_FIT_CLIENT_SECRET ?? "";
const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
].join(" ");

// Google Fit API 기본 URL
const GOOGLE_FIT_API = "https://www.googleapis.com/fitness/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// 토큰 갱신 함수
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_FIT_CLIENT_ID,
        client_secret: GOOGLE_FIT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json() as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

// Google Fit 데이터 가져오기
async function fetchGoogleFitData(accessToken: string, dataTypeName: string, startTimeNs: string, endTimeNs: string) {
  const res = await fetch(`${GOOGLE_FIT_API}/dataset:aggregate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName }],
      bucketByTime: { durationMillis: 86400000 }, // 1일 단위
      startTimeMillis: Math.floor(Number(startTimeNs) / 1000000),
      endTimeMillis: Math.floor(Number(endTimeNs) / 1000000),
    }),
  });
  return res.json();
}

export const googleFitRouter = router({
  // Google Fit OAuth URL 생성
  getAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .query(({ input, ctx }) => {
      if (!GOOGLE_FIT_CLIENT_ID) {
        return { url: null, configured: false };
      }
      const redirectUri = `${input.origin}/api/google-fit/callback`;
      const params = new URLSearchParams({
        client_id: GOOGLE_FIT_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GOOGLE_FIT_SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: String(ctx.user.id),
      });
      return {
        url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
        configured: true,
      };
    }),

  // 연동 상태 확인
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const connection = await (await getDb())!
      .select()
      .from(wearableConnections)
      .where(
        and(
          eq(wearableConnections.userId, ctx.user.id),
          eq(wearableConnections.platform, "google_fit")
        )
      )
      .limit(1);

    return {
      connected: connection.length > 0 && connection[0].isActive,
      lastSyncAt: connection[0]?.lastSyncAt ?? null,
      configured: !!GOOGLE_FIT_CLIENT_ID,
    };
  }),

  // 연동 해제
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await (await getDb())!
      .update(wearableConnections)
      .set({ isActive: false })
      .where(
        and(
          eq(wearableConnections.userId, ctx.user.id),
          eq(wearableConnections.platform, "google_fit")
        )
      );
    return { success: true };
  }),

  // 데이터 수동 동기화
  syncData: protectedProcedure.mutation(async ({ ctx }) => {
    const connection = await (await getDb())!
      .select()
      .from(wearableConnections)
      .where(
        and(
          eq(wearableConnections.userId, ctx.user.id),
          eq(wearableConnections.platform, "google_fit"),
          eq(wearableConnections.isActive, true)
        )
      )
      .limit(1);

    if (!connection.length || !connection[0].accessToken) {
      throw new Error("Google Fit이 연동되지 않았습니다.");
    }

    let accessToken = connection[0].accessToken;

    // 토큰 만료 시 갱신
    if (connection[0].tokenExpiresAt && new Date(connection[0].tokenExpiresAt) < new Date()) {
      if (connection[0].refreshToken) {
        const newToken = await refreshAccessToken(connection[0].refreshToken);
        if (newToken) {
          accessToken = newToken;
          await (await getDb())!
            .update(wearableConnections)
            .set({ accessToken: newToken })
            .where(eq(wearableConnections.id, connection[0].id));
        }
      }
    }

    // 최근 7일 데이터 가져오기
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const startNs = String(sevenDaysAgo * 1000000);
    const endNs = String(now * 1000000);

    let stepsData: number | null = null;
    let distanceData: number | null = null;
    let caloriesData: number | null = null;
    let heartRateData: number | null = null;

    try {
      // 걸음수
      const stepsRes = await fetchGoogleFitData(accessToken, "com.google.step_count.delta", startNs, endNs) as { bucket?: Array<{ dataset?: Array<{ point?: Array<{ value?: Array<{ intVal?: number }> }> }> }> };
      const stepsBuckets = stepsRes.bucket ?? [];
      stepsData = stepsBuckets.reduce((sum: number, bucket: { dataset?: Array<{ point?: Array<{ value?: Array<{ intVal?: number }> }> }> }) => {
        const points = bucket.dataset?.[0]?.point ?? [];
        return sum + points.reduce((s: number, p: { value?: Array<{ intVal?: number }> }) => s + (p.value?.[0]?.intVal ?? 0), 0);
      }, 0);

      // 거리 (미터)
      const distRes = await fetchGoogleFitData(accessToken, "com.google.distance.delta", startNs, endNs) as { bucket?: Array<{ dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }> };
      const distBuckets = distRes.bucket ?? [];
      distanceData = distBuckets.reduce((sum: number, bucket: { dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }) => {
        const points = bucket.dataset?.[0]?.point ?? [];
        return sum + points.reduce((s: number, p: { value?: Array<{ fpVal?: number }> }) => s + (p.value?.[0]?.fpVal ?? 0), 0);
      }, 0);

      // 칼로리
      const calRes = await fetchGoogleFitData(accessToken, "com.google.calories.expended", startNs, endNs) as { bucket?: Array<{ dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }> };
      const calBuckets = calRes.bucket ?? [];
      caloriesData = calBuckets.reduce((sum: number, bucket: { dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }) => {
        const points = bucket.dataset?.[0]?.point ?? [];
        return sum + points.reduce((s: number, p: { value?: Array<{ fpVal?: number }> }) => s + (p.value?.[0]?.fpVal ?? 0), 0);
      }, 0);

      // 심박수 (평균)
      const hrRes = await fetchGoogleFitData(accessToken, "com.google.heart_rate.bpm", startNs, endNs) as { bucket?: Array<{ dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }> };
      const hrBuckets = hrRes.bucket ?? [];
      const hrValues: number[] = [];
      hrBuckets.forEach((bucket: { dataset?: Array<{ point?: Array<{ value?: Array<{ fpVal?: number }> }> }> }) => {
        const points = bucket.dataset?.[0]?.point ?? [];
        points.forEach((p: { value?: Array<{ fpVal?: number }> }) => {
          if (p.value?.[0]?.fpVal) hrValues.push(p.value[0].fpVal);
        });
      });
      heartRateData = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null;

    } catch (err) {
      console.error("[GoogleFit] 데이터 동기화 오류:", err);
    }

    // DB에 저장
    await (await getDb())!.insert(realtimeBioData).values({
      userId: ctx.user.id,
      wearableConnectionId: connection[0].id,
      heartRate: heartRateData,
      steps: stepsData,
      caloriesBurned: caloriesData ? Math.round(caloriesData) : null,
      measuredAt: new Date(),
    });

    // 마지막 동기화 시간 업데이트
    await (await getDb())!
      .update(wearableConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(wearableConnections.id, connection[0].id));

    return {
      success: true,
      data: {
        steps: stepsData,
        distanceMeters: distanceData ? Math.round(distanceData) : null,
        calories: caloriesData ? Math.round(caloriesData) : null,
        avgHeartRate: heartRateData,
      },
    };
  }),

  // 최근 동기화 데이터 조회
  getRecentData: protectedProcedure.query(async ({ ctx }) => {
    const recent = await (await getDb())!
      .select()
      .from(realtimeBioData)
      .where(eq(realtimeBioData.userId, ctx.user.id))
      .orderBy(desc(realtimeBioData.measuredAt))
      .limit(7);

    return recent;
  }),
});
