/**
 * Google/Kakao OAuth 인증 모듈
 * Supabase Auth 기반 소셜 로그인 통합
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Google OAuth 로그인
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
      scopes: 'profile email',
    },
  });

  if (error) {
    throw new Error(`Google OAuth failed: ${error.message}`);
  }

  return data;
}

/**
 * Kakao OAuth 로그인
 */
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
      scopes: 'profile_image account_email',
    },
  });

  if (error) {
    throw new Error(`Kakao OAuth failed: ${error.message}`);
  }

  return data;
}

/**
 * 이메일/비밀번호 회원가입
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Email signup failed: ${error.message}`);
  }

  return data;
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Email login failed: ${error.message}`);
  }

  return data;
}

/**
 * 매직링크 (이메일 링크) 로그인
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Magic link failed: ${error.message}`);
  }

  return data;
}

/**
 * OTP (일회용 비밀번호) 로그인
 */
export async function verifyOtp(email: string, token: string, type: 'email' | 'sms' = 'email') {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }

  return data;
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * 현재 세션 조회
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Get session failed: ${error.message}`);
  }

  return data.session;
}

/**
 * 사용자 정보 조회
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Get user failed: ${error.message}`);
  }

  return data.user;
}

/**
 * 비밀번호 재설정 요청
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }

  return data;
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(`Password update failed: ${error.message}`);
  }

  return data;
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateProfile(updates: {
  email?: string;
  phone?: string;
  data?: Record<string, any>;
}) {
  const { data, error } = await supabase.auth.updateUser(updates);

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }

  return data;
}

/**
 * 아바타 업로드
 */
export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Avatar upload failed: ${uploadError.message}`);
  }

  // 공개 URL 생성
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 세션 갱신
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new Error(`Session refresh failed: ${error.message}`);
  }

  return data;
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
