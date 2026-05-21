import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiFeedbackDashboard from '../AiFeedbackDashboard';
import FeedbackTemplateManager from '../FeedbackTemplateManager';
import EventManagement from '../EventManagement';
import TargetAudienceManager from '../TargetAudienceManager';
import ScheduledMissionManager from '../ScheduledMissionManager';
import SleepDetectionSettings from '../SleepDetectionSettings';

/**
 * 새로운 페이지 통합 테스트
 * 
 * 테스트 항목:
 * - 페이지 렌더링
 * - 제목 표시
 * - 주요 컴포넌트 표시
 */

describe('AI 피드백 대시보드', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<AiFeedbackDashboard />);
    expect(screen.getByText('AI 피드백 관리')).toBeInTheDocument();
  });

  it('3단계 피드백 설명이 표시되어야 함', () => {
    render(<AiFeedbackDashboard />);
    expect(screen.getByText('1차: 격려')).toBeInTheDocument();
    expect(screen.getByText('2차: 경고')).toBeInTheDocument();
    expect(screen.getByText('3차: 프리미엄')).toBeInTheDocument();
  });

  it('탭이 표시되어야 함', () => {
    render(<AiFeedbackDashboard />);
    expect(screen.getByRole('tab', { name: /개요/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /피드백 단계/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /템플릿 관리/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /발송 이력/i })).toBeInTheDocument();
  });
});

describe('피드백 템플릿 관리', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<FeedbackTemplateManager />);
    expect(screen.getByText('피드백 템플릿 관리')).toBeInTheDocument();
  });

  it('5단계 티어가 표시되어야 함', () => {
    render(<FeedbackTemplateManager />);
    expect(screen.getByText('상위 10%')).toBeInTheDocument();
  });

  it('필터가 표시되어야 함', () => {
    render(<FeedbackTemplateManager />);
    expect(screen.getByText('필터')).toBeInTheDocument();
  });
});

describe('이벤트 관리', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<EventManagement />);
    expect(screen.getByText('이벤트 관리')).toBeInTheDocument();
  });

  it('캠페인과 반복 이벤트 탭이 표시되어야 함', () => {
    render(<EventManagement />);
    expect(screen.getByRole('tab', { name: /캠페인/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /반복 이벤트/i })).toBeInTheDocument();
  });

  it('통계 카드가 표시되어야 함', () => {
    render(<EventManagement />);
    expect(screen.getByText('활성 캠페인')).toBeInTheDocument();
    expect(screen.getByText('발송 대상')).toBeInTheDocument();
  });
});

describe('타겟 발송 관리', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<TargetAudienceManager />);
    expect(screen.getByText('타겟 발송 관리')).toBeInTheDocument();
  });

  it('세그먼트 목록이 표시되어야 함', () => {
    render(<TargetAudienceManager />);
    expect(screen.getByText('타겟 세그먼트')).toBeInTheDocument();
  });

  it('발송 이력이 표시되어야 함', () => {
    render(<TargetAudienceManager />);
    expect(screen.getByText('발송 이력')).toBeInTheDocument();
  });
});

describe('스케줄러 관리', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<ScheduledMissionManager />);
    expect(screen.getByText('스케줄러 관리')).toBeInTheDocument();
  });

  it('스케줄된 미션 탭이 표시되어야 함', () => {
    render(<ScheduledMissionManager />);
    expect(screen.getByRole('tab', { name: /스케줄된 미션/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /주간 미션/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /발송 이력/i })).toBeInTheDocument();
  });

  it('통계가 표시되어야 함', () => {
    render(<ScheduledMissionManager />);
    expect(screen.getByText('활성 스케줄')).toBeInTheDocument();
    expect(screen.getByText('예정된 미션')).toBeInTheDocument();
  });
});

describe('수면 감지 시스템', () => {
  it('페이지가 렌더링되어야 함', () => {
    render(<SleepDetectionSettings />);
    expect(screen.getByText('수면 감지 시스템')).toBeInTheDocument();
  });

  it('시스템 설정 탭이 표시되어야 함', () => {
    render(<SleepDetectionSettings />);
    expect(screen.getByRole('tab', { name: /시스템 설정/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /감지 규칙/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /사용자 설정/i })).toBeInTheDocument();
  });

  it('시스템 상태가 표시되어야 함', () => {
    render(<SleepDetectionSettings />);
    expect(screen.getByText('연결된 기기')).toBeInTheDocument();
    expect(screen.getByText('활성 사용자')).toBeInTheDocument();
  });
});
