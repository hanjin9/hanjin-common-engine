/**
 * AiEngineDashboard.tsx — AI 엔진 통합 관리 대시보드
 * 3개 엔진 상태 · 프로젝트별 ON/OFF · 실시간 코칭 테스트
 */
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const ENGINE_META = {
  anomalyDetection: { label: '🚨 이상 감지', color: '#ef4444', bg: '#fef2f2', completion: 95, note: 'LLM 응급 조언 완성' },
  realtimeCoaching: { label: '🎯 실시간 코칭', color: '#10b981', bg: '#f0fdf4', completion: 90, note: '음성 피드백 미구현' },
  healthAnalysis:   { label: '💊 건강 분석',  color: '#3b82f6', bg: '#eff6ff', completion: 85, note: 'DB 연동 필요' },
  autoSend:         { label: '📤 자동 발송',  color: '#f59e0b', bg: '#fffbeb', completion: 70, note: '채널 연동 필요' },
  voiceFeedback:    { label: '🎙️ 음성 피드백', color: '#8b5cf6', bg: '#f5f3ff', completion: 0,  note: 'ElevenLabs 추후 연동' },
  weeklyReport:     { label: '📊 주간 리포트', color: '#06b6d4', bg: '#ecfeff', completion: 60, note: '자동 발송 연동 필요' },
  tierRanking:      { label: '🏆 티어 랭킹',  color: '#f97316', bg: '#fff7ed', completion: 80, note: '% 기반 자동 분류' },
};

const PROJECT_ORDER = ['glwa','soom','sports','jangbu'];
const PROJECT_LABELS: Record<string,string> = {
  glwa:'🌊 GLWA 웰니스', soom:'🌬️ 숨 호흡 앱', sports:'⚡ 스포츠 회복사', jangbu:'📋 장부 관리사'
};

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 99, transition: 'width .5s' }} />
    </div>
  );
}

export default function AiEngineDashboard() {
  const { data: configs, refetch } = trpc.coachingOrchestrator.getAllEngineConfigs.useQuery();
  const updateEngine = trpc.coachingOrchestrator.updateEngineConfig.useMutation({
    onSuccess: () => { toast.success('엔진 설정 저장 완료!'); refetch(); },
  });
  const runCoaching = trpc.coachingOrchestrator.runCoaching.useMutation({
    onSuccess: (r) => toast.success(`✅ 코칭 완료! 엔진: ${r.enginesUsed.join(', ')}`),
    onError: () => toast.error('코칭 실행 오류'),
  });

  const [testProject, setTestProject] = useState('glwa');
  const [testUser, setTestUser] = useState('test_user_001');
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = (projectSlug: string, engineKey: string, current: boolean) => {
    updateEngine.mutate({ projectSlug, engines: { [engineKey]: !current } as any });
  };

  const handleTest = async () => {
    setIsTesting(true);
    await runCoaching.mutateAsync({
      userId: testUser,
      projectSlug: testProject,
      triggerType: 'activity_complete',
      activityType: 'breathing',
      healthData: { heartRate: 72, stressLevel: 35, sleepHours: 7.5, steps: 6000 },
      activityData: { score: 85, duration: 10, completionRate: 100 },
      userProfile: { name: '테스트 사용자', language: 'ko', fitnessLevel: 'intermediate' },
    });
    setIsTesting(false);
  };

  return (
    <DashboardLayout>
      <div className="p-3 md:p-4 space-y-3">
        <div>
          <h1 className="text-base font-bold truncate">🤖 AI 엔진 통합 관리</h1>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            3개 엔진 완전 통합 · 프로젝트별 ON/OFF · 완전 자동화 건강 1:1 코칭 플랫폼
          </p>
        </div>

        {/* 파이프라인 흐름도 */}
        <Card style={{ background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)' }}>
          <CardContent className="pt-2 pb-2">
            <p className="text-xs font-semibold text-gray-500 mb-3">⚡ 자동화 파이프라인</p>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {[
                { icon:'📡', label:'데이터 수집' },
                { icon:'🚨', label:'이상 감지', engine:true },
                { icon:'💊', label:'건강 분석', engine:true },
                { icon:'🎯', label:'코칭 생성', engine:true },
                { icon:'📤', label:'자동 발송' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium ${s.engine ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span>{s.icon}</span>{s.label}
                    {s.engine && <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block ml-1 animate-pulse" />}
                  </div>
                  {i < 4 && <span className="text-gray-400">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 엔진 완성도 현황 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['anomalyDetection','realtimeCoaching','healthAnalysis'] as const).map(key => {
            const m = ENGINE_META[key];
            return (
              <Card key={key} style={{ borderLeft: `4px solid ${m.color}` }}>
                <CardContent className="pt-2 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{m.label}</span>
                    <Badge style={{ background: m.bg, color: m.color }}>{m.completion}%</Badge>
                  </div>
                  <ProgressBar pct={m.completion} color={m.color} />
                  <p className="text-xs text-gray-400 mt-2">{m.note}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 프로젝트별 엔진 설정 */}
        <Card>
          <CardHeader><CardTitle className="text-base">📋 프로젝트별 엔진 ON/OFF</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="text-left py-2 pr-4">프로젝트</th>
                  {Object.keys(ENGINE_META).map(k => (
                    <th key={k} className="text-center py-2 px-1" style={{ color: ENGINE_META[k as keyof typeof ENGINE_META].color }}>
                      {ENGINE_META[k as keyof typeof ENGINE_META].label.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECT_ORDER.map(slug => {
                  const cfg = configs?.find(c => c.projectSlug === slug);
                  if (!cfg) return null;
                  return (
                    <tr key={slug} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{PROJECT_LABELS[slug]}</td>
                      {Object.keys(ENGINE_META).map(engineKey => {
                        const isOn = (cfg.engines as any)[engineKey] ?? false;
                        const meta = ENGINE_META[engineKey as keyof typeof ENGINE_META];
                        return (
                          <td key={engineKey} className="py-2 px-1 text-center">
                            <button
                              onClick={() => handleToggle(slug, engineKey, isOn)}
                              className="w-10 h-5 rounded-full transition-all relative"
                              style={{ background: isOn ? meta.color : '#e5e7eb' }}
                              title={`${isOn ? 'ON' : 'OFF'} → 클릭하여 전환`}>
                              <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                                style={{ left: isOn ? '24px' : '2px' }} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 실시간 테스트 */}
        <Card>
          <CardHeader><CardTitle className="text-base">🧪 통합 코칭 테스트</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap mb-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">프로젝트</label>
                <select value={testProject} onChange={e => setTestProject(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs">
                  {PROJECT_ORDER.map(s => <option key={s} value={s}>{PROJECT_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">테스트 사용자 ID</label>
                <input value={testUser} onChange={e => setTestUser(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs w-36" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleTest} disabled={isTesting}
                className="bg-green-600 hover:bg-green-700 text-white gap-2">
                {isTesting ? '실행 중...' : '⚡ 통합 코칭 파이프라인 실행'}
              </Button>
              <p className="text-xs text-gray-400">
                이상 감지 → 건강 분석 → 코칭 생성 → 발송 전체 파이프라인 실행
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
