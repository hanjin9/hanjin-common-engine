-- 한진 공통 엔진 멀티 프로젝트 DB 스키마 마이그레이션
-- Phase 1: 프로젝트 관리 테이블

-- 1. 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE COMMENT '프로젝트명 (장부관리사, 스포츠회복사, 로또, GLWA, 숨호흡, 랜딩)',
  slug VARCHAR(100) NOT NULL UNIQUE COMMENT '프로젝트 슬러그 (URL용)',
  description TEXT COMMENT '프로젝트 설명',
  logo_url VARCHAR(500) COMMENT '프로젝트 로고 URL',
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active' COMMENT '프로젝트 상태',
  owner_id INT NOT NULL COMMENT '프로젝트 소유자 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 프로젝트 멤버 테이블 (사용자와 프로젝트 매핑)
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'manager', 'user') DEFAULT 'user' COMMENT '프로젝트 내 역할',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_user (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '플랜명 (기본, 프리미엄, 엔터프라이즈)',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL COMMENT '월간 가격',
  billing_cycle ENUM('monthly', 'yearly', 'one_time') DEFAULT 'monthly',
  features JSON COMMENT '플랜 기능 목록',
  stripe_price_id VARCHAR(255) COMMENT 'Stripe Price ID',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project (project_id),
  INDEX idx_stripe_price (stripe_price_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 구독 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE COMMENT 'Stripe Subscription ID',
  status ENUM('active', 'past_due', 'canceled', 'unpaid', 'paused') DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP NULL COMMENT '취소 예정 시간',
  canceled_at TIMESTAMP NULL COMMENT '실제 취소 시간',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_project_user (project_id, user_id),
  INDEX idx_status (status),
  INDEX idx_stripe_subscription (stripe_subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 결제 테이블
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  subscription_id INT COMMENT '구독 ID (구독 결제인 경우)',
  amount DECIMAL(10, 2) NOT NULL COMMENT '결제 금액',
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('succeeded', 'pending', 'failed', 'refunded') DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255) UNIQUE COMMENT 'Stripe Payment Intent ID',
  stripe_charge_id VARCHAR(255) COMMENT 'Stripe Charge ID',
  payment_method VARCHAR(50) COMMENT '결제 수단 (card, bank_transfer 등)',
  description TEXT COMMENT '결제 설명',
  metadata JSON COMMENT '추가 메타데이터',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_project_user (project_id, user_id),
  INDEX idx_status (status),
  INDEX idx_stripe_payment_intent (stripe_payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 결제 이벤트 테이블 (Stripe 웹훅 이벤트)
CREATE TABLE IF NOT EXISTS payment_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Stripe Event ID',
  event_type VARCHAR(100) NOT NULL COMMENT '이벤트 타입 (payment_intent.succeeded 등)',
  project_id INT COMMENT '프로젝트 ID',
  user_id INT COMMENT '사용자 ID',
  payment_id INT COMMENT '결제 ID',
  subscription_id INT COMMENT '구독 ID',
  data JSON NOT NULL COMMENT 'Stripe 이벤트 데이터',
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_stripe_event (stripe_event_id),
  INDEX idx_event_type (event_type),
  INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  user_id INT,
  action VARCHAR(100) NOT NULL COMMENT '작업 (create, update, delete, login 등)',
  resource_type VARCHAR(50) COMMENT '리소스 타입 (user, payment, subscription 등)',
  resource_id INT COMMENT '리소스 ID',
  changes JSON COMMENT '변경 사항',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 프로젝트 통계 테이블
CREATE TABLE IF NOT EXISTS project_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL UNIQUE,
  total_users INT DEFAULT 0,
  active_subscriptions INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  monthly_revenue DECIMAL(12, 2) DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '이탈율 (%)',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 자격증/인증 테이블
CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  certification_name VARCHAR(255) NOT NULL,
  certification_number VARCHAR(100) COMMENT '자격증 번호',
  issued_date DATE,
  expiry_date DATE COMMENT '만료 날짜',
  issuer VARCHAR(255) COMMENT '발급 기관',
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  document_url VARCHAR(500) COMMENT '자격증 문서 URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_user (project_id, user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 사용자 권한 테이블 (RBAC)
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  permission VARCHAR(100) NOT NULL COMMENT '권한 (read, write, delete, admin 등)',
  resource_type VARCHAR(50) COMMENT '리소스 타입',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_permission (project_id, user_id, permission),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_user (project_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  email_on_payment_success BOOLEAN DEFAULT TRUE,
  email_on_payment_failed BOOLEAN DEFAULT TRUE,
  email_on_subscription_renewal BOOLEAN DEFAULT TRUE,
  email_on_subscription_expiry BOOLEAN DEFAULT TRUE,
  email_on_subscription_expiry_7d BOOLEAN DEFAULT TRUE,
  email_on_subscription_expiry_1d BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_notification_setting (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터 삽입: 6개 프로젝트
INSERT INTO projects (name, slug, description, status, owner_id) VALUES
('장부관리사', 'bookkeeper', '회계 및 장부 관리 서비스', 'active', 1),
('스포츠회복사', 'sports-recovery', '스포츠 회복 및 재활 서비스', 'active', 1),
('로또', 'lottery', '로또 응모 및 관리 서비스', 'active', 1),
('GLWA', 'glwa', '글로벌 건강 협회 서비스', 'active', 1),
('숨호흡', 'breathing', '호흡법 및 명상 서비스', 'active', 1),
('랜딩', 'landing', '랜딩 페이지 및 마케팅', 'active', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 초기 구독 플랜 생성
INSERT INTO subscription_plans (project_id, name, description, price, billing_cycle, features, is_active) VALUES
(1, '기본', '기본 기능 제공', 9.99, 'monthly', '["기본 기능", "이메일 지원"]', TRUE),
(1, '프리미엠', '고급 기능 제공', 29.99, 'monthly', '["모든 기능", "우선 지원", "API 접근"]', TRUE),
(2, '기본', '기본 기능 제공', 14.99, 'monthly', '["기본 기능", "이메일 지원"]', TRUE),
(2, '프리미엄', '고급 기능 제공', 39.99, 'monthly', '["모든 기능", "우선 지원", "API 접근"]', TRUE),
(3, '기본', '기본 기능 제공', 4.99, 'monthly', '["기본 기능"]', TRUE),
(3, '프리미엄', '고급 기능 제공', 19.99, 'monthly', '["모든 기능", "통계"]', TRUE),
(4, '기본', '기본 기능 제공', 12.99, 'monthly', '["기본 기능"]', TRUE),
(4, '프리미엄', '고급 기능 제공', 34.99, 'monthly', '["모든 기능", "우선 지원"]', TRUE),
(5, '기본', '기본 기능 제공', 7.99, 'monthly', '["기본 기능"]', TRUE),
(5, '프리미엄', '고급 기능 제공', 24.99, 'monthly', '["모든 기능", "맞춤 프로그램"]', TRUE),
(6, '기본', '기본 기능 제공', 0, 'one_time', '["랜딩 페이지"]', TRUE),
(6, '프리미엄', '고급 기능 제공', 99.99, 'one_time', '["완전 맞춤 랜딩"]', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
