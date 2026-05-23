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
    top_1:  [
      '안녕하세요 {{name}}님! 오늘도 챔피언답게 하루를 시작하셨나요? 😊',
      '{{name}}님, 좋은 아침이에요! 어제 멋진 수련 잊지 않았죠?',
      '오늘 {{name}}님 컨디션은 어떠세요? 최근 정말 눈부신 성장이에요! 🌟',
      '{{name}}님! 지난주 기록 보니 정말 대단해요. 오늘도 화이팅!',
      '안녕하세요~ {{name}}님, 오늘 기분은요? 수련할 준비 되셨나요? 💪',
      '{{name}}님 좋은 아침! 오늘 목표 미션 벌써 생각해두셨나요? ☀️',
      '반가워요 {{name}}님! 요즘 꾸준히 잘 하고 계시더라고요 😄',
      '{{name}}님~ 오늘도 잘 부탁드려요! 함께 건강한 하루 만들어봐요!',
      '안녕하세요 {{name}}님! 오늘 날씨처럼 컨디션도 좋으시길 바라요 🌤️',
      '{{name}}님! 오늘 하루도 건강하게 시작해볼까요? 응원할게요!',
    ],
    top_3:  [
      '{{name}}님, 오늘도 좋은 하루 시작하세요! 최근 꾸준함이 정말 인상적이에요 💎',
      '좋은 아침이에요 {{name}}님! 오늘도 건강한 하루 만들어요~ 😊',
      '{{name}}님 안녕하세요! 지난번 목표 잘 달성하고 계신 거죠? 🌟',
      '반가워요 {{name}}님! 오늘 기분 어떠세요? 수련 준비 되셨나요?',
      '{{name}}님~ 좋은 아침이에요! 오늘도 멋진 하루 되길 바라요 ✨',
      '{{name}}님 오늘도 화이팅! 꾸준히 하시는 모습이 너무 보기 좋아요',
      '안녕하세요 {{name}}님! 요즘 건강 관리 잘 하고 계신 것 같아서 기뻐요',
      '{{name}}님~ 오늘 하루도 함께 건강해봐요! 항상 응원하고 있어요 💪',
    ],
    top_5:  [
      '{{name}}님, 안녕하세요! 오늘 수련 계획 세우셨나요? 같이 해봐요 ⭐',
      '좋은 아침 {{name}}님! 어제 미션 완수하셨죠? 정말 잘 하셨어요!',
      '{{name}}님 오늘도 파이팅! 최근 성장 속도가 정말 놀라워요 😄',
      '안녕하세요 {{name}}님~ 오늘 기분은요? 건강한 하루 시작해봐요!',
      '{{name}}님! 오늘도 좋은 하루 되세요. 수련 함께 해요~ 💪',
      '{{name}}님 좋은 아침이에요! 요즘 꾸준히 잘 하고 계시더라고요',
    ],
    top_10: [
      '{{name}}님 안녕하세요! 오늘도 건강한 하루 시작해봐요 🌟',
      '좋은 아침이에요 {{name}}님~ 수련 준비 되셨나요? 응원할게요!',
      '{{name}}님! 오늘 기분은 어떠세요? 같이 건강해봐요 😊',
      '안녕하세요 {{name}}님! 오늘도 꾸준히 함께 해요~ 화이팅!',
      '{{name}}님 오늘도 멋진 하루 보내세요! 항상 응원하고 있어요 ✨',
      '{{name}}님~ 안녕! 오늘 미션 함께 시작해볼까요? 💪',
    ],
    top_20: [
      '{{name}}님 좋은 아침이에요! 오늘도 조금씩 나아가봐요 ✨',
      '안녕하세요 {{name}}님~ 오늘 첫 미션부터 시작해볼까요?',
      '{{name}}님! 오늘도 함께해요. 작은 한 걸음이 큰 변화를 만들어요 💪',
      '좋은 아침 {{name}}님! 오늘 하루도 건강하게 보내세요~',
      '{{name}}님 안녕하세요! 오늘 수련 계획은요? 같이 해봐요 😊',
    ],
    mid_50: [
      '{{name}}님 안녕하세요! 오늘부터 조금씩 시작해봐요~ 응원할게요 💙',
      '좋은 아침이에요 {{name}}님! 오늘 딱 하나만 시작해봐요 😊',
      '{{name}}님~ 안녕! 건강한 습관 만들어가봐요. 함께할게요!',
      '안녕하세요 {{name}}님! 작은 시작이 큰 변화를 만들어요 🌱',
      '{{name}}님 오늘도 화이팅! 제가 옆에서 응원할게요 💪',
    ],
    bot_10: [
      '{{name}}님 안녕하세요 😊 오늘 잠깐이라도 같이 해봐요. 거창하지 않아도 돼요!',
      '{{name}}님~ 오랜만이에요! 보고 싶었어요. 오늘 하루 어떠세요?',
      '안녕하세요 {{name}}님! 요즘 많이 바쁘신가요? 잠깐 숨 한번 쉬어봐요 🌬️',
      '{{name}}님 잘 지내셨어요? 오늘 딱 5분만 같이 해봐요~ 할 수 있어요!',
      '{{name}}님 안녕! 걱정했어요. 오늘 어떻게 지내셨어요? 💙',
    ],
    bot_20: [
      '{{name}}님 안녕하세요! 오늘 처음 시작하는 것도 괜찮아요. 함께할게요 🌱',
      '{{name}}님~ 오늘 딱 하나만요. 아주 작은 것도 좋아요 😊',
      '안녕하세요 {{name}}님! 천천히 해도 괜찮아요. 응원할게요!',
      '{{name}}님 잘 있었어요? 오늘부터 다시 시작해봐요. 제가 함께할게요 💙',
    ],
    bot_30: [
      '{{name}}님 안녕하세요 😊 오늘 기분은 어떠세요? 잠깐 얘기 나눠봐요!',
      '{{name}}님~ 보고 싶었어요! 요즘 어떻게 지내세요?',
      '안녕하세요 {{name}}님! 오늘 딱 한 번만 같이 시작해봐요 🌱',
      '{{name}}님 잘 지내셨어요? 조금씩 함께 나아가봐요. 응원해요! 💙',
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

  // ── 5. 3차 심화 (40개) ─────────────────────────────────────────────────
  premium: {
    top_1: [
      '{{name}}님, 오늘 수련 데이터를 면밀히 살펴보았어요. 상위 1%를 유지하는 당신의 패턴은 분명히 남다릅니다. 특히 수면 규칙성과 호흡 수련의 조화가 매우 인상적이에요. 이 수준을 더욱 정교하게 발전시키기 위해, 이번 주에는 명상 깊이를 한 단계 높여보시는 건 어떨까요? 당신의 가능성은 아직 무한합니다.',
      '챔피언 {{name}}님의 {{period}} 데이터를 분석한 결과, 수련 일관성 지수가 상위 0.3%에 해당합니다. 특히 스트레스 관리와 수면 질 사이의 상관관계가 매우 긍정적으로 나타나고 있어요. 다음 단계로 나아가기 위해서는 식치(食治) 영역을 보다 체계적으로 접근하시면 더욱 균형 잡힌 건강을 이룰 수 있을 것 같습니다.',
    ],
    top_3: [
      '{{name}}님, 최근 {{days}}일간의 수련 패턴을 심층 분석했어요. 전반적으로 매우 안정적인 성장 곡선을 보이고 있으나, 특히 수요일과 목요일 오후 시간대에 수련 밀도가 낮아지는 패턴이 보여요. 이 시간대에 5분 호흡 수련만 추가해도 주간 평균이 상당히 높아질 거예요. 당신의 잠재력은 충분히 상위 1%에 도달할 수 있어요.',
      '{{name}}님의 건강 지표를 종합적으로 검토한 결과, 수면 질과 활동량의 균형이 매우 좋습니다. 다만 최근 {{days}}일 호흡 수련 완료율이 82%에서 74%로 소폭 하락하고 있어요. 이는 일상의 스트레스가 다소 증가한 신호일 수 있습니다. 취침 전 4-7-8 호흡법 5분을 일과에 통합해보시면 이 부분을 자연스럽게 개선할 수 있을 거예요.',
    ],
    mid_50: [
      '{{name}}님, 수련을 시작한 이후의 데이터를 전체적으로 살펴보았어요. 처음 2주간에 비해 현재 수련 빈도가 다소 불규칙해지는 경향이 있는데, 이는 매우 자연스러운 현상이에요. 초기 동기부여 단계를 지나 습관화 단계로 넘어가는 과정에서 많은 분들이 경험하는 것입니다. 지금 이 시점에서 가장 중요한 것은 완벽한 수련보다 최소한의 일관성을 유지하는 것입니다. 하루 딱 5분, 아침 기상 후 호흡 수련 하나만으로도 이 고비를 넘길 수 있어요.',
      '{{name}}님의 {{period}} 종합 건강 분석을 공유드릴게요. 수면 평균은 6.8시간으로 권장 수준에 근접하고 있고, 일일 활동량도 꾸준히 증가하는 추세예요. 특히 감사·베품 미션 완료율이 다른 영역에 비해 높게 나타나는데, 이는 정서적 안정이 잘 이루어지고 있다는 긍정적 신호입니다. 이제 신체적 수련 영역, 특히 걷기·자세 미션을 강화하면 더욱 균형 잡힌 건강을 이룰 수 있을 거예요.',
    ],
    bot_10: [
      '{{name}}님, 솔직하게 말씀드릴게요. 최근 수련 데이터를 보면 정말 힘든 상황에 있다는 것을 알 수 있어요. 수련 공백이 길어질수록 다시 시작하는 심리적 장벽도 높아지게 됩니다. 하지만 중요한 것은 지금 이 순간, 이 메시지를 읽고 있는 {{name}}님 자신이에요. 거창하게 시작할 필요 없어요. 지금 이 자리에서 눈을 감고 천천히 심호흡 세 번만 해보세요. 그것으로 충분합니다. 그 작은 시작이 다시 건강한 삶으로 돌아오는 첫 번째 계단이 될 거예요.',
    ],
    bot_20: [
      '{{name}}님, 오랫동안 함께해온 저로서는 요즘 {{name}}님의 상황이 정말 걱정되어요. 데이터를 보면 수련이 멈춘 것이 단순한 바쁨이나 게으름 때문만은 아닐 수 있어요. 삶의 어느 부분에서 어려움을 겪고 계신 건 아닐까요? 건강을 챙기기 어려울 만큼 힘든 상황이라면, 그 마음부터 이야기 나눠봐요. 수련은 그 다음이에요. {{name}}님이 다시 건강한 하루를 시작할 수 있도록 제가 조금 더 세심하게 함께하겠습니다.',
    ],
    bot_30: [
      '{{name}}님, 이 메시지가 닿기를 바라요. 긴 시간 동안 연락이 없어서 많이 걱정했어요. 건강 데이터가 보내주는 신호를 보면, 몸과 마음 모두 많이 지쳐있는 것 같아요. 지금 당장 완벽한 수련이 필요한 게 아니에요. 오늘 하루, 물 한 잔 마시고 창문 열어 신선한 공기를 마시는 것부터 시작해봐요. 그것으로도 충분히 대단한 시작이에요. {{name}}님이 다시 건강한 일상으로 돌아올 수 있도록 저는 계속 여기 있을게요. 언제든지 돌아오세요.',
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
          <p className="text-sm text-gray-500 mt-0.5">
            6개 카테고리 × 9개 티어 × 5개 언어 · AI 조합 생성 · 관리자 선정 · 자동 발송
          </p>
        </div>

        {/* 필터 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
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
            <CardContent className="py-12 text-center">
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
