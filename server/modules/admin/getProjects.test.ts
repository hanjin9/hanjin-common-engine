import { describe, it, expect, vi } from 'vitest';
import { adminRouter } from './adminRouter';

// ── MOCK_PROJECTS 를 vi.mock 팩토리 밖에 정의하면 hoisting 에러 발생
// → vi.mock 내에서 직접 인라인 정의
vi.mock('../../db', () => {
  // hoisting 안전하게 인라인 정의
  const mockProjects = [
    { id: 1, slug: 'glwa-franchise',   name: 'GLWA 프랜차이즈',  description: '가맹점 관리', projectType: 'glwa_franchise',   isActive: true },
    { id: 2, slug: 'breathing-app',    name: '숨호흡 앱',         description: '호흡 건강',   projectType: 'breathing',        isActive: true },
    { id: 3, slug: 'sports-recovery',  name: '스포츠회복사',      description: '스포츠 회복', projectType: 'sports_recovery',  isActive: true },
    { id: 4, slug: 'accounting',       name: '장부관리사협회',    description: '장부 관리',   projectType: 'accounting',       isActive: true },
    { id: 5, slug: 'glwa-community',   name: 'GLWA 커뮤니티',     description: '커뮤니티',    projectType: 'glwa_community',   isActive: true },
    { id: 6, slug: 'lottery',          name: '로또',              description: '로또 서비스', projectType: 'lottery',          isActive: false },
  ];

  return {
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockProjects),
          where: vi.fn().mockResolvedValue(mockProjects),
        }),
      }),
      query: {
        users: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        userMemberships: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        membershipTiers: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        projects: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue(mockProjects),
        },
        stripePayments: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      },
      execute: vi.fn().mockResolvedValue([{ count: 0 }]),
    }),
  };
});

vi.mock('../../../drizzle/schema', () => ({
  users: {},
  projects: { id: 'id', slug: 'slug', name: 'name', description: 'description', projectType: 'projectType', isActive: 'isActive' },
  userMemberships: {},
  membershipTiers: {},
  stripePayments: {},
}));

const VALID_TYPES = ['glwa_franchise','glwa_community','breathing','sports_recovery','accounting','lottery','landing'];

const adminCtx = { user: { id: 1, role: 'admin' as const, openId: 'x', name: 'Admin' }, req: {} as any, res: {} as any };
const userCtx  = { user: { id: 9, role: 'user'  as const, openId: 'y', name: 'User'  }, req: {} as any, res: {} as any };

describe('adminRouter.getProjects', () => {
  it('should return list of projects for admin user', async () => {
    const result = await adminRouter.createCaller(adminCtx).getProjects();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      result.forEach((p: any) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('slug');
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('projectType');
        expect(p).toHaveProperty('isActive');
        expect(typeof p.id).toBe('number');
        expect(typeof p.name).toBe('string');
        expect(typeof p.isActive).toBe('boolean');
      });
    }
  });

  it('should throw FORBIDDEN when user is not admin', async () => {
    await expect(adminRouter.createCaller(userCtx).getProjects()).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: expect.stringContaining('관리자 권한'),
    });
  });

  it('should return projects as array', async () => {
    const result = await adminRouter.createCaller(adminCtx).getProjects();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include valid projectType values', async () => {
    const result = await adminRouter.createCaller(adminCtx).getProjects();
    if (result.length > 0) {
      result.forEach((p: any) => {
        expect(VALID_TYPES).toContain(p.projectType);
      });
    }
  });
});
