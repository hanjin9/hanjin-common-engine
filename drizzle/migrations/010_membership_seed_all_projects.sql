-- ============================================================
-- 010_membership_seed_all_projects.sql
-- 5개 프로젝트 멤버십/구독 단계 시드 데이터
-- INSERT IGNORE 사용 (중복 방지)
-- ============================================================

-- ─── 1. GLWA VIP 멤버십 11단계 ──────────────────────────────
INSERT IGNORE INTO project_membership_tiers
  (project_slug, tier_name, tier_label, tier_order, monthly_fee, annual_fee, color_hex, description, benefits, is_active)
VALUES
  ('glwa', 'bronze',           '브론즈',          1,  0,       0,       '#cd7f32', '입문 단계 — 기본 건강 체크 제공',                  '["기본 건강 체크","커뮤니티 접근"]',                                                    1),
  ('glwa', 'silver',           '실버',            2,  29000,   290000,  '#c0c0c0', '기초 건강 관리 단계',                              '["기본 건강 체크","AI 피드백 월 3회","커뮤니티 접근"]',                                 1),
  ('glwa', 'gold',             '골드',            3,  59000,   590000,  '#d4af37', '중급 건강 관리 단계',                              '["AI 피드백 무제한","미션 포인트 2배","우선 상담"]',                                    1),
  ('glwa', 'blue_sapphire',    '블루사파이어',    4,  99000,   990000,  '#0f52ba', '고급 건강 관리 단계',                              '["AI 코칭 주 1회","전문가 상담","미션 포인트 3배"]',                                    1),
  ('glwa', 'green_emerald',    '그린에메랄드',    5,  149000,  1490000, '#50c878', '프리미엄 건강 관리 단계',                          '["AI 코칭 주 2회","VIP 라운지 접근","포인트 4배"]',                                     1),
  ('glwa', 'diamond',          '다이아몬드',      6,  199000,  1990000, '#b9f2ff', '엘리트 건강 관리 단계',                            '["AI 코칭 주 3회","1:1 전문가 매칭","포인트 5배","VIP 이벤트"]',                        1),
  ('glwa', 'blue_diamond',     '블루다이아몬드',  7,  299000,  2990000, '#4fc3f7', '최상위 건강 관리 단계',                            '["무제한 AI 코칭","전담 매니저","포인트 6배","글로벌 이벤트"]',                          1),
  ('glwa', 'platinum',         '플래티넘',        8,  499000,  4990000, '#e5e4e2', '초프리미엄 건강 관리 단계',                        '["전담 의료진 연결","무제한 코칭","포인트 8배","해외 리트릿"]',                          1),
  ('glwa', 'black_platinum',   '블랙플래티넘',    9,  999000,  9990000, '#1a1a1a', '최고 등급 — 완전 맞춤형 건강 관리',                '["전담 의료팀","글로벌 네트워크","포인트 10배","프라이빗 리트릿","자산관리 연계"]',     1),
  ('glwa', 'founder',          '파운더 (예약)',   10, 0,       0,       '#ffd700', '창립 멤버 특별 등급 (예약)',                        '["창립 멤버 혜택 (준비 중)"]',                                                          0),
  ('glwa', 'global_ambassador','글로벌 앰배서더', 11, 0,       0,       '#ff6b35', '글로벌 홍보대사 등급 (예약)',                       '["글로벌 앰배서더 혜택 (준비 중)"]',                                                    0);

-- ─── 2. 숨호흡 구독 레벨 5단계 ─────────────────────────────
INSERT IGNORE INTO project_membership_tiers
  (project_slug, tier_name, tier_label, tier_order, monthly_fee, annual_fee, color_hex, description, benefits, is_active)
VALUES
  ('breathing-app', 'free',      '무료',       1, 0,      0,      '#6b7280', '기본 호흡법 3종 제공',                    '["기본 호흡법 3종","7일 무료 체험"]',                                  1),
  ('breathing-app', 'silver',    '실버',       2, 9900,   99000,  '#c0c0c0', '호흡법 10종 + AI 가이드',                 '["호흡법 10종","AI 음성 가이드","진행 통계"]',                          1),
  ('breathing-app', 'gold',      '골드',       3, 19900,  199000, '#d4af37', '전체 호흡법 + 개인화 코칭',               '["전체 호흡법","개인화 AI 코칭","수면 분석"]',                          1),
  ('breathing-app', 'premium',   '프리미엄',   4, 39900,  399000, '#8b5cf6', '전문가 수준 호흡 훈련',                   '["전문가 호흡 훈련","의료진 연계","GLWA 포인트 연동"]',                 1),
  ('breathing-app', 'pro',       '프로 (예약)',5, 0,      0,      '#f59e0b', '전문 강사 자격 연계 (예약)',               '["프로 강사 자격 (준비 중)"]',                                         0);

-- ─── 3. 스포츠회복사 구독 레벨 3단계 ───────────────────────
INSERT IGNORE INTO project_membership_tiers
  (project_slug, tier_name, tier_label, tier_order, monthly_fee, annual_fee, color_hex, description, benefits, is_active)
VALUES
  ('sports-recovery', 'basic',        '베이직',     1, 29000,  290000,  '#10b981', '스포츠 회복 기초 과정',               '["기초 회복 이론","온라인 강의 10강","수료증 발급"]',                   1),
  ('sports-recovery', 'professional', '프로페셔널', 2, 79000,  790000,  '#3b82f6', '스포츠 회복 전문가 과정',             '["전문가 실습 과정","1:1 멘토링 2회","자격증 지원"]',                   1),
  ('sports-recovery', 'master',       '마스터',     3, 149000, 1490000, '#f59e0b', '스포츠 회복 마스터 과정',             '["마스터 심화 과정","강사 자격 취득","GLWA 협회 등록","수익 쉐어"]',    1);

-- ─── 4. 장부관리사 구독 레벨 4단계 ─────────────────────────
INSERT IGNORE INTO project_membership_tiers
  (project_slug, tier_name, tier_label, tier_order, monthly_fee, annual_fee, color_hex, description, benefits, is_active)
VALUES
  ('bread-coach', 'silver',   '실버',    1, 19900,  199000,  '#c0c0c0', '장부관리 기초 자격',                  '["기초 장부관리 이론","온라인 강의 8강","수료증"]',                      1),
  ('bread-coach', 'gold',     '골드',    2, 49900,  499000,  '#d4af37', '장부관리 전문 자격',                  '["전문 실무 과정","세무 연계 강의","자격증 지원"]',                      1),
  ('bread-coach', 'platinum', '플래티넘',3, 99000,  990000,  '#e5e4e2', '장부관리 고급 자격',                  '["고급 재무 분석","1:1 멘토링","강사 자격 취득"]',                       1),
  ('bread-coach', 'diamond',  '다이아몬드',4,199000,1990000, '#b9f2ff', '장부관리 마스터 자격',                '["마스터 자격","사무소 개설 지원","GLWA 협회 파트너","수익 쉐어"]',       1);
