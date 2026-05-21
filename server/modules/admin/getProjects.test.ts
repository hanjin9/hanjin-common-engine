import { describe, it, expect, beforeAll } from 'vitest';
import { adminRouter } from './adminRouter';
import { getDb } from '../../db';
import { users } from '../../../drizzle/schema';

/**
 * 관리자 라우터 테스트 - 프로젝트 목록 조회
 */
describe('adminRouter.getProjects', () => {
  let db: any;
  let testAdminId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // 테스트용 관리자 사용자 생성
    const result = await db.insert(users).values({
      openId: `test-admin-${Date.now()}`,
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
    });
    testAdminId = result[0];
  });

  it('should return list of projects for admin user', async () => {
    const caller = adminRouter.createCaller({
      user: {
        id: testAdminId,
        role: 'admin',
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
      },
    });

    const result = await caller.getProjects();

    // 검증: 배열 반환
    expect(Array.isArray(result)).toBe(true);

    // 각 프로젝트 항목의 구조 검증
    if (result.length > 0) {
      result.forEach((proj: any) => {
        expect(proj).toHaveProperty('id');
        expect(proj).toHaveProperty('slug');
        expect(proj).toHaveProperty('name');
        expect(proj).toHaveProperty('description');
        expect(proj).toHaveProperty('projectType');
        expect(proj).toHaveProperty('isActive');
        expect(typeof proj.id).toBe('number');
        expect(typeof proj.name).toBe('string');
        expect(typeof proj.isActive).toBe('boolean');
      });
    }
  });

  it('should throw error if user is not admin', async () => {
    // 일반 사용자 컨텍스트로 호출 시도
    try {
      const caller = adminRouter.createCaller({
        user: {
          id: 9999,
          role: 'user',
          openId: 'test-user',
          name: 'Test User',
        },
      });

      await caller.getProjects();
      expect.fail('Should have thrown FORBIDDEN error');
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toContain('관리자 권한');
    }
  });

  it('should return projects sorted by name', async () => {
    const caller = adminRouter.createCaller({
      user: {
        id: testAdminId,
        role: 'admin',
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
      },
    });

    const result = await caller.getProjects();

    // 프로젝트가 2개 이상 있으면 정렬 확인
    if (result.length >= 2) {
      for (let i = 1; i < result.length; i++) {
        expect(result[i].name >= result[i - 1].name).toBe(true);
      }
    }
  });

  it('should include project metadata fields', async () => {
    const caller = adminRouter.createCaller({
      user: {
        id: testAdminId,
        role: 'admin',
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
      },
    });

    const result = await caller.getProjects();

    if (result.length > 0) {
      const firstProject = result[0];
      
      // 필수 필드 검증
      expect(firstProject.id).toBeDefined();
      expect(firstProject.slug).toBeDefined();
      expect(firstProject.name).toBeDefined();
      expect(firstProject.projectType).toBeDefined();
      expect(firstProject.isActive).toBeDefined();
      
      // 타입 검증
      expect(typeof firstProject.id).toBe('number');
      expect(typeof firstProject.slug).toBe('string');
      expect(typeof firstProject.name).toBe('string');
      expect(['glwa_franchise', 'glwa_community', 'breathing', 'sports_recovery', 'accounting', 'lottery', 'landing']).toContain(firstProject.projectType);
      expect(typeof firstProject.isActive).toBe('boolean');
    }
  });
});
