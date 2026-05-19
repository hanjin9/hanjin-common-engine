/**
 * BullMQ 스케줄러 모듈
 * 
 * 한진 공통 엔진의 자동화 시스템을 BullMQ를 통해 구현합니다.
 * - 이메일 발송 큐
 * - 주간 리포트 생성
 * - 구독 만료 알림
 * - 결제 실패 재시도
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

// Redis 연결
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

/**
 * 이메일 발송 큐
 */
export const emailQueue = new Queue("emails", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

/**
 * 주간 리포트 큐
 */
export const weeklyReportQueue = new Queue("weekly-reports", {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
  },
});

/**
 * 구독 알림 큐
 */
export const subscriptionAlertQueue = new Queue("subscription-alerts", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

/**
 * 결제 재시도 큐
 */
export const paymentRetryQueue = new Queue("payment-retries", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

/**
 * 데이터 집계 큐
 */
export const analyticsQueue = new Queue("analytics", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
  },
});

/**
 * 이메일 발송 작업 추가
 * 
 * @param email 수신 이메일
 * @param subject 제목
 * @param template 템플릿 이름
 * @param data 템플릿 데이터
 * @param delay 지연 시간 (밀리초)
 */
export async function scheduleEmail(
  email: string,
  subject: string,
  template: string,
  data: Record<string, any> = {},
  delay?: number
) {
  return await emailQueue.add(
    "send-email",
    { email, subject, template, data },
    { delay }
  );
}

/**
 * 주간 리포트 생성 작업 추가
 * 
 * @param projectId 프로젝트 ID
 */
export async function scheduleWeeklyReport(projectId?: number) {
  return await weeklyReportQueue.add(
    "generate-report",
    { projectId },
    {
      repeat: {
        pattern: "0 9 * * 1", // 매주 월요일 오전 9시
      },
    }
  );
}

/**
 * 구독 만료 알림 작업 추가
 * 
 * @param subscriptionId 구독 ID
 * @param daysUntilExpiry 만료까지 남은 일수
 */
export async function scheduleSubscriptionAlert(
  subscriptionId: number,
  daysUntilExpiry: number
) {
  return await subscriptionAlertQueue.add(
    "send-alert",
    { subscriptionId, daysUntilExpiry },
    {
      delay: daysUntilExpiry === 7 ? 0 : 24 * 60 * 60 * 1000, // D-7은 즉시, D-1은 24시간 후
    }
  );
}

/**
 * 결제 재시도 작업 추가
 * 
 * @param paymentId 결제 ID
 */
export async function schedulePaymentRetry(paymentId: number) {
  return await paymentRetryQueue.add(
    "retry-payment",
    { paymentId },
    {
      delay: 60 * 60 * 1000, // 1시간 후 재시도
    }
  );
}

/**
 * 분석 데이터 집계 작업 추가
 * 
 * @param projectId 프로젝트 ID
 */
export async function scheduleAnalyticsAggregation(projectId: number) {
  return await analyticsQueue.add(
    "aggregate-data",
    { projectId },
    {
      repeat: {
        pattern: "0 * * * *", // 매시간
      },
    }
  );
}

/**
 * 이메일 발송 워커
 */
export const emailWorker = new Worker(
  "emails",
  async (job) => {
    const { email, subject, template, data } = job.data;

    try {
      console.log(`[Email Worker] Sending email to ${email}`);

      // 이메일 발송 로직 (Resend 통합)
      // await sendEmail(email, subject, template, data);

      return { success: true, email };
    } catch (error) {
      console.error(`[Email Worker] Error sending email:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * 주간 리포트 워커
 */
export const weeklyReportWorker = new Worker(
  "weekly-reports",
  async (job) => {
    const { projectId } = job.data;

    try {
      console.log(`[Report Worker] Generating weekly report for project ${projectId}`);

      // 리포트 생성 로직
      // const report = await generateWeeklyReport(projectId);
      // await sendReportEmail(report);

      return { success: true, projectId };
    } catch (error) {
      console.error(`[Report Worker] Error generating report:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * 구독 알림 워커
 */
export const subscriptionAlertWorker = new Worker(
  "subscription-alerts",
  async (job) => {
    const { subscriptionId, daysUntilExpiry } = job.data;

    try {
      console.log(
        `[Alert Worker] Sending subscription alert for subscription ${subscriptionId}`
      );

      // 알림 발송 로직
      // await sendSubscriptionAlert(subscriptionId, daysUntilExpiry);

      return { success: true, subscriptionId };
    } catch (error) {
      console.error(`[Alert Worker] Error sending alert:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * 결제 재시도 워커
 */
export const paymentRetryWorker = new Worker(
  "payment-retries",
  async (job) => {
    const { paymentId } = job.data;

    try {
      console.log(`[Payment Worker] Retrying payment ${paymentId}`);

      // 결제 재시도 로직
      // await retryPayment(paymentId);

      return { success: true, paymentId };
    } catch (error) {
      console.error(`[Payment Worker] Error retrying payment:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * 분석 데이터 집계 워커
 */
export const analyticsWorker = new Worker(
  "analytics",
  async (job) => {
    const { projectId } = job.data;

    try {
      console.log(`[Analytics Worker] Aggregating data for project ${projectId}`);

      // 데이터 집계 로직
      // await aggregateAnalyticsData(projectId);

      return { success: true, projectId };
    } catch (error) {
      console.error(`[Analytics Worker] Error aggregating data:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * 큐 이벤트 모니터링
 */
export function setupQueueEventListeners() {
  // 이메일 큐 이벤트
  const emailQueueEvents = new QueueEvents("emails", { connection: redis });
  emailQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[Email Queue] Job ${jobId} completed`);
  });
  emailQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[Email Queue] Job ${jobId} failed: ${failedReason}`);
  });

  // 리포트 큐 이벤트
  const reportQueueEvents = new QueueEvents("weekly-reports", {
    connection: redis,
  });
  reportQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[Report Queue] Job ${jobId} completed`);
  });
  reportQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[Report Queue] Job ${jobId} failed: ${failedReason}`);
  });

  // 구독 알림 큐 이벤트
  const alertQueueEvents = new QueueEvents("subscription-alerts", {
    connection: redis,
  });
  alertQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[Alert Queue] Job ${jobId} completed`);
  });
  alertQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[Alert Queue] Job ${jobId} failed: ${failedReason}`);
  });

  // 결제 재시도 큐 이벤트
  const paymentQueueEvents = new QueueEvents("payment-retries", {
    connection: redis,
  });
  paymentQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[Payment Queue] Job ${jobId} completed`);
  });
  paymentQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[Payment Queue] Job ${jobId} failed: ${failedReason}`);
  });

  // 분석 큐 이벤트
  const analyticsQueueEvents = new QueueEvents("analytics", {
    connection: redis,
  });
  analyticsQueueEvents.on("completed", ({ jobId }) => {
    console.log(`[Analytics Queue] Job ${jobId} completed`);
  });
  analyticsQueueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[Analytics Queue] Job ${jobId} failed: ${failedReason}`);
  });
}

/**
 * 모든 워커 종료
 */
export async function closeAllWorkers() {
  await Promise.all([
    emailWorker.close(),
    weeklyReportWorker.close(),
    subscriptionAlertWorker.close(),
    paymentRetryWorker.close(),
    analyticsWorker.close(),
  ]);
  console.log("[Scheduler] All workers closed");
}

/**
 * 모든 큐 정리
 */
export async function cleanupAllQueues() {
  await Promise.all([
    emailQueue.close(),
    weeklyReportQueue.close(),
    subscriptionAlertQueue.close(),
    paymentRetryQueue.close(),
    analyticsQueue.close(),
  ]);
  console.log("[Scheduler] All queues cleaned up");
}
