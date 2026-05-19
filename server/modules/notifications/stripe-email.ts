/**
 * Stripe 웹훅 기반 자동 이메일 시스템
 * 
 * Stripe 이벤트에 따라 자동으로 이메일을 발송합니다.
 * - 결제 완료 이메일
 * - 결제 실패 이메일
 * - 구독 생성 이메일
 * - 구독 취소 이메일
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { Resend } from "resend";
import { getDb } from "../../db";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 결제 완료 이메일 발송
 */
export async function sendPaymentSuccessEmail(
  email: string,
  paymentData: {
    amount: number;
    currency: string;
    projectName: string;
    paymentIntentId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `결제 완료 - ${paymentData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>결제 완료</h2>
          <p>안녕하세요,</p>
          <p>귀하의 결제가 성공적으로 완료되었습니다.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>결제 금액:</strong> ${paymentData.amount} ${paymentData.currency}</p>
            <p><strong>프로젝트:</strong> ${paymentData.projectName}</p>
            <p><strong>결제 ID:</strong> ${paymentData.paymentIntentId}</p>
            <p><strong>결제 일시:</strong> ${new Date().toLocaleString("ko-KR")}</p>
          </div>
          
          <p>감사합니다!</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Payment success email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending payment success email:", error);
    throw error;
  }
}

/**
 * 결제 실패 이메일 발송
 */
export async function sendPaymentFailureEmail(
  email: string,
  paymentData: {
    amount: number;
    currency: string;
    projectName: string;
    failureReason: string;
    paymentIntentId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `결제 실패 - ${paymentData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">결제 실패</h2>
          <p>안녕하세요,</p>
          <p>죄송하지만 귀하의 결제 처리 중 오류가 발생했습니다.</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>결제 금액:</strong> ${paymentData.amount} ${paymentData.currency}</p>
            <p><strong>프로젝트:</strong> ${paymentData.projectName}</p>
            <p><strong>실패 사유:</strong> ${paymentData.failureReason}</p>
            <p><strong>결제 ID:</strong> ${paymentData.paymentIntentId}</p>
          </div>
          
          <p>다시 시도하려면 계정에 로그인하여 결제 방법을 확인하고 다시 시도해주세요.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Payment failure email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending payment failure email:", error);
    throw error;
  }
}

/**
 * 구독 생성 이메일 발송
 */
export async function sendSubscriptionCreatedEmail(
  email: string,
  subscriptionData: {
    projectName: string;
    planName: string;
    price: number;
    currency: string;
    billingPeriod: string;
    subscriptionId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `구독 시작 - ${subscriptionData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">구독 시작</h2>
          <p>안녕하세요,</p>
          <p>구독이 성공적으로 시작되었습니다!</p>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>프로젝트:</strong> ${subscriptionData.projectName}</p>
            <p><strong>요금제:</strong> ${subscriptionData.planName}</p>
            <p><strong>가격:</strong> ${subscriptionData.price} ${subscriptionData.currency} / ${subscriptionData.billingPeriod}</p>
            <p><strong>구독 ID:</strong> ${subscriptionData.subscriptionId}</p>
            <p><strong>시작일:</strong> ${new Date().toLocaleString("ko-KR")}</p>
          </div>
          
          <p>이제 모든 프리미엄 기능을 이용할 수 있습니다.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription created email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending subscription created email:", error);
    throw error;
  }
}

/**
 * 구독 취소 이메일 발송
 */
export async function sendSubscriptionCanceledEmail(
  email: string,
  subscriptionData: {
    projectName: string;
    planName: string;
    cancellationDate: Date;
    subscriptionId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `구독 취소 - ${subscriptionData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>구독 취소</h2>
          <p>안녕하세요,</p>
          <p>귀하의 구독이 취소되었습니다.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>프로젝트:</strong> ${subscriptionData.projectName}</p>
            <p><strong>요금제:</strong> ${subscriptionData.planName}</p>
            <p><strong>취소일:</strong> ${subscriptionData.cancellationDate.toLocaleString("ko-KR")}</p>
            <p><strong>구독 ID:</strong> ${subscriptionData.subscriptionId}</p>
          </div>
          
          <p>다시 구독하고 싶으시면 언제든지 계정에서 재구독할 수 있습니다.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription canceled email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending subscription canceled email:", error);
    throw error;
  }
}

/**
 * 구독 만료 D-7 알림 이메일
 */
export async function sendSubscriptionExpiringEmail(
  email: string,
  subscriptionData: {
    projectName: string;
    planName: string;
    expirationDate: Date;
    subscriptionId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `구독 만료 예정 알림 - ${subscriptionData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">구독 만료 예정</h2>
          <p>안녕하세요,</p>
          <p>귀하의 구독이 7일 후에 만료될 예정입니다.</p>
          
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p><strong>프로젝트:</strong> ${subscriptionData.projectName}</p>
            <p><strong>요금제:</strong> ${subscriptionData.planName}</p>
            <p><strong>만료 예정일:</strong> ${subscriptionData.expirationDate.toLocaleString("ko-KR")}</p>
            <p><strong>구독 ID:</strong> ${subscriptionData.subscriptionId}</p>
          </div>
          
          <p>서비스를 계속 이용하려면 구독을 갱신해주세요.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription expiring email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending subscription expiring email:", error);
    throw error;
  }
}

/**
 * 구독 만료 D-1 긴급 알림 이메일
 */
export async function sendSubscriptionExpiringUrgentEmail(
  email: string,
  subscriptionData: {
    projectName: string;
    planName: string;
    expirationDate: Date;
    subscriptionId: string;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `⚠️ 구독 만료 긴급 알림 - ${subscriptionData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">⚠️ 구독 만료 긴급 알림</h2>
          <p>안녕하세요,</p>
          <p><strong>귀하의 구독이 내일 만료됩니다!</strong></p>
          
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <p><strong>프로젝트:</strong> ${subscriptionData.projectName}</p>
            <p><strong>요금제:</strong> ${subscriptionData.planName}</p>
            <p><strong>만료 예정일:</strong> ${subscriptionData.expirationDate.toLocaleString("ko-KR")}</p>
            <p><strong>구독 ID:</strong> ${subscriptionData.subscriptionId}</p>
          </div>
          
          <p>지금 바로 구독을 갱신하여 서비스 중단을 방지하세요!</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Subscription expiring urgent email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending subscription expiring urgent email:", error);
    throw error;
  }
}

/**
 * 청구서 결제 완료 이메일
 */
export async function sendInvoicePaidEmail(
  email: string,
  invoiceData: {
    projectName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
    paidDate: Date;
  }
) {
  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@hanjin-engine.com",
      to: email,
      subject: `청구서 결제 완료 - ${invoiceData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">청구서 결제 완료</h2>
          <p>안녕하세요,</p>
          <p>청구서가 성공적으로 결제되었습니다.</p>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>프로젝트:</strong> ${invoiceData.projectName}</p>
            <p><strong>청구서 번호:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>결제 금액:</strong> ${invoiceData.amount} ${invoiceData.currency}</p>
            <p><strong>결제일:</strong> ${invoiceData.paidDate.toLocaleString("ko-KR")}</p>
          </div>
          
          <p>감사합니다!</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.
          </p>
        </div>
      `,
    });

    console.log(`[Email] Invoice paid email sent to ${email}`);
    return response;
  } catch (error) {
    console.error("[Email] Error sending invoice paid email:", error);
    throw error;
  }
}
