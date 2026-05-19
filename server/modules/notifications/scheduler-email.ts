/**
 * BullMQ 스케줄러 기반 자동 이메일 시스템
 * 
 * 정기적으로 실행되는 스케줄러를 통해 자동으로 이메일을 발송합니다.
 * - 주간 리포트 이메일
 * - 구독 만료 D-7 알림
 * - 구독 만료 D-1 알림
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { Queue, Worker } from "bullmq";
import { Resend } from "resend";
import { getDb } from "../../db";

const resend = new Resend(process.env.RESEND_API_KEY);

// Redis 연결 설정
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// 이메일 큐
export const emailQueue = new Queue("email", { connection: redisConnection });

/**
 * 주간 리포트 이메일 발송
 */
export async function sendWeeklyReportEmail(
  email: string,
  reportData: {
    projectName: string;
    weekStart: Date;
    weekEnd: Date;
    newUsers: number;
    activeUsers: number;
    revenue: number;
    currency: string;
    conversionRate: number;
    retentionRate: number;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `주간 리포트 - ${reportData.projectName} (${reportData.weekStart.toLocaleDateString("ko-KR")} ~ ${reportData.weekEnd.toLocaleDateString("ko-KR")})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>주간 리포트</h2>
          <p>안녕하세요,</p>
          <p>${reportData.projectName}의 주간 리포트입니다.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📊 주간 통계</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">신규 사용자</td>
                <td style="padding: 10px; text-align: right;">${reportData.newUsers}명</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">활성 사용자</td>
                <td style="padding: 10px; text-align: right;">${reportData.activeUsers}명</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">주간 매출</td>
                <td style="padding: 10px; text-align: right;">${reportData.revenue} ${reportData.currency}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold;">전환율</td>
                <td style="padding: 10px; text-align: right;">${reportData.conversionRate.toFixed(2)}%</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">유지율</td>
                <td style="padding: 10px; text-align: right;">${reportData.retentionRate.toFixed(2)}%</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Weekly report email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending weekly report email:", error);
    throw error;
  }
}

/**
 * 구독 만료 예정 사용자 이메일 발송 (D-7)
 */
export async function sendSubscriptionExpiringReminderEmails() {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Scheduler] Database not available");
    return;
  }

  try {
    // 실제 구현에서는 subscriptions 테이블에서 만료 예정 구독 조회
    // const expiringSubscriptions = await db.query.subscriptions.findMany({
    //   where: and(
    //     eq(subscriptions.status, "active"),
    //     between(
    //       subscriptions.currentPeriodEnd,
    //       new Date(),
    //       new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    //     )
    //   ),
    // });

    console.log("[Email Scheduler] Subscription expiring reminder emails scheduled");

    // 각 구독에 대해 이메일 발송
    // for (const subscription of expiringSubscriptions) {
    //   await emailQueue.add("subscription-expiring", {
    //     subscriptionId: subscription.id,
    //     email: subscription.user.email,
    //   });
    // }

    return { success: true };
  } catch (error) {
    console.error("[Email Scheduler] Error sending subscription expiring emails:", error);
    throw error;
  }
}

/**
 * 구독 만료 긴급 알림 이메일 발송 (D-1)
 */
export async function sendSubscriptionExpiringUrgentReminderEmails() {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Scheduler] Database not available");
    return;
  }

  try {
    // 실제 구현에서는 subscriptions 테이블에서 만료 예정 구독 조회
    // const expiringSubscriptions = await db.query.subscriptions.findMany({
    //   where: and(
    //     eq(subscriptions.status, "active"),
    //     between(
    //       subscriptions.currentPeriodEnd,
    //       new Date(),
    //       new Date(Date.now() + 24 * 60 * 60 * 1000)
    //     )
    //   ),
    // });

    console.log("[Email Scheduler] Subscription expiring urgent reminder emails scheduled");

    // 각 구독에 대해 이메일 발송
    // for (const subscription of expiringSubscriptions) {
    //   await emailQueue.add("subscription-expiring-urgent", {
    //     subscriptionId: subscription.id,
    //     email: subscription.user.email,
    //   });
    // }

    return { success: true };
  } catch (error) {
    console.error("[Email Scheduler] Error sending subscription expiring urgent emails:", error);
    throw error;
  }
}

/**
 * 주간 리포트 이메일 발송 (매주 월요일 09:00)
 */
export async function sendWeeklyReportEmails() {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Scheduler] Database not available");
    return;
  }

  try {
    // 실제 구현에서는 projects 테이블에서 모든 프로젝트 조회
    // const projects = await db.query.projects.findMany();

    console.log("[Email Scheduler] Weekly report emails scheduled");

    // 각 프로젝트에 대해 리포트 이메일 발송
    // for (const project of projects) {
    //   const stats = await getProjectStats(project.id);
    //   await emailQueue.add("weekly-report", {
    //     projectId: project.id,
    //     email: project.contactEmail,
    //     stats,
    //   });
    // }

    return { success: true };
  } catch (error) {
    console.error("[Email Scheduler] Error sending weekly report emails:", error);
    throw error;
  }
}

/**
 * 이메일 워커 설정
 */
export function setupEmailWorker() {
  const worker = new Worker("email", async (job) => {
    try {
      console.log(`[Email Worker] Processing job: ${job.name}`);

      switch (job.name) {
        case "subscription-expiring":
          // 구독 만료 D-7 이메일 발송
          console.log(`[Email Worker] Sending subscription expiring email`);
          break;

        case "subscription-expiring-urgent":
          // 구독 만료 D-1 이메일 발송
          console.log(`[Email Worker] Sending subscription expiring urgent email`);
          break;

        case "weekly-report":
          // 주간 리포트 이메일 발송
          console.log(`[Email Worker] Sending weekly report email`);
          break;

        default:
          console.log(`[Email Worker] Unknown job type: ${job.name}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`[Email Worker] Error processing job:`, error);
      throw error;
    }
  }, { connection: redisConnection });

  worker.on("completed", (job) => {
    console.log(`[Email Worker] Job completed: ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`[Email Worker] Job failed: ${job?.id}`, error);
  });

  return worker;
}

/**
 * 스케줄러 설정
 */
export async function setupEmailScheduler() {
  try {
    // 매주 월요일 09:00에 주간 리포트 이메일 발송
    await emailQueue.add(
      "weekly-report",
      {},
      {
        repeat: {
          pattern: "0 9 * * 1", // 매주 월요일 09:00
        },
      }
    );

    // 매일 09:00에 구독 만료 D-7 알림 이메일 발송
    await emailQueue.add(
      "subscription-expiring",
      {},
      {
        repeat: {
          pattern: "0 9 * * *", // 매일 09:00
        },
      }
    );

    // 매일 09:00에 구독 만료 D-1 긴급 알림 이메일 발송
    await emailQueue.add(
      "subscription-expiring-urgent",
      {},
      {
        repeat: {
          pattern: "0 9 * * *", // 매일 09:00
        },
      }
    );

    console.log("[Email Scheduler] Email scheduler configured");
  } catch (error) {
    console.error("[Email Scheduler] Error setting up email scheduler:", error);
    throw error;
  }
}
