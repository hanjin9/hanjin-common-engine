import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Users, Filter, Send, Plus, Edit2, Trash2,
  Bell, Mail, MessageSquare, Calendar, X, CheckCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

// 캠페인 유형 정의
const CAMPAIGN_TYPES = [
  { value: 'notice', label: '📢 공지사항', desc: '앱 내 공지 팝업' },
  { value: 'event', label: '🎉 이벤트 안내', desc: '이벤트 참여 유도' },
  { value: 'mission', label: '🎯 미션 독려', desc: '미션 참여 요청' },
  { value: 'point', label: '⭐ 게릴라 포인트', desc: '즉시 포인트 지급' },
  { value: 'push', label: '🔔 일반 푸시', desc: '자유 형식 알림' },
];

const CHANNELS = [
  { value: 'app', label: '📱 앱 푸시', icon: Bell },
  { value: 'email', label: '📧 이메일', icon: Mail },
  { value: 'sms', label: '📲 SMS', icon: MessageSquare },
];

const segments = [
  { id: 1, name: '상위 10% 사용자', description: '건강 점수 상위 10%', criteria: 'score >= 90', memberCount: 150, status: 'active', createdAt: '2026-05-01' },
  { id: 2, name: '하위 20% 사용자', description: '건강 점수 하위 20%', criteria: 'score < 40', memberCount: 300, status: 'active', createdAt: '2026-05-05' },
  { id: 3, name: '프리미엄 구독자', description: '프리미엄 멤버십 구독 중', criteria: 'membership = "premium"', memberCount: 450, status: 'active', createdAt: '2026-04-20' },
  { id: 4, name: '휴면 사용자', description: '30일 이상 미활동', criteria: 'lastActivity < 30days', memberCount: 200, status: 'inactive', createdAt: '2026-05-10' },
];

const sendHistory = [
  { id: 1, segmentName: '상위 10% 사용자', messageTitle: '이달의 MVP 축하 메시지', sentCount: 150, successCount: 145, failureCount: 5, sentAt: '2026-05-22 10:30', status: 'completed' },
  { id: 2, segmentName: '하위 20% 사용자', messageTitle: '건강 개선 응원 메시지', sentCount: 300, successCount: 285, failureCount: 15, sentAt: '2026-05-21 14:00', status: 'completed' },
];

export default function TargetAudienceManager() {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [showCampaign, setShowCampaign] = useState(false);
  const [campaignType, setCampaignType] = useState('notice');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignMsg, setCampaignMsg] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['app']);
  const [sendMode, setSendMode] = useState<'instant' | 'schedule'>('instant');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendDone, setSendDone] = useState(false);

  const toggleChannel = (ch: string) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSend = () => {
    if (!campaignTitle.trim() || !campaignMsg.trim()) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }
    if (selectedChannels.length === 0) {
      alert('채널을 1개 이상 선택해 주세요.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendDone(true);
      setTimeout(() => {
        setSendDone(false);
        setShowCampaign(false);
        setCampaignTitle('');
        setCampaignMsg('');
        setCampaignType('notice');
        setSelectedChannels(['app']);
        setSendMode('instant');
      }, 1800);
    }, 1200);
  };

  const seg = selectedSegment != null ? segments.find(s => s.id === selectedSegment) : null;

  return (
    <DashboardLayout>
      <div className="space-y-3 p-3 md:p-4">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Filter className="h-6 w-6 text-blue-600" />타겟 발송 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">세그먼트별 맞춤 발송 · 새 캠페인 생성</p>
          </div>
          <Button
            size="lg"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => { setShowCampaign(true); setSendDone(false); }}
          >
            <Plus className="h-4 w-4" />새 캠페인
          </Button>
        </div>

        {/* ── KPI ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Card><CardContent className="pt-5">
            <p className="text-sm text-gray-500">활성 세그먼트</p>
            <p className="text-xl font-bold">3</p>
            <p className="text-xs text-gray-400 mt-1">관리 중</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-gray-500">총 타겟 인원</p>
            <p className="text-xl font-bold">900명</p>
            <p className="text-xs text-gray-400 mt-1">전체 세그먼트</p>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-sm text-gray-500">평균 발송 성공률</p>
            <p className="text-xl font-bold text-green-600">95.1%</p>
            <p className="text-xs text-gray-400 mt-1">최근 30일</p>
          </CardContent></Card>
        </div>

        {/* ── 새 캠페인 모달 ── */}
        {showCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />새 캠페인 생성
                </h2>
                <button onClick={() => setShowCampaign(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* 캠페인 유형 */}
                <div>
                  <p className="text-sm font-semibold mb-2">캠페인 유형</p>
                  <div className="grid grid-cols-1 gap-2">
                    {CAMPAIGN_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        onClick={() => setCampaignType(ct.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                          campaignType === ct.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-sm">{ct.label}</span>
                        <span className="text-xs text-gray-500">{ct.desc}</span>
                        {campaignType === ct.value && (
                          <CheckCircle className="h-4 w-4 text-blue-600 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 대상 세그먼트 */}
                <div>
                  <p className="text-sm font-semibold mb-2">대상 선택</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSelectedSegment(null)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition ${
                        selectedSegment === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">전체 회원</span>
                      <span className="text-gray-500">1,247명</span>
                    </button>
                    {segments.filter(s => s.status === 'active').map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSegment(s.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition ${
                          selectedSegment === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-gray-500">{s.memberCount.toLocaleString()}명</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 채널 선택 */}
                <div>
                  <p className="text-sm font-semibold mb-2">발송 채널</p>
                  <div className="flex gap-2 flex-wrap">
                    {CHANNELS.map(ch => (
                      <button
                        key={ch.value}
                        onClick={() => toggleChannel(ch.value)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                          selectedChannels.includes(ch.value)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 제목 + 내용 */}
                <div>
                  <p className="text-sm font-semibold mb-2">제목</p>
                  <Input
                    placeholder="캠페인 제목을 입력하세요"
                    value={campaignTitle}
                    onChange={e => setCampaignTitle(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">내용</p>
                  <Textarea
                    placeholder="발송할 메시지를 입력하세요..."
                    value={campaignMsg}
                    onChange={e => setCampaignMsg(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* 발송 시점 */}
                <div>
                  <p className="text-sm font-semibold mb-2">발송 시점</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSendMode('instant')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                        sendMode === 'instant' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                      }`}
                    >⚡ 즉시 발송</button>
                    <button
                      onClick={() => setSendMode('schedule')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                        sendMode === 'schedule' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                      }`}
                    ><Calendar className="h-4 w-4 inline mr-1" />예약 발송</button>
                  </div>
                  {sendMode === 'schedule' && (
                    <Input
                      type="datetime-local"
                      className="mt-2"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  )}
                </div>

                {/* 발송 버튼 */}
                <Button
                  className="w-full gap-2"
                  disabled={isSending || sendDone}
                  onClick={handleSend}
                >
                  {sendDone ? (
                    <><CheckCircle className="h-4 w-4" />발송 완료!</>
                  ) : isSending ? (
                    '발송 중...'
                  ) : (
                    <><Send className="h-4 w-4" />
                    {sendMode === 'instant' ? '즉시 발송' : '예약 등록'}
                    ({seg ? `${seg.memberCount.toLocaleString()}명` : '1,247명'} 대상)</>
                  )}
                </Button>

              </div>
            </div>
          </div>
        )}

        {/* ── 세그먼트 목록 ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">타겟 세그먼트</h2>
          {segments.map(s => (
            <Card key={s.id}
              className={`cursor-pointer transition ${selectedSegment === s.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedSegment(selectedSegment === s.id ? null : s.id)}
            >
              <CardContent className="pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{s.name}</h3>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                        {s.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{s.description}</p>
                    <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">{s.criteria}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="font-bold">{s.memberCount.toLocaleString()}명</span>
                      <span className="text-gray-400">생성: {s.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="default" className="gap-1 text-xs"
                      onClick={e => { e.stopPropagation(); setSelectedSegment(s.id); setShowCampaign(true); }}>
                      <Send className="h-3 w-3" />발송
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={e => { e.stopPropagation(); alert(`${s.name} 세그먼트 수정`); }}>
                      <Edit2 className="h-3 w-3" />수정
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-red-500 border-red-200"
                      onClick={e => { e.stopPropagation(); if(confirm(`${s.name} 삭제?`)) alert('삭제 완료'); }}>
                      <Trash2 className="h-3 w-3" />삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── 발송 이력 ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">발송 이력</h2>
          {sendHistory.map(h => (
            <Card key={h.id}>
              <CardContent className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{h.segmentName}</span>
                  <Badge variant="secondary" className="text-xs">{h.messageTitle}</Badge>
                  <Badge variant="default" className="text-xs ml-auto">완료</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-3">{h.sentAt}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-gray-500">발송</p><p className="text-xl font-bold">{h.sentCount}</p></div>
                  <div><p className="text-xs text-gray-500">성공</p><p className="text-xl font-bold text-green-600">{h.successCount}</p></div>
                  <div><p className="text-xs text-gray-500">실패</p><p className="text-xl font-bold text-red-500">{h.failureCount}</p></div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${(h.successCount / h.sentCount) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  성공률 {((h.successCount / h.sentCount) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
