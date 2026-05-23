import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, FileText, Heart, Bell, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// 각 탭별 스크롤 완료 여부 추적
type TabKey = "terms" | "privacy" | "health" | "marketing";

export default function TermsOfService() {
  const [activeTab, setActiveTab] = useState<TabKey>("terms");
  const [readStatus, setReadStatus] = useState<Record<TabKey, boolean>>({
    terms: false,
    privacy: false,
    health: false,
    marketing: false,
  });
  const [agreed, setAgreed] = useState<Record<TabKey, boolean>>({
    terms: false,
    privacy: false,
    health: false,
    marketing: false,
  });

  // 각 탭 스크롤 컨테이너 ref
  const scrollRefs = useRef<Record<TabKey, HTMLDivElement | null>>({
    terms: null,
    privacy: null,
    health: null,
    marketing: null,
  });

  const handleScroll = useCallback((tab: TabKey) => {
    const el = scrollRefs.current[tab];
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    // 하단 30px 이내 도달 시 "읽음" 처리
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setReadStatus((prev) => ({ ...prev, [tab]: true }));
    }
  }, []);

  const handleAgree = (tab: TabKey) => {
    if (!readStatus[tab]) {
      toast.warning("약관을 끝까지 읽어주세요!");
      return;
    }
    setAgreed((prev) => {
      const updated = { ...prev, [tab]: true };
      const requiredDone = updated.terms && updated.privacy && updated.health;
      if (requiredDone) toast.success("필수 약관 동의 완료! 서비스를 이용하실 수 있습니다.");
      return updated;
    });
  };

  const requiredDone = agreed.terms && agreed.privacy && agreed.health;
  const allDone = requiredDone && agreed.marketing;

  const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode; required: boolean }[] = [
    { key: "terms", label: "이용약관", icon: <FileText className="w-4 h-4" />, required: true },
    { key: "privacy", label: "개인정보", icon: <ShieldCheck className="w-4 h-4" />, required: true },
    { key: "health", label: "건강데이터", icon: <Heart className="w-4 h-4" />, required: true },
    { key: "marketing", label: "마케팅", icon: <Bell className="w-4 h-4" />, required: false },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-3 md:p-4 space-y-3">
      {/* 헤더 */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <h1 className="text-xl font-bold text-emerald-700">GLWA 서비스 약관</h1>
        <p className="text-muted-foreground text-sm mt-1">최종 업데이트: 2026년 5월 22일</p>

        {/* 진행 상태 표시 */}
        <div className="flex justify-center gap-3 mt-4">
          {TAB_CONFIG.map(({ key, label, required }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <motion.div
                animate={agreed[key] ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {agreed[key]
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <div className={`w-5 h-5 rounded-full border-2 ${readStatus[key] ? "border-emerald-400 bg-emerald-50" : "border-gray-300"}`} />
                }
              </motion.div>
              <span className="text-[10px] text-muted-foreground">
                {label}{required ? <span className="text-red-400">*</span> : ""}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="w-full grid grid-cols-4">
          {TAB_CONFIG.map(({ key, label, icon }) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1 text-xs sm:text-sm">
              {agreed[key] ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : icon}
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 이용약관 */}
        <TabsContent value="terms" className="mt-4">
          <TermsCard
            tab="terms"
            title="서비스 이용약관"
            required
            read={readStatus.terms}
            agreed={agreed.terms}
            scrollRef={(el) => { scrollRefs.current.terms = el; }}
            onScroll={() => handleScroll("terms")}
            onAgree={() => handleAgree("terms")}
          >
            <Section title="1. 서비스 소개">
              GLWA(글로벌 웰니스 앱)는 개인 건강 수련 및 웰니스 프로그램을 제공하는 플랫폼입니다. 회원가입 시 본 약관에 동의한 것으로 간주합니다.
            </Section>
            <Section title="2. 회원 자격">
              만 14세 이상이면 누구나 가입할 수 있습니다. 타인의 정보를 도용하거나 허위 정보를 입력하는 경우 서비스 이용이 제한될 수 있습니다.
            </Section>
            <Section title="3. 서비스 이용">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>제공된 건강 콘텐츠는 참고용이며, 의학적 진단·치료를 대체하지 않습니다.</li>
                <li>타인의 권리를 침해하거나 서비스를 악용하는 행위는 금지됩니다.</li>
                <li>서비스는 사전 공지 후 변경·중단될 수 있습니다.</li>
              </ul>
            </Section>
            <Section title="4. 멤버십 및 결제">
              유료 멤버십은 선불 결제 방식으로 운영됩니다. 환불은 이용 전 7일 이내 전액, 이용 후에는 잔여 기간 기준으로 처리됩니다.
            </Section>
            <Section title="5. 지적 재산권">
              서비스 내 모든 콘텐츠(텍스트, 이미지, 영상)의 저작권은 GLWA에 귀속됩니다. 무단 복제·배포를 금지합니다.
            </Section>
            <Section title="6. 면책 조항">
              GLWA는 회원의 건강 상태 변화에 대해 의학적 책임을 지지 않습니다. 서비스는 건강 증진을 위한 보조 도구입니다.
            </Section>
            <Section title="7. 약관 변경">
              약관 변경 시 7일 전 앱 내 공지를 통해 안내합니다. 변경 후 계속 이용 시 동의한 것으로 간주합니다.
            </Section>
          </TermsCard>
        </TabsContent>

        {/* 개인정보처리방침 */}
        <TabsContent value="privacy" className="mt-4">
          <TermsCard
            tab="privacy"
            title="개인정보처리방침"
            required
            read={readStatus.privacy}
            agreed={agreed.privacy}
            scrollRef={(el) => { scrollRefs.current.privacy = el; }}
            onScroll={() => handleScroll("privacy")}
            onAgree={() => handleAgree("privacy")}
          >
            <Section title="1. 수집 항목">
              <div className="flex flex-wrap gap-2 mt-1">
                {["이름", "이메일", "생년월일", "성별", "건강 데이터", "기기 정보"].map((item) => (
                  <Badge key={item} variant="secondary">{item}</Badge>
                ))}
              </div>
            </Section>
            <Section title="2. 수집 목적">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>맞춤형 건강 프로그램 제공</li>
                <li>서비스 개선 및 통계 분석</li>
                <li>법령 의무 이행</li>
              </ul>
            </Section>
            <Section title="3. 보유 기간">
              회원 탈퇴 후 30일 이내 삭제합니다. 단, 법령에 따라 일부 정보는 최대 5년간 보관될 수 있습니다.
            </Section>
            <Section title="4. 제3자 제공">
              원칙적으로 제3자에게 제공하지 않습니다. 법령에 의한 경우 또는 회원의 별도 동의가 있는 경우에만 제공합니다.
            </Section>
            <Section title="5. 보안 조치">
              SSL 암호화, 접근 권한 관리, 정기적 보안 점검을 통해 개인정보를 보호합니다.
            </Section>
            <Section title="6. 개인정보보호책임자">
              책임자: 한진 | 이메일: privacy@glwa.app | 문의는 영업일 기준 3일 이내 답변드립니다.
            </Section>
          </TermsCard>
        </TabsContent>

        {/* 건강데이터 동의 */}
        <TabsContent value="health" className="mt-4">
          <TermsCard
            tab="health"
            title="건강 데이터 수집 및 활용 동의"
            required
            read={readStatus.health}
            agreed={agreed.health}
            scrollRef={(el) => { scrollRefs.current.health = el; }}
            onScroll={() => handleScroll("health")}
            onAgree={() => handleAgree("health")}
          >
            <Section title="1. 수집 데이터">
              <div className="flex flex-wrap gap-2 mt-1">
                {["걸음수", "심박수", "수면 패턴", "칼로리 소모", "혈중 산소", "스트레스 지수", "운동 기록"].map((item) => (
                  <Badge key={item} variant="secondary" className="bg-emerald-50 text-emerald-700">{item}</Badge>
                ))}
              </div>
            </Section>
            <Section title="2. 수집 방법">
              스마트워치·피트니스 트래커 연동(Google Fit, Apple Health 등) 또는 앱 내 직접 입력을 통해 수집합니다.
            </Section>
            <Section title="3. 활용 목적">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>개인 맞춤형 건강 분석 및 AI 피드백 제공</li>
                <li>웰니스 랭킹 및 미션 추천</li>
                <li>익명화된 통계 연구 (개인 식별 불가)</li>
              </ul>
            </Section>
            <Section title="4. 연동 해제">
              언제든지 설정 → 웨어러블 연동에서 데이터 수집을 중단하고 기존 데이터를 삭제할 수 있습니다.
            </Section>
            <Section title="5. 민감 정보 보호">
              건강 데이터는 암호화 저장되며, 의료 기관·보험사 등 제3자에게 절대 제공하지 않습니다.
            </Section>
          </TermsCard>
        </TabsContent>

        {/* 마케팅 동의 */}
        <TabsContent value="marketing" className="mt-4">
          <TermsCard
            tab="marketing"
            title="마케팅 정보 수신 동의"
            required={false}
            read={readStatus.marketing}
            agreed={agreed.marketing}
            scrollRef={(el) => { scrollRefs.current.marketing = el; }}
            onScroll={() => handleScroll("marketing")}
            onAgree={() => handleAgree("marketing")}
          >
            <Section title="수신 내용">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>신규 건강 프로그램 및 미션 안내</li>
                <li>멤버십 혜택 및 이벤트 정보</li>
                <li>건강 팁 및 웰니스 콘텐츠</li>
              </ul>
            </Section>
            <Section title="수신 채널">
              <div className="flex flex-wrap gap-2 mt-2">
                {["앱 푸시 알림", "이메일", "SMS (선택 시)"].map((ch) => (
                  <Badge key={ch} variant="secondary">{ch}</Badge>
                ))}
              </div>
            </Section>
            <Section title="수신 거부">
              언제든지 설정 → 알림 설정에서 수신 거부가 가능합니다. 법령에 따른 필수 안내는 동의 여부와 관계없이 발송됩니다.
            </Section>
            <Section title="선택 사항 안내">
              마케팅 수신 동의는 선택 사항입니다. 동의하지 않아도 서비스 이용에 제한이 없습니다.
            </Section>
          </TermsCard>
        </TabsContent>
      </Tabs>

      {/* 전체 동의 완료 배너 */}
      <AnimatePresence>
        {requiredDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-emerald-700">필수 약관 동의 완료!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {allDone ? "모든 약관에 동의하셨습니다." : "마케팅 동의는 선택 사항입니다."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-xs text-muted-foreground">
        문의사항: <span className="text-emerald-600">support@glwa.app</span> · 개인정보보호책임자: 한진
      </p>
    </div>
  );
}

// 약관 카드 컴포넌트 - 스크롤 완료 시 동의 버튼 활성화
interface TermsCardProps {
  tab: TabKey;
  title: string;
  required: boolean;
  read: boolean;
  agreed: boolean;
  scrollRef: (el: HTMLDivElement | null) => void;
  onScroll: () => void;
  onAgree: () => void;
  children: React.ReactNode;
}

function TermsCard({ title, required, read, agreed, scrollRef, onScroll, onAgree, children }: TermsCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          {title}
          {required && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">필수</Badge>}
        </h2>
        {agreed && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </motion.div>
        )}
      </div>

      {/* 스크롤 가능한 약관 본문 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="overflow-y-auto text-sm leading-relaxed p-5 space-y-4"
        style={{ maxHeight: "320px" }}
      >
        {children}

        {/* 하단 여백 (스크롤 유도) */}
        <div className="h-4" />
      </div>

      {/* 스크롤 안내 + 동의 버튼 */}
      <div className="px-4 py-3 border-t bg-muted/20">
        <AnimatePresence mode="wait">
          {!read ? (
            <motion.div
              key="scroll-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
              끝까지 스크롤하면 동의 버튼이 활성화됩니다
            </motion.div>
          ) : (
            <motion.div
              key="agree-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              {agreed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium text-sm py-1">
                  <CheckCircle2 className="w-4 h-4" />
                  동의 완료
                </div>
              ) : (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={onAgree}
                  >
                    {required ? "필수 약관에 동의합니다" : "마케팅 수신에 동의합니다 (선택)"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
        <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
        {title}
      </h3>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
