# Phase 10. 보안 점검

## 목적

이 문서는 Cathy Garden 배포 전 보안 점검 결과와 남은 운영 확인 항목을 정리합니다.

비밀번호, 세션 쿠키, AWS 접근 키, presigned URL, 개인 이메일, 파일 원본 경로 같은 민감값은 문서, 테스트 fixture, 로그에 남기지 않습니다.

## 확인한 항목

- `/library`, `/upload`, `/media/[id]`는 서버 레이아웃에서 인증을 요구한다.
- `/api/upload/presign`, `/api/media/complete`, `/api/media/[id]`는 인증되지 않은 요청에 `401`을 반환한다.
- 로그인 redirect는 내부 경로만 허용하고 외부 URL 또는 `//` 경로를 기본 보관함 경로로 대체한다.
- 비밀번호와 세션 쿠키 값 비교는 timing-safe 비교를 사용한다.
- 세션 쿠키는 `httpOnly`, `sameSite: "lax"`, production `secure` 속성을 사용한다.
- S3 presigned URL은 서버 응답에는 포함되지만 서버 로그에는 남기지 않는다.
- 원본 에러 객체는 로그에 남기지 않고, 필요한 경우 안전한 에러 이름만 기록한다.

## 수정한 항목

- presigned upload 발급 실패 로그에서 원본 AWS 에러 객체를 제거했다.
- 레거시 Kakao/axios 유틸의 원본 에러 로그를 제거했다.

## 비인가 접근 차단 확인

- 보호 페이지는 `src/app/(private)/layout.tsx`에서 `requireAuthenticatedSession()`을 호출한다.
- 보호 대상 경로는 `lib/auth.ts`의 `PROTECTED_PATH_PREFIXES`에 `/library`, `/upload`, `/media`로 등록되어 있다.
- 보호 API는 요청 처리 시작 시 `isAuthenticated()`를 확인하고 실패 시 `401`과 `unauthorized` error code를 반환한다.
- `tests/agent/unauthorized-access-guard.test.ts`가 이 계약을 고정한다.

## 남은 운영 확인

- Vercel production 환경에서 `CATHY_GARDEN_AUTH_SECRET`이 비밀번호와 별도 값으로 설정되어 있는지 확인한다.
- Vercel 로그에서 password, cookie, AWS key, presigned URL, 개인 이메일이 출력되지 않는지 확인한다.
- S3 bucket은 public access block을 유지한다.
- IAM key는 이 앱 전용 최소 권한 key를 사용한다.
- 운영 도메인만 S3 CORS origin에 등록한다.
