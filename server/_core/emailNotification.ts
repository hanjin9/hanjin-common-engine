/**
 * 이메일 알림 시스템 (Resend 통합)
 * 환영, 미션완료, 결제, 보상 등 다양한 알림 템플릿 지원
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplateType = 'welcome' | 'mission_complete' | 'payment' | 'reward' | 'reminder' | 'alert';

interface EmailTemplate {
  subject: string;
  html: string;
}

interface EmailNotificationPayload {
  to: string;
  templateType: EmailTemplateType;
  data: Record<string, any>;
}

/**
 * 이메일 템플릿 생성
 */
function generateTemplate(type: EmailTemplateType, data: Record<string, any>): EmailTemplate {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f9fafb;
    color: #1f2937;
    line-height: 1.6;
  `;

  const containerStyle = `
    max-width: 600px;
    margin: 0 auto;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
    padding: 40px 20px;
    text-align: center;
  `;

  const contentStyle = `
    padding: 30px 20px;
  `;

  const buttonStyle = `
    display: inline-block;
    background-color: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 20px;
  `;

  const footerStyle = `
    background-color: #f3f4f6;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
  `;

  switch (type) {
    case 'welcome':
      return {
        subject: '한진 공통 엔진에 오신 것을 환영합니다! 🎉',
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">환영합니다!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">한진 공통 엔진</p>
              </div>
              <div style="${contentStyle}">
                <p>안녕하세요, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>한진 공통 엔진에 가입해주셔서 감사합니다. 이제 다양한 기능을 이용할 수 있습니다.</p>
                <h3 style="color: #1e40af; margin-top: 20px;">시작하기:</h3>
                <ul style="color: #4b5563;">
                  <li>프로필 완성하기</li>
                  <li>첫 번째 미션 도전하기</li>
                  <li>커뮤니티 참여하기</li>
                </ul>
                <a href="${data.loginUrl || '#'}" style="${buttonStyle}">대시보드 접속</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
                <p><a href="#" style="color: #3b82f6; text-decoration: none;">알림 설정</a> | <a href="#" style="color: #3b82f6; text-decoration: none;">도움말</a></p>
              </div>
            </div>
          </div>
        `,
      };

    case 'mission_complete':
      return {
        subject: `🎯 미션 완료! "${data.missionTitle}" 축하합니다!`,
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">🎉 미션 완료!</h1>
              </div>
              <div style="${contentStyle}">
                <p>축하합니다, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>다음 미션을 성공적으로 완료했습니다:</p>
                <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #1e40af;">${data.missionTitle}</h3>
                  <p style="margin: 0; color: #4b5563;">난이도: <strong>${data.difficulty}</strong></p>
                  <p style="margin: 5px 0 0 0; color: #4b5563;">보상: <strong>+${data.reward} 포인트</strong></p>
                </div>
                <p>계속해서 미션을 완료하고 포인트를 모아보세요!</p>
                <a href="${data.dashboardUrl || '#'}" style="${buttonStyle}">다음 미션 보기</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'payment':
      return {
        subject: `💳 결제 완료 - ${data.amount}원`,
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">💳 결제 완료</h1>
              </div>
              <div style="${contentStyle}">
                <p>안녕하세요, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>결제가 정상적으로 완료되었습니다.</p>
                <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0 0 10px 0;"><strong>결제 상세</strong></p>
                  <p style="margin: 5px 0;">상품: ${data.productName}</p>
                  <p style="margin: 5px 0;">금액: <strong>${data.amount}원</strong></p>
                  <p style="margin: 5px 0;">결제일: ${data.paymentDate}</p>
                  <p style="margin: 5px 0;">주문번호: ${data.orderId}</p>
                </div>
                <p>영수증은 마이페이지에서 확인할 수 있습니다.</p>
                <a href="${data.receiptUrl || '#'}" style="${buttonStyle}">영수증 보기</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'reward':
      return {
        subject: `🏆 보상 획득! ${data.rewardPoints}포인트를 받으셨습니다!`,
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">🏆 보상 획득!</h1>
              </div>
              <div style="${contentStyle}">
                <p>축하합니다, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>${data.reason}으로 보상을 획득했습니다!</p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #047857;">+${data.rewardPoints} 포인트</h3>
                  <p style="margin: 0; color: #4b5563;">누적 포인트: <strong>${data.totalPoints}</strong></p>
                </div>
                <p>포인트는 다양한 방식으로 사용할 수 있습니다.</p>
                <a href="${data.shopUrl || '#'}" style="${buttonStyle}">포인트 사용하기</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'reminder':
      return {
        subject: `⏰ 미션 알림 - 오늘의 미션을 확인하세요!`,
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">⏰ 오늘의 미션</h1>
              </div>
              <div style="${contentStyle}">
                <p>안녕하세요, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>오늘 완료할 수 있는 미션이 있습니다.</p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #92400e;">${data.missionTitle}</h3>
                  <p style="margin: 0; color: #4b5563;">난이도: <strong>${data.difficulty}</strong></p>
                  <p style="margin: 5px 0 0 0; color: #4b5563;">보상: <strong>+${data.reward} 포인트</strong></p>
                </div>
                <p>지금 바로 미션을 시작해보세요!</p>
                <a href="${data.missionUrl || '#'}" style="${buttonStyle}">미션 시작하기</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      };

    case 'alert':
      return {
        subject: `⚠️ 중요 알림 - ${data.alertTitle}`,
        html: `
          <div style="${baseStyle}">
            <div style="${containerStyle}">
              <div style="${headerStyle}">
                <h1 style="margin: 0; font-size: 28px;">⚠️ 중요 알림</h1>
              </div>
              <div style="${contentStyle}">
                <p>안녕하세요, <strong>${data.name || '사용자'}</strong>님!</p>
                <p>다음 사항을 확인해주세요:</p>
                <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #991b1b;">${data.alertTitle}</h3>
                  <p style="margin: 0; color: #4b5563;">${data.alertMessage}</p>
                </div>
                <p>빠른 조치가 필요합니다. 아래 링크를 클릭하여 확인해주세요.</p>
                <a href="${data.actionUrl || '#'}" style="${buttonStyle}">확인하기</a>
              </div>
              <div style="${footerStyle}">
                <p>© 2026 한진 공통 엔진. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

/**
 * 이메일 발송
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  try {
    const template = generateTemplate(payload.templateType, payload.data);

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@hanjin-engine.com',
      to: payload.to,
      subject: template.subject,
      html: template.html,
    });

    if (response.error) {
      console.error('[Resend] Error sending email:', response.error);
      return false;
    }

    console.log(`[Email] ${payload.templateType} sent to ${payload.to}`);
    return true;
  } catch (error) {
    console.error('[Resend] Exception sending email:', error);
    return false;
  }
}

/**
 * 환영 이메일 발송
 */
export async function sendWelcomeEmail(email: string, name: string, loginUrl: string) {
  return sendEmailNotification({
    to: email,
    templateType: 'welcome',
    data: { name, loginUrl },
  });
}

/**
 * 미션 완료 이메일 발송
 */
export async function sendMissionCompleteEmail(
  email: string,
  name: string,
  missionTitle: string,
  difficulty: string,
  reward: number,
  dashboardUrl: string
) {
  return sendEmailNotification({
    to: email,
    templateType: 'mission_complete',
    data: { name, missionTitle, difficulty, reward, dashboardUrl },
  });
}

/**
 * 결제 완료 이메일 발송
 */
export async function sendPaymentEmail(
  email: string,
  name: string,
  productName: string,
  amount: number,
  paymentDate: string,
  orderId: string,
  receiptUrl: string
) {
  return sendEmailNotification({
    to: email,
    templateType: 'payment',
    data: { name, productName, amount, paymentDate, orderId, receiptUrl },
  });
}

/**
 * 보상 획득 이메일 발송
 */
export async function sendRewardEmail(
  email: string,
  name: string,
  reason: string,
  rewardPoints: number,
  totalPoints: number,
  shopUrl: string
) {
  return sendEmailNotification({
    to: email,
    templateType: 'reward',
    data: { name, reason, rewardPoints, totalPoints, shopUrl },
  });
}

/**
 * 미션 알림 이메일 발송
 */
export async function sendReminderEmail(
  email: string,
  name: string,
  missionTitle: string,
  difficulty: string,
  reward: number,
  missionUrl: string
) {
  return sendEmailNotification({
    to: email,
    templateType: 'reminder',
    data: { name, missionTitle, difficulty, reward, missionUrl },
  });
}

/**
 * 중요 알림 이메일 발송
 */
export async function sendAlertEmail(
  email: string,
  name: string,
  alertTitle: string,
  alertMessage: string,
  actionUrl: string
) {
  return sendEmailNotification({
    to: email,
    templateType: 'alert',
    data: { name, alertTitle, alertMessage, actionUrl },
  });
}
