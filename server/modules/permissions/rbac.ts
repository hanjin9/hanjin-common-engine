/**
 * 역할 기반 접근 제어 (RBAC) 모듈
 * 
 * 한진 공통 엔진의 세분화된 권한 관리 시스템을 구현합니다.
 * - 역할 정의 및 관리
 * - 권한 정의 및 할당
 * - 리소스 기반 접근 제어
 * - 감사 로깅
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

/**
 * 사용 가능한 역할
 */
export enum Role {
  SUPER_ADMIN = "super_admin", // 최고 관리자
  ADMIN = "admin", // 관리자
  PROJECT_MANAGER = "project_manager", // 프로젝트 관리자
  TEAM_LEAD = "team_lead", // 팀 리더
  ANALYST = "analyst", // 분석가
  SUPPORT = "support", // 지원팀
  USER = "user", // 일반 사용자
  GUEST = "guest", // 손님
}

/**
 * 사용 가능한 권한
 */
export enum Permission {
  // 사용자 관리
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_LIST = "user:list",

  // 프로젝트 관리
  PROJECT_CREATE = "project:create",
  PROJECT_READ = "project:read",
  PROJECT_UPDATE = "project:update",
  PROJECT_DELETE = "project:delete",
  PROJECT_LIST = "project:list",

  // 구독 관리
  SUBSCRIPTION_CREATE = "subscription:create",
  SUBSCRIPTION_READ = "subscription:read",
  SUBSCRIPTION_UPDATE = "subscription:update",
  SUBSCRIPTION_CANCEL = "subscription:cancel",
  SUBSCRIPTION_LIST = "subscription:list",

  // 결제 관리
  PAYMENT_READ = "payment:read",
  PAYMENT_REFUND = "payment:refund",
  PAYMENT_LIST = "payment:list",

  // 분석
  ANALYTICS_READ = "analytics:read",
  ANALYTICS_EXPORT = "analytics:export",

  // 설정
  SETTINGS_READ = "settings:read",
  SETTINGS_UPDATE = "settings:update",

  // 감사
  AUDIT_READ = "audit:read",
  AUDIT_EXPORT = "audit:export",
}

/**
 * 역할별 권한 매핑
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // 모든 권한
    ...Object.values(Permission),
  ],

  [Role.ADMIN]: [
    // 사용자 관리
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_LIST,

    // 프로젝트 관리
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_LIST,

    // 구독 관리
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_LIST,

    // 결제 관리
    Permission.PAYMENT_READ,
    Permission.PAYMENT_REFUND,
    Permission.PAYMENT_LIST,

    // 분석
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,

    // 설정
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,

    // 감사
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
  ],

  [Role.PROJECT_MANAGER]: [
    // 사용자 읽기
    Permission.USER_READ,
    Permission.USER_LIST,

    // 프로젝트 관리
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_LIST,

    // 구독 읽기
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_LIST,

    // 결제 읽기
    Permission.PAYMENT_READ,
    Permission.PAYMENT_LIST,

    // 분석
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
  ],

  [Role.TEAM_LEAD]: [
    // 사용자 읽기
    Permission.USER_READ,
    Permission.USER_LIST,

    // 프로젝트 읽기
    Permission.PROJECT_READ,
    Permission.PROJECT_LIST,

    // 구독 읽기
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_LIST,

    // 분석
    Permission.ANALYTICS_READ,
  ],

  [Role.ANALYST]: [
    // 분석
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,

    // 감사
    Permission.AUDIT_READ,
  ],

  [Role.SUPPORT]: [
    // 사용자 읽기
    Permission.USER_READ,
    Permission.USER_LIST,

    // 구독 읽기
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_LIST,

    // 결제 읽기
    Permission.PAYMENT_READ,
    Permission.PAYMENT_LIST,
  ],

  [Role.USER]: [
    // 자신의 정보만 읽기
    Permission.USER_READ,

    // 자신의 구독 읽기
    Permission.SUBSCRIPTION_READ,

    // 자신의 결제 읽기
    Permission.PAYMENT_READ,
  ],

  [Role.GUEST]: [
    // 제한된 읽기만 가능
    Permission.PROJECT_READ,
  ],
};

/**
 * 사용자 권한 확인
 * 
 * @param userRole 사용자 역할
 * @param requiredPermission 필요한 권한
 * @returns 권한 여부
 */
export function hasPermission(
  userRole: Role,
  requiredPermission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}

/**
 * 사용자가 여러 권한을 가지고 있는지 확인
 * 
 * @param userRole 사용자 역할
 * @param requiredPermissions 필요한 권한 배열
 * @param requireAll 모든 권한 필요 여부 (true: AND, false: OR)
 * @returns 권한 여부
 */
export function hasPermissions(
  userRole: Role,
  requiredPermissions: Permission[],
  requireAll: boolean = false
): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];

  if (requireAll) {
    // 모든 권한 필요
    return requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );
  } else {
    // 하나의 권한이라도 있으면 됨
    return requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );
  }
}

/**
 * 역할 계층 확인 (상위 역할인지 확인)
 * 
 * @param userRole 사용자 역할
 * @param targetRole 대상 역할
 * @returns 상위 역할 여부
 */
export function isHigherRole(userRole: Role, targetRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 8,
    [Role.ADMIN]: 7,
    [Role.PROJECT_MANAGER]: 6,
    [Role.TEAM_LEAD]: 5,
    [Role.ANALYST]: 4,
    [Role.SUPPORT]: 3,
    [Role.USER]: 2,
    [Role.GUEST]: 1,
  };

  return roleHierarchy[userRole] > roleHierarchy[targetRole];
}

/**
 * 리소스 기반 접근 제어
 * 
 * @param userRole 사용자 역할
 * @param resourceType 리소스 유형
 * @param action 작업 (create, read, update, delete)
 * @param resourceOwner 리소스 소유자 ID
 * @param userId 사용자 ID
 * @returns 접근 가능 여부
 */
export function canAccessResource(
  userRole: Role,
  resourceType: string,
  action: "create" | "read" | "update" | "delete",
  resourceOwner: number,
  userId: number
): boolean {
  // 최고 관리자는 모든 리소스 접근 가능
  if (userRole === Role.SUPER_ADMIN) {
    return true;
  }

  // 자신의 리소스인 경우
  if (resourceOwner === userId) {
    return true;
  }

  // 역할 기반 권한 확인
  const permission = `${resourceType}:${action}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * 권한 감사 로깅
 * 
 * @param userId 사용자 ID
 * @param userRole 사용자 역할
 * @param action 작업
 * @param resource 리소스
 * @param allowed 허용 여부
 * @param details 추가 정보
 */
export async function logPermissionAudit(
  userId: number,
  userRole: Role,
  action: string,
  resource: string,
  allowed: boolean,
  details?: Record<string, any>
) {
  try {
    const auditLog = {
      timestamp: new Date(),
      userId,
      userRole,
      action,
      resource,
      allowed,
      details,
    };

    console.log(`[RBAC Audit] ${allowed ? "ALLOWED" : "DENIED"}: ${action} on ${resource} by user ${userId}`);

    // 실제 구현에서는 감사 로그를 데이터베이스에 저장
    // await db.insert(auditLogs).values(auditLog);
  } catch (error) {
    console.error("[RBAC] Error logging audit:", error);
  }
}

/**
 * 권한 미들웨어
 * 
 * @param requiredPermission 필요한 권한
 * @returns Express 미들웨어
 */
export function requirePermission(requiredPermission: Permission) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as Role;

    if (!userRole) {
      logPermissionAudit(
        req.user?.id || 0,
        Role.GUEST,
        "access_denied",
        req.path,
        false,
        { reason: "No role" }
      );
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!hasPermission(userRole, requiredPermission)) {
      logPermissionAudit(
        req.user.id,
        userRole,
        "access_denied",
        req.path,
        false,
        { requiredPermission }
      );
      return res.status(403).json({ error: "Forbidden" });
    }

    logPermissionAudit(
      req.user.id,
      userRole,
      "access_granted",
      req.path,
      true
    );

    next();
  };
}

/**
 * 역할 미들웨어
 * 
 * @param requiredRoles 필요한 역할 배열
 * @returns Express 미들웨어
 */
export function requireRole(...requiredRoles: Role[]) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as Role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      logPermissionAudit(
        req.user?.id || 0,
        userRole || Role.GUEST,
        "role_access_denied",
        req.path,
        false,
        { requiredRoles }
      );
      return res.status(403).json({ error: "Forbidden" });
    }

    logPermissionAudit(
      req.user.id,
      userRole,
      "role_access_granted",
      req.path,
      true
    );

    next();
  };
}

/**
 * 권한 확인 헬퍼 (tRPC용)
 * 
 * @param userRole 사용자 역할
 * @param requiredPermission 필요한 권한
 */
export function checkPermission(
  userRole: Role | undefined,
  requiredPermission: Permission
): boolean {
  if (!userRole) {
    return false;
  }

  return hasPermission(userRole, requiredPermission);
}

/**
 * 역할 확인 헬퍼 (tRPC용)
 * 
 * @param userRole 사용자 역할
 * @param requiredRoles 필요한 역할 배열
 */
export function checkRole(
  userRole: Role | undefined,
  ...requiredRoles: Role[]
): boolean {
  if (!userRole) {
    return false;
  }

  return requiredRoles.includes(userRole);
}
