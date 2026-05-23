import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Chrome, Github, Mail, Apple, Smartphone, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email) {
      toast.error('이메일을 입력해주세요');
      return;
    }
    setIsLoading(true);
    toast.loading('로그인 중...');
    // 실제 로그인 로직
    setTimeout(() => {
      setIsLoading(false);
      toast.success('로그인 링크가 이메일로 전송되었습니다');
    }, 1000);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    toast.loading(`${provider}로 로그인 중...`);
    // 실제 소셜 로그인 로직
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${provider}로 로그인되었습니다`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 rounded-full p-3">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">한진 공통 엔진</CardTitle>
          <CardDescription>로그인하여 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {/* 소셜 로그인 - 추천 순서 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">소셜 로그인</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Google')}
                disabled={isLoading}
                className="gap-2 h-10"
              >
                <Chrome className="h-4 w-4" />
                <span className="text-xs">Google</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('GitHub')}
                disabled={isLoading}
                className="gap-2 h-10"
              >
                <Github className="h-4 w-4" />
                <span className="text-xs">GitHub</span>
              </Button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 이메일 로그인 */}
          <div className="space-y-1.5">
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleEmailLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <Mail className="h-4 w-4" />
              이메일로 로그인
            </Button>
          </div>

          {/* 추가 로그인 옵션 */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">다른 방법</p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Phone')}
                disabled={isLoading}
                className="gap-2 h-10"
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">휴대폰</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('Apple')}
                disabled={isLoading}
                className="gap-2 h-10"
              >
                <Apple className="h-4 w-4" />
                <span className="text-xs">Apple</span>
              </Button>
            </div>
          </div>

          {/* 약관 */}
          <div className="text-center text-xs text-gray-500">
            <p>
              로그인하면 <a href="#" className="text-blue-600 hover:underline">이용약관</a>과{' '}
              <a href="#" className="text-blue-600 hover:underline">개인정보처리방침</a>에 동의합니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
