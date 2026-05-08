# Phase 10. 비용 점검

## 목적

이 문서는 Cathy Garden의 운영 비용이 예상 가능한 범위에 머물도록 확인한 항목과 운영 중 확인해야 할 항목을 정리합니다.

정확한 단가는 변동될 수 있으므로 배포 전에는 AWS와 Vercel의 공식 가격 페이지를 다시 확인합니다.

## 현재 비용 구조

- 원본 사진/영상은 S3에 저장한다.
- 앱 서버는 파일 본문을 중계하지 않고 presigned URL만 발급한다.
- 브라우저가 S3로 직접 업로드하므로 Vercel 함수에는 파일 크기만큼의 업로드 트래픽이 지나가지 않는다.
- 보관함 metadata는 별도 DB 없이 S3 manifest object 하나로 관리한다.
- 이미지 상세/목록 미리보기는 S3 signed GET URL을 사용하므로 반복 조회 시 S3 GET 요청과 data transfer out이 발생한다.

## 비용 통제 기준

- 단일 파일 업로드 한도는 `MAX_UPLOAD_SIZE_BYTES`로 제한한다.
- 허용 MIME type은 사진/영상 파일로 제한한다.
- 업로드 object key는 `uploads/...` prefix 아래로만 생성한다.
- manifest는 `manifests/media-index.json` 한 object로 유지한다.
- 서버에서 원본 파일을 base64 변환하거나 Vercel 응답 body로 프록시하지 않는다.
- 자동 썸네일 생성, 이미지 최적화, 공유 링크, 검색 인덱스는 도입 전 별도 비용 검토를 한다.

## AWS 확인 항목

- S3 Standard 저장 용량, 요청, data transfer out 단가를 확인한다.
- AWS Budgets에서 월간 비용 알림을 설정한다.
- S3 Storage Lens free metrics로 bucket/prefix 성장 추이를 확인한다.
- 장기 보관 정책이 필요해지면 S3 Lifecycle transition 또는 archive storage class를 별도 검토한다.
- multipart upload를 도입하면 incomplete multipart upload abort lifecycle rule을 추가한다.

## Vercel 확인 항목

- Hobby/Pro plan의 포함 사용량과 초과 과금 기준을 확인한다.
- Functions invocation, active CPU, fast data transfer, edge requests 사용량을 모니터링한다.
- 서버가 원본 파일을 프록시하지 않는 구조를 유지한다.
- 사용량 알림 또는 spend management를 켠다.

## 운영 체크 절차

1. S3 bucket의 `uploads/` prefix 총 용량을 확인한다.
2. 최근 7일 S3 GET/PUT/DELETE 요청량과 data transfer out을 확인한다.
3. Vercel usage dashboard에서 함수 호출과 전송량이 개인용 사용량 범위인지 확인한다.
4. 예상보다 빠르게 증가하는 prefix나 비정상 반복 조회가 없는지 확인한다.
5. 비용 알림이 받을 수 있는 이메일로 설정되어 있는지 확인한다.

## 현재 결론

현재 개인 1인용 MVP 기준에서는 `S3 direct upload + manifest metadata + upload size cap` 구조가 비용 통제에 적합하다.

다만 원본 이미지/동영상은 누적 저장 용량과 반복 다운로드가 비용의 핵심이므로, 운영 시작 후 AWS Budgets와 Vercel usage alert를 반드시 켜야 한다.
