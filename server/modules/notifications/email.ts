/**
 * Resend 이메일 모듈
 * 
 * 한진 공통 엔진의 이메일 발송 시스템을 Resend를 통해 구현합니다.
 * - 회원가입 환영 이메일
 * - 결제 완료 이메일
 * - 구독 갱신 이메일
 * - 구독 만료 알림
 * - 결제 실패 알림
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@hanjin.com";

/**
 * 회원가입 환영 이메일
 * 
 * @param email 수신 이메일
 * @param name 사용자명
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "한진 공통 엔진에 가입하셨습니다",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>환영합니다, ${name}님!</h1>
          <p>한진 공통 엔진에 가입해주셔서 감사합니다.</p>
          <p>이제 다양한 프로젝트를 통합 관리할 수 있습니다.</p>
          <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px;">
            대시보드로 이동
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Welcome email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(`[Email] Error sending welcome email to ${email}:`, error);
    throw error;
  }
}

/**
 * 결제 완료 이메일
 * 
 * @param email 수신 이메일
 * @param planName 요금제명
 * @param amount 결제 금액
 * @param currency 통화
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  planName: string,
  amount: number,
  currency: string = "USD"
) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${planName} 구독이 완료되었습니다`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>결제가 완료되었습니다</h1>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>요금제:</strong> ${planName}</p>
            <p><strong>금액:</strong> ${(amount / 100).toFixed(2)} ${currency}</p>
            <p><strong>상태:</strong> 활성</p>
          </div>
          <p>구독이 활성화되었습니다. 이제 모든 기능을 이용할 수 있습니다.</p>
          <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px;">
            대시보드로 이동
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Payment confirmation email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending payment confirmation email to ${email}:`,
      error
    );
    throw error;
  }
}

/**
 * 구독 갱신 이메일
 * 
 * @param email 수신 이메일
 * @param planName 요금제명
 * @param renewalDate 갱신 날짜
 */
export async function sendSubscriptionRenewalEmail(
  email: string,
  planName: string,
  renewalDate: Date
) {
  try {
    const formattedDate = renewalDate.toLocaleDateString("ko-KR");

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${planName} 구독이 갱신되었습니다`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>구독이 갱신되었습니다</h1>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>요금제:</strong> ${planName}</p>
            <p><strong>갱신 날짜:</strong> ${formattedDate}</p>
          </div>
          <p>구독이 자동으로 갱신되었습니다. 계속해서 모든 기능을 이용할 수 있습니다.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription renewal email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending subscription renewal email to ${email}:`,
      error
    );
    throw error;
  }
}

/**
 * 구독 만료 알림 (D-7)
 * 
 * @param email 수신 이메일
 * @param planName 요금제명
 * @param expiryDate 만료 날짜
 */
export async function sendSubscriptionExpiringIn7DaysEmail(
  email: string,
  planName: string,
  expiryDate: Date
) {
  try {
    const formattedDate = expiryDate.toLocaleDateString("ko-KR");

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${planName} 구독이 7일 후 만료됩니다`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>구독 만료 알림</h1>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>알림:</strong> ${planName} 구독이 ${formattedDate}에 만료됩니다.</p>
          </div>
          <p>구독을 계속 유지하려면 갱신해주세요.</p>
          <a href="${process.env.APP_URL}/subscriptions" style="display: inline-block; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px;">
            구독 관리
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription expiring in 7 days email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending subscription expiring in 7 days email to ${email}:`,
      error
    );
    throw error;
  }
}

/**
 * 구독 만료 알림 (D-1)
 * 
 * @param email 수신 이메일
 * @param planName 요금제명
 * @param expiryDate 만료 날짜
 */
export async function sendSubscriptionExpiringIn1DayEmail(
  email: string,
  planName: string,
  expiryDate: Date
) {
  try {
    const formattedDate = expiryDate.toLocaleDateString("ko-KR");

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${planName} 구독이 내일 만료됩니다`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>긴급: 구독 만료 알림</h1>
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p><strong>경고:</strong> ${planName} 구독이 내일(${formattedDate})에 만료됩니다.</p>
          </div>
          <p>지금 바로 갱신하여 서비스 중단을 방지하세요.</p>
          <a href="${process.env.APP_URL}/subscriptions" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            지금 갱신하기
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription expiring in 1 day email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending subscription expiring in 1 day email to ${email}:`,
      error
    );
    throw error;
  }
}

/**
 * 결제 실패 알림
 * 
 * @param email 수신 이메일
 * @param planName 요금제명
 * @param reason 실패 사유
 */
export async function sendPaymentFailureEmail(
  email: string,
  planName: string,
  reason: string = "카드 거절"
) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${planName} 구독 결제 실패`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>결제 실패</h1>
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p><strong>오류:</strong> ${planName} 구독 결제에 실패했습니다.</p>
            <p><strong>사유:</strong> ${reason}</p>
          </div>
          <p>결제 방법을 확인하고 다시 시도해주세요.</p>
          <a href="${process.env.APP_URL}/billing" style="display: inline-block; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px;">
            결제 방법 변경
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Payment failure email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending payment failure email to ${email}:`,
      error
    );
    throw error;
  }
}

/**
 * 주간 리포트 이메일
 * 
 * @param email 수신 이메일
 * @param reportData 리포트 데이터
 */
export async function sendWeeklyReportEmail(
  email: string,
  reportData: {
    totalRevenue: number;
    newUsers: number;
    churnedUsers: number;
    activeSubscriptions: number;
    currency: string;
  }
) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `주간 리포트 - ${new Date().toLocaleDateString("ko-KR")}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>주간 리포트</h1>
          <p>이번 주의 주요 통계입니다.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="color: #666; margin: 0;">총 매출</p>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${(reportData.totalRevenue / 100).toFixed(2)} ${reportData.currency}</p>
              </div>
              <div>
                <p style="color: #666; margin: 0;">신규 가입자</p>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${reportData.newUsers}</p>
              </div>
              <div>
                <p style="color: #666; margin: 0;">이탈자</p>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${reportData.churnedUsers}</p>
              </div>
              <div>
                <p style="color: #666; margin: 0;">활성 구독</p>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${reportData.activeSubscriptions}</p>
              </div>
            </div>
          </div>
          <a href="${process.env.APP_URL}/analytics" style="display: inline-block; padding: 10px 20px; background-color: #ff0000; color: white; text-decoration: none; border-radius: 5px;">
            상세 분석 보기
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Weekly report email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `[Email] Error sending weekly report email to ${email}:`,
      error
    );
    throw error;
  }
}
