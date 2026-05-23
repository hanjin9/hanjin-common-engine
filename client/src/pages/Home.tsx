import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Shield, BarChart3, Users, CreditCard } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // 로그인된 사용자는 바로 /admin으로 이동
  useEffect(() => {
    if (!loading && user) {
      navigate("/admin");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 비로그인 상태: 랜딩 페이지
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">한진 공통 엔진</span>
        </div>
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          관리자 로그인
        </Button>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10">
        <div className="flex flex-col items-center gap-2 max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            한진 공통 엔진
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            GLWA · 숨호흡 · 장부관리사 · 스포츠회복사 등<br />
            멀티 프로젝트 통합 관리 플랫폼
          </p>
          <Button
            size="lg"
            className="mt-2 px-8"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            관리자 대시보드 입장
          </Button>
        </div>

        {/* 기능 카드 3개 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-2xl">
          <div className="border rounded-xl p-5 text-left flex flex-col gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">통합 통계</p>
            <p className="text-xs text-muted-foreground">프로젝트별 매출·가입자·구독 현황을 한눈에</p>
          </div>
          <div className="border rounded-xl p-5 text-left flex flex-col gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">멤버십 관리</p>
            <p className="text-xs text-muted-foreground">GLWA 10단계 VIP 멤버십 정책 편집 및 이력 관리</p>
          </div>
          <div className="border rounded-xl p-5 text-left flex flex-col gap-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">사용자 관리</p>
            <p className="text-xs text-muted-foreground">전체 프로젝트 사용자 통합 조회 및 역할 관리</p>
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        © 2026 한진 공통 엔진 · GLWA Global Leaders Wellness Association
      </footer>
    </div>
  );
}
