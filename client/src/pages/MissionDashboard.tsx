import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Zap, Target, Users, TrendingUp, RefreshCw, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  reward: number;
  completionRate: number;
  participants: number;
  status: 'active' | 'inactive' | 'completed';
}

export default function MissionDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    reward: number;
  }>({
    title: '',
    description: '',
    difficulty: 'medium',
    category: 'health',
    reward: 100,
  });

  const { data: missions, isLoading, refetch } = trpc.admin.getSystemStats.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('미션 데이터를 새로고침 중...');
    await refetch();
    setIsRefreshing(false);
    toast.success('미션 데이터가 업데이트되었습니다');
  };

  const handleCreateMission = () => {
    if (!formData.title || !formData.description) {
      toast.error('필수 정보를 입력해주세요');
      return;
    }
    toast.success(`"${formData.title}" 미션이 생성되었습니다`);
    setFormData({ title: '', description: '', difficulty: 'medium', category: 'health', reward: 100 });
    setIsCreateDialogOpen(false);
  };

  const handleEditMission = () => {
    if (!formData.title || !formData.description) {
      toast.error('필수 정보를 입력해주세요');
      return;
    }
    toast.success(`"${formData.title}" 미션이 수정되었습니다`);
    setIsEditDialogOpen(false);
    setSelectedMission(null);
  };

  const handleDeleteMission = (mission: Mission) => {
    toast.success(`"${mission.title}" 미션이 삭제되었습니다`);
  };

  const handleEditClick = (mission: Mission) => {
    setSelectedMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description,
      difficulty: mission.difficulty,
      category: mission.category,
      reward: mission.reward,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Spinner className="h-8 w-8" />
        <p className="text-muted-foreground">미션 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const difficultyData = [
    { name: '상', value: 45, color: '#ef4444' },
    { name: '중', value: 120, color: '#f59e0b' },
    { name: '하', value: 235, color: '#10b981' },
  ];

  const completionData = [
    { date: '5월 18일', completed: 45, attempted: 120 },
    { date: '5월 19일', completed: 62, attempted: 145 },
    { date: '5월 20일', completed: 58, attempted: 130 },
    { date: '5월 21일', completed: 78, attempted: 165 },
    { date: '5월 22일', completed: 85, attempted: 180 },
  ];

  const missionList: Mission[] = [
    { id: '1', title: '아침 운동', description: '매일 아침 30분 운동하기', difficulty: 'easy', category: 'health', reward: 100, completionRate: 85, participants: 450, status: 'active' },
    { id: '2', title: '명상 도전', description: '10분 명상 완료', difficulty: 'medium', category: 'wellness', reward: 150, completionRate: 62, participants: 320, status: 'active' },
    { id: '3', title: '수련 마스터', description: '모든 수련법 완성', difficulty: 'hard', category: 'training', reward: 500, completionRate: 28, participants: 95, status: 'active' },
    { id: '4', title: '주간 챌린지', description: '7일 연속 미션 완료', difficulty: 'hard', category: 'challenge', reward: 300, completionRate: 45, participants: 180, status: 'active' },
  ];

  const getDifficultyBadge = (difficulty: string) => {
    const config = {
      easy: { label: '쉬움', color: 'bg-green-100 text-green-700' },
      medium: { label: '중간', color: 'bg-yellow-100 text-yellow-700' },
      hard: { label: '어려움', color: 'bg-red-100 text-red-700' },
    };
    const key = difficulty as keyof typeof config;
    return <Badge className={config[key]?.color}>{config[key]?.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            미션 관리
          </h1>
          <p className="text-gray-600 mt-2">미션 생성 · 진행률 추적 · 보상 관리</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            새 미션
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              총 미션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">400</div>
            <p className="text-xs text-gray-500 mt-1">활성 미션</p>
            <Badge className="mt-2 bg-blue-100 text-blue-700">↑ 12개 추가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              완료율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">62%</div>
            <p className="text-xs text-gray-500 mt-1">평균 완료율</p>
            <Badge className="mt-2 bg-green-100 text-green-700">↑ 8% 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              참여자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1,045</div>
            <p className="text-xs text-gray-500 mt-1">활성 참여자</p>
            <Badge className="mt-2 bg-purple-100 text-purple-700">↑ 156명 증가</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              배포 보상
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">45,600</div>
            <p className="text-xs text-gray-500 mt-1">이번 주 배포</p>
            <Badge className="mt-2 bg-yellow-100 text-yellow-700">↑ 12,300 증가</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>난이도별 미션 분포</CardTitle>
            <CardDescription>미션 난이도 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>완료율 추이</CardTitle>
            <CardDescription>최근 5일간의 미션 완료율</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="완료" />
                <Bar dataKey="attempted" fill="#3b82f6" name="시도" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>미션 목록</CardTitle>
          <CardDescription>활성 미션 관리</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {missionList.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">미션이 없습니다</p>
              </div>
            ) : (
              missionList.map((mission) => (
                <div key={mission.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{mission.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(mission)}
                        className="gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMission(mission)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">난이도</p>
                      {getDifficultyBadge(mission.difficulty)}
                    </div>
                    <div>
                      <p className="text-gray-500">카테고리</p>
                      <Badge variant="outline">{mission.category}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">보상</p>
                      <p className="font-semibold text-yellow-600">{mission.reward}P</p>
                    </div>
                    <div>
                      <p className="text-gray-500">완료율</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${mission.completionRate}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold mt-1">{mission.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">참여자</p>
                      <p className="font-semibold">{mission.participants}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 미션 생성 모달 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 미션 생성</DialogTitle>
            <DialogDescription>새로운 미션을 생성하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">미션 제목</Label>
              <Input
                id="title"
                placeholder="미션 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="미션 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">난이도</Label>
                <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">쉬움</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="hard">어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">건강</SelectItem>
                    <SelectItem value="wellness">웰니스</SelectItem>
                    <SelectItem value="training">수련</SelectItem>
                    <SelectItem value="challenge">챌린지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward">보상 (포인트)</Label>
              <Input
                id="reward"
                type="number"
                placeholder="보상 포인트"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateMission} className="bg-blue-600 hover:bg-blue-700">
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 미션 편집 모달 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>미션 편집</DialogTitle>
            <DialogDescription>미션 정보를 수정하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">미션 제목</Label>
              <Input
                id="edit-title"
                placeholder="미션 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                placeholder="미션 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">난이도</Label>
                <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">쉬움</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="hard">어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">카테고리</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">건강</SelectItem>
                    <SelectItem value="wellness">웰니스</SelectItem>
                    <SelectItem value="training">수련</SelectItem>
                    <SelectItem value="challenge">챌린지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reward">보상 (포인트)</Label>
              <Input
                id="edit-reward"
                type="number"
                placeholder="보상 포인트"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditMission} className="bg-blue-600 hover:bg-blue-700">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
