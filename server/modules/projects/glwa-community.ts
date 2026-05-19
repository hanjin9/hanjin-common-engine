/**
 * GLWA 커뮤니티 협회 관리 API
 * 
 * 기능:
 * - 협회 정보 조회/수정
 * - 협회 멤버 관리 (회원, 강사, 협회장)
 * - 협회 역할 및 권한 관리
 * - 협회 통계
 */

import { router, protectedProcedure, adminProcedure } from '../../_core/trpc';
import { getDb } from '../../db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  projects,
  projectMembers,
  projectAuditLogs,
  users,
} from '../../../drizzle/schema';
import { eq, and, ne } from 'drizzle-orm';

export const glwaCommunityRouter = router({
  /**
   * 협회 정보 조회
   */
  getAssociation: protectedProcedure
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
            message: 'Association not found',
          });
        }

        if (project.projectType !== 'glwa_community') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This project is not a GLWA community',
          });
        }

        return project;
      } catch (error) {
        console.error('[GLWA Community] getAssociation error:', error);
        throw error;
      }
    }),

  /**
   * 협회 정보 수정
   */
  updateAssociation: adminProcedure
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
            message: 'Association not found',
          });
        }

        if (project.projectType !== 'glwa_community') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This project is not a GLWA community',
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

        // 감사 로그
        await db.insert(projectAuditLogs).values({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: 'association_updated',
          resourceType: 'project',
          resourceId: input.projectId,
          details: JSON.stringify({
            changes: {
              name: input.name,
              description: input.description,
            },
          }),
        });

        return { success: true };
      } catch (error) {
        console.error('[GLWA Community] updateAssociation error:', error);
        throw error;
      }
    }),

  /**
   * 협회 멤버 목록 조회 (역할별 필터링 가능)
   */
  listMembers: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        role: z.enum(['admin', 'manager', 'user']).optional(),
      })
    )
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

        let whereCondition: any = eq(projectMembers.projectId, input.projectId);

        if (input.role) {
          whereCondition = and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.role, input.role)
          );
        }

        const members = await db.query.projectMembers.findMany({
          where: whereCondition,
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
        console.error('[GLWA Community] listMembers error:', error);
        throw error;
      }
    }),

  /**
   * 협회에 멤버 추가
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
            message: 'Association not found',
          });
        }

        if (project.projectType !== 'glwa_community') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This project is not a GLWA community',
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
        console.error('[GLWA Community] addMember error:', error);
        throw error;
      }
    }),

  /**
   * 협회 멤버 역할 변경
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
        console.error('[GLWA Community] updateMemberRole error:', error);
        throw error;
      }
    }),

  /**
   * 협회에서 멤버 제거
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
            role: member.role,
          }),
        });

        return { success: true };
      } catch (error) {
        console.error('[GLWA Community] removeMember error:', error);
        throw error;
      }
    }),

  /**
   * 협회 통계 조회
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

        // 멤버 통계
        const totalMembers = await db.query.projectMembers.findMany({
          where: eq(projectMembers.projectId, input.projectId),
        });

        const admins = totalMembers.filter((m: any) => m.role === 'admin');
        const managers = totalMembers.filter((m: any) => m.role === 'manager');
        const regularUsers = totalMembers.filter((m: any) => m.role === 'user');

        return {
          projectId: input.projectId,
          totalMembers: totalMembers.length,
          admins: admins.length,
          managers: managers.length,
          regularUsers: regularUsers.length,
        };
      } catch (error) {
        console.error('[GLWA Community] getStatistics error:', error);
        throw error;
      }
    }),

  /**
   * 협회 멤버 상세 정보 조회
   */
  getMemberDetails: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        userId: z.number(),
      })
    )
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

        const member = await db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          ),
          with: {
            user: true,
          },
        });

        if (!member) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        return member;
      } catch (error) {
        console.error('[GLWA Community] getMemberDetails error:', error);
        throw error;
      }
    }),
});
