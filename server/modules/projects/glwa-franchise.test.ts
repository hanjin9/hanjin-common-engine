import { describe, it, expect, beforeEach, vi } from 'vitest';
import { glwaFranchiseRouter } from './glwa-franchise';
import { getDb } from '../../db';
import { TRPCError } from '@trpc/server';

// Mock getDb
vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

describe('GLWA Franchise Router', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: {
        projects: {
          findFirst: vi.fn(),
        },
        projectMembers: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        projectAuthConfig: {
          findFirst: vi.fn(),
        },
        projectStatistics: {
          findFirst: vi.fn(),
        },
        users: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  describe('getProject', () => {
    it('should return project info for authorized user', async () => {
      const mockProject = {
        id: 1,
        slug: 'glwa-franchise',
        name: 'GLWA Franchise',
        projectType: 'glwa_franchise',
        ownerId: 1,
      };

      mockDb.query.projects.findFirst.mockResolvedValue(mockProject);
      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1,
        userId: 1,
        role: 'admin',
      });

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getProject({ projectId: 1 });
      expect(result).toEqual(mockProject);
    });

    it('should throw NOT_FOUND error when project does not exist', async () => {
      mockDb.query.projects.findFirst.mockResolvedValue(null);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getProject({ projectId: 999 })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw FORBIDDEN error when user is not a member', async () => {
      const mockProject = {
        id: 1,
        slug: 'glwa-franchise',
        name: 'GLWA Franchise',
        projectType: 'glwa_franchise',
        ownerId: 2,
      };

      mockDb.query.projects.findFirst.mockResolvedValue(mockProject);
      mockDb.query.projectMembers.findFirst.mockResolvedValue(null);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getProject({ projectId: 1 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('listMembers', () => {
    it('should return members for authorized user', async () => {
      const mockMembers = [
        {
          projectId: 1,
          userId: 1,
          role: 'admin',
          user: { id: 1, email: 'admin@example.com', name: 'Admin' },
        },
        {
          projectId: 1,
          userId: 2,
          role: 'manager',
          user: { id: 2, email: 'manager@example.com', name: 'Manager' },
        },
      ];

      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1,
        userId: 1,
        role: 'admin',
      });

      mockDb.query.projectMembers.findMany.mockResolvedValue(mockMembers);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listMembers({ projectId: 1 });
      expect(result).toEqual(mockMembers);
      expect(result.length).toBe(2);
    });

    it('should throw FORBIDDEN error when user is not a member', async () => {
      mockDb.query.projectMembers.findFirst.mockResolvedValue(null);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.listMembers({ projectId: 1 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics', async () => {
      const mockStats = {
        projectId: 1,
        totalUsers: 100,
        activeSubscriptions: 50,
        totalRevenue: '10000',
        monthlyRevenue: '1000',
        churnRate: '5',
        avgSubscriptionValue: '200',
        updatedAt: new Date(),
      };

      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1,
        userId: 1,
        role: 'admin',
      });

      mockDb.query.projectStatistics.findFirst.mockResolvedValue(mockStats);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getStatistics({ projectId: 1 });
      expect(result).toEqual(mockStats);
    });

    it('should initialize statistics if not found', async () => {
      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1,
        userId: 1,
        role: 'admin',
      });

      mockDb.query.projectStatistics.findFirst.mockResolvedValue(null);

      const insertBuilder = {
        values: vi.fn().mockResolvedValue({}),
      };

      mockDb.insert.mockReturnValue(insertBuilder);

      const caller = glwaFranchiseRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getStatistics({ projectId: 1 });
      expect(result.projectId).toBe(1);
      expect(result.totalUsers).toBe(0);
      expect(result.activeSubscriptions).toBe(0);
    });
  });
});
