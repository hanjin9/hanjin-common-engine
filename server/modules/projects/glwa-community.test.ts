import { describe, it, expect, beforeEach, vi } from 'vitest';
import { glwaCommunityRouter } from './glwa-community';
import { getDb } from '../../db';

// Mock getDb
vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

describe('GLWA Community Router', () => {
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

  describe('getAssociation', () => {
    it('should return association info for GLWA community project', async () => {
      const mockAssociation = {
        id: 1,
        slug: 'glwa-community',
        name: 'GLWA Community',
        projectType: 'glwa_community',
        ownerId: 1,
      };

      mockDb.query.projects.findFirst.mockResolvedValue(mockAssociation);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getAssociation({ projectId: 1 });
      expect(result).toEqual(mockAssociation);
    });

    it('should throw NOT_FOUND error when project does not exist', async () => {
      mockDb.query.projects.findFirst.mockResolvedValue(null);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getAssociation({ projectId: 999 })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw BAD_REQUEST error when project is not GLWA community', async () => {
      const mockProject = {
        id: 1,
        slug: 'other-project',
        name: 'Other Project',
        projectType: 'glwa_franchise',
        ownerId: 1,
      };

      mockDb.query.projects.findFirst.mockResolvedValue(mockProject);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getAssociation({ projectId: 1 })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });
  });

  describe('listMembers', () => {
    it('should return members for authorized user', async () => {
      const mockMembers = [
        { projectId: 1, userId: 1, role: 'admin', user: { id: 1, email: 'admin@example.com', name: 'Admin' } },
        { projectId: 1, userId: 2, role: 'manager', user: { id: 2, email: 'manager@example.com', name: 'Manager' } },
        { projectId: 1, userId: 3, role: 'user', user: { id: 3, email: 'user@example.com', name: 'User' } },
      ];

      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1, userId: 1, role: 'admin',
      });
      mockDb.query.projectMembers.findMany.mockResolvedValue(mockMembers);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listMembers({ projectId: 1 });
      expect(result).toEqual(mockMembers);
      expect(result.length).toBe(3);
    });

    it('should filter members by role', async () => {
      const mockAdmins = [
        { projectId: 1, userId: 1, role: 'admin', user: { id: 1, email: 'admin@example.com', name: 'Admin' } },
      ];

      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1, userId: 1, role: 'admin',
      });
      mockDb.query.projectMembers.findMany.mockResolvedValue(mockAdmins);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.listMembers({ projectId: 1, role: 'admin' });
      expect(result).toEqual(mockAdmins);
      expect(result.length).toBe(1);
    });

    it('should throw FORBIDDEN error when user is not a member', async () => {
      mockDb.query.projectMembers.findFirst.mockResolvedValue(null);

      const caller = glwaCommunityRouter.createCaller({
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
    it('should return association statistics', async () => {
      const mockMembers = [
        { projectId: 1, userId: 1, role: 'admin' },
        { projectId: 1, userId: 2, role: 'admin' },
        { projectId: 1, userId: 3, role: 'manager' },
        { projectId: 1, userId: 4, role: 'user' },
        { projectId: 1, userId: 5, role: 'user' },
      ];

      mockDb.query.projectMembers.findFirst.mockResolvedValue({
        projectId: 1, userId: 1, role: 'admin',
      });
      mockDb.query.projectMembers.findMany.mockResolvedValue(mockMembers);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getStatistics({ projectId: 1 });
      expect(result.projectId).toBe(1);
      expect(result.totalMembers).toBe(5);
      expect(result.admins).toBe(2);
      expect(result.managers).toBe(1);
      expect(result.regularUsers).toBe(2);
    });

    it('should throw FORBIDDEN error when user is not a member', async () => {
      mockDb.query.projectMembers.findFirst.mockResolvedValue(null);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getStatistics({ projectId: 1 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('getMemberDetails', () => {
    it('should return member details for authorized user', async () => {
      const mockMember = {
        projectId: 1,
        userId: 2,
        role: 'manager',
        user: {
          id: 2,
          email: 'manager@example.com',
          name: 'Manager',
          role: 'user',
          createdAt: new Date(),
        },
      };

      mockDb.query.projectMembers.findFirst
        .mockResolvedValueOnce({ projectId: 1, userId: 1, role: 'admin' })
        .mockResolvedValueOnce(mockMember);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getMemberDetails({ projectId: 1, userId: 2 });
      expect(result).toEqual(mockMember);
      expect(result.role).toBe('manager');
    });

    it('should throw NOT_FOUND error when member does not exist', async () => {
      mockDb.query.projectMembers.findFirst
        .mockResolvedValueOnce({ projectId: 1, userId: 1, role: 'admin' })
        .mockResolvedValueOnce(null);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getMemberDetails({ projectId: 1, userId: 999 })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw FORBIDDEN error when user is not a member', async () => {
      mockDb.query.projectMembers.findFirst.mockResolvedValue(null);

      const caller = glwaCommunityRouter.createCaller({
        user: { id: 1, role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.getMemberDetails({ projectId: 1, userId: 2 })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });
});
