/**
 * Supabase OAuth 통합
 * Google, GitHub 등 소셜 로그인 지원
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface OAuthProvider {
  provider: 'google' | 'github' | 'discord' | 'apple';
  redirectTo: string;
}

/**
 * OAuth 로그인 URL 생성
 */
export async function getOAuthUrl(provider: OAuthProvider['provider'], redirectTo: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo,
        scopes: provider === 'google' ? 'openid profile email' : undefined,
      },
    });

    if (error) throw error;
    return data.url;
  } catch (error) {
    console.error(`[Supabase OAuth] Error getting ${provider} URL:`, error);
    throw error;
  }
}

/**
 * OAuth 콜백 처리
 */
export async function handleOAuthCallback(code: string) {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('[Supabase OAuth] Error handling callback:', error);
    throw error;
  }
}

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Supabase] Error getting user profile:', error);
    throw error;
  }
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(userId: string, profile: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[Supabase] Error updating user profile:', error);
    throw error;
  }
}

/**
 * 소셜 로그인 사용자 동기화
 */
export async function syncSocialUser(user: any) {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // 새 프로필 생성
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            provider: user.app_metadata?.provider,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    return existingProfile;
  } catch (error) {
    console.error('[Supabase] Error syncing social user:', error);
    throw error;
  }
}

/**
 * 로그아웃
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('[Supabase] Error signing out:', error);
    throw error;
  }
}
