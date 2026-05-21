import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';

/**
 * 피드백 템플릿 관리 페이지
 * 
 * 5단계 티어별 피드백 템플릿 관리
 * - 상위 10%, 상위 20%, 중위, 하위 20%, 하위 10%
 */
export default function FeedbackTemplateManager() {
  const [selectedTier, setSelectedTier] = useState('상위10%');
  const [selectedStage, setSelectedStage] = useState('encouragement');
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 템플릿 예시 데이터
  const templates = [
    {
      id: 'top10_encouragement_ko',
      tier: '상위10%',
      stage: 'encouragement',
      language: 'ko',
      title: '축하합니다!',
      content: '🏆 {{userName}}님은 상위 10%의 건강 실천자입니다! 당신의 헌신과 노력이 정말 인상적입니다. 이 수준을 유지하면서 더 높은 목표를 향해 나아가세요!',
      emoji: '🏆',
      tone: 'positive',
      variables: ['userName'],
    },
    {
      id: 'top10_warning_ko',
      tier: '상위10%',
      stage: 'warning',
      language: 'ko',
      title: '더 나은 성과를 위해',
      content: '⚠️ 상위 10%도 개선이 필요합니다. 현재 점수: {{score}}/100. 다음 영역을 집중해보세요: {{focusArea}}.',
      emoji: '⚠️',
      tone: 'neutral',
      variables: ['score', 'focusArea'],
    },
    {
      id: 'bottom10_warning_ko',
      tier: '하위10%',
      stage: 'warning',
      language: 'ko',
      title: '긴급 개입 필요',
      content: '🆘 긴급: 건강 개선이 시급합니다. 현재 점수: {{score}}/100. {{focusArea}} 영역이 매우 위험합니다. 지금 바로 전문가의 도움을 받으세요!',
      emoji: '🆘',
      tone: 'urgent',
      variables: ['score', 'focusArea'],
    },
  ];

  const filteredTemplates = templates.filter(
    t => t.tier === selectedTier && t.stage === selectedStage && t.language === selectedLanguage
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">피드백 템플릿 관리</h1>
          <p className="text-muted-foreground mt-2">5단계 티어별 피드백 템플릿 커스터마이징</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              새 템플릿 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 템플릿 추가</DialogTitle>
              <DialogDescription>새로운 피드백 템플릿을 추가합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">티어</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="상위10%">상위 10%</SelectItem>
                      <SelectItem value="상위20%">상위 20%</SelectItem>
                      <SelectItem value="중위">중위</SelectItem>
                      <SelectItem value="하위20%">하위 20%</SelectItem>
                      <SelectItem value="하위10%">하위 10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">단계</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encouragement">1차: 격려</SelectItem>
                      <SelectItem value="warning">2차: 경고</SelectItem>
                      <SelectItem value="premium">3차: 프리미엄</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">언어</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">제목</label>
                <Input placeholder="템플릿 제목" />
              </div>
              <div>
                <label className="text-sm font-medium">이모지</label>
                <Input placeholder="🏆" maxLength={2} />
              </div>
              <div>
                <label className="text-sm font-medium">톤</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">긍정적</SelectItem>
                    <SelectItem value="neutral">중립적</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">내용</label>
                <Textarea 
                  placeholder="{{userName}}, {{score}} 등의 변수를 사용할 수 있습니다"
                  rows={5}
                />
              </div>
              <Button className="w-full">추가</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">티어</label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="상위10%">상위 10%</SelectItem>
                  <SelectItem value="상위20%">상위 20%</SelectItem>
                  <SelectItem value="중위">중위</SelectItem>
                  <SelectItem value="하위20%">하위 20%</SelectItem>
                  <SelectItem value="하위10%">하위 10%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">단계</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encouragement">1차: 격려</SelectItem>
                  <SelectItem value="warning">2차: 경고</SelectItem>
                  <SelectItem value="premium">3차: 프리미엄</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">언어</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 템플릿 목록 */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">해당하는 템플릿이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{template.emoji}</span>
                      <h3 className="text-lg font-semibold">{template.title}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {template.stage === 'encouragement' ? '1차' :
                         template.stage === 'warning' ? '2차' : '3차'}
                      </Badge>
                      <Badge 
                        variant={
                          template.tone === 'positive' ? 'default' :
                          template.tone === 'neutral' ? 'secondary' : 'destructive'
                        }
                      >
                        {template.tone === 'positive' ? '긍정' :
                         template.tone === 'neutral' ? '중립' : '긴급'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.tier} • {template.language.toUpperCase()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{template.content}</p>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">사용 가능한 변수:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="font-mono">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    수정
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Copy className="w-4 h-4" />
                    복제
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
