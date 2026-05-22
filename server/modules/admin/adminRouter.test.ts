import { describe, it, expect, vi } from 'vitest';
import { adminRouter } from './adminRouter';

// ── 모든 데이터를 vi.mock 팩토리 내부에 인라인 정의 (hoisting 안전) ──
vi.mock('../../db', () => {
  const tiers = [
    { tier: 'bronze',        nameKo: '브론즈',       pointThreshold: 0,    colorCode: '#cd7f32' },
    { tier: 'silver',        nameKo: '실버',         pointThreshold: 1000, colorCode: '#c0c0c0' },
    { tier: 'gold',          nameKo: '골드',         pointThreshold: 3000, colorCode: '#ffd700' },
    { tier: 'emerald',       nameKo: '에메랄드',     pointThreshold: 5000, colorCode: '#50c878' },
    { tier: 'green_emerald', nameKo: '그린에메랄드', pointThreshold: 8000, colorCode: '#2ecc71' },
    { tier: 'sapphire',      nameKo: '사파이어',     pointThreshold:12000, colorCode: '#4f86f7' },
    { tier: 'blue_sapphire', nameKo: '블루사파이어', pointThreshold:15000, colorCode: '#0f52ba' },
    { tier: 'diamond',       nameKo: '다이아몬드',   pointThreshold:20000, colorCode: '#b9f2ff' },
    { tier: 'blue_diamond',  nameKo: '블루다이아몬드',pointThreshold:25000,colorCode: '#0047ab' },
    { tier: 'platinum',      nameKo: '플래티넘',     pointThreshold:35000, colorCode: '#e5e4e2' },
    { tier: 'black_platinum',nameKo: '블랙플래티넘', pointThreshold:50000, colorCode: '#1a1a2e' },
  ];
  const countResult = [{ count: 0 }];
  return {
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(tiers),
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(tiers),
          }),
        }),
      }),
      query: {
        users: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        userMemberships: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue(countResult) },
        membershipTiers: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue(tiers) },
        projects: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        stripePayments: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      },
      execute: vi.fn().mockResolvedValue(countResult),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }),
  };
});

vi.mock('../../../drizzle/schema', () => ({
  users: { id: 'id', role: 'role', openId: 'openId', name: 'name', email: 'email' },
  userMemberships: { tier: 'tier', userId: 'userId' },
  membershipTiers: { tier: 'tier', pointThreshold: 'pointThreshold', nameKo: 'nameKo', colorCode: 'colorCode' },
  projects: { id: 'id', slug: 'slug', name: 'name', description: 'description', projectType: 'projectType', isActive: 'isActive' },
  stripePayments: {},
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return { ...actual, count: vi.fn().mockReturnValue('count_field'), eq: vi.fn().mockReturnValue(true) };
});

const adminCtx = { user: { id: 1, role: 'admin' as const, openId: 'admin', name: 'Admin' }, req: {} as any, res: {} as any };
const userCtx  = { user: { id: 2, role: 'user'  as const, openId: 'user',  name: 'User'  }, req: {} as any, res: {} as any };

describe('adminRouter', () => {
  describe('getAnalytics', () => {
    it('should return analytics with correct structure', async () => {
      const result = await adminRouter.createCaller(adminCtx).getAnalytics();
      expect(result).toHaveProperty('totalMembers');
      expect(result).toHaveProperty('monthlyRevenue');
      expect(result).toHaveProperty('activeRate');
      expect(result).toHaveProperty('avgScore');
      expect(result).toHaveProperty('membershipDistribution');
      expect(Array.isArray(result.membershipDistribution)).toBe(true);
    });

    it('should return membershipDistribution with 11 tiers', async () => {
      const result = await adminRouter.createCaller(adminCtx).getAnalytics();
      expect(result.membershipDistribution.length).toBe(11);
      const names = result.membershipDistribution.map((t: any) => t.name);
      ['브론즈','실버','골드','에메랄드','그린에메랄드','사파이어',
       '블루사파이어','다이아몬드','블루다이아몬드','플래티넘','블랙플래티넘']
        .forEach(n => expect(names).toContain(n));
      result.membershipDistribution.forEach((t: any) => {
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('tier');
        expect(t).toHaveProperty('value');
        expect(t).toHaveProperty('color');
        expect(typeof t.value).toBe('number');
        expect(t.value >= 0).toBe(true);
      });
    });

    it('should throw FORBIDDEN when user is not admin', async () => {
      await expect(adminRouter.createCaller(userCtx).getAnalytics()).rejects.toMatchObject({
        code: 'FORBIDDEN', message: expect.stringContaining('관리자 권한'),
      });
    });
  });
});
