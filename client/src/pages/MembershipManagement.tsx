/**
 * MembershipManagement.tsx — 멤버십 관리 (6차 신규)
 * 11단계 VIP 멤버십 체계 · 가로 표 형식 · 정책/조건/혜택/회비 편집
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { X, Save, Edit2, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const TIERS = [
  { step: 1,  emoji: '🥉', name: '브론즈',        color: '#cd7f32', bg: '#fdf8f0',
    condition: '가입 후 30일 이상 · 미션 5개 이상 완료', benefits: '기초 콘텐츠 · 일일 미션 5개 · AI 1차 피드백',
    joinFee: 0, deposit: 0, monthly: 0, annual: 0, healthScore: 0 },
  { step: 2,  emoji: '🥈', name: '실버',          color: '#94a3b8', bg: '#f8fafc',
    condition: '건강 점수 30+ · 미션 30개 완료', benefits: '전체 콘텐츠 · 무제한 미션 · 1,000P/월',
    joinFee: 0, deposit: 0, monthly: 9900, annual: 99000, healthScore: 30 },
  { step: 3,  emoji: '🥇', name: '골드',          color: '#f59e0b', bg: '#fffbeb',
    condition: '건강 점수 50+ · 3개월 연속 수련', benefits: 'AI 맞춤 코칭 · 2,000P/월 · 오프라인 이벤트',
    joinFee: 50000, deposit: 0, monthly: 29900, annual: 299000, healthScore: 50 },
  { step: 4,  emoji: '💚', name: '에메랄드',      color: '#10b981', bg: '#f0fdf4',
    condition: '건강 점수 60+ · 6개월 연속', benefits: '웨어러블 연동 · 3,000P/월 · 1:1 피드백',
    joinFee: 100000, deposit: 0, monthly: 49900, annual: 499000, healthScore: 60 },
  { step: 5,  emoji: '🌊', name: '그린에메랄드',  color: '#0d9488', bg: '#f0fdfa',
    condition: '건강 점수 65+ · 9개월 연속', benefits: '맞춤 미션 · 4,000P/월 · 그룹 세션',
    joinFee: 150000, deposit: 0, monthly: 69900, annual: 699000, healthScore: 65 },
  { step: 6,  emoji: '💙', name: '사파이어',      color: '#2563eb', bg: '#eff6ff',
    condition: '건강 점수 70+ · 1년 연속', benefits: 'VIP 분석 리포트 · 5,000P/월 · 전문가 상담',
    joinFee: 200000, deposit: 500000, monthly: 99000, annual: 990000, healthScore: 70 },
  { step: 7,  emoji: '🔷', name: '블루사파이어',  color: '#3b82f6', bg: '#eff6ff',
    condition: '건강 점수 75+ · 2년 연속', benefits: '프리미엄 코칭 · 7,000P/월 · 해외 이벤트',
    joinFee: 300000, deposit: 1000000, monthly: 149000, annual: 1490000, healthScore: 75 },
  { step: 8,  emoji: '💎', name: '다이아몬드',    color: '#818cf8', bg: '#eef2ff',
    condition: '건강 점수 80+ · 3년 연속', benefits: '다이아몬드 혜택 · 10,000P/월 · 수익 배분',
    joinFee: 500000, deposit: 2000000, monthly: 199000, annual: 1990000, healthScore: 80 },
  { step: 9,  emoji: '🌀', name: '블루다이아몬드', color: '#06b6d4', bg: '#ecfeff',
    condition: '건강 점수 85+ · 5년 연속', benefits: '최상위 혜택 · 15,000P/월 · 파트너 자격',
    joinFee: 1000000, deposit: 3000000, monthly: 299000, annual: 2990000, healthScore: 85 },
  { step: 10, emoji: '👑', name: '플래티넘',      color: '#6366f1', bg: '#eef2ff',
    condition: '건강 점수 90+ · 10년 연속', benefits: 'VIP 모든 혜택 · 20,000P/월 · 임원급',
    joinFee: 2000000, deposit: 5000000, monthly: 499000, annual: 4990000, healthScore: 90 },
  { step: 11, emoji: '⚫', name: '블랙플래티넘',  color: '#1a1a2e', bg: '#f1f5f9',
    condition: '초청제 · 관리자 승인 필요', benefits: '최고 등급 · 무제한 포인트 · 수익 공유 · 프랜차이즈',
    joinFee: 5000000, deposit: 10000000, monthly: 999000, annual: 9990000, healthScore: 95 },
];

const fmtKrw = (v: number) => v === 0 ? '무료' : `₩${v.toLocaleString('ko-KR')}`;

interface EditState {
  condition: string; benefits: string;
  joinFee: string; deposit: string; monthly: string; annual: string;
}

export default function MembershipManagement() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditState>({
    condition: '', benefits: '', joinFee: '', deposit: '', monthly: '', annual: '',
  });

  const startEdit = (tier: typeof TIERS[0]) => {
    setEditing(tier.step);
    setEditData({
      condition: tier.condition, benefits: tier.benefits,
      joinFee: String(tier.joinFee), deposit: String(tier.deposit),
      monthly: String(tier.monthly), annual: String(tier.annual),
    });
  };

  const saveEdit = (step: number) => {
    toast.success(`${step}단계 멤버십 정책 저장 완료!`);
    setEditing(null);
  };

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-base font-bold truncate">멤버십 관리</h1>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">11단계 VIP 멤버십 체계 · 정책·조건·혜택·회비 편집</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 text-xs">공통 엔진 — 프로젝트별 단계 선택 적용</Badge>
        </div>

        {/* 11단계 가로 표 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">11단계 멤버십 체계</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* 헤더 */}
            <div className="grid text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 px-4 py-2"
              style={{ gridTemplateColumns: '140px 1fr 1fr 160px 40px' }}>
              <span>등급</span>
              <span>자격 조건</span>
              <span>주요 혜택</span>
              <span>회비</span>
              <span></span>
            </div>

            {TIERS.map(tier => (
              <div key={tier.step}>
                {/* 메인 행 */}
                <div
                  className="grid items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns: '140px 1fr 1fr 160px 40px' }}>
                  {/* 등급 */}
                  <div className="flex items-center gap-2">
                    {/* 이미지 슬롯 */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 6, background: tier.bg,
                      border: `2px solid ${tier.color}33`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0,
                    }} onClick={() => toast.success('멤버십 카드 이미지 업로드 (준비 중)')}>
                      {tier.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: tier.color }}>
                        {tier.step}단계
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{tier.emoji} {tier.name}</div>
                    </div>
                  </div>
                  {/* 자격 조건 */}
                  <div className="text-xs text-gray-600 pr-3">{tier.condition}</div>
                  {/* 혜택 */}
                  <div className="text-xs text-gray-600 pr-3">{tier.benefits}</div>
                  {/* 회비 */}
                  <div className="text-xs">
                    <div className="text-gray-500">월 <span className="font-semibold text-gray-800">{fmtKrw(tier.monthly)}</span></div>
                    <div className="text-gray-400">연 {fmtKrw(tier.annual)}</div>
                  </div>
                  {/* 펼치기 */}
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => setExpanded(expanded === tier.step ? null : tier.step)}>
                    {expanded === tier.step
                      ? <ChevronUp className="h-4 w-4 text-gray-500" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>

                {/* 펼쳐진 편집 영역 */}
                {expanded === tier.step && (
                  <div style={{ background: tier.bg, borderBottom: '1px solid #e5e7eb', padding: '14px 20px' }}>
                    {editing === tier.step ? (
                      // 편집 모드
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">자격 조건</label>
                            <Textarea value={editData.condition} rows={2}
                              onChange={e => setEditData(d => ({ ...d, condition: e.target.value }))}
                              className="text-xs" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">기본 혜택</label>
                            <Textarea value={editData.benefits} rows={2}
                              onChange={e => setEditData(d => ({ ...d, benefits: e.target.value }))}
                              className="text-xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { k: 'joinFee', label: '가입비 (₩)' },
                            { k: 'deposit',  label: '보증금 (₩)' },
                            { k: 'monthly',  label: '월 회비 (₩)' },
                            { k: 'annual',   label: '연 회비 (₩)' },
                          ].map(f => (
                            <div key={f.k}>
                              <label className="text-xs font-medium text-gray-500 block mb-1">{f.label}</label>
                              <Input type="number" value={(editData as any)[f.k]} className="h-7 text-xs"
                                onChange={e => setEditData(d => ({ ...d, [f.k]: e.target.value }))} />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1 bg-blue-600 text-white" onClick={() => saveEdit(tier.step)}>
                            <Save className="h-3 w-3" />저장
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(null)}>
                            <X className="h-3 w-3" />취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-gray-600 mb-1">📋 자격 조건</p>
                            <p className="text-gray-700">{tier.condition}</p>
                            <p className="text-gray-400 mt-1">건강 점수 {tier.healthScore}점 이상 필요</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 mb-1">🎁 기본 혜택</p>
                            <p className="text-gray-700">{tier.benefits}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                            <p className="text-gray-400">가입비</p>
                            <p className="font-bold text-gray-800">{fmtKrw(tier.joinFee)}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                            <p className="text-gray-400">보증금</p>
                            <p className="font-bold text-gray-800">{fmtKrw(tier.deposit)}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                            <p className="text-gray-400">월 회비</p>
                            <p className="font-bold text-gray-800">{fmtKrw(tier.monthly)}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                            <p className="text-gray-400">연 회비</p>
                            <p className="font-bold text-gray-800">{fmtKrw(tier.annual)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => startEdit(tier)}>
                            <Edit2 className="h-3 w-3" />수정
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"
                            onClick={() => toast.success('멤버십 카드 이미지 업로드 준비 중')}>
                            <Upload className="h-3 w-3" />이미지 업로드
                          </Button>
                          <span className="text-xs text-gray-400">• 이미지 슬롯: 럭셔리 카드 이미지 업로드 예정</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 공통 엔진 활용 안내 */}
        <Card>
          <CardHeader><CardTitle className="text-sm">📋 공통 엔진 활용 가이드</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-700 mb-1">GLWA 프랜차이즈</p>
                <p className="text-blue-600">11단계 전체 사용 (1~11단계)</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-700 mb-1">중형 프로젝트</p>
                <p className="text-green-600">4~6단계 선택 (브론즈·골드·다이아몬드)</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">소형 프로젝트</p>
                <p className="text-gray-600">3단계 (브론즈·실버·골드)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
