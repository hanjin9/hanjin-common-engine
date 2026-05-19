/**
 * 국제 타이포그래피 스타일 (International Typographic Style)
 * 
 * 디자인 철학:
 * - 수학적 정밀함에 근거한 그리드 시스템
 * - 순백의 캔버스 위에 검정 산세리프 타이포그래피
 * - 빨간 사각형 포인트 요소로 시각적 위계 정의
 * - 가는 검정 구분선과 넉넉한 여백
 * - 기능적이면서도 시대를 초월한 모던한 미감
 */

// 색상 팔레트
export const colors = {
  // 기본 색상
  white: '#FFFFFF',
  black: '#000000',
  
  // 회색 스케일 (명도 기반)
  gray: {
    50: '#FAFAFA',   // 거의 흰색
    100: '#F5F5F5',  // 배경
    200: '#EEEEEE',  // 경계선
    300: '#E0E0E0',  // 비활성
    400: '#BDBDBD',  // 보조 텍스트
    500: '#9E9E9E',  // 중간 텍스트
    600: '#757575',  // 강조 텍스트
    700: '#616161',  // 주요 텍스트
    800: '#424242',  // 강한 텍스트
    900: '#212121',  // 거의 검정
  },
  
  // 포인트 색상 (빨간색)
  red: {
    primary: '#E53935',   // 주요 포인트
    dark: '#C62828',      // 호버/활성
    light: '#FFEBEE',     // 배경
  },
  
  // 기능 색상
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#1976D2',
};

// 타이포그래피 스케일
export const typography = {
  // 제목 (Heading)
  h1: {
    fontSize: '3.5rem',    // 56px
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: '-0.015em',
  },
  h2: {
    fontSize: '2.75rem',   // 44px
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '2.2rem',    // 35px
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: '-0.005em',
  },
  h4: {
    fontSize: '1.75rem',   // 28px
    lineHeight: 1.35,
    fontWeight: 600,
    letterSpacing: '0em',
  },
  h5: {
    fontSize: '1.4rem',    // 22px
    lineHeight: 1.4,
    fontWeight: 600,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1.1rem',    // 18px
    lineHeight: 1.45,
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
  
  // 본문 (Body)
  body1: {
    fontSize: '1rem',      // 16px
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0.03em',
  },
  body2: {
    fontSize: '0.875rem',  // 14px
    lineHeight: 1.57,
    fontWeight: 400,
    letterSpacing: '0.025em',
  },
  
  // 캡션 (Caption)
  caption: {
    fontSize: '0.75rem',   // 12px
    lineHeight: 1.66,
    fontWeight: 500,
    letterSpacing: '0.04em',
  },
  
  // 버튼
  button: {
    fontSize: '0.875rem',  // 14px
    lineHeight: 1.75,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  },
};

// 간격 시스템 (8px 기반)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

// 경계선 (Border)
export const borders = {
  thin: '0.5px solid',
  normal: '1px solid',
  thick: '2px solid',
};

// 그림자 (Shadow) - 최소화
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

// 모서리 반경 (Border Radius)
export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
};

// 전환 (Transition)
export const transitions = {
  fast: '150ms ease-out',
  normal: '250ms ease-out',
  slow: '350ms ease-out',
};

// 그리드 시스템 (12 컬럼)
export const grid = {
  columns: 12,
  gap: '1.5rem',
  maxWidth: '1440px',
  containerPadding: '2rem',
};

// 반응형 브레이크포인트
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
