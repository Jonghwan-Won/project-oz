BEGIN;
SET LOCAL lock_timeout = '5s';

COMMENT ON TABLE public."Asset" IS '첨부파일 메타데이터';
COMMENT ON COLUMN public."Asset"."id" IS '고유 식별자';
COMMENT ON COLUMN public."Asset"."storageKey" IS '저장소 상대 경로';
COMMENT ON COLUMN public."Asset"."originalName" IS '원본 파일명';
COMMENT ON COLUMN public."Asset"."mimeType" IS '파일 MIME 유형';
COMMENT ON COLUMN public."Asset"."byteSize" IS '파일 크기(바이트)';
COMMENT ON COLUMN public."Asset"."width" IS '이미지 너비(픽셀)';
COMMENT ON COLUMN public."Asset"."height" IS '이미지 높이(픽셀)';
COMMENT ON COLUMN public."Asset"."uploadedById" IS '업로드한 작성자 ID';
COMMENT ON COLUMN public."Asset"."createdAt" IS '생성 시각';

COMMENT ON TABLE public."AuthAccount" IS '외부 로그인 계정';
COMMENT ON COLUMN public."AuthAccount"."id" IS '고유 식별자';
COMMENT ON COLUMN public."AuthAccount"."accountId" IS '공급자 계정 ID';
COMMENT ON COLUMN public."AuthAccount"."providerId" IS '로그인 공급자 ID';
COMMENT ON COLUMN public."AuthAccount"."userId" IS '인증 사용자 ID';
COMMENT ON COLUMN public."AuthAccount"."accessToken" IS '접근 토큰(암호화 저장)';
COMMENT ON COLUMN public."AuthAccount"."refreshToken" IS '갱신 토큰(암호화 저장)';
COMMENT ON COLUMN public."AuthAccount"."idToken" IS '공급자 ID 토큰';
COMMENT ON COLUMN public."AuthAccount"."accessTokenExpiresAt" IS '접근 토큰 만료 시각';
COMMENT ON COLUMN public."AuthAccount"."refreshTokenExpiresAt" IS '갱신 토큰 만료 시각';
COMMENT ON COLUMN public."AuthAccount"."scope" IS '인증 권한 범위';
COMMENT ON COLUMN public."AuthAccount"."password" IS '비밀번호 인증용 값';
COMMENT ON COLUMN public."AuthAccount"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."AuthAccount"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."AuthSession" IS '로그인 세션';
COMMENT ON COLUMN public."AuthSession"."id" IS '고유 식별자';
COMMENT ON COLUMN public."AuthSession"."userId" IS '인증 사용자 ID';
COMMENT ON COLUMN public."AuthSession"."token" IS '세션 토큰';
COMMENT ON COLUMN public."AuthSession"."expiresAt" IS '만료 시각';
COMMENT ON COLUMN public."AuthSession"."ipAddress" IS '접속 IP 주소';
COMMENT ON COLUMN public."AuthSession"."userAgent" IS '접속 클라이언트 정보';
COMMENT ON COLUMN public."AuthSession"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."AuthSession"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."AuthUser" IS '인증 사용자';
COMMENT ON COLUMN public."AuthUser"."id" IS '고유 식별자';
COMMENT ON COLUMN public."AuthUser"."name" IS '사용자 이름';
COMMENT ON COLUMN public."AuthUser"."email" IS '이메일 주소';
COMMENT ON COLUMN public."AuthUser"."emailVerified" IS '이메일 인증 여부';
COMMENT ON COLUMN public."AuthUser"."image" IS '프로필 이미지 URL';
COMMENT ON COLUMN public."AuthUser"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."AuthUser"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."AuthVerification" IS '인증 검증 정보';
COMMENT ON COLUMN public."AuthVerification"."id" IS '고유 식별자';
COMMENT ON COLUMN public."AuthVerification"."identifier" IS '검증 대상 식별자';
COMMENT ON COLUMN public."AuthVerification"."value" IS '검증 값';
COMMENT ON COLUMN public."AuthVerification"."expiresAt" IS '만료 시각';
COMMENT ON COLUMN public."AuthVerification"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."AuthVerification"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."CommonCode" IS '공통코드';
COMMENT ON COLUMN public."CommonCode"."groupKey" IS '소속 공통코드 그룹 키';
COMMENT ON COLUMN public."CommonCode"."code" IS '공통코드 값';
COMMENT ON COLUMN public."CommonCode"."nameKo" IS '한국어 표시명';
COMMENT ON COLUMN public."CommonCode"."nameEn" IS '영어 표시명';
COMMENT ON COLUMN public."CommonCode"."position" IS '표시 순서';
COMMENT ON COLUMN public."CommonCode"."isActive" IS '사용 여부';
COMMENT ON COLUMN public."CommonCode"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."CommonCode"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."CommonCodeGroup" IS '공통코드 그룹';
COMMENT ON COLUMN public."CommonCodeGroup"."key" IS '공통코드 그룹 키';
COMMENT ON COLUMN public."CommonCodeGroup"."nameKo" IS '한국어 표시명';
COMMENT ON COLUMN public."CommonCodeGroup"."nameEn" IS '영어 표시명';
COMMENT ON COLUMN public."CommonCodeGroup"."description" IS '그룹 설명';
COMMENT ON COLUMN public."CommonCodeGroup"."isActive" IS '사용 여부';
COMMENT ON COLUMN public."CommonCodeGroup"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."CommonCodeGroup"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."Inquiry" IS '접수된 문의';
COMMENT ON COLUMN public."Inquiry"."id" IS '고유 식별자';
COMMENT ON COLUMN public."Inquiry"."typeGroup" IS '유형 공통코드 그룹';
COMMENT ON COLUMN public."Inquiry"."typeCode" IS '유형 코드';
COMMENT ON COLUMN public."Inquiry"."statusGroup" IS '상태 공통코드 그룹';
COMMENT ON COLUMN public."Inquiry"."statusCode" IS '상태 코드';
COMMENT ON COLUMN public."Inquiry"."body" IS '본문';
COMMENT ON COLUMN public."Inquiry"."createdById" IS '등록한 작성자 ID';
COMMENT ON COLUMN public."Inquiry"."updatedById" IS '수정한 작성자 ID';
COMMENT ON COLUMN public."Inquiry"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."Inquiry"."updatedAt" IS '수정 시각';

COMMENT ON TABLE public."Post" IS '게시글';
COMMENT ON COLUMN public."Post"."id" IS '고유 식별자';
COMMENT ON COLUMN public."Post"."slug" IS '고유 URL 식별자';
COMMENT ON COLUMN public."Post"."category" IS '게시글 카테고리 코드';
COMMENT ON COLUMN public."Post"."isVisible" IS '공개 여부';
COMMENT ON COLUMN public."Post"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."Post"."updatedAt" IS '수정 시각';
COMMENT ON COLUMN public."Post"."deletedAt" IS '논리 삭제 시각';
COMMENT ON COLUMN public."Post"."version" IS '수정 충돌 확인 버전';
COMMENT ON COLUMN public."Post"."categoryGroup" IS '게시글 카테고리 그룹';

COMMENT ON TABLE public."PostAsset" IS '게시글 첨부 연결';
COMMENT ON COLUMN public."PostAsset"."postId" IS '게시글 ID';
COMMENT ON COLUMN public."PostAsset"."assetId" IS '첨부파일 ID';

COMMENT ON TABLE public."PostTranslation" IS '게시글 언어별 내용';
COMMENT ON COLUMN public."PostTranslation"."postId" IS '게시글 ID';
COMMENT ON COLUMN public."PostTranslation"."locale" IS '언어 코드(ko/en)';
COMMENT ON COLUMN public."PostTranslation"."title" IS '제목';
COMMENT ON COLUMN public."PostTranslation"."summary" IS '요약';
COMMENT ON COLUMN public."PostTranslation"."body" IS '본문';
COMMENT ON COLUMN public."PostTranslation"."bodySchemaVersion" IS '본문 문서 형식 버전';

COMMENT ON TABLE public."Project" IS '프로젝트';
COMMENT ON COLUMN public."Project"."id" IS '고유 식별자';
COMMENT ON COLUMN public."Project"."slug" IS '고유 URL 식별자';
COMMENT ON COLUMN public."Project"."originGroup" IS '작업 구분 공통코드 그룹';
COMMENT ON COLUMN public."Project"."originCode" IS '작업 구분 코드';
COMMENT ON COLUMN public."Project"."typeGroup" IS '유형 공통코드 그룹';
COMMENT ON COLUMN public."Project"."typeCode" IS '유형 코드';
COMMENT ON COLUMN public."Project"."lifecycle" IS '프로젝트 진행 단계';
COMMENT ON COLUMN public."Project"."placeholder" IS '임시 콘텐츠 여부';
COMMENT ON COLUMN public."Project"."startedOn" IS '시작일';
COMMENT ON COLUMN public."Project"."endedOn" IS '종료일';
COMMENT ON COLUMN public."Project"."createdById" IS '등록한 작성자 ID';
COMMENT ON COLUMN public."Project"."updatedById" IS '수정한 작성자 ID';
COMMENT ON COLUMN public."Project"."createdAt" IS '생성 시각';
COMMENT ON COLUMN public."Project"."updatedAt" IS '수정 시각';
COMMENT ON COLUMN public."Project"."version" IS '수정 충돌 확인 버전';
COMMENT ON COLUMN public."Project"."thumbnailUrl" IS '썸네일 URL';
COMMENT ON COLUMN public."Project"."customerName" IS '고객사명';
COMMENT ON COLUMN public."Project"."deletedAt" IS '논리 삭제 시각';
COMMENT ON COLUMN public."Project"."isVisible" IS '공개 여부';

COMMENT ON TABLE public."ProjectAsset" IS '프로젝트 첨부 연결';
COMMENT ON COLUMN public."ProjectAsset"."id" IS '고유 식별자';
COMMENT ON COLUMN public."ProjectAsset"."projectId" IS '프로젝트 ID';
COMMENT ON COLUMN public."ProjectAsset"."assetId" IS '첨부파일 ID';
COMMENT ON COLUMN public."ProjectAsset"."usage" IS '첨부 용도';
COMMENT ON COLUMN public."ProjectAsset"."position" IS '표시 순서';
COMMENT ON COLUMN public."ProjectAsset"."label" IS '첨부 표시명';

COMMENT ON TABLE public."ProjectTag" IS '프로젝트 태그 연결';
COMMENT ON COLUMN public."ProjectTag"."projectId" IS '프로젝트 ID';
COMMENT ON COLUMN public."ProjectTag"."tagId" IS '태그 ID';
COMMENT ON COLUMN public."ProjectTag"."position" IS '표시 순서';

COMMENT ON TABLE public."ProjectTranslation" IS '프로젝트 언어별 내용';
COMMENT ON COLUMN public."ProjectTranslation"."projectId" IS '프로젝트 ID';
COMMENT ON COLUMN public."ProjectTranslation"."locale" IS '언어 코드(ko/en)';
COMMENT ON COLUMN public."ProjectTranslation"."title" IS '제목';
COMMENT ON COLUMN public."ProjectTranslation"."summary" IS '요약';
COMMENT ON COLUMN public."ProjectTranslation"."body" IS '본문';
COMMENT ON COLUMN public."ProjectTranslation"."bodySchemaVersion" IS '본문 문서 형식 버전';

COMMENT ON TABLE public."Tag" IS '프로젝트 태그';
COMMENT ON COLUMN public."Tag"."id" IS '고유 식별자';
COMMENT ON COLUMN public."Tag"."kind" IS '태그 종류';
COMMENT ON COLUMN public."Tag"."slug" IS '고유 URL 식별자';
COMMENT ON COLUMN public."Tag"."name" IS '사용자 이름';

COMMENT ON TABLE public."User" IS '콘텐츠 작성자';
COMMENT ON COLUMN public."User"."id" IS '고유 식별자';
COMMENT ON COLUMN public."User"."displayName" IS '작성자 표시명';
COMMENT ON COLUMN public."User"."createdAt" IS '생성 시각';

COMMENT ON TABLE public."_prisma_migrations" IS 'Prisma 마이그레이션 이력';
COMMENT ON COLUMN public."_prisma_migrations"."id" IS '고유 식별자';
COMMENT ON COLUMN public."_prisma_migrations"."checksum" IS '마이그레이션 파일 체크섬';
COMMENT ON COLUMN public."_prisma_migrations"."finished_at" IS '적용 완료 시각';
COMMENT ON COLUMN public."_prisma_migrations"."migration_name" IS '마이그레이션 이름';
COMMENT ON COLUMN public."_prisma_migrations"."logs" IS '마이그레이션 실행 로그';
COMMENT ON COLUMN public."_prisma_migrations"."rolled_back_at" IS '롤백 처리 시각';
COMMENT ON COLUMN public."_prisma_migrations"."started_at" IS '적용 시작 시각';
COMMENT ON COLUMN public."_prisma_migrations"."applied_steps_count" IS '적용된 단계 수';

COMMIT;
