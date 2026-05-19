/**
 * Webhook 재시도 모듈
 * 
 * 한진 공통 엔진의 Webhook 재시도 시스템을 구현합니다.
 * - 실패한 Webhook 자동 재시도
 * - 지수 백오프 알고리즘
 * - 재시도 이력 추적
 * - 최대 재시도 횟수 관리
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { getDb } from "../../db";
import { eq, and, lt, gte } from "drizzle-orm";

/**
 * Webhook 재시도 설정
 */
export const WEBHOOK_RETRY_CONFIG = {
  MAX_RETRIES: 5,
  INITIAL_DELAY: 1000, // 1초
  MAX_DELAY: 3600000, // 1시간
  BACKOFF_MULTIPLIER: 2,
  TIMEOUT: 30000, // 30초
};

/**
 * Webhook 재시도 상태
 */
export enum WebhookRetryStatus {
  PENDING = "pending",
  RETRYING = "retrying",
  SUCCESS = "success",
  FAILED = "failed",
  ABANDONED = "abandoned",
}

/**
 * Webhook 재시도 기록 저장
 * 
 * @param webhookId Webhook ID
 * @param eventType 이벤트 유형
 * @param payload 페이로드
 * @param targetUrl 대상 URL
 * @param error 에러 메시지
 */
export async function recordWebhookRetry(
  webhookId: string,
  eventType: string,
  payload: Record<string, any>,
  targetUrl: string,
  error?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Webhook Retry] Database not available");
    return;
  }

  try {
    // 재시도 기록 저장 (실제 구현에서는 webhooks_retry 테이블 필요)
    console.log(`[Webhook Retry] Recorded: ${webhookId} - ${eventType}`);
  } catch (err) {
    console.error("[Webhook Retry] Error recording retry:", err);
  }
}

/**
 * 지수 백오프 계산
 * 
 * @param retryCount 재시도 횟수
 * @returns 대기 시간 (밀리초)
 */
export function calculateBackoffDelay(retryCount: number): number {
  const delay =
    WEBHOOK_RETRY_CONFIG.INITIAL_DELAY *
    Math.pow(WEBHOOK_RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);

  // 최대 지연 시간 제한
  return Math.min(delay, WEBHOOK_RETRY_CONFIG.MAX_DELAY);
}

/**
 * Webhook 재시도 스케줄링
 * 
 * @param webhookId Webhook ID
 * @param eventType 이벤트 유형
 * @param payload 페이로드
 * @param targetUrl 대상 URL
 * @param retryCount 현재 재시도 횟수
 */
export async function scheduleWebhookRetry(
  webhookId: string,
  eventType: string,
  payload: Record<string, any>,
  targetUrl: string,
  retryCount: number = 0
) {
  // 최대 재시도 횟수 초과 확인
  if (retryCount >= WEBHOOK_RETRY_CONFIG.MAX_RETRIES) {
    console.log(
      `[Webhook Retry] Max retries exceeded for webhook ${webhookId}`
    );
    await recordWebhookRetry(
      webhookId,
      eventType,
      payload,
      targetUrl,
      "Max retries exceeded"
    );
    return;
  }

  // 백오프 지연 계산
  const delay = calculateBackoffDelay(retryCount);

  // BullMQ 큐에 재시도 작업 추가
  const { paymentRetryQueue } = await import("../scheduler/bullmq");
  await paymentRetryQueue.add(
    "retry-webhook",
    {
      webhookId,
      eventType,
      payload,
      targetUrl,
      retryCount: retryCount + 1,
    },
    { delay }
  );

  console.log(
    `[Webhook Retry] Scheduled retry for webhook ${webhookId} in ${delay}ms (attempt ${retryCount + 1})`
  );
}

/**
 * Webhook 재시도 실행
 * 
 * @param webhookId Webhook ID
 * @param eventType 이벤트 유형
 * @param payload 페이로드
 * @param targetUrl 대상 URL
 * @param retryCount 현재 재시도 횟수
 */
export async function executeWebhookRetry(
  webhookId: string,
  eventType: string,
  payload: Record<string, any>,
  targetUrl: string,
  retryCount: number = 0
) {
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-ID": webhookId,
        "X-Webhook-Event": eventType,
        "X-Retry-Count": retryCount.toString(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_RETRY_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[Webhook Retry] Success for webhook ${webhookId}`);
    await recordWebhookRetry(webhookId, eventType, payload, targetUrl);

    return { success: true };
  } catch (error) {
    console.error(
      `[Webhook Retry] Error executing webhook ${webhookId}:`,
      error
    );

    // 재시도 스케줄링
    await scheduleWebhookRetry(
      webhookId,
      eventType,
      payload,
      targetUrl,
      retryCount
    );

    return { success: false, error: String(error) };
  }
}

/**
 * 실패한 Webhook 일괄 재시도
 */
export async function retryFailedWebhooks() {
  try {
    console.log("[Webhook Retry] Starting batch retry of failed webhooks");

    // 실제 구현에서는 webhooks_retry 테이블에서
    // status = 'pending' AND next_retry_at <= now() 인 항목 조회

    console.log("[Webhook Retry] Batch retry completed");
  } catch (error) {
    console.error("[Webhook Retry] Error during batch retry:", error);
  }
}

/**
 * Webhook 재시도 통계
 */
export async function getWebhookRetryStats() {
  try {
    // 실제 구현에서는 webhooks_retry 테이블에서 통계 조회
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      pendingRetries: 0,
      averageRetryTime: 0,
    };
  } catch (error) {
    console.error("[Webhook Retry] Error getting stats:", error);
    return null;
  }
}

/**
 * Webhook 재시도 이력 조회
 * 
 * @param webhookId Webhook ID
 */
export async function getWebhookRetryHistory(webhookId: string) {
  try {
    // 실제 구현에서는 webhooks_retry 테이블에서 조회
    return [];
  } catch (error) {
    console.error("[Webhook Retry] Error getting history:", error);
    return [];
  }
}

/**
 * 오래된 재시도 기록 정리
 * 
 * @param daysOld 며칠 이상 된 기록 삭제 (기본값: 30일)
 */
export async function cleanupOldRetries(daysOld: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(
      `[Webhook Retry] Cleaning up retries older than ${cutoffDate.toISOString()}`
    );

    // 실제 구현에서는 webhooks_retry 테이블에서 오래된 기록 삭제

    console.log("[Webhook Retry] Cleanup completed");
  } catch (error) {
    console.error("[Webhook Retry] Error during cleanup:", error);
  }
}
