# 아카이브 모듈 (Archive Modules)

이 폴더에는 현재 엔진과 아키텍처가 다르거나, 향후 사용을 위해 보관된 모듈들이 있습니다.

## 보관된 모듈

### `authjs-integration.ts`
- **설명:** NextAuth.js(Auth.js) 기반 인증 모듈
- **기능:** Google OAuth, Kakao OAuth, 이메일/비밀번호 인증
- **보관 이유:** 현재 엔진은 Manus OAuth를 사용하므로 아키텍처 불일치
- **사용 시기:** NextAuth.js로 전환하거나 독립 배포 시 사용
- **필요 패키지:** `next-auth`, `bcrypt`
- **필요 스키마 필드:** `users.passwordHash`, `users.avatarUrl`

## 사용 방법

1. 필요한 파일을 `server/modules/auth/` 폴더로 복사
2. `drizzle/schema.ts`에 필요한 필드 추가
3. 필요한 패키지 설치
4. 환경변수 설정 (GOOGLE_CLIENT_ID, KAKAO_CLIENT_ID 등)
