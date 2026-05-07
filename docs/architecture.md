# Cathy Garden 아키텍처 문서

## 개요

현재 Cathy Garden 저장소는 `Next.js` 기반의 새 앱 골격과, 아직 일부 남아 있는 레거시 CRA 코드를 함께 가지고 있는 전환 중간 상태입니다.

핵심 방향은 다음과 같습니다.

- 런타임 기준 앱은 `Next.js + App Router`
- 배포 대상은 `Vercel`
- 파일 저장소는 향후 `Amazon S3`
- 기존 CRA 코드는 마이그레이션이 끝날 때까지 제한적으로 보존

이전의 블록체인용 `contract/` 워크스페이스는 현재 제품 목표와 맞지 않아 제거되었습니다.

## 현재 전체 구조

```text
/
├── src/
│   ├── app/             # Next.js App Router
│   ├── legacy-pages/    # 기존 CRA 페이지 코드
│   ├── common/          # 레거시 공통 유틸/상수/상태
│   ├── components/      # 레거시 컴포넌트
│   └── setupTests.ts    # CRA/Jest 테스트 초기화
├── components/          # 새 Next.js 공용 컴포넌트
├── public/              # 정적 리소스
├── tests/
│   ├── agent/           # 에이전트 테스트
│   └── human/
├── docs/                # 제품/설계/전환 문서
├── next.config.ts
├── craco.config.ts
├── tsconfig.json
└── package.json
```

## 런타임 아키텍처

### 메인 앱 구조

현재 실행 기준 메인 앱은 `Next.js`입니다.

관련 파일:

- [package.json](/Users/inbrew/Desktop/cathy-garden/package.json)
- [next.config.ts](/Users/inbrew/Desktop/cathy-garden/next.config.ts)
- [src/app/layout.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/layout.tsx)
- [src/app/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/page.tsx)

현재 실행 스크립트:

- `yarn dev` -> `next dev`
- `yarn build` -> `next build`
- `yarn start` -> `next start`

레거시 CRA 실행 스크립트는 완전 제거 전까지 아래 이름으로만 유지됩니다.

- `yarn legacy:start`
- `yarn legacy:build`
- `yarn legacy:test`

### App Router

새 앱 라우트는 `src/app/` 아래에 구성되어 있습니다.

현재 라우트:

- `/` -> 홈
- `/login` -> 로그인 골격
- `/library` -> 보관함 골격
- `/upload` -> 업로드 골격
- `/media/[id]` -> 미디어 상세 골격

관련 파일:

- [src/app/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/page.tsx)
- [src/app/login/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/login/page.tsx)
- [src/app/library/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/library/page.tsx)
- [src/app/upload/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/upload/page.tsx)
- [src/app/media/[id]/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/media/[id]/page.tsx)

현재는 기능 구현보다 골격과 정보 구조를 먼저 올린 상태입니다.

## 새 UI 레이어

새 `Next.js` 레이어의 공용 컴포넌트는 루트 `components/`에 있습니다.

관련 파일:

- [components/app-shell.tsx](/Users/inbrew/Desktop/cathy-garden/components/app-shell.tsx)
- [components/site-header.tsx](/Users/inbrew/Desktop/cathy-garden/components/site-header.tsx)
- [components/hero-section.tsx](/Users/inbrew/Desktop/cathy-garden/components/hero-section.tsx)
- [components/section-card.tsx](/Users/inbrew/Desktop/cathy-garden/components/section-card.tsx)
- [src/app/globals.css](/Users/inbrew/Desktop/cathy-garden/src/app/globals.css)

현재 특징:

- 전원주택/정원 이미지 톤 반영
- 따뜻한 배경색과 카드 중심 레이아웃
- 모바일 우선의 단순한 정보 구조
- SaaS 대시보드보다 개인용 아카이브 분위기 강조

## 레거시 CRA 레이어

기존 CRA 코드는 아직 완전히 제거되지 않았고, `src/legacy-pages/`로 이동해 보존 중입니다.

관련 파일:

- [src/App.tsx](/Users/inbrew/Desktop/cathy-garden/src/App.tsx)
- [src/legacy-pages/Login.tsx](/Users/inbrew/Desktop/cathy-garden/src/legacy-pages/Login.tsx)
- [src/legacy-pages/Callback.tsx](/Users/inbrew/Desktop/cathy-garden/src/legacy-pages/Callback.tsx)
- [src/legacy-pages/Garden.tsx](/Users/inbrew/Desktop/cathy-garden/src/legacy-pages/Garden.tsx)
- [craco.config.ts](/Users/inbrew/Desktop/cathy-garden/craco.config.ts)

이 레이어는 현재 두 가지 이유로 남아 있습니다.

- 기존 로그인/정원 흐름을 참고하기 위한 보존
- 테스트 환경과 단계적 전환을 위한 완충 지대

장기적으로는 제거 대상입니다.

## 상태 관리

레거시 영역에서는 여전히 `Recoil`이 남아 있습니다.

관련 파일:

- [src/common/recoil/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/kakao.ts)
- [src/common/recoil/loading.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/loading.ts)
- [src/common/recoil/tabSelect.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/tabSelect.ts)

현재 판단:

- 이 상태 관리는 새 `Next.js` 구조의 목표 아키텍처와는 맞지 않습니다.
- 인증과 서버 데이터는 점차 서버 중심 구조로 옮겨야 합니다.
- Recoil은 전환 완료 전 제거 후보입니다.

## 인증 구조

현재 실제 구현은 여전히 레거시 Kakao OAuth 흐름에 있습니다.

관련 파일:

- [src/common/utils/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/utils/kakao.ts)
- [src/legacy-pages/Login.tsx](/Users/inbrew/Desktop/cathy-garden/src/legacy-pages/Login.tsx)
- [src/legacy-pages/Callback.tsx](/Users/inbrew/Desktop/cathy-garden/src/legacy-pages/Callback.tsx)

현재 한계:

- 브라우저 중심 인증
- 브라우저 저장소 기반 로그인 상태
- 서버 세션 없음

목표 방향:

- private gate 또는 서버 기반 OAuth로 재설계

## 스토리지 및 데이터 계층

아직 실제 `S3` 연동이나 데이터베이스는 구현되지 않았습니다.

현재 없는 것:

- S3 presigned URL 발급 API
- 업로드 완료 처리 API
- 파일 메타데이터 저장소
- 사용자/파일 DB 스키마

즉, 현재 저장소는 앱 골격과 테스트 기반은 마련되었지만, 실제 미디어 서비스 기능은 아직 올라가지 않은 상태입니다.

## 테스트 구조

테스트는 현재 `tests/agent/`를 기준으로 운영됩니다.

관련 파일:

- [tests/agent/route-constants.test.ts](/Users/inbrew/Desktop/cathy-garden/tests/agent/route-constants.test.ts)
- [tests/agent/project-docs.test.ts](/Users/inbrew/Desktop/cathy-garden/tests/agent/project-docs.test.ts)
- [tests/agent/next-app-skeleton.test.ts](/Users/inbrew/Desktop/cathy-garden/tests/agent/next-app-skeleton.test.ts)

현재 테스트 목적:

- 전환 문서 기준선 유지
- 라우트 상수 유지
- `Next.js` 앱 골격 유지

테스트 실행:

- `yarn test`

## 현재 아키텍처의 성격

현재 이 저장소는 완성된 서비스가 아니라, 다음 단계로 넘어가기 위한 기반을 갖춘 전환 중간 상태입니다.

정리하면 다음과 같습니다.

- `Next.js` 런타임 골격은 준비됨
- 레거시 CRA 코드는 일부 남아 있음
- 블록체인 워크스페이스는 제거됨
- 테스트 환경은 정상화됨
- 실제 인증/S3/DB 기능은 아직 미구현

## 현재 남아 있는 제약

### 레거시 코드 공존

`Next.js` 골격과 CRA 잔존 코드가 함께 있으므로 구조가 아직 완전히 단순하지 않습니다.

### 미완성 인증

로그인 경로는 존재하지만, 실제 private gate나 서버 세션은 아직 구현되지 않았습니다.

### 업로드 기능 미구현

보관함 서비스의 핵심인 S3 업로드와 메타데이터 저장이 아직 없습니다.

### 레거시 UI 흔적

일부 상태 및 컴포넌트에는 NFT 방향 흔적이 남아 있습니다.

## 다음에 우선 볼 파일

다음 구현 단계에서 먼저 볼 파일은 아래 순서가 효율적입니다.

1. [src/app/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/page.tsx)
2. [src/app/library/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/library/page.tsx)
3. [src/app/upload/page.tsx](/Users/inbrew/Desktop/cathy-garden/src/app/upload/page.tsx)
4. [components/app-shell.tsx](/Users/inbrew/Desktop/cathy-garden/components/app-shell.tsx)
5. [package.json](/Users/inbrew/Desktop/cathy-garden/package.json)
6. [tsconfig.json](/Users/inbrew/Desktop/cathy-garden/tsconfig.json)
7. [tests/agent/next-app-skeleton.test.ts](/Users/inbrew/Desktop/cathy-garden/tests/agent/next-app-skeleton.test.ts)

## 요약

현재 Cathy Garden 저장소는:

- `Next.js App Router` 골격을 가진 새 런타임 구조
- 일부 레거시 CRA 코드를 보존한 전환 상태
- 전원주택/정원 중심 UI 방향을 반영한 새 화면 골격
- 블록체인 워크스페이스를 제거한 개인용 미디어 보관함 전용 저장소

즉 이제부터의 핵심 작업은 구조 정리가 아니라, 인증, 업로드, 보관함 기능을 새 골격 위에 실제로 쌓아 올리는 것입니다.
