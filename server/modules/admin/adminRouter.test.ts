import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { adminRouter } from './adminRouter';
import { getDb } from '../../db';
import { membershipTiers, userMemberships, users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * 관리자 라우터 테스트 - 11단계 멤버십 분포 조회
 */
describe('adminRouter', () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // 테스트용 관리자 사용자 생성
    const adminUser = await db.insert(users).values({
      openId: `test-admin-${Date.now()}`,
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
    });
    testUserId = adminUser[0];
  });

  afterAll(async () => {
    if (db && testUserId) {
      // 테스트 데이터 정리
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it('should return membership distribution with all 11 tiers', async () => {
    const caller = adminRouter.createCaller({
      user: {
        id: testUserId,
        role: 'admin',
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
      },
    });

    const result = await caller.getAnalytics();

    // 검증: membershipDistribution이 존재하고 11개의 항목을 포함
    expect(result).toBeDefined();
    expect(result.membershipDistribution).toBeDefined();
    expect(Array.isArray(result.membershipDistribution)).toBe(true);
    expect(result.membershipDistribution.length).toBe(11);

    // 각 멤버십 항목의 구조 검증
    result.membershipDistribution.forEach((tier: any) => {
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('tier');
      expect(tier).toHaveProperty('value');
      expect(tier).toHaveProperty('color');
      expect(typeof tier.value).toBe('number');
      expect(tier.value >= 0).toBe(true);
    });

    // 11단계 멤버십 이름 검증
    const tierNames = result.membershipDistribution.map((t: any) => t.name);
    expect(tierNames).toContain('브론즈');
    expect(tierNames).toContain('실버');
    expect(tierNames).toContain('골드');
    expect(tierNames).toContain('에메랄드');
    expect(tierNames).toContain('그린에메랄드');
    expect(tierNames).toContain('사파이어');
    expect(tierNames).toContain('블루사파이어');
    expect(tierNames).toContain('다이아몬드');
    expect(tierNames).toContain('블루다이아몬드');
    expect(tierNames).toContain('플래티넘');
    expect(tierNames).toContain('블랙플래티넘');
  });

  it('should return analytics data with correct structure', async () => {
    const caller = adminRouter.createCaller({
      user: {
        id: testUserId,
        role: 'admin',
        openId: `test-admin-${Date.now()}`,
        name: 'Test Admin',
      },
    });

    const result = await caller.getAnalytics();

    // KPI 데이터 검증
    expect(result).toHaveProperty('totalMembers');
    expect(result).toHaveProperty('monthlyRevenue');
    expect(result).toHaveProperty('activeRate');
    expect(result).toHaveProperty('avgScore');
    expect(result).toHaveProperty('membershipDistribution');

    expect(typeof result.totalMembers).toBe('number');
    expect(typeof result.monthlyRevenue).toBe('number');
    expect(typeof result.activeRate).toBe('number');
    expect(typeof result.avgScore).toBe('number');
  });

  it('should throw error if user is not admin', async () => {
    // 일반 사용자 생성
    const regularUser = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: 'user@test.com',
      role: 'user',
    });
    const regularUserId = regularUser[0];

    try {
      const caller = adminRouter.createCaller({
        user: {
          id: regularUserId,
          role: 'user',
          openId: `test-user-${Date.now()}`,
          name: 'Test User',
        },
      });

      await caller.getAnalytics();
      expect.fail('Should have thrown FORBIDDEN error');
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toContain('관리자 권한');
    } finally {
      // 정리
      await db.delete(users).where(eq(users.id, regularUserId));
    }
  });
});
