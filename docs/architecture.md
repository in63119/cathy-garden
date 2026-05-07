# Cathy Garden 아키텍처 문서

## 개요

현재 이 프로젝트는 크게 두 부분으로 나뉘어 있습니다.

- `Create React App`(`react-scripts`)와 `CRACO` 기반의 프론트엔드 웹앱
- `contract/` 아래에 분리된 `Hardhat` 기반 블록체인 워크스페이스

프론트엔드는 Kakao 로그인과 정원 페이지 중심의 작은 React SPA이며, 블록체인 워크스페이스는 런타임에서 직접 연결되지는 않습니다. 다만 UI와 상태 구조에는 과거 NFT 방향의 흔적이 아직 남아 있습니다.

## 전체 구조

```text
/
├── src/                  # React 애플리케이션 소스
├── public/               # CRA가 제공하는 정적 리소스
├── contract/             # 별도 Hardhat 프로젝트
├── craco.config.ts       # webpack alias 설정
├── package.json          # 프론트엔드 의존성 및 스크립트
└── tsconfig.json         # 프론트엔드 TypeScript 설정
```

## 프론트엔드 아키텍처

### 사용 기술

- `React 18`
- `TypeScript`
- `react-router-dom`
- `Recoil`
- `MUI`
- `axios`
- `CRACO`

현재 프론트엔드는 브라우저에서 동작하는 클라이언트 렌더링 SPA입니다. 라우팅, 인증 상태, 네비게이션이 모두 브라우저 안에서 처리됩니다.

### 진입점

애플리케이션의 시작점은 [src/index.tsx](/Users/inbrew/Desktop/cathy-garden/src/index.tsx)입니다.

여기서 수행하는 역할은 다음과 같습니다.

- 최상위에 `RecoilRoot` 등록
- `React.StrictMode` 적용
- `App`를 루트 애플리케이션 셸로 마운트

### 앱 셸과 라우팅

메인 라우터는 [src/App.tsx](/Users/inbrew/Desktop/cathy-garden/src/App.tsx)에 정의되어 있습니다.

현재 등록된 라우트는 다음과 같습니다.

- `/` -> `/login`으로 리다이렉트
- `/login` -> 로그인 페이지
- `/callback` -> Kakao OAuth 콜백 처리
- `/house/garden` -> 메인 정원 페이지

공통 레이아웃 요소는 다음과 같습니다.

- [src/components/Header.tsx](/Users/inbrew/Desktop/cathy-garden/src/components/Header.tsx): 항상 렌더링되는 상단 헤더
- [src/components/Loading.tsx](/Users/inbrew/Desktop/cathy-garden/src/components/Loading.tsx): 전역 로딩 상태에 따라 표시되는 로딩 컴포넌트

라우트 상수는 [src/common/constants/page-urls.ts](/Users/inbrew/Desktop/cathy-garden/src/common/constants/page-urls.ts)에 모여 있습니다.

### 상태 관리

전역 상태는 `Recoil`로 관리하고 있으며, 일부 atom은 `recoil-persist`를 통해 브라우저 저장소에 유지됩니다.

현재 주요 atom은 다음과 같습니다.

- [src/common/recoil/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/kakao.ts)
  - `kakaoEmail`, `kakaoId`, `isLogin` 저장
- [src/common/recoil/loading.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/loading.ts)
  - 전역 로딩 여부 저장
- [src/common/recoil/tabSelect.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/tabSelect.ts)
  - 현재 선택된 탭 저장, 기본값은 `NFT`

이 구조 때문에 현재 로그인 상태는 서버 세션이 아니라 브라우저 저장소에 의존합니다.

### 인증 흐름

현재 인증은 전적으로 클라이언트 중심의 Kakao OAuth 흐름으로 구성되어 있습니다.

관련 파일:

- [src/pages/Login.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Login.tsx)
- [src/pages/Callback.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Callback.tsx)
- [src/common/utils/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/utils/kakao.ts)

현재 동작 흐름:

1. 로그인 페이지에서 Kakao 인증 페이지로 이동
2. Kakao가 `/callback`으로 인증 코드를 포함해 리다이렉트
3. 클라이언트가 인증 코드로 액세스 토큰 요청
4. 클라이언트가 Kakao 사용자 정보 조회
5. 조회한 사용자 정보를 Recoil 및 브라우저 저장소에 저장
6. 다시 인트로 경로로 이동하고, 앱 내부 흐름으로 진입

중요한 특징:

- OAuth 토큰 교환과 사용자 조회가 서버가 아닌 브라우저에서 시작됩니다.

### 페이지 구성

#### 로그인 페이지

[src/pages/Login.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Login.tsx)는 다음을 렌더링합니다.

- 배경 이미지
- Kakao 로그인 버튼 이미지
- 이미 로그인된 경우 정원 페이지로 이동하는 로직

#### 콜백 페이지

[src/pages/Callback.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Callback.tsx)는 다음 역할을 담당합니다.

- URL의 `code` 쿼리 파라미터 읽기
- Kakao API를 통한 인증 처리
- 사용자 정보를 전역 상태에 저장

#### 정원 페이지

[src/pages/Garden.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Garden.tsx)는 로그인 이후의 메인 페이지입니다.

이 페이지는 다음을 수행합니다.

- `isLogin` 플래그를 기준으로 접근 여부 확인
- 로그인되지 않은 경우 인트로 경로로 리다이렉트
- 브랜드 배경 이미지 렌더링
- 탭 선택 컴포넌트 표시

#### 탭 네비게이션

[src/components/TabSelector.tsx](/Users/inbrew/Desktop/cathy-garden/src/components/TabSelector.tsx)는 과거 블록체인/NFT 방향의 UI 흔적을 그대로 가지고 있습니다.

현재 탭:

- `NFT`
- `Mint`
- `Market`

이 컴포넌트는 선택된 탭을 Recoil에 저장하고 탭 값으로 라우팅을 시도하지만, 실제 메인 라우터에는 대응되는 페이지가 정의되어 있지 않습니다.

### 네트워크 계층

HTTP 유틸은 [src/common/utils/axios.ts](/Users/inbrew/Desktop/cathy-garden/src/common/utils/axios.ts)에 있습니다.

현재 특징:

- `axios.get`, `axios.post`를 감싼 얇은 래퍼
- 에러는 콘솔에만 출력
- 공통 API base URL 없음
- interceptor, 인증 헤더, 재시도, 응답 타입 관리 없음

### 정적 리소스와 브랜딩

정적 리소스는 두 군데에 나뉘어 있습니다.

- `public/`: CRA가 직접 제공하는 정적 파일
- `src/common/images/`: React 코드에서 import하는 이미지 파일

현재 브랜딩의 핵심은 다음과 같습니다.

- `Cathy Garden`
- Kakao 로그인 이미지
- 정원과 전원주택 중심의 비주얼 톤

## 프론트엔드 빌드 및 설정

### 실행 스크립트

루트 [package.json](/Users/inbrew/Desktop/cathy-garden/package.json)에 정의된 스크립트는 다음과 같습니다.

- `yarn start` -> `craco start`
- `yarn build` -> `craco build`
- `yarn test` -> `craco test`

즉 현재 구조는 백엔드가 통합된 프레임워크가 아니라, CRACO로 약간 확장된 전형적인 CRA 구조입니다.

### 경로 alias

[craco.config.ts](/Users/inbrew/Desktop/cathy-garden/craco.config.ts)에는 다음과 같은 webpack alias가 정의되어 있습니다.

- `@src`
- `@components`
- `@pages`
- `@common`
- `@recoil`
- `@images`
- `@utils`
- `@types`

같은 alias 체계가 [tsconfig.json](/Users/inbrew/Desktop/cathy-garden/tsconfig.json)에도 반영되어 있습니다.

## contract 워크스페이스 아키텍처

`contract/` 디렉터리는 별도의 `Hardhat` 프로젝트입니다. 루트 프론트엔드와는 독립적으로 의존성과 빌드 설정을 가집니다.

관련 파일:

- [contract/package.json](/Users/inbrew/Desktop/cathy-garden/contract/package.json)
- [contract/hardhat.config.ts](/Users/inbrew/Desktop/cathy-garden/contract/hardhat.config.ts)
- [contract/utils/deploy.ts](/Users/inbrew/Desktop/cathy-garden/contract/utils/deploy.ts)
- [contract/utils/upgrade.ts](/Users/inbrew/Desktop/cathy-garden/contract/utils/upgrade.ts)

현재 특징:

- `Hardhat` 사용
- `OpenZeppelin` 컨트랙트 사용
- `typechain` 바인딩 생성
- 배포 및 업그레이드 유틸 포함
- 생성된 artifact와 타입 바인딩이 저장소에 포함되어 있음

이 워크스페이스는 현재 사진/영상 보관함 방향보다는, 이전의 스마트 컨트랙트 중심 제품 방향을 반영하고 있습니다.

## 현재 아키텍처의 경계

현재 코드베이스는 아래 두 영역이 명확히 분리되어 있습니다.

- 브라우저 전용 프론트엔드 앱
- 별도 블록체인 툴링 워크스페이스

현재 없는 것:

- 통합 백엔드 애플리케이션
- 서버 기반 세션 관리
- 데이터베이스 계층
- 오브젝트 스토리지 연동
- 사진/영상 업로드 파이프라인
- 미디어 메타데이터 모델

## 현재 구조의 제약과 리스크

### 클라이언트 저장소 기반 인증 상태

로그인 상태가 브라우저 저장소에 유지됩니다. UI 수준의 간단한 접근 제어는 가능하지만, 서버가 검증하는 안전한 인증 구조는 아닙니다.

### 브라우저에서 수행되는 OAuth 처리

현재 Kakao 인증 흐름은 토큰 교환과 사용자 조회를 클라이언트에서 수행합니다. 개인용 서비스라 하더라도 운영 환경에서는 서버 처리 방식보다 경계가 약합니다.

### 라우트와 UI의 불일치

라우터에는 로그인, 콜백, 정원 페이지만 존재하지만, 탭 UI는 NFT 관련 다단계 흐름이 있는 것처럼 구성되어 있습니다. 현재 실제 기능 구조와 화면 구조가 어긋나 있습니다.

### 이중 프로젝트 구조로 인한 복잡성

루트 프론트엔드와 `contract/` 워크스페이스가 서로 다른 제품 방향을 담고 있습니다. 이 상태는 유지보수 비용을 높이고, 저장소의 목적을 흐리게 만듭니다.

## 이후 리팩터링 시 먼저 볼 파일

이 프로젝트를 개인용 사진/영상 보관함으로 전환하려면, 현재 기준에서 아래 파일부터 읽는 것이 가장 효율적입니다.

1. [src/App.tsx](/Users/inbrew/Desktop/cathy-garden/src/App.tsx)
2. [src/pages/Login.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Login.tsx)
3. [src/pages/Callback.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Callback.tsx)
4. [src/pages/Garden.tsx](/Users/inbrew/Desktop/cathy-garden/src/pages/Garden.tsx)
5. [src/common/utils/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/utils/kakao.ts)
6. [src/common/recoil/kakao.ts](/Users/inbrew/Desktop/cathy-garden/src/common/recoil/kakao.ts)
7. [contract/package.json](/Users/inbrew/Desktop/cathy-garden/contract/package.json)

## 요약

현재 이 저장소는 다음과 같이 설명할 수 있습니다.

- CRA 기반의 React SPA
- 브라우저 중심 Kakao OAuth와 Recoil persisted 상태를 사용하는 구조
- 정원/전원주택 중심의 비주얼 아이덴티티 보유
- 과거 블록체인/NFT 아키텍처의 흔적을 여전히 포함

즉 아직은 개인용 미디어 보관함을 위한 풀스택 구조는 아니며, 이 문서는 앞으로 `Next.js + Vercel + 오브젝트 스토리지` 구조로 전환하기 전의 기준선 문서 역할을 합니다.
