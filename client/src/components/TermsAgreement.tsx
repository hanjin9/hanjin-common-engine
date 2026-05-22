import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TermsAgreementProps {
  onAgreementChange: (agreed: {
    allAgreed: boolean;
    terms: boolean;
    privacy: boolean;
    healthData: boolean;
    marketing: boolean;
  }) => void;
}

export default function TermsAgreement({ onAgreementChange }: TermsAgreementProps) {
  const [expanded, setExpanded] = useState(false);
  const [terms, setTerms] = useState({
    terms: false,
    privacy: false,
    healthData: false,
    marketing: false,
  });

  const allRequired = terms.terms && terms.privacy && terms.healthData;
  const allAgreed = allRequired && terms.marketing;

  const handleAll = (checked: boolean) => {
    const updated = {
      terms: checked,
      privacy: checked,
      healthData: checked,
      marketing: checked,
    };
    setTerms(updated);
    onAgreementChange({ allAgreed: checked, ...updated });
  };

  const handleSingle = (key: keyof typeof terms, checked: boolean) => {
    const updated = { ...terms, [key]: checked };
    setTerms(updated);
    onAgreementChange({
      allAgreed: updated.terms && updated.privacy && updated.healthData && updated.marketing,
      ...updated,
    });
  };

  return (
    <div className="space-y-3">
      {/* 전체 동의 */}
      <div
        className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg cursor-pointer"
        onClick={() => handleAll(!allAgreed)}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="all"
            checked={allAgreed}
            onCheckedChange={(v) => handleAll(!!v)}
            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
          />
          <Label htmlFor="all" className="font-semibold text-emerald-800 cursor-pointer">
            전체 동의하기
          </Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="h-6 w-6 p-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* 개별 항목 */}
      {expanded && (
        <div className="space-y-2 pl-2">
          {[
            { key: "terms" as const, label: "이용약관 동의", required: true, href: "/terms#terms" },
            { key: "privacy" as const, label: "개인정보처리방침 동의", required: true, href: "/terms#privacy" },
            { key: "healthData" as const, label: "건강 데이터 수집 및 활용 동의", required: true, href: "/terms#health" },
            { key: "marketing" as const, label: "마케팅 정보 수신 동의", required: false, href: "/terms#marketing" },
          ].map(({ key, label, required, href }) => (
            <div key={key} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={key}
                  checked={terms[key]}
                  onCheckedChange={(v) => handleSingle(key, !!v)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor={key} className="text-sm cursor-pointer">
                  {label}
                  <span className={`ml-1 text-xs font-medium ${required ? "text-red-500" : "text-muted-foreground"}`}>
                    {required ? "(필수)" : "(선택)"}
                  </span>
                </Label>
              </div>
              <Link href={href}>
                <span className="text-xs text-muted-foreground hover:text-emerald-600 underline cursor-pointer">
                  보기
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 필수 동의 안내 */}
      {!allRequired && (
        <p className="text-xs text-muted-foreground pl-1">
          ✓ 필수 항목(이용약관, 개인정보, 건강데이터)에 동의해야 서비스를 이용할 수 있습니다.
        </p>
      )}
    </div>
  );
}
