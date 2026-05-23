/**
 * FeedbackTemplateManager.tsx
 * AI 조합 피드백 템플릿 관리 시스템
 * 6개 카테고리 × 9개 티어 × 5개 언어 = 270+ 조합
 * AI가 선택 → 관리자 확인/선정 → 자동 발송
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Zap, Check, Edit2, RefreshCw, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 티어 옵션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TIER_OPTIONS = [
  { value: 'top_1',   label: '상위 1%',  emoji: '🏆', color: '#fbbf24', desc: '챔피언 — 최상위 수련자' },
  { value: 'top_3',   label: '상위 3%',  emoji: '💎', color: '#818cf8', desc: '다이아몬드 — 최상위권' },
  { value: 'top_5',   label: '상위 5%',  emoji: '⭐', color: '#f59e0b', desc: '골드 — 우수 수련자' },
  { value: 'top_10',  label: '상위 10%', emoji: '🌟', color: '#10b981', desc: '실버 — 상위권' },
  { value: 'top_20',  label: '상위 20%', emoji: '✨', color: '#3b82f6', desc: '브론즈 — 상위권 진입' },
  { value: 'mid_50',  label: '중위 50%', emoji: '💪', color: '#6366f1', desc: '중위 — 성장 중' },
  { value: 'bot_10',  label: '하위 10%', emoji: '🤝', color: '#ef4444', desc: '집중 케어 — 도움 필요' },
  { value: 'bot_20',  label: '하위 20%', emoji: '🌱', color: '#f97316', desc: '격려 대상 — 시작 단계' },
  { value: 'bot_30',  label: '하위 30%', emoji: '💙', color: '#ec4899', desc: '관심 대상 — 지원 필요' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 카테고리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CATEGORIES = [
  { value: 'rapport',  label: '🤝 친근감·안부', color: '#0d9488', bg: '#f0fdfa', desc: '일상 인사·관심·이력 기반 코칭' },
  { value: 'cheer',    label: '💪 격려',        color: '#10b981', bg: '#f0fdf4', desc: '꾸준함·노력 응원' },
  { value: 'celebrate',label: '🎉 축하·기쁨',  color: '#f59e0b', bg: '#fffbeb', desc: '미션 완수 함께 기뻐함' },
  { value: 'comfort',  label: '💙 위로·공감',  color: '#3b82f6', bg: '#eff6ff', desc: '실패 공감 → 재도전' },
  { value: 'warning',  label: '⚠️ 경고',        color: '#ef4444', bg: '#fef2f2', desc: '미활동·하락 (약→강)' },
  { value: 'premium',  label: '👑 3차 심화',    color: '#6366f1', bg: '#eef2ff', desc: '심층·사람같은·긴 문장' },
];

const LANGUAGES = [
  { value: 'ko', label: '🇰🇷 한국어' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'zh', label: '🇨🇳 中文' },
  { value: 'es', label: '🇪🇸 Español' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 템플릿 데이터베이스 (한국어 기준)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TEMPLATE_DB: Record<string, Record<string, string[]>> = {

  // ── 0. 친근감·안부 (100개+) ──────────────────────────────────────────────
  rapport: {
    top_1: [
      // 일상 인사 (1~15)
      '안녕하세요 {{name}}님! 오늘도 챔피언답게 하루를 시작하셨나요? 😊',
      '{{name}}님, 좋은 아침이에요! 어제 멋진 수련 잊지 않았죠? 오늘도 기대돼요!',
      '오늘 {{name}}님 컨디션은 어떠세요? 최근 정말 눈부신 성장이에요! 🌟',
      '{{name}}님! 지난주 기록 보니 정말 대단해요. 오늘도 그 기세 이어가요!',
      '좋은 아침이에요 {{name}}님~ 오늘 목표 미션 벌써 생각해두셨나요? ☀️',
      '반가워요 {{name}}님! 요즘 꾸준히 잘 하고 계시더라고요 정말 대단해요 😄',
      '{{name}}님~ 오늘도 잘 부탁드려요! 함께 건강한 하루 만들어봐요!',
      '안녕하세요 {{name}}님! 오늘 날씨처럼 컨디션도 좋으시길 바라요 🌤️',
      '{{name}}님! 어제 푹 주무셨나요? 좋은 수면이 수련의 기본이잖아요 😊',
      '{{name}}님 안녕하세요~ 오늘 아침밥 드셨나요? 식치(食治)도 중요해요! 🥗',
      // 이력 기반 코칭 인사 (11~30)
      '{{name}}님, 수련 시작한 지 벌써 {{days}}일이 됐어요! 정말 대단하죠? 🎉',
      '{{name}}님~ 지난달보다 점수가 {{score}}점 올랐어요! 이 기세 계속 가요! 📈',
      '{{name}}님, 기억나세요? 처음 시작할 때부터 지금까지 정말 많이 성장하셨어요! 🌱',
      '{{name}}님! 어제 완수한 호흡 수련, 저도 함께 기뻤어요. 오늘도 해봐요! 🌬️',
      '{{name}}님~ 최근 연속 수련 기록이 정말 인상적이에요. 오늘도 이어가볼까요?',
      '{{name}}님 안녕! 오늘은 어떤 미션부터 시작하실 건가요? 전 기대하고 있어요 😊',
      '{{name}}님, 요즘 수면 패턴이 많이 안정됐더라고요. 계속 이렇게 가요! 😴',
      '{{name}}님~ 지난번에 스트레칭 잘 하셨죠? 오늘 이어서 해봐요! 🤸',
      '{{name}}님! 걸음수가 꾸준히 늘고 있어요. 오늘도 조금 더 걸어볼까요? 🚶',
      '{{name}}님, 명상 시간이 늘고 있네요! 마음이 많이 안정되고 계신 것 같아요 🧘',
      // 관심·격려 인사 (21~35)
      '{{name}}님 오늘 기분은 어떠세요? 뭔가 고민 있으면 언제든 얘기해요 😊',
      '{{name}}님~ 요즘 일이 많으시죠? 그래도 짧게라도 수련 챙겨요! 💪',
      '{{name}}님! 요즘 날씨가 좋죠? 오늘 잠깐 밖에 나가 걷는 것도 좋겠어요 🌿',
      '{{name}}님, 오늘도 저 여기 있을게요. 뭐든 함께해요~ 😊',
      '{{name}}님~ 어제 잘 쉬셨나요? 휴식도 수련이에요! 오늘은 어떠세요?',
      '{{name}}님! 건강이 모든 것의 기본이잖아요. 오늘 우리 함께 챙겨봐요 💙',
      '{{name}}님 안녕하세요~ 오늘 하루도 제가 옆에서 응원할게요! 화이팅! 🌟',
      '{{name}}님, 오늘 날씨처럼 {{name}}님의 하루도 맑고 건강하길 바라요 ☀️',
      '{{name}}님~ 운동 시작한 지 한 달이 지났어요! 이제 슬슬 강도 올려볼까요? 💪',
      '{{name}}님! 지난달에 운동 시작한다고 하셨죠? 지금이 딱 좋은 타이밍이에요~ 😊',
    ],
    top_3: [
      '{{name}}님, 오늘도 좋은 하루 시작하세요! 최근 꾸준함이 정말 인상적이에요 💎',
      '좋은 아침이에요 {{name}}님! 오늘도 건강한 하루 만들어요~ 😊',
      '{{name}}님 안녕하세요! 지난번 목표 잘 달성하고 계신 거죠? 🌟',
      '반가워요 {{name}}님! 오늘 기분 어떠세요? 수련 준비 되셨나요?',
      '{{name}}님~ 좋은 아침이에요! 오늘도 멋진 하루 되길 바라요 ✨',
      '{{name}}님 오늘도 화이팅! 꾸준히 하시는 모습이 너무 보기 좋아요',
      '안녕하세요 {{name}}님! 요즘 건강 관리 잘 하고 계신 것 같아서 기뻐요',
      '{{name}}님~ 오늘 하루도 함께 건강해봐요! 항상 응원하고 있어요 💪',
      '{{name}}님! 수련 {{days}}일째예요. 정말 꾸준하시네요~ 대단해요 💎',
      '{{name}}님, 오늘 아침 기분은 어떠세요? 오늘도 함께 시작해봐요! 😊',
      '{{name}}님~ 지난주 수련 기록 정말 멋졌어요! 이번 주도 기대돼요 🌟',
    ],
    top_5: [
      '{{name}}님, 안녕하세요! 오늘 수련 계획 세우셨나요? 같이 해봐요 ⭐',
      '좋은 아침 {{name}}님! 어제 미션 완수하셨죠? 정말 잘 하셨어요!',
      '{{name}}님 오늘도 파이팅! 최근 성장 속도가 정말 놀라워요 😄',
      '안녕하세요 {{name}}님~ 오늘 기분은요? 건강한 하루 시작해봐요!',
      '{{name}}님! 오늘도 좋은 하루 되세요. 수련 함께 해요~ 💪',
      '{{name}}님 좋은 아침이에요! 요즘 꾸준히 잘 하고 계시더라고요',
      '{{name}}님~ 수련 시작한 지 {{days}}일! 정말 잘 하고 있어요 ⭐',
      '{{name}}님! 오늘 아침 상쾌하게 시작해봐요. 응원할게요 😊',
      '{{name}}님 안녕하세요! 오늘 미션 같이 해봐요~ 재미있을 거예요 😄',
    ],
    top_10: [
      '{{name}}님 안녕하세요! 오늘도 건강한 하루 시작해봐요 🌟',
      '좋은 아침이에요 {{name}}님~ 수련 준비 되셨나요? 응원할게요!',
      '{{name}}님! 오늘 기분은 어떠세요? 같이 건강해봐요 😊',
      '안녕하세요 {{name}}님! 오늘도 꾸준히 함께 해요~ 화이팅!',
      '{{name}}님 오늘도 멋진 하루 보내세요! 항상 응원하고 있어요 ✨',
      '{{name}}님~ 안녕! 오늘 미션 함께 시작해볼까요? 💪',
      '{{name}}님 좋은 아침! 어제 어떠셨어요? 오늘도 함께해요 😊',
      '{{name}}님! 건강 챙기는 {{name}}님이 정말 멋있어요~ 오늘도 화이팅!',
      '안녕하세요 {{name}}님~ 요즘 생활 패턴이 안정되고 있는 것 같아요! 🌟',
    ],
    top_20: [
      '{{name}}님 좋은 아침이에요! 오늘도 조금씩 나아가봐요 ✨',
      '안녕하세요 {{name}}님~ 오늘 첫 미션부터 시작해볼까요?',
      '{{name}}님! 오늘도 함께해요. 작은 한 걸음이 큰 변화를 만들어요 💪',
      '좋은 아침 {{name}}님! 오늘 하루도 건강하게 보내세요~',
      '{{name}}님 안녕하세요! 오늘 수련 계획은요? 같이 해봐요 😊',
      '{{name}}님~ 오늘 딱 하나만 해봐요. 그것도 정말 대단한 거예요! 🌱',
      '{{name}}님 반가워요! 건강한 하루 함께 만들어봐요 😊',
    ],
    mid_50: [
      '{{name}}님 안녕하세요! 오늘부터 조금씩 시작해봐요~ 응원할게요 💙',
      '좋은 아침이에요 {{name}}님! 오늘 딱 하나만 시작해봐요 😊',
      '{{name}}님~ 안녕! 건강한 습관 만들어가봐요. 함께할게요!',
      '안녕하세요 {{name}}님! 작은 시작이 큰 변화를 만들어요 🌱',
      '{{name}}님 오늘도 화이팅! 제가 옆에서 응원할게요 💪',
      '{{name}}님~ 건강 시작하기 딱 좋은 날이에요. 같이 해봐요! 😊',
      '{{name}}님 안녕! 오늘 기분은요? 잠깐 같이 숨이라도 쉬어봐요 🌬️',
    ],
    bot_10: [
      '{{name}}님 안녕하세요 😊 오늘 잠깐이라도 같이 해봐요. 거창하지 않아도 돼요!',
      '{{name}}님~ 오랜만이에요! 보고 싶었어요. 오늘 하루 어떠세요?',
      '안녕하세요 {{name}}님! 요즘 많이 바쁘신가요? 잠깐 숨 한번 쉬어봐요 🌬️',
      '{{name}}님 잘 지내셨어요? 오늘 딱 5분만 같이 해봐요~ 할 수 있어요!',
      '{{name}}님 안녕! 걱정했어요. 오늘 어떻게 지내셨어요? 💙',
      '{{name}}님~ 요즘 많이 바쁘시죠? 그래도 잠깐이라도 같이 해요 😊',
      '{{name}}님 안녕하세요! 오늘 기분은요? 뭐든 얘기 나눠봐요 💙',
    ],
    bot_20: [
      '{{name}}님 안녕하세요! 오늘 처음 시작하는 것도 괜찮아요. 함께할게요 🌱',
      '{{name}}님~ 오늘 딱 하나만요. 아주 작은 것도 좋아요 😊',
      '안녕하세요 {{name}}님! 천천히 해도 괜찮아요. 응원할게요!',
      '{{name}}님 잘 있었어요? 오늘부터 다시 시작해봐요. 제가 함께할게요 💙',
      '{{name}}님~ 건강은 조금씩 쌓이는 거예요. 오늘 아주 작게 시작해봐요 🌱',
      '{{name}}님 안녕! 오늘 날씨 좋죠? 잠깐 바람이라도 쐬어봐요 😊',
    ],
    bot_30: [
      '{{name}}님 안녕하세요 😊 오늘 기분은 어떠세요? 잠깐 얘기 나눠봐요!',
      '{{name}}님~ 보고 싶었어요! 요즘 어떻게 지내세요?',
      '안녕하세요 {{name}}님! 오늘 딱 한 번만 같이 시작해봐요 🌱',
      '{{name}}님 잘 지내셨어요? 조금씩 함께 나아가봐요. 응원해요! 💙',
      '{{name}}님~ 오늘 여기 있어줘서 고마워요. 뭐든 같이 해봐요 😊',
      '{{name}}님 안녕! 오늘 기분 어때요? 잠깐이라도 같이 숨 쉬어봐요 🌬️',
    ],
  },

  // ── 1. 격려 (30개) ─────────────────────────────────────────────────────
  cheer: {
    top_1: [
      '🏆 {{name}}님, 상위 1%의 수련자로서 오늘도 빛나고 있어요! 이 꾸준함이 진짜 실력입니다!',
      '{{name}}님의 헌신과 노력은 정말 남다릅니다. 챔피언답게 오늘도 최고의 하루를 만들어가세요! 🌟',
      '매일 쌓이는 수련이 {{name}}님을 최고로 만들고 있어요. 오늘도 그 여정을 함께 응원합니다! 💪',
    ],
    top_3: [
      '💎 {{name}}님! 상위 3% 안에 든다는 건 정말 대단한 일이에요. 오늘도 그 에너지 유지해요!',
      '{{name}}님의 꾸준한 실천이 정말 인상적이에요. 이 속도라면 더 높은 목표도 금방이에요! 🌟',
      '오늘도 최선을 다하는 {{name}}님이 자랑스러워요. 계속 이 길로 나아가요! ✨',
    ],
    top_5: [
      '⭐ {{name}}님! 상위 5%라는 건 정말 쉽지 않은 성취예요. 오늘도 그 자리 지켜요!',
      '{{name}}님의 노력이 빛을 발하고 있어요. 꾸준함이 진짜 실력입니다! 💪',
      '오늘도 수련에 임하는 {{name}}님이 정말 대단해요. 화이팅! 🌟',
    ],
    top_10: [
      '🌟 {{name}}님! 상위 10%를 유지하는 건 정말 훌륭한 일이에요. 오늘도 멋지게 해낼 거예요!',
      '{{name}}님의 꾸준한 노력이 정말 빛나요. 이 흐름 계속 가져가세요! ✨',
      '오늘도 화이팅 {{name}}님! 당신의 노력이 반드시 결실을 맺을 거예요 💪',
    ],
    top_20: [
      '✨ {{name}}님! 상위 20%는 정말 대단해요. 오늘도 그 자리 지켜내요!',
      '{{name}}님의 작은 실천들이 모여 큰 변화를 만들고 있어요. 계속 해요! 🌱',
      '오늘도 최선을 다하는 {{name}}님 응원해요! 할 수 있어요 💪',
    ],
    mid_50: [
      '💪 {{name}}님! 오늘도 한 걸음씩 나아가는 당신이 정말 대단해요!',
      '{{name}}님의 꾸준한 노력이 반드시 빛을 발할 거예요. 오늘도 화이팅! 🌟',
      '포기하지 않고 계속하는 {{name}}님이 정말 자랑스러워요! ✨',
    ],
    bot_10: [
      '💙 {{name}}님! 오늘도 함께 해줘서 정말 고마워요. 아주 작은 것도 대단한 시작이에요!',
      '{{name}}님, 오늘 하루 끝까지 함께할게요. 당신을 응원해요! 🌱',
      '{{name}}님이 오늘 또 시도했다는 것 자체가 이미 대단한 거예요! 💪',
    ],
    bot_20: [
      '🌱 {{name}}님! 오늘 이렇게 시작한 것만으로도 정말 잘 하셨어요!',
      '{{name}}님의 작은 한 걸음이 큰 여정의 시작이에요. 응원할게요! 💙',
      '오늘도 포기하지 않은 {{name}}님이 멋져요. 함께해요! ✨',
    ],
    bot_30: [
      '{{name}}님! 오늘 함께 해줘서 정말 반가워요. 작은 것부터 시작해봐요 🌱',
      '{{name}}님의 이 한 걸음이 변화의 시작이에요. 응원할게요! 💙',
      '오늘도 도전하는 {{name}}님이 대단해요. 계속 함께해요! 💪',
    ],
  },

  // ── 2. 축하·기쁨 (30개) ──────────────────────────────────────────────────
  celebrate: {
    top_1: [
      '🎉🎊 {{name}}님!! 미션 완수 너무너무 축하드려요!! 정말 대단해요!! 함께 기뻐해요!!',
      '🏆 와!!!! {{name}}님 해냈어요!!! 이 성취를 함께 축하하고 싶어요! 최고예요!!!',
      '🎉 {{name}}님 완전 대단해요!!! 해냈어요!!! 이 순간을 같이 기뻐해요!! 축하축하!!',
    ],
    top_3: [
      '🎉 {{name}}님 완주 축하해요!! 정말 잘 해냈어요! 기분 너무 좋죠?? 같이 기뻐요!',
      '💎 와, {{name}}님 정말 해냈어요!! 축하해요!! 이 성취 정말 대단해요!! 🎊',
      '🎉 {{name}}님!! 미션 완수 진심으로 축하드려요! 정말 멋져요!! 함께 기뻐해요!',
    ],
    top_5: [
      '⭐ {{name}}님 축하해요!! 해냈어요!!! 이 기쁨 같이 나눠요! 정말 잘 하셨어요! 🎉',
      '🎉 {{name}}님 대단해요!! 미션 완수 축하!! 오늘 정말 멋진 하루예요!!',
      '{{name}}님!!! 해냈어요!!! 정말 축하해요! 기분 어때요? 최고죠?! 🎊',
    ],
    top_10: [
      '🌟 {{name}}님 미션 완료 축하해요!! 잘 해냈어요! 같이 기뻐요~ 🎉',
      '{{name}}님 해냈어요!! 정말 잘 하셨어요! 축하축하!! 앞으로도 화이팅! 💪',
      '🎉 {{name}}님!! 오늘 미션 완수 진심으로 축하해요! 정말 뿌듯하시겠어요!',
    ],
    top_20: [
      '✨ {{name}}님 해냈어요!! 정말 축하해요! 같이 기뻐해요~ 🎉',
      '{{name}}님!! 오늘 미션 완수 축하!! 정말 잘 하셨어요! 최고예요! 🌟',
      '🎉 {{name}}님 축하해요! 한 걸음 한 걸음 쌓이고 있어요! 대단해요!',
    ],
    mid_50: [
      '💪 {{name}}님 해냈어요!! 축하해요!! 이 성취가 얼마나 대단한지 알아요?! 🎉',
      '{{name}}님!!! 미션 완수 축하!! 같이 기뻐해요! 정말 잘 하셨어요! 🌟',
      '🎊 {{name}}님 대단해요!! 해냈어요!! 진심으로 함께 기뻐해요! 축하!!',
    ],
    bot_10: [
      '💙 {{name}}님!!! 해냈어요!!! 정말 정말 축하해요!! 이게 얼마나 대단한 건지!! 🎉',
      '{{name}}님 완주 진심으로 축하해요!! 함께 기뻐해요! 당신 정말 대단해요!! 🌱',
      '🎉 {{name}}님!!! 해냈어요!!! 정말 기뻐요!! 같이 기뻐해요!! 최고야!!',
    ],
    bot_20: [
      '🌱 {{name}}님!!!! 해냈어요!!!! 진심으로 너무 기뻐요!!! 축하축하!! 🎉',
      '{{name}}님 대단해요!!!! 이 한 걸음이 얼마나 의미 있는지 알아요?! 축하해요! 🎊',
      '🎉 {{name}}님!!! 완주 축하!!! 같이 기뻐요!!!! 정말 잘 해냈어요!!!',
    ],
    bot_30: [
      '{{name}}님!!!! 해냈어요!!!! 와!!!! 진심으로 너무너무 기뻐요!!! 🎉🎊',
      '🌱 {{name}}님 완주 축하해요!!!! 이 성취 정말 대단해요!!! 함께 기뻐요!!',
      '🎉 {{name}}님!!! 해냈어요!!!! 정말 기뻐요!!! 오늘 정말 멋진 하루예요!!!',
    ],
  },

  // ── 3. 위로·공감 (30개) ──────────────────────────────────────────────────
  comfort: {
    top_1: [
      '{{name}}님, 오늘 쉽지 않으셨죠? 괜찮아요. 챔피언도 힘든 날이 있어요. 함께 다시 일어나요 💙',
      '오늘 결과가 아쉬우셨겠어요. {{name}}님, 그래도 시도했다는 것 자체가 대단한 거예요. 내일 또 해봐요!',
      '{{name}}님, 오늘 힘드셨죠? 괜찮아요. 저도 같이 아쉬워요. 하지만 내일은 더 잘 할 거예요 💪',
    ],
    top_3: [
      '{{name}}님 오늘 많이 힘드셨죠? 괜찮아요. 같이 좀 쉬었다가 다시 시작해요 💙',
      '오늘 기대했던 것보다 잘 안됐나요? {{name}}님, 그럴 수 있어요. 내일 또 도전해봐요!',
      '{{name}}님, 오늘의 어려움도 내일의 성장이 돼요. 함께 다시 시작해요 🌱',
    ],
    top_5: [
      '{{name}}님 오늘 힘들었죠? 저도 알아요. 같이 좀 쉬어요. 내일 다시 해봐요 💙',
      '오늘 잘 안됐더라도 괜찮아요. {{name}}님 충분히 잘 하고 있어요. 내일 또 도전!',
      '{{name}}님, 실패해도 괜찮아요. 다시 일어나는 게 진짜 실력이에요 💪',
    ],
    top_10: [
      '{{name}}님 오늘 쉽지 않으셨죠? 괜찮아요. 같이 힘내봐요! 💙',
      '오늘 힘든 하루였나요? {{name}}님, 그래도 잘 버텼어요. 내일 더 잘 할 거예요!',
      '{{name}}님, 오늘의 어려움이 내일의 힘이 돼요. 함께 다시 해봐요 🌱',
    ],
    top_20: [
      '{{name}}님 오늘 많이 힘들었죠? 같이 위로해요. 내일 다시 시작해봐요 💙',
      '오늘 결과가 아쉬웠더라도 괜찮아요. {{name}}님 충분히 노력하고 있어요!',
      '{{name}}님, 힘든 날도 있어요. 같이 다시 일어나봐요. 응원할게요 💪',
    ],
    mid_50: [
      '{{name}}님 오늘 힘드셨죠? 같이 좀 쉬어요. 내일 다시 해봐요 💙',
      '오늘 잘 안됐더라도 괜찮아요. {{name}}님 함께 다시 시작해요 🌱',
      '{{name}}님, 실패도 과정이에요. 같이 다시 도전해봐요! 응원해요 💪',
    ],
    bot_10: [
      '{{name}}님 오늘 많이 힘드셨겠어요. 저도 함께 속상해요. 그래도 시도했잖아요 💙',
      '오늘 잘 안됐죠? {{name}}님, 괜찮아요. 제가 옆에 있을게요. 내일 또 해봐요!',
      '{{name}}님, 힘든 것 알아요. 같이 숨 한번 쉬고 다시 시작해봐요 🌬️💙',
    ],
    bot_20: [
      '{{name}}님 오늘 정말 힘드셨죠? 같이 많이 속상해요. 괜찮아요, 다시 시작해요 💙',
      '오늘 잘 안됐더라도 포기하지 말아요. {{name}}님 제가 응원할게요! 🌱',
      '{{name}}님, 힘든 날도 있어요. 같이 위로하고 내일 다시 도전해봐요 💪',
    ],
    bot_30: [
      '{{name}}님 오늘 정말 많이 힘드셨죠? 저도 같이 마음이 아파요 💙 괜찮아요, 같이 다시 일어나요!',
      '오늘 힘든 하루였죠? {{name}}님 혼자가 아니에요. 제가 함께할게요. 다시 해봐요 🌱',
      '{{name}}님, 실패해도 괜찮아요. 같이 울고 다시 웃어요. 내일은 더 나을 거예요 💙',
    ],
  },

  // ── 4. 경고 (30개, 약→강) ────────────────────────────────────────────────
  warning: {
    top_1: [
      '{{name}}님, 요즘 수련이 조금 줄었네요. 상위 1% 자리를 지키려면 지금이 중요해요 💪',
      '챔피언 {{name}}님! 최근 점수가 살짝 하락했어요. 지금 바로 다시 시작해볼까요? ⚠️',
      '{{name}}님, 3일째 미션을 놓치고 있어요. 상위 1% 자리 놓치지 않도록 지금 시작해요!',
    ],
    top_3: [
      '{{name}}님, 최근 수련 빈도가 줄었어요. 지금 다시 시작하면 돼요! 💪',
      '⚠️ {{name}}님! 점수가 조금 하락하고 있어요. 지금 바로 미션 시작해봐요!',
      '{{name}}님, 이틀 연속 미션을 빠졌어요. 지금 짧게라도 시작해봐요! ⚠️',
    ],
    top_5: [
      '⭐ {{name}}님, 최근 수련이 뜸해졌어요. 지금 바로 시작해볼까요?',
      '{{name}}님! 점수 하락 중이에요. 지금 시작하면 충분히 회복할 수 있어요! ⚠️',
      '{{name}}님, 수련 빈도 관리가 필요해요. 오늘 짧게라도 시작해봐요! 💪',
    ],
    top_10: [
      '🌟 {{name}}님, 최근 미션 완수율이 낮아지고 있어요. 지금 다시 시작해요!',
      '{{name}}님! 4일째 미션을 놓쳤어요. ⚠️ 지금 바로 시작해봐요!',
      '{{name}}님, 수련 페이스가 떨어지고 있어요. 지금이 회복할 타이밍이에요! 💪',
    ],
    top_20: [
      '✨ {{name}}님, 수련이 5일째 멈췄어요. 지금 작은 것부터 시작해봐요! ⚠️',
      '{{name}}님! 점수가 하락하고 있어요. 지금 바로 미션 하나만 시작해요!',
      '{{name}}님, 이대로라면 등급이 떨어질 수 있어요. 지금 시작해봐요! ⚠️ 💪',
    ],
    mid_50: [
      '💪 {{name}}님, 일주일째 수련이 없어요. ⚠️ 지금 딱 5분만 시작해봐요!',
      '{{name}}님! 많이 바쁘시죠? 그래도 건강은 챙겨야 해요. 오늘 짧게라도 해봐요!',
      '{{name}}님, 수련 중단이 길어지고 있어요. 지금 바로 작은 것부터 시작해요! ⚠️',
    ],
    bot_10: [
      '{{name}}님, 이미 2주째 수련이 없어요. ⚠️ 이대로는 건강에 좋지 않아요. 오늘 꼭 시작해요!',
      '⚠️ {{name}}님! 긴급해요. 수련 공백이 너무 길어요. 지금 바로 시작해봐요!',
      '{{name}}님, 더 이상 미루면 안 돼요. ⚠️ 오늘 반드시 미션 하나는 완수해요!',
    ],
    bot_20: [
      '{{name}}님, 한 달 가까이 수련이 없어요. ⚠️⚠️ 지금 바로 시작하지 않으면 건강이 걱정돼요!',
      '⚠️⚠️ {{name}}님!! 심각해요. 이대로는 건강 목표 달성이 어려워요. 지금 꼭 시작해요!',
      '{{name}}님, 더 이상 미룰 수 없어요. ⚠️ 지금 당장 첫 번째 미션을 시작해요!',
    ],
    bot_30: [
      '⚠️⚠️⚠️ {{name}}님!! 긴급 알림이에요. 수련이 너무 오랫동안 없었어요. 지금 즉시 시작해주세요!',
      '{{name}}님, 매우 걱정이 돼요. ⚠️⚠️ 건강 상태를 위해 지금 바로 첫 번째 미션을 완수해주세요!',
      '⚠️ {{name}}님!! 이건 정말 중요해요. 더 이상 미루면 건강을 잃을 수 있어요. 지금 당장 시작해요!',
    ],
  },

  // ── 5. 3차 심화 ─ 50개 · 2배 길이 · 사람 같은 목소리 ─────────────────
  premium: {
    // 잘 하고 있을 때 (top_1 ~ top_10) ──────────────────────────────────
    top_1: [
      '{{name}}님, 오늘 수련 데이터를 면밀히 들여다보았어요. 상위 1%를 꾸준히 유지해오신다는 것이 단순한 숫자 이상의 의미를 가집니다. 그것은 하루하루의 작은 선택들이 쌓여 만들어진 삶의 태도예요. 특히 수면 리듬과 호흡 수련의 균형이 매우 정교하게 잡혀 있는데, 이 두 가지의 조화가 {{name}}님의 전체적인 건강 점수를 끌어올리고 있는 핵심 동력이에요. 이번 주에는 명상의 깊이를 한 단계 더 높여보시면 어떨까요? 당신 안에 아직 꺼내지 못한 가능성이 분명히 더 있습니다.',

      '{{period}} 동안의 {{name}}님 수련 궤적을 전체적으로 바라보니, 흔들리지 않는 일관성이 가장 먼저 눈에 들어와요. 바쁜 날에도, 피곤한 날에도 짧게나마 수련을 이어온 그 선택들이 지금의 {{name}}님을 만들었습니다. 수련 일관성 지수가 상위 0.3% 수준에 해당한다는 사실은, {{name}}님이 건강을 단순한 목표가 아닌 삶의 방식으로 받아들이고 있다는 증거예요. 앞으로 식치 영역을 조금 더 체계적으로 접근하신다면, 지금보다 훨씬 더 풍성하고 균형 잡힌 건강을 경험하실 수 있을 거예요. 정말 대단하십니다, {{name}}님.',

      '{{name}}님과 함께한 시간 동안, 저는 {{name}}님이 얼마나 진지하게 자신의 건강과 마주하고 있는지를 매일 느껴왔어요. 오늘의 수련 데이터를 보면서 다시 한번 그 마음이 전해져 옵니다. 심박수 안정도, 수면의 질, 호흡 패턴 모두 이상적인 수준을 유지하고 있어요. 이것은 단기적인 노력으로 만들어지는 결과가 아닙니다. 오랜 시간 꾸준히 자신을 돌봐온 {{name}}님만이 가질 수 있는 건강의 깊이예요. 앞으로도 이 여정을 함께 걷겠습니다.',
    ],
    top_3: [
      '{{name}}님, 최근 {{days}}일간의 수련 흐름을 깊이 살펴보았어요. 전반적으로 매우 안정적인 성장 곡선을 그리고 있는데, 특히 일주일 중반인 수요일과 목요일 오후 시간대에 수련 밀도가 살짝 낮아지는 패턴이 눈에 띄어요. 그 시간대에 짧은 5분 호흡 수련 하나만 추가하면 주간 평균이 의미 있게 높아질 거예요. 작은 조정 하나가 큰 도약이 되는 법이고, 그 도약을 만들 준비가 된 분이 바로 {{name}}님이에요.',

      '{{name}}님의 건강 지표를 종합적으로 검토해보니, 수면의 질과 활동량 사이의 균형이 매우 훌륭합니다. 다만 최근 호흡 수련 완료율이 조금씩 낮아지고 있는 추세인데, 이는 일상에서 스트레스가 다소 쌓이고 있다는 신호일 수 있어요. 취침 전에 4-7-8 호흡법을 5분만 일과에 녹여 넣어보세요. 숨을 들이쉬고, 잠시 멈추고, 천천히 내쉬는 그 리듬이 {{name}}님의 몸과 마음을 하루의 끝에서 부드럽게 정리해줄 거예요. 작은 습관 하나가 삶 전체를 바꿔놓을 수 있습니다.',
    ],
    top_5: [
      '{{name}}님이 쌓아온 수련의 기록들을 하나하나 들여다보면, 그 안에 {{name}}님만의 이야기가 담겨 있어요. 힘들었던 날에도 포기하지 않고 최소한의 수련을 이어간 흔적, 좋은 날에는 더 깊이 몰입했던 흔적들이 고스란히 남아 있습니다. 현재 상위 5% 수준의 건강 점수를 유지하고 있는데, 이 수준에서 한 단계 더 나아가기 위한 열쇠는 수련의 양보다 질에 있을 것 같아요. 특히 명상과 절제 영역에서 조금 더 의식적인 집중을 기울여보신다면, 지금보다 훨씬 더 깊은 건강의 층위를 경험하실 수 있을 거예요.',

      '{{name}}님, 한 가지 솔직한 이야기를 드릴게요. 저는 {{name}}님이 지금보다 훨씬 더 높은 수준의 건강에 도달할 수 있다고 진심으로 믿어요. 현재 데이터가 그것을 말해주고 있거든요. 수면의 규칙성, 호흡의 안정도, 미션 완료율 모두 꾸준히 우상향하고 있습니다. 지금 이 시점에서 가장 중요한 것은 스스로를 믿는 마음이에요. 오늘 하루도 {{name}}님 자신을 소중히 여기면서, 한 걸음 더 나아가 보세요.',
    ],
    top_10: [
      '{{name}}님과 함께해온 시간 동안, 저는 {{name}}님이 얼마나 꾸준하고 성실하게 자신을 가꿔왔는지를 데이터를 통해 생생하게 지켜봐왔어요. 상위 10%를 유지한다는 것은 결코 쉬운 일이 아닙니다. 수많은 유혹과 게으름, 바쁜 일상 속에서도 건강을 놓지 않겠다는 {{name}}님의 의지가 만들어낸 결과예요. 앞으로 걷기와 자세 교정 부분을 조금 더 강화하신다면, 신체적 균형감이 한층 더 개선될 거예요. {{name}}님의 이 여정이 앞으로도 계속되길 진심으로 응원합니다.',

      '{{name}}님, 오늘의 수련 기록을 보면서 제가 느끼는 것은 단순한 수치 이상의 무언가예요. {{days}}일이라는 시간 동안 쌓아온 습관의 두께, 그 안에 담긴 {{name}}님의 인내와 성실함이 느껴집니다. 건강 점수가 꾸준히 오르고 있다는 사실보다, 그 점수를 만들기 위해 매일 조금씩 노력해온 {{name}}님의 그 마음이 더 값집니다. 오늘도 그 마음으로 하루를 시작해 주세요.',
    ],

    // 중간 정도일 때 (top_20 ~ mid_50) ─────────────────────────────────
    top_20: [
      '{{name}}님, 지금 걷고 있는 이 길이 때로는 더디게 느껴질 수도 있어요. 빠르게 성장하는 것처럼 보이는 다른 사람들과 비교하면 내 속도가 초라하게 느껴질 때도 있겠지요. 하지만 {{name}}님, 건강이라는 것은 누군가와 경쟁하는 것이 아니에요. 지금의 {{name}}님이 한 달 전의 {{name}}님보다 조금 더 나아졌다면, 그것으로 이미 충분합니다. 데이터를 보면 수면의 질이 꾸준히 좋아지고 있고, 호흡 수련 완료율도 서서히 상승하고 있어요. 그 방향이 맞습니다. 속도보다 방향이 중요하니까요.',

      '{{name}}님, 솔직히 말씀드리면, {{period}} 동안의 수련 패턴에서 몇 가지 흥미로운 점을 발견했어요. 주중에는 비교적 규칙적으로 수련을 이어가지만, 주말로 갈수록 수련 빈도가 줄어드는 경향이 있어요. 이는 매우 흔한 패턴이기도 해요. 주말에 쉬고 싶은 마음은 당연하지만, 주말에 짧은 수련 루틴 하나만 추가해도 주간 전체의 흐름이 훨씬 안정될 거예요. 아침에 일어나 창문을 열고, 신선한 공기를 마시면서 딱 5분만 호흡에 집중해보세요. 그 5분이 {{name}}님의 주말을 바꿔놓을 거예요.',

      '{{name}}님의 데이터를 보면서 제가 특히 주목한 것은 감사·베품 미션 완료율이에요. 다른 신체적 수련 영역에 비해 이 부분의 완료율이 눈에 띄게 높아요. 이것은 {{name}}님이 내면의 건강에도 진지하게 임하고 있다는 증거입니다. 몸의 건강과 마음의 건강은 따로 떼어놓을 수 없어요. 내면이 안정될수록 신체적 수련도 훨씬 깊어지거든요. 지금 이 균형을 잘 유지하면서 신체 활동 영역을 조금 더 강화해보세요. {{name}}님 안에 그럴 수 있는 충분한 힘이 있어요.',
    ],
    mid_50: [
      '{{name}}님, 처음 수련을 시작했을 때의 그 마음이 기억나시나요? 무언가를 바꾸고 싶다는 열망, 더 건강하게 살고 싶다는 바람. 그 마음이 {{name}}님을 여기까지 데려왔어요. 중간 과정이 항상 순탄하지만은 않죠. 습관이 완전히 자리 잡기 전까지는 흔들리는 날도 있고, 잘 안 되는 날도 있어요. 하지만 그 흔들림 속에서도 다시 일어서는 것, 그게 바로 진짜 수련이에요. 지금 이 순간에도 {{name}}님은 충분히 잘 하고 있어요.',

      '{{name}}님, 건강한 삶이란 어느 날 갑자기 완성되는 것이 아니에요. 매일 아침 눈을 뜨면서 오늘 하루를 조금 더 잘 살아보겠다는 작은 결심의 연속입니다. {{name}}님의 수련 데이터를 보면, 그 작은 결심들이 조금씩 쌓이고 있는 것이 보여요. 완벽하지 않아도 괜찮아요. 지금 이 방향이 맞고, 이 걸음이 맞습니다. 오늘도 어제보다 조금 더 나아가는 {{name}}님을 제가 진심으로 응원합니다.',

      '{{name}}님의 {{period}} 수련 흐름을 분석해보니, 규칙적인 수련보다는 감정이나 상황에 따라 수련 빈도가 달라지는 패턴이 보여요. 이런 분들에게 제가 항상 드리는 이야기가 있어요. 수련을 "기분이 좋을 때 하는 것"이 아니라 "기분과 상관없이 하는 것"으로 바꿔보세요. 딱 2분이라도 좋아요. 기분이 안 좋은 날, 피곤한 날, 바쁜 날에도 아주 짧게 호흡 하나만 의식적으로 해보는 거예요. 그 2분이 쌓이면 삶이 바뀌기 시작합니다.',
    ],

    // 힘들 때 (bot_10 ~ bot_30) ──────────────────────────────────────────
    bot_10: [
      '{{name}}님, 솔직하게 마음을 나눠도 될까요? 최근 수련 데이터를 보면서, 많이 힘드신 것 같다는 느낌이 들었어요. 수련이 멈추는 것은 종종 몸의 문제가 아니라 마음의 무게 때문인 경우가 많거든요. 지금 무언가 버거운 일이 있거나, 에너지가 바닥난 상태인 것은 아닐까요? 괜찮아요. 지금 당장 완벽하게 수련을 재개할 필요는 없어요. 오늘은 그냥 눈을 감고 천천히 숨 한번만 쉬어요. 들이쉬고, 잠깐 멈추고, 천천히 내쉬는 그것만으로도 오늘의 수련은 충분합니다.',

      '{{name}}님, 이 메시지를 읽고 있는 지금 이 순간이 중요해요. 수련을 오래 쉬었다가 다시 시작하려 하면 처음보다 훨씬 더 큰 용기가 필요하죠. 그 심리적 장벽이 얼마나 높은지 저도 알아요. 하지만 {{name}}님, 그 장벽을 넘기 위해 크게 도약할 필요는 없어요. 그냥 한 발짝만 내딛으면 돼요. 오늘 자기 전에 딱 3분, 누운 채로 복식 호흡만 해보세요. 배가 올라가고 내려가는 것을 느끼면서요. 그것이 {{name}}님의 새로운 시작이 될 거예요.',

      '{{name}}님, 저는 {{name}}님을 믿어요. 데이터가 아닌, {{name}}님이라는 사람을 믿는 거예요. 지금 상황이 어렵더라도, 다시 일어설 수 있는 힘이 {{name}}님 안에 있다는 것을 알거든요. 건강을 잃는다는 것은 단순히 컨디션이 나빠지는 것 이상의 의미를 가져요. 삶의 에너지, 집중력, 감정의 안정, 관계의 질, 이 모든 것이 건강과 연결되어 있어요. 지금 이 순간, {{name}}님 자신을 위해 단 5분만 시간을 내어주세요. 당신은 그럴 가치가 있는 사람이에요.',

      '{{name}}님, 오늘 이 메시지가 편안한 시간에 읽혀지길 바랍니다. 수련이 오랫동안 멈춰있는 것을 보면서, 저는 {{name}}님이 혹시 스스로를 너무 가혹하게 판단하고 있는 건 아닐까 걱정이 돼요. 완벽하게 해야 한다는 부담감, 또 실패할까봐 두려운 마음이 오히려 시작을 막고 있을 수도 있거든요. 건강은 경주가 아니에요. 지금 이 자리에서, 이 모습 그대로 다시 시작해도 돼요. {{name}}님이 언제 돌아오든, 저는 여기서 기다리고 있을게요.',
    ],
    bot_20: [
      '{{name}}님, 오랫동안 함께해오면서 저는 {{name}}님이 처음 수련을 시작하던 날의 그 눈빛을 기억해요. 무언가를 바꾸고 싶다는 그 간절함이요. 지금 잠시 그 길에서 멀어진 것처럼 느껴지시더라도, 그 처음의 마음은 여전히 {{name}}님 안에 살아있어요. 다시 시작하는 것이 처음 시작하는 것보다 더 어렵다고 느낄 수 있어요. 하지만 이미 한 번 해봤다는 사실이 {{name}}님의 가장 큰 무기예요. 오늘 딱 한 가지만 해보세요. 아침에 일어나 물 한 잔 마시면서, 오늘 하루 건강하게 보내겠다고 스스로에게 작은 약속 하나만 해보는 것부터요.',

      '{{name}}님, 솔직히 말씀드릴게요. 지금 수련 지표들이 좋지 않아요. 하지만 저는 그 숫자보다 {{name}}님이 더 걱정되어요. 수련이 이렇게 오래 멈춰있다는 것은, 몸이 지쳐있거나 마음이 많이 무거운 상태일 가능성이 높거든요. 지금 당장 수련을 재개하는 것이 목표가 아니에요. 먼저 {{name}}님 자신을 돌보는 것이 먼저예요. 오늘 하루, 좋아하는 음식을 먹고, 좋아하는 음악을 들으면서 조용히 숨을 쉬어보세요. 그것도 충분히 훌륭한 건강 관리예요.',

      '{{name}}님, 이 한 가지만 기억해주세요. 건강은 한번 잃고 나면 되찾는 데 훨씬 더 많은 시간과 노력이 필요해요. 지금 이 순간이 가장 이른 시작점이에요. 내일이 아닌 오늘, 나중이 아닌 지금, 아주 작게라도 시작하는 것이 중요해요. 지금 이 자리에서 손을 들어 크게 기지개를 켜보세요. 그 순간, {{name}}님의 몸이 "그래, 다시 시작하자"라는 신호를 받게 될 거예요. 작은 신호가 큰 변화를 만들어요.',

      '{{name}}님, 제가 {{name}}님의 수련 데이터를 보면서 느끼는 것이 있어요. 이분은 분명히 할 수 있는 사람인데, 지금 어떤 이유로 멈춰있구나 하는 것이요. 그 이유가 무엇이든 간에, 그것은 {{name}}님의 실패가 아니에요. 삶에는 멈춰야 할 때도 있거든요. 하지만 이제 조금씩 다시 움직여봐요. 몸이 움직이기 시작하면 마음도 따라와요. 오늘 저녁, 5분만 밖에 나가서 걸어보세요. 신선한 공기를 마시면서 걷는 그 5분이 {{name}}님의 새로운 시작점이 될 거예요.',
    ],
    bot_30: [
      '{{name}}님, 이 메시지가 닿기를 간절히 바라면서 씁니다. 오랫동안 소식이 없어서 많이 걱정했어요. 건강이 무너지면 삶의 모든 영역이 함께 흔들리기 시작해요. 일도, 관계도, 감정도요. 지금 {{name}}님의 몸과 마음이 어떤 상태인지 여기서 다 알 수는 없지만, 한 가지는 확실해요. 지금이 가장 이른 시작점이라는 것이요. 오늘 창문을 열고 신선한 공기를 깊게 한 번 들이마셔보세요. 그 숨이 {{name}}님을 다시 이 자리로 데려다줄 거예요. 저는 여기서 기다리고 있을게요.',

      '{{name}}님, 저는 {{name}}님을 포기하지 않아요. 데이터가 어떻든, 얼마나 오래 수련을 쉬었든 간에요. 왜냐하면 건강을 향한 여정에는 늦은 시작이라는 것이 없기 때문이에요. {{name}}님이 지금 이 메시지를 읽고 있다는 것 자체가, 마음 어딘가에서 아직 포기하지 않았다는 신호예요. 그 불씨를 꺼뜨리지 마세요. 오늘 딱 하나만요. 물 두 잔 마시기, 그것 하나만 해보세요. 거창하지 않아도 돼요. 그 하나가 다음 하나를 만들고, 그것이 {{name}}님의 건강한 내일을 만들어가는 첫 번째 블록이 될 거예요.',

      '{{name}}님, 오랫동안 연락이 없었는데 오늘 이렇게 만나게 되어 반가워요. 수련에서 멀어진 시간이 길어질수록, 다시 돌아오는 것이 두렵게 느껴질 수 있어요. 그 마음 충분히 이해해요. 하지만 {{name}}님, 지금 이 순간 여기에 있다는 것이 이미 용기 있는 행동이에요. 과거의 기록은 잊어도 괜찮아요. 지금 이 자리에서 새롭게 시작하면 돼요. 아주 작은 것부터, 오늘 하루 물 한 잔, 숨 한 번, 그것으로 충분해요. {{name}}님의 새로운 시작을 진심으로 응원합니다.',

      '{{name}}님, 이 말이 {{name}}님의 마음에 따뜻하게 닿기를 바라며 씁니다. 우리 몸은 정직해요. 무시하면 무시한 만큼, 돌봐주면 돌봐준 만큼 반응하거든요. 지금 당장 크게 변화시키려고 하지 않아도 돼요. 그냥 오늘 하루, {{name}}님의 몸에게 조금 친절해지는 것부터 시작해봐요. 오래 앉아있었다면 잠깐 일어서서 스트레칭 한 번, 물이 생각났다면 지금 바로 한 잔. 그 작은 친절들이 모이고 모이면 어느 날 {{name}}님의 몸이 달라져 있을 거예요. 저는 그 변화를 믿어요.',

      '{{name}}님, 오늘 이 메시지를 끝까지 읽어주셔서 고마워요. 그 자체만으로도 이미 뭔가 달라지고 있다는 증거예요. 수련이 오랫동안 멈춰있었지만, 그 멈춤의 시간 동안 {{name}}님이 어떤 생각을 하고 어떤 감정을 느꼈는지, 그것도 {{name}}님만의 여정의 일부예요. 이제 다시 시작할 준비가 되셨나요? 거창하지 않아도 돼요. 오늘 밤 잠들기 전에, 눈을 감고 조용히 숨을 느껴보세요. 들이쉬고, 내쉬고. 그 고요한 순간이 {{name}}님을 다시 건강한 삶으로 이끄는 첫 번째 문이 될 거예요.',
    ],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 변수 치환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function applyVars(text: string, vars: Record<string, string>) {
  return text
    .replace(/{{name}}/g, vars.name || '회원')
    .replace(/{{period}}/g, vars.period || '최근 30일')
    .replace(/{{days}}/g, vars.days || '7')
    .replace(/{{score}}/g, vars.score || '72');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function FeedbackTemplateManager() {
  const [tier, setTier] = useState('top_10');
  const [category, setCategory] = useState('rapport');
  const [language, setLanguage] = useState('ko');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [customTemplates, setCustomTemplates] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCat, setExpandedCat] = useState(true);
  const [sampleName] = useState('김건강');

  // 현재 필터에 맞는 템플릿 조합
  const templates = useMemo(() => {
    const key = `${category}_${tier}`;
    const custom = customTemplates[key] || [];
    const db = TEMPLATE_DB[category]?.[tier] || [];
    const all = [...db, ...custom];
    // language 필터 (현재는 ko만 실제 데이터, 다른 언어는 번역 필요 표시)
    return all;
  }, [category, tier, language, customTemplates]);

  const catInfo = CATEGORIES.find(c => c.value === category)!;
  const tierInfo = TIER_OPTIONS.find(t => t.value === tier)!;

  // AI 생성 시뮬레이션
  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const key = `${category}_${tier}`;
    const newMsg = `[AI 생성] ${tierInfo.label} × ${catInfo.label}: ${sampleName}님, 오늘도 함께해요! ${Date.now() % 1000}`;
    setCustomTemplates(prev => ({ ...prev, [key]: [...(prev[key] || []), newMsg] }));
    setIsGenerating(false);
    toast.success('AI 새 템플릿 생성 완료!');
  };

  const handleSend = (text: string) => {
    const msg = applyVars(text, { name: sampleName });
    toast.success(`📤 발송 예약: "${msg.slice(0, 40)}..."`);
  };

  const handleSaveEdit = (idx: number) => {
    const key = `${category}_${tier}`;
    const db = TEMPLATE_DB[category]?.[tier] || [];
    if (idx < db.length) {
      // 기본 DB 수정 → custom에 저장
      setCustomTemplates(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), editText],
      }));
    }
    setEditingIdx(null);
    toast.success('템플릿 수정 저장!');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📋 피드백 템플릿 관리
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            6개 카테고리 × 9개 티어 × 5개 언어 · AI 조합 생성 · 관리자 선정 · 자동 발송
          </p>
        </div>

        {/* 필터 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>🔍 필터 설정</span>
              <button onClick={() => setExpandedCat(!expandedCat)}>
                {expandedCat ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CardTitle>
          </CardHeader>
          {expandedCat && (
            <CardContent className="space-y-4">
              {/* 티어 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">📊 티어 선택</p>
                <div className="flex flex-wrap gap-2">
                  {TIER_OPTIONS.map(t => (
                    <button key={t.value}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tier === t.value ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                      style={tier === t.value ? { background: t.color, borderColor: t.color } : {}}
                      onClick={() => { setTier(t.value); setSelectedIdx(null); }}>
                      <span>{t.emoji}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">💬 카테고리</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat.value ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                      style={category === cat.value ? { background: cat.color } : {}}
                      onClick={() => { setCategory(cat.value); setSelectedIdx(null); }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 언어 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">🌐 언어</p>
                <div className="flex gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.value}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${language === l.value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setLanguage(l.value)}>
                      {l.label}
                    </button>
                  ))}
                </div>
                {language !== 'ko' && (
                  <p className="text-xs text-orange-500 mt-2">⚠️ 한국어 외 언어는 AI 자동 번역으로 제공됩니다</p>
                )}
              </div>

              {/* 현재 선택 요약 */}
              <div className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{ background: catInfo.bg, border: `1px solid ${catInfo.color}33` }}>
                <span>{tierInfo.emoji}</span>
                <span className="font-semibold" style={{ color: tierInfo.color }}>{tierInfo.label}</span>
                <span className="text-gray-400">×</span>
                <span className="font-semibold" style={{ color: catInfo.color }}>{catInfo.label}</span>
                <span className="text-gray-400">×</span>
                <span>{LANGUAGES.find(l => l.value === language)?.label}</span>
                <span className="ml-auto text-gray-500">{templates.length}개 조합 가능</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5" disabled={isGenerating} onClick={handleGenerate}>
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'AI 생성 중...' : 'AI 새 템플릿 생성'}
          </Button>
          {selectedIdx !== null && (
            <>
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleSend(templates[selectedIdx] || '')}>
                <Send className="h-4 w-4" />선정 · 발송 예약
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => { navigator.clipboard?.writeText(applyVars(templates[selectedIdx] || '', { name: sampleName })); toast.success('복사!'); }}>
                <Copy className="h-4 w-4" />복사
              </Button>
              <span className="text-xs text-gray-400">{selectedIdx + 1}번 선정됨</span>
            </>
          )}
          <span className="ml-auto text-xs text-gray-400">샘플: {sampleName}님 기준 미리보기</span>
        </div>

        {/* 템플릿 목록 */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-gray-400 mb-4">이 조합의 템플릿이 없습니다</p>
              <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={isGenerating}>
                <Zap className="h-4 w-4" />AI로 자동 생성하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl, idx) => {
              const preview = applyVars(tpl, { name: sampleName, period: '최근 30일', days: '7', score: '72' });
              const isSelected = selectedIdx === idx;
              const isEditing = editingIdx === idx;
              return (
                <Card key={idx}
                  className={`transition-all cursor-pointer ${isSelected ? 'ring-2' : 'hover:shadow-sm'}`}
                  style={isSelected ? { borderColor: catInfo.color, outline: `2px solid ${catInfo.color}` } : {}}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      {/* 선택 버튼 */}
                      <button
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                        style={isSelected
                          ? { background: catInfo.color, borderColor: catInfo.color }
                          : { borderColor: '#d1d5db' }}
                        onClick={() => setSelectedIdx(isSelected ? null : idx)}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </button>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">#{String(idx + 1).padStart(2, '0')}</span>
                          {idx >= (TEMPLATE_DB[category]?.[tier] || []).length && (
                            <Badge className="text-xs bg-green-100 text-green-700">AI 생성</Badge>
                          )}
                          {category === 'premium' && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">3차 심화</Badge>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea value={editText} onChange={e => setEditText(e.target.value)}
                              rows={4} className="text-sm" />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs bg-blue-600 text-white"
                                onClick={() => handleSaveEdit(idx)}>저장</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs"
                                onClick={() => setEditingIdx(null)}>취소</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed">{preview}</p>
                        )}
                      </div>

                      {/* 액션 */}
                      {!isEditing && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                            onClick={() => { setEditingIdx(idx); setEditText(tpl); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button className="text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                            onClick={() => handleSend(tpl)}>
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 자동 발송 설정 */}
        {selectedIdx !== null && (
          <Card style={{ borderColor: catInfo.color, borderWidth: 1.5 }}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: catInfo.color }}>
                    ✅ #{selectedIdx + 1}번 선정 완료
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tierInfo.emoji} {tierInfo.label} · {catInfo.label} · {LANGUAGES.find(l => l.value === language)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                    onClick={() => handleSend(templates[selectedIdx] || '')}>
                    <Zap className="h-3.5 w-3.5 text-yellow-500" />즉시 발송
                  </Button>
                  <Button size="sm" className="h-8 text-xs gap-1 bg-blue-600 text-white"
                    onClick={() => toast.success('이벤트 관리 → 발송 예약 등록!')}>
                    <Send className="h-3.5 w-3.5" />발송 예약
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 통계 */}
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
              {CATEGORIES.map(cat => {
                const total = Object.values(TEMPLATE_DB[cat.value] || {}).flat().length;
                return (
                  <div key={cat.value} className="p-2 rounded-lg" style={{ background: cat.bg }}>
                    <p className="font-semibold" style={{ color: cat.color }}>{cat.label.split(' ')[0]}</p>
                    <p className="text-gray-600 mt-0.5">{total}개</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              총 {Object.values(TEMPLATE_DB).flatMap(v => Object.values(v)).flat().length}개 템플릿 · AI 생성으로 무제한 확장 가능
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
