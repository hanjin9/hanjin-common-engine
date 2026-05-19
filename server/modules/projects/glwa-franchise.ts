/**
 * GLWA 프랜차이즈 (분양/프랜차이즈/글로벌) 관리 API
 * 
 * 기능:
 * - 프로젝트 정보 조회/수정
 * - 프로젝트 멤버 관리
 * - 프로젝트 통계
 * - 인증/결제 설정
 */

import { router, protectedProcedure, adminProcedure } from '../../_core/trpc';
import { getDb } from '../../db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  projects,
  projectMembers,
  projectAuthConfig,
  projectAuditLogs,
  projectStatistics,
  users,
} from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const glwaFranchiseRouter = router({
  /**
   * 프로젝트 정보 조회
   */
  getProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const project = await db.query.projects.findFirst({
          where: eq(projects.id, input.projectId),
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // 권한 확인: 프로젝트 멤버 또는 관리자만 조회 가능
        const isMember = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          ),
        });

        if (!isMember && ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        return project;
      } catch (error) {
        console.error('[GLWA Franchise] getProject error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 정보 수정
   */
  updateProject: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const project = await db.query.projects.findFirst({
          where: eq(projects.id, input.projectId),
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // 프로젝트 소유자 또는 시스템 관리자만 수정 가능
        if (project.ownerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only project owner can update',
          });
        }

        await db
          .update(projects)
          .set({
            name: input.name || project.name,
            description: input.description || project.description,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        // 감사 로그 기록
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'project_updated',
          resourceType: 'project',
          resourceId: input.projectId,
          details: JSON.stringify({
            changes: {
              name: input.name,
              description: input.description,
            },
          }),
        });

        return { success: true, projectId: input.projectId };
      } catch (error) {
        console.error('[GLWA Franchise] updateProject error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 멤버 목록 조회
   */
  listMembers: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // 권한 확인
        const isMember = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          ),
        });

        if (!isMember && ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        const members = await db.query.projectMembers.findMany({
          where: eq(projectMembers.projectId, input.projectId),
          with: {
            user: {
              columns: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        return members;
      } catch (error) {
        console.error('[GLWA Franchise] listMembers error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트에 멤버 추가
   */
  addMember: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(['admin', 'manager', 'user']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // 프로젝트 존재 확인
        const project = await db.query.projects.findFirst({
          where: eq(projects.id, input.projectId),
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // 사용자 존재 확인
        const user = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // 이미 멤버인지 확인
        const existingMember = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          ),
        });

        if (existingMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member',
          });
        }

        // 멤버 추가
        const result = await db.insert(projectMembers).values({
          projectId: input.projectId,
          userId: input.userId,
          role: input.role,
        });

        // 감사 로그
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'member_added',
          resourceType: 'project_member',
          resourceId: input.userId,
          details: JSON.stringify({
            memberId: input.userId,
            role: input.role,
          }),
        });

        return { success: true, memberId: input.userId };
      } catch (error) {
        console.error('[GLWA Franchise] addMember error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 멤버 역할 변경
   */
  updateMemberRole: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
        role: z.enum(['admin', 'manager', 'user']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const member = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          ),
        });

        if (!member) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        await db
          .update(projectMembers)
          .set({ role: input.role })
          .where(
            and(
              eq(projectMembers.projectId, input.projectId),
              eq(projectMembers.userId, input.userId)
            )
          );

        // 감사 로그
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'member_role_updated',
          resourceType: 'project_member',
          resourceId: input.userId,
          details: JSON.stringify({
            memberId: input.userId,
            newRole: input.role,
            oldRole: member.role,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error('[GLWA Franchise] updateMemberRole error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트에서 멤버 제거
   */
  removeMember: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const member = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          ),
        });

        if (!member) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        await db
          .delete(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, input.projectId),
              eq(projectMembers.userId, input.userId)
            )
          );

        // 감사 로그
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'member_removed',
          resourceType: 'project_member',
          resourceId: input.userId,
          details: JSON.stringify({
            memberId: input.userId,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error('[GLWA Franchise] removeMember error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 통계 조회
   */
  getStatistics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // 권한 확인
        const isMember = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          ),
        });

        if (!isMember && ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }

        const stats = await db.query.projectStatistics.findFirst({
          where: eq(projectStatistics.projectId, input.projectId),
        });

        if (!stats) {
          // 통계 초기화
          await db.insert(projectStatistics).values({
            projectId: input.projectId,
            totalUsers: 0,
            activeSubscriptions: 0,
            totalRevenue: '0',
            monthlyRevenue: '0',
            churnRate: '0',
            avgSubscriptionValue: '0',
          });

          return {
            projectId: input.projectId,
            totalUsers: 0,
            activeSubscriptions: 0,
            totalRevenue: '0',
            monthlyRevenue: '0',
            churnRate: '0',
            avgSubscriptionValue: '0',
            updatedAt: new Date(),
          };
        }

        return stats;
      } catch (error) {
        console.error('[GLWA Franchise] getStatistics error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 인증 설정 조회
   */
  getAuthConfig: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const config = await db.query.projectAuthConfig.findFirst({
          where: eq(projectAuthConfig.projectId, input.projectId),
        });

        if (!config) {
          // 기본 설정 생성
          const result = await db.insert(projectAuthConfig).values({
            projectId: input.projectId,
            authProvider: 'manus',
            emailProvider: 'resend',
            oauthGoogleEnabled: false,
            oauthKakaoEnabled: false,
          });

          return {
            id: 0,
            projectId: input.projectId,
            authProvider: 'manus',
            emailProvider: 'resend',
            oauthGoogleEnabled: false,
            oauthKakaoEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        return config;
      } catch (error) {
        console.error('[GLWA Franchise] getAuthConfig error:', error);
        throw error;
      }
    }),

  /**
   * 프로젝트 인증 설정 업데이트
   */
  updateAuthConfig: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        oauthGoogleEnabled: z.boolean().optional(),
        oauthKakaoEnabled: z.boolean().optional(),
        oauthGoogleClientId: z.string().optional(),
        oauthKakaoClientId: z.string().optional(),
        emailFromAddress: z.string().optional(),
        emailFromName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const config = await db.query.projectAuthConfig.findFirst({
          where: eq(projectAuthConfig.projectId, input.projectId),
        });

        if (!config) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Auth config not found',
          });
        }

        await db
          .update(projectAuthConfig)
          .set({
            oauthGoogleEnabled: input.oauthGoogleEnabled ?? config.oauthGoogleEnabled,
            oauthKakaoEnabled: input.oauthKakaoEnabled ?? config.oauthKakaoEnabled,
            oauthGoogleClientId: input.oauthGoogleClientId ?? config.oauthGoogleClientId,
            oauthKakaoClientId: input.oauthKakaoClientId ?? config.oauthKakaoClientId,
            emailFromAddress: input.emailFromAddress ?? config.emailFromAddress,
            emailFromName: input.emailFromName ?? config.emailFromName,
            updatedAt: new Date(),
          })
          .where(eq(projectAuthConfig.projectId, input.projectId));

        // 감사 로그
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'auth_config_updated',
          resourceType: 'auth_config',
          resourceId: input.projectId,
          details: JSON.stringify({
            changes: input,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error('[GLWA Franchise] updateAuthConfig error:', error);
        throw error;
      }
    }),
});
