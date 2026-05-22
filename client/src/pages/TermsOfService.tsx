import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileText, Heart, Bell } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-emerald-700">GLWA 서비스 약관</h1>
        <p className="text-muted-foreground text-sm mt-1">최종 업데이트: 2026년 5월 22일</p>
      </div>

      <Tabs defaultValue="terms">
        <TabsList className="w-full">
          <TabsTrigger value="terms" className="flex-1">
            <FileText className="w-4 h-4 mr-1" /> 이용약관
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1">
            <ShieldCheck className="w-4 h-4 mr-1" /> 개인정보처리방침
          </TabsTrigger>
          <TabsTrigger value="health" className="flex-1">
            <Heart className="w-4 h-4 mr-1" /> 건강데이터 동의
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex-1">
            <Bell className="w-4 h-4 mr-1" /> 마케팅 동의
          </TabsTrigger>
        </TabsList>

        {/* 이용약관 */}
        <TabsContent value="terms" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
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
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>유료 멤버십은 결제 즉시 효력이 발생합니다.</li>
                  <li>환불은 결제 후 7일 이내, 서비스 미이용 시 가능합니다.</li>
                  <li>멤버십 등급에 따라 제공 기능이 다를 수 있습니다.</li>
                </ul>
              </Section>

              <Section title="5. 면책사항">
                GLWA는 회원의 건강 결과에 대해 법적 책임을 지지 않습니다. 건강 이상 시 반드시 의료 전문가와 상담하세요.
              </Section>

              <Section title="6. 분쟁 해결">
                서비스 이용 관련 분쟁은 대한민국 법률에 따르며, 관할 법원은 서울중앙지방법원으로 합니다.
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 개인정보처리방침 */}
        <TabsContent value="privacy" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs">
                📌 GLWA는 최소한의 정보만 수집하며, 제3자에게 판매하지 않습니다.
              </div>

              <Section title="수집하는 정보">
                <table className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 border">항목</th>
                      <th className="text-left p-2 border">목적</th>
                      <th className="text-left p-2 border">보관기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["이름, 이메일", "회원 식별 및 서비스 제공", "회원 탈퇴 시까지"],
                      ["건강 활동 데이터", "맞춤형 웰니스 프로그램 제공", "회원 탈퇴 시까지"],
                      ["결제 정보", "유료 서비스 결제 처리", "5년 (전자상거래법)"],
                      ["기기 정보, 접속 로그", "서비스 개선 및 보안", "1년"],
                    ].map(([item, purpose, period]) => (
                      <tr key={item} className="border-b">
                        <td className="p-2 border font-medium">{item}</td>
                        <td className="p-2 border text-muted-foreground">{purpose}</td>
                        <td className="p-2 border text-muted-foreground">{period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="정보 제공">
                수집된 정보는 아래 경우에만 제3자에게 제공됩니다.
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>법령에 의한 요청 (수사기관 등)</li>
                  <li>결제 처리 (Stripe - 결제 정보만)</li>
                  <li>회원의 사전 동의가 있는 경우</li>
                </ul>
              </Section>

              <Section title="회원의 권리">
                언제든지 개인정보 열람·수정·삭제·처리정지를 요청할 수 있습니다.
                <br />
                문의: <span className="text-emerald-600 font-medium">privacy@glwa.app</span>
              </Section>

              <Section title="쿠키 사용">
                로그인 유지 및 서비스 개선을 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 건강데이터 동의 */}
        <TabsContent value="health" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-xs">
                💙 건강 데이터 수집은 더 나은 맞춤형 웰니스 서비스를 위해서만 사용됩니다.
              </div>

              <Section title="수집하는 건강 데이터">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                  <li>걸음수, 이동 거리, 소모 칼로리</li>
                  <li>심박수, 혈중 산소 포화도</li>
                  <li>수면 시간 및 수면 품질</li>
                  <li>운동 기록 (종류, 시간, 강도)</li>
                  <li>체중, 체지방률 (직접 입력 시)</li>
                </ul>
              </Section>

              <Section title="데이터 수집 방법">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                  <li><Badge variant="outline" className="text-xs mr-1">직접 입력</Badge> 앱 내 수동 기록</li>
                  <li><Badge variant="outline" className="text-xs mr-1">Google Fit</Badge> Google Fit 연동 (별도 동의)</li>
                  <li><Badge variant="outline" className="text-xs mr-1">웨어러블</Badge> 스마트워치 연동 (별도 동의)</li>
                </ul>
              </Section>

              <Section title="사용 목적">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                  <li>맞춤형 웰니스 미션 및 프로그램 추천</li>
                  <li>AI 기반 건강 분석 및 피드백 제공</li>
                  <li>멤버십 등급 산정 및 랭킹 시스템</li>
                  <li>서비스 개선을 위한 익명화된 통계 분석</li>
                </ul>
              </Section>

              <Section title="중요 안내">
                <div className="p-3 bg-yellow-50 rounded-lg text-yellow-800 text-xs mt-2">
                  ⚠️ 수집된 건강 데이터는 의학적 진단에 사용되지 않습니다. 건강 이상 시 반드시 의료 전문가와 상담하세요.
                </div>
              </Section>

              <Section title="동의 철회">
                언제든지 설정 → 연동 관리에서 건강 데이터 수집 동의를 철회할 수 있습니다. 철회 시 맞춤형 서비스 제공이 제한될 수 있습니다.
              </Section>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 마케팅 동의 */}
        <TabsContent value="marketing" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-800 text-xs">
                📣 마케팅 동의는 선택사항이며, 동의하지 않아도 서비스 이용에 불이익이 없습니다.
              </div>

              <Section title="수신 동의 항목">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                  <li>
                    <span className="font-medium text-foreground">서비스 알림</span> (필수)
                    <br />
                    <span className="text-xs ml-4">미션 완료, 랭킹 변동, 결제 내역 등 서비스 이용 관련 알림</span>
                  </li>
                  <li>
                    <span className="font-medium text-foreground">건강 리마인더</span> (선택)
                    <br />
                    <span className="text-xs ml-4">수련 시간 알림, 수면 알림, 목표 달성 격려 메시지</span>
                  </li>
                  <li>
                    <span className="font-medium text-foreground">이벤트 및 혜택</span> (선택)
                    <br />
                    <span className="text-xs ml-4">신규 기능 안내, 프로모션, 멤버십 혜택 정보</span>
                  </li>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        문의사항: <span className="text-emerald-600">support@glwa.app</span> · 개인정보보호책임자: 한진
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
        <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
        {title}
      </h3>
      <div className="text-muted-foreground pl-3">{children}</div>
    </div>
  );
}
