/**
 * Auth.js (NextAuth.js) 통합 모듈
 * 
 * 한진 공통 엔진의 인증 시스템을 Auth.js를 통해 구현합니다.
 * - Google OAuth
 * - Kakao OAuth
 * - 이메일/비밀번호 기반 인증
 * - 세션 관리
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import type { NextAuthOptions } from "next-auth";
import { getDb } from "../../db";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Auth.js 설정
 * 
 * 지원하는 인증 방식:
 * 1. Google OAuth
 * 2. Kakao OAuth
 * 3. 이메일/비밀번호 (Credentials)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Kakao OAuth
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // 이메일/비밀번호 기반 인증
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요");
        }

        const db = await getDb();
        if (!db) throw new Error("데이터베이스 연결 실패");

        // 사용자 조회
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!userRecord[0]) {
          throw new Error("등록되지 않은 이메일입니다");
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userRecord[0].passwordHash || ""
        );

        if (!isPasswordValid) {
          throw new Error("비밀번호가 일치하지 않습니다");
        }

        return {
          id: userRecord[0].id.toString(),
          email: userRecord[0].email,
          name: userRecord[0].name,
          image: userRecord[0].avatarUrl,
        };
      },
    }),
  ],

  // 콜백 함수
  callbacks: {
    // JWT 토큰 생성/업데이트
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // OAuth 계정 연결 시 처리
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    // 세션 생성
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },

    // 사인인 콜백 (사용자 생성/업데이트)
    async signIn({ user, account, profile }) {
      try {
        const db = await getDb();
        if (!db) return false;

        // 기존 사용자 조회
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (existingUser[0]) {
          // 기존 사용자 업데이트
          await db
            .update(users)
            .set({
              name: user.name || existingUser[0].name,
              avatarUrl: user.image || existingUser[0].avatarUrl,
              lastSignedIn: new Date(),
            })
            .where(eq(users.id, existingUser[0].id));
        } else {
          // 새 사용자 생성
          await db.insert(users).values({
            email: user.email!,
            name: user.name || "사용자",
            avatarUrl: user.image || null,
            loginMethod: account?.provider || "credentials",
            role: "user",
            lastSignedIn: new Date(),
          });
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },

    // 리다이렉트 콜백
    async redirect({ url, baseUrl }) {
      // 상대 URL 처리
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 같은 도메인의 URL만 허용
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // 페이지 커스터마이징
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },

  // 세션 설정
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
    updateAge: 24 * 60 * 60, // 24시간마다 업데이트
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  // 이벤트 핸들러
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`[Auth] User signed in: ${user.email} (${account?.provider})`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token.email}`);
    },
    async error({ error }) {
      console.error(`[Auth] Error: ${error}`);
    },
  },

  // 기타 설정
  debug: process.env.NODE_ENV === "development",
};

/**
 * 서버 세션 조회
 * 
 * @returns 현재 사용자 세션 또는 null
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 사용자 인증 여부 확인
 * 
 * @returns 인증된 사용자 정보 또는 null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * 보호된 라우트 미들웨어
 * 
 * @param handler 요청 핸들러
 * @returns 보호된 핸들러
 */
export function withAuth(handler: any) {
  return async (req: any, res: any) => {
    const session = await getSession();

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    return handler(req, res);
  };
}

/**
 * 관리자 인증 미들웨어
 * 
 * @param handler 요청 핸들러
 * @returns 관리자 전용 핸들러
 */
export function withAdminAuth(handler: any) {
  return async (req: any, res: any) => {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = session.user;
    return handler(req, res);
  };
}
