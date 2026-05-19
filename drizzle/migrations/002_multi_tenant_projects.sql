-- ============================================================================
-- 한진 공통 엔진 v1.6 - 멀티테넌트 프로젝트 스키마
-- 7개 프로젝트 지원: GLWA 프랜차이즈, GLWA 커뮤니티, JW 숨호흡, 스포츠회복사, 장부관리사, 로또, 통합 관리
-- ============================================================================

-- 1. 프로젝트 테이블 (7개 프로젝트 등록)
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE COMMENT '프로젝트 슬러그 (URL용)',
  name VARCHAR(255) NOT NULL COMMENT '프로젝트 명칭',
  description TEXT COMMENT '프로젝트 설명',
  owner_id INT NOT NULL COMMENT '소유자 ID (users.id)',
  project_type ENUM('glwa_franchise', 'glwa_community', 'breathing', 'sports_recovery', 'accounting', 'lottery', 'landing') NOT NULL COMMENT '프로젝트 타입',
  ownership_status ENUM('hanjin', 'client_pending', 'client_active') NOT NULL DEFAULT 'hanjin' COMMENT '명의 상태',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id),
  INDEX idx_project_type (project_type),
  INDEX idx_ownership_status (ownership_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멀티테넌트 프로젝트 관리 테이블';

-- 2. 프로젝트 멤버 테이블 (프로젝트별 사용자 관리)
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  role ENUM('admin', 'manager', 'user') NOT NULL DEFAULT 'user' COMMENT '프로젝트 내 역할',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_user (project_id, user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 멤버 관리';

-- 3. 프로젝트 인증 설정 테이블 (각 프로젝트별 독립 로그인/결제 설정)
CREATE TABLE IF NOT EXISTS project_auth_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL UNIQUE COMMENT '프로젝트 ID',
  auth_provider ENUM('manus', 'supabase', 'auth0', 'custom') NOT NULL DEFAULT 'manus' COMMENT '인증 제공자',
  oauth_google_enabled BOOLEAN DEFAULT FALSE COMMENT 'Google OAuth 활성화',
  oauth_kakao_enabled BOOLEAN DEFAULT FALSE COMMENT 'Kakao OAuth 활성화',
  oauth_google_client_id VARCHAR(255) COMMENT 'Google OAuth Client ID',
  oauth_kakao_client_id VARCHAR(255) COMMENT 'Kakao OAuth Client ID',
  stripe_account_id VARCHAR(255) COMMENT 'Stripe 계정 ID (프로젝트별 독립 계정)',
  stripe_publishable_key VARCHAR(255) COMMENT 'Stripe 공개 키',
  email_provider ENUM('resend', 'sendgrid', 'custom') NOT NULL DEFAULT 'resend' COMMENT '이메일 제공자',
  email_from_address VARCHAR(255) COMMENT '발신 이메일 주소',
  email_from_name VARCHAR(255) COMMENT '발신자 이름',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 인증 및 결제 설정';

-- 4. 프로젝트 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS project_subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  name VARCHAR(255) NOT NULL COMMENT '플랜 명칭',
  description TEXT COMMENT '플랜 설명',
  price DECIMAL(10, 2) NOT NULL COMMENT '가격',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT '통화',
  billing_period ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly' COMMENT '결제 주기',
  features JSON COMMENT '포함된 기능 (JSON)',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성 여부',
  stripe_price_id VARCHAR(255) COMMENT 'Stripe Price ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 구독 플랜';

-- 5. 프로젝트 구독 테이블
CREATE TABLE IF NOT EXISTS project_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  plan_id INT NOT NULL COMMENT '구독 플랜 ID',
  stripe_subscription_id VARCHAR(255) COMMENT 'Stripe Subscription ID',
  status ENUM('active', 'paused', 'cancelled', 'expired') NOT NULL DEFAULT 'active' COMMENT '구독 상태',
  current_period_start DATETIME COMMENT '현재 기간 시작',
  current_period_end DATETIME COMMENT '현재 기간 종료',
  cancelled_at DATETIME COMMENT '취소 날짜',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES project_subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 사용자 구독';

-- 6. 프로젝트 결제 테이블
CREATE TABLE IF NOT EXISTS project_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  user_id INT NOT NULL COMMENT '사용자 ID',
  subscription_id INT COMMENT '구독 ID',
  amount DECIMAL(10, 2) NOT NULL COMMENT '결제 금액',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT '통화',
  status ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending' COMMENT '결제 상태',
  stripe_payment_intent_id VARCHAR(255) COMMENT 'Stripe Payment Intent ID',
  stripe_invoice_id VARCHAR(255) COMMENT 'Stripe Invoice ID',
  payment_method VARCHAR(50) COMMENT '결제 수단',
  error_message TEXT COMMENT '에러 메시지 (실패 시)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES project_subscriptions(id) ON DELETE SET NULL,
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 결제 이력';

-- 7. 프로젝트 통계 테이블
CREATE TABLE IF NOT EXISTS project_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL UNIQUE COMMENT '프로젝트 ID',
  total_users INT DEFAULT 0 COMMENT '총 사용자 수',
  active_subscriptions INT DEFAULT 0 COMMENT '활성 구독 수',
  total_revenue DECIMAL(12, 2) DEFAULT 0 COMMENT '총 매출',
  monthly_revenue DECIMAL(12, 2) DEFAULT 0 COMMENT '월간 매출',
  churn_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '이탈률 (%)',
  avg_subscription_value DECIMAL(10, 2) DEFAULT 0 COMMENT '평균 구독 가치',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 통계 요약';

-- 8. 프로젝트 감사 로그 테이블
CREATE TABLE IF NOT EXISTS project_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  user_id INT COMMENT '사용자 ID (시스템 작업 시 NULL)',
  action VARCHAR(255) NOT NULL COMMENT '작업 (예: project_created, user_added, payment_processed)',
  resource_type VARCHAR(100) COMMENT '리소스 타입 (예: project, user, subscription)',
  resource_id INT COMMENT '리소스 ID',
  details JSON COMMENT '작업 상세 정보',
  ip_address VARCHAR(45) COMMENT 'IP 주소',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project_id (project_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 감사 로그';

-- 9. 프로젝트 Webhook 이벤트 테이블
CREATE TABLE IF NOT EXISTS project_webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL COMMENT '프로젝트 ID',
  event_type VARCHAR(255) NOT NULL COMMENT '이벤트 타입 (예: stripe.payment_intent.succeeded)',
  provider VARCHAR(50) COMMENT '이벤트 제공자 (stripe, resend 등)',
  payload JSON NOT NULL COMMENT '이벤트 페이로드',
  status ENUM('pending', 'processed', 'failed', 'retry') NOT NULL DEFAULT 'pending' COMMENT '처리 상태',
  retry_count INT DEFAULT 0 COMMENT '재시도 횟수',
  error_message TEXT COMMENT '에러 메시지',
  processed_at DATETIME COMMENT '처리 완료 시간',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_event_type (event_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 Webhook 이벤트';

-- 10. 프로젝트 알림 설정 테이블
CREATE TABLE IF NOT EXISTS project_notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL UNIQUE COMMENT '프로젝트 ID',
  email_on_new_user BOOLEAN DEFAULT TRUE COMMENT '신규 사용자 가입 시 이메일',
  email_on_payment_success BOOLEAN DEFAULT TRUE COMMENT '결제 성공 시 이메일',
  email_on_payment_failed BOOLEAN DEFAULT TRUE COMMENT '결제 실패 시 이메일',
  email_on_subscription_cancelled BOOLEAN DEFAULT TRUE COMMENT '구독 취소 시 이메일',
  email_on_subscription_expiring BOOLEAN DEFAULT TRUE COMMENT '구독 만료 D-7 이메일',
  admin_email_recipients JSON COMMENT '관리자 이메일 수신자 목록',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로젝트별 알림 설정';

-- ============================================================================
-- 초기 데이터 삽입 (7개 프로젝트)
-- ============================================================================

INSERT INTO projects (slug, name, description, owner_id, project_type, ownership_status) VALUES
  ('glwa-franchise', 'GLWA 웹사이트 (분양/프랜차이즈/글로벌)', 'GLWA 프랜차이즈 분양 및 글로벌 확장 플랫폼', 1, 'glwa_franchise', 'hanjin'),
  ('glwa-community', 'GLWA (글로벌 커뮤니티 협회)', '글로벌 건강 커뮤니티 협회', 1, 'glwa_community', 'hanjin'),
  ('jw-breathing', 'JW 숨호흡 앱', 'AI 기반 호흡법 및 건강 관리 앱', 1, 'breathing', 'hanjin'),
  ('sports-recovery', '스포츠회복사 협회', '스포츠 회복 전문가 협회', 1, 'sports_recovery', 'hanjin'),
  ('accounting-association', '장부관리사 협회', '장부 관리 전문가 협회', 1, 'accounting', 'client_pending'),
  ('lottery', '로또', '글로벌 로또 플랫폼', 1, 'lottery', 'client_pending'),
  ('landing', '랜딩 페이지', '통합 랜딩 페이지 및 마케팅', 1, 'landing', 'hanjin');

-- ============================================================================
-- 인덱스 추가 (성능 최적화)
-- ============================================================================

ALTER TABLE project_members ADD INDEX idx_role (role);
ALTER TABLE project_subscription_plans ADD INDEX idx_is_active (is_active);
ALTER TABLE project_subscriptions ADD INDEX idx_current_period_end (current_period_end);
ALTER TABLE project_payments ADD INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id);
ALTER TABLE project_audit_logs ADD INDEX idx_resource_type (resource_type);
ALTER TABLE project_webhook_events ADD INDEX idx_provider (provider);

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
