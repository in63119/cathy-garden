# Phase 10. 스토리지 연동 확인

## 목적

이 문서는 Cathy Garden의 S3 스토리지 연동이 배포 환경에서 동작하기 위해 필요한 확인 항목을 정리합니다.

비밀값, 접근 키, presigned URL은 문서나 로그에 남기지 않습니다.

## 현재 연동 구조

- 원본 파일은 S3 `uploads/...` prefix에 저장한다.
- 메타데이터는 S3 manifest object인 `manifests/media-index.json`에 저장한다.
- 브라우저는 `/api/upload/presign`에서 발급한 presigned PUT URL로 S3에 직접 업로드한다.
- 업로드 완료 후 `/api/media/complete`가 manifest에 항목을 추가한다.
- 보관함과 상세 페이지는 manifest를 읽고, 상세/미리보기에는 presigned GET URL을 사용한다.
- presigned PUT/GET URL 만료시간은 `PRESIGNED_URL_EXPIRES_IN_SECONDS` 기준 300초다.

## 환경변수 확인

Vercel 환경에는 다음 값이 등록되어 있어야 한다.

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_MEDIA_MANIFEST_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

확인 기준:

- 값이 비어 있지 않다.
- `AWS_S3_MEDIA_MANIFEST_KEY`는 기본값과 동일한 `manifests/media-index.json` 또는 명시적으로 결정한 manifest key다.
- 운영 로그, 문서, 테스트 fixture에는 실제 값이 남아 있지 않다.

## S3 권한 확인

앱이 사용하는 IAM principal에는 최소한 다음 권한이 필요하다.

- `s3:PutObject` on `uploads/*`
- `s3:GetObject` on `uploads/*`
- `s3:DeleteObject` on `uploads/*`
- `s3:GetObject` on manifest object
- `s3:PutObject` on manifest object

manifest 갱신은 ETag 조건부 쓰기를 사용하므로 `GetObject`와 `PutObject`가 모두 필요하다.

## CORS 확인

브라우저 직접 업로드를 위해 S3 bucket CORS는 배포 도메인에서 다음 요청을 허용해야 한다.

- Method: `PUT`
- Allowed headers: `Content-Type`
- Allowed origin: Vercel production domain

개발 환경 smoke test를 실행할 때만 localhost origin을 임시로 허용한다.

## 기능 확인 절차

1. 로그인 후 `/upload`에서 작은 이미지 1개를 업로드한다.
2. 업로드 진행률이 표시되고 완료 후 `/library`로 이동하는지 확인한다.
3. S3 bucket의 `uploads/...` prefix에 원본 object가 생성됐는지 확인한다.
4. `manifests/media-index.json`에 새 entry가 추가됐는지 확인한다.
5. `/library`에서 새 항목이 보이고, `/media/[id]` 상세 페이지에서 signed preview가 열리는지 확인한다.
6. 삭제 버튼을 실행한 뒤 원본 object와 manifest entry가 함께 제거되는지 확인한다.

## 자동 테스트 범위

`tests/agent/s3-integration-contract.test.ts`는 다음 계약을 검증한다.

- S3 연동에 필요한 환경변수가 누락되면 명시적으로 실패한다.
- presigned upload는 S3 `PutObjectCommand`를 사용한다.
- 업로드 object key는 `uploads/...` prefix 아래에 생성된다.
- presigned upload/download URL 만료 시간은 업로드 정책의 300초 상수와 일치한다.

이 테스트는 실제 AWS 네트워크 호출을 하지 않는다. 실제 bucket, IAM, CORS는 위 기능 확인 절차로 별도 smoke test가 필요하다.
