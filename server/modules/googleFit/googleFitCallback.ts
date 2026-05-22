import type { Express } from "express";
import { getDb } from "../../db";
import { wearableConnections } from "../../../drizzle/schema";
import { and, eq } from "drizzle-orm";

const GOOGLE_FIT_CLIENT_ID = process.env.GOOGLE_FIT_CLIENT_ID ?? "";
const GOOGLE_FIT_CLIENT_SECRET = process.env.GOOGLE_FIT_CLIENT_SECRET ?? "";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function registerGoogleFitCallback(app: Express) {
  app.get("/api/google-fit/callback", async (req, res) => {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

    if (error) {
      console.error("[GoogleFit] OAuth 오류:", error);
      return res.redirect(`/settings?google_fit=error&reason=${encodeURIComponent(String(error))}`);
    }

    if (!code || !state) {
      return res.redirect("/settings?google_fit=error&reason=missing_params");
    }

    const userId = parseInt(String(state), 10);
    if (isNaN(userId)) {
      return res.redirect("/settings?google_fit=error&reason=invalid_state");
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/google-fit/callback`;

    try {
      // 인증 코드로 액세스 토큰 교환
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_FIT_CLIENT_ID,
          client_secret: GOOGLE_FIT_CLIENT_SECRET,
          code: String(code),
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        console.error("[GoogleFit] 토큰 교환 실패:", tokenData);
        return res.redirect("/settings?google_fit=error&reason=token_exchange_failed");
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      // 기존 연동 확인
      const existing = await (await getDb())!
        .select()
        .from(wearableConnections)
        .where(
          and(
            eq(wearableConnections.userId, userId),
            eq(wearableConnections.platform, "google_fit")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // 기존 연동 업데이트
        await (await getDb())!
          .update(wearableConnections)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token ?? existing[0].refreshToken,
            tokenExpiresAt: expiresAt,
            isActive: true,
            lastSyncAt: new Date(),
          })
          .where(eq(wearableConnections.id, existing[0].id));
      } else {
        // 새 연동 생성
        await (await getDb())!.insert(wearableConnections).values({
          userId,
          platform: "google_fit",
          deviceName: "Google Fit",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          tokenExpiresAt: expiresAt,
          isActive: true,
          lastSyncAt: new Date(),
        });
      }

      console.log(`[GoogleFit] 사용자 ${userId} 연동 완료`);
      return res.redirect("/settings?google_fit=success");

    } catch (err) {
      console.error("[GoogleFit] 콜백 처리 오류:", err);
      return res.redirect("/settings?google_fit=error&reason=server_error");
    }
  });
}
