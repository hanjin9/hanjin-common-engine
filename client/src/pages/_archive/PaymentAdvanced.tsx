import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, ShoppingBag, Building2, Plus, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PaymentAdvanced() {
  const [ruleOpen, setRuleOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("");
  const [rulePoints, setRulePoints] = useState("");
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState<string>("mission_pack");
  const [productPrice, setProductPrice] = useState("");

  const { data: summary } = trpc.paymentAdvanced.getPaymentAdvancedSummary.useQuery();
  const { data: rewardRules, refetch: refetchRules } = trpc.paymentAdvanced.getRewardRules.useQuery();
  const { data: products, refetch: refetchProducts } = trpc.paymentAdvanced.getPremiumProducts.useQuery({ activeOnly: false });
  const { data: settlements } = trpc.paymentAdvanced.getSettlements.useQuery({});

  const createRule = trpc.paymentAdvanced.createRewardRule.useMutation({
    onSuccess: () => { toast.success("리워드 규칙이 생성되었습니다!"); setRuleOpen(false); refetchRules(); },
    onError: () => toast.error("생성에 실패했습니다."),
  });

  const updateRule = trpc.paymentAdvanced.updateRewardRule.useMutation({
    onSuccess: () => { toast.success("규칙이 업데이트되었습니다."); refetchRules(); },
  });

  const createProduct = trpc.paymentAdvanced.createPremiumProduct.useMutation({
    onSuccess: () => { toast.success("상품이 등록되었습니다!"); setProductOpen(false); refetchProducts(); },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const processSettlement = trpc.paymentAdvanced.processSettlement.useMutation({
    onSuccess: () => toast.success("정산이 처리되었습니다."),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-yellow-700">결제 고도화</h1>
        <p className="text-muted-foreground text-sm mt-1">포인트 경제, 프리미엄 마켓, B2B 프랜차이즈 정산 관리</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-0">
          <CardContent className="p-4 flex items-center gap-1.5">
            <Coins className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">활성 리워드 규칙</p>
              <p className="text-2xl font-bold">{summary?.activeRewardRules ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-0">
          <CardContent className="p-4 flex items-center gap-1.5">
            <ShoppingBag className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">프리미엄 상품</p>
              <p className="text-2xl font-bold">{summary?.activePremiumProducts ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0">
          <CardContent className="p-4 flex items-center gap-1.5">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">정산 대기</p>
              <p className="text-2xl font-bold">{summary?.pendingSettlements ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">포인트 규칙</TabsTrigger>
          <TabsTrigger value="market">프리미엄 마켓</TabsTrigger>
          <TabsTrigger value="settlement">B2B 정산</TabsTrigger>
        </TabsList>

        {/* 포인트 규칙 탭 */}
        <TabsContent value="rewards" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> 규칙 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>포인트 리워드 규칙 생성</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>규칙 이름</Label>
                    <Input className="mt-1" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="예: 미션 완료 보상" />
                  </div>
                  <div>
                    <Label>트리거 이벤트</Label>
                    <Input className="mt-1" value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} placeholder="예: mission_completed" />
                  </div>
                  <div>
                    <Label>포인트 수량</Label>
                    <Input className="mt-1" type="number" value={rulePoints} onChange={(e) => setRulePoints(e.target.value)} />
                  </div>
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => createRule.mutate({ name: ruleName, triggerEvent: ruleTrigger, pointsAmount: Number(rulePoints) })}
                    disabled={!ruleName || !ruleTrigger || !rulePoints || createRule.isPending}>
                    {createRule.isPending ? "생성 중..." : "생성하기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">이름</th>
                  <th className="text-left py-2 px-3">트리거</th>
                  <th className="text-right py-2 px-3">포인트</th>
                  <th className="text-center py-2 px-3">상태</th>
                  <th className="text-right py-2 px-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {rewardRules?.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{rule.name}</td>
                    <td className="py-2 px-3 text-muted-foreground font-mono text-xs">{rule.triggerEvent}</td>
                    <td className="py-2 px-3 text-right font-bold text-yellow-600">+{rule.pointsAmount}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "활성" : "비활성"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => updateRule.mutate({ ruleId: rule.id, isActive: !rule.isActive })}>
                        {rule.isActive ? "비활성화" : "활성화"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 프리미엄 마켓 탭 */}
        <TabsContent value="market" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={productOpen} onOpenChange={setProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> 상품 등록
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>프리미엄 상품 등록</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>상품 이름</Label>
                    <Input className="mt-1" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  </div>
                  <div>
                    <Label>상품 유형</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mission_pack">미션 팩</SelectItem>
                        <SelectItem value="coaching_session">코칭 세션</SelectItem>
                        <SelectItem value="report">리포트</SelectItem>
                        <SelectItem value="course">강좌</SelectItem>
                        <SelectItem value="tool">도구</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>가격 (원)</Label>
                    <Input className="mt-1" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => createProduct.mutate({ name: productName, productType: productType as "mission_pack" | "coaching_session" | "report" | "course" | "tool", priceKrw: Number(productPrice) })}
                    disabled={!productName || !productPrice || createProduct.isPending}>
                    {createProduct.isPending ? "등록 중..." : "등록하기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products?.map((product) => (
              <Card key={product.id} className={product.isActive ? "" : "opacity-50"}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{product.productType}</Badge>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "판매 중" : "비활성"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  {product.description && <p className="text-xs text-muted-foreground mt-1">{product.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-orange-600">{product.priceKrw.toLocaleString()}원</span>
                    <span className="text-xs text-muted-foreground">판매 {product.salesCount}건</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* B2B 정산 탭 */}
        <TabsContent value="settlement" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">프로젝트</th>
                  <th className="text-left py-2 px-3">기간</th>
                  <th className="text-right py-2 px-3">총 매출</th>
                  <th className="text-right py-2 px-3">플랫폼 수수료</th>
                  <th className="text-right py-2 px-3">정산 금액</th>
                  <th className="text-center py-2 px-3">상태</th>
                  <th className="text-right py-2 px-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {settlements?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-3 text-muted-foreground">정산 내역이 없습니다.</td></tr>
                )}
                {settlements?.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-3">프로젝트 #{s.projectId}</td>
                    <td className="py-2 px-3">{s.year}년 {s.month}월</td>
                    <td className="py-2 px-3 text-right">{Number(s.totalRevenue).toLocaleString()}원</td>
                    <td className="py-2 px-3 text-right text-red-500">-{Number(s.platformFee).toLocaleString()}원</td>
                    <td className="py-2 px-3 text-right font-bold text-green-600">{Number(s.franchiseeAmount).toLocaleString()}원</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant={s.status === "completed" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>
                        {s.status === "completed" ? <><CheckCircle className="w-3 h-3 mr-1" />완료</> : s.status === "pending" ? <><Clock className="w-3 h-3 mr-1" />대기</> : s.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {s.status === "pending" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600"
                          onClick={() => processSettlement.mutate({ settlementId: s.id, status: "completed" })}>
                          처리
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
