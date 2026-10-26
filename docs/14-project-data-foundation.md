# 프로젝트 데이터 기반 - 1차

## 2026-10-21 한국어·영어 콘텐츠 지원으로 변경

최신 정책은 한국어·영어 두 언어 지원이다. Project에는 공통 정보를, ProjectTranslation에는 locale(ko/en), title, summary, body, bodySchemaVersion을 저장한다. 아래 원문 단일 저장·번역 제거 기록은 당시 이력이며 이 정책으로 대체한다. 게시글 DB 도입 시에도 Post와 PostTranslation을 분리한다. 게시글 테이블·관리자 영어 입력·공개 화면 DB 조회·언어 버튼 변경은 아직 구현하지 않았다.


## 현재 범위

- 공통 코드 그룹/상세, 프로젝트/원문 내용, 태그/프로젝트 태그, 파일/프로젝트 파일, 작성자 참조용 최소 User 모델.
- 관리자 화면·인증·파일 업로드·공개 화면 DB 조회 연결은 2차다. 현재 화면은 기존 TS 데이터를 계속 사용한다.
- 게시글은 작성 원문을 저장한다. 게시글 번역 테이블을 만들지 않는다. posts 및 ideas의 실제 테이블과 연결은 각 기능 구현 시 추가한다.
- 프로젝트 제목·소개·본문은 작성 원문 한 벌만 Project에 저장한다. 번역 테이블과 영어 입력은 없다. 공통 코드 표시명만 ko/en으로 관리한다.

## 데이터와 제약

- 프로젝트 작업 구분은 PROJECT_ORIGIN, 유형은 PROJECT_TYPE 그룹만 참조할 수 있다. 복합 FK와 CHECK로 그룹 혼입과 없는 코드를 차단한다.
- 진행 상태는 enum이며, 프로젝트 노출 여부는 boolean `isVisible`이다. 코드 관리 화면에서 항목을 추가한다고 새로운 동작이 생기지 않는다.
- title/summary/body는 Project에 저장한다. body는 doc/content 구조의 JSONB이며 bodySchemaVersion으로 형식을 구분한다. 편집기 선정 시 전체 노드 검증과 안전한 렌더링을 구현해야 한다.
- 대표 이미지는 ProjectAsset의 COVER로 관리하며 부분 유일 인덱스로 프로젝트당 최대 1개를 보장한다. INLINE/ATTACHMENT도 같은 파일 테이블을 참조한다.
- 프로젝트 삭제 시 연결 행은 제거하지만 원본 파일과 태그는 남긴다. 사용 중인 파일/태그/코드/사용자는 FK로 삭제를 거부한다.
- 파일은 NAS 경로 자체가 아닌 상대 storageKey를 저장한다. 실제 파일 업로드·형식 검증·다운로드 접근 검사는 2차다.
- 최초 이관 데이터의 작성자는 확인하지 못했으므로 NULL이다. 가짜 관리자 계정을 만들지 않는다. 실제 관리자 저장 시 서버에서 작성자·수정자를 지정해야 한다.
- 작업 기간과 콘텐츠 생성 시각을 분리한다. 기존 자료에서 미제공한 기간·상태·기술은 추정하지 않는다. 진행 상태는 미상일 경우 NULL이다.
- version은 양수로 제한한다. 실제 수정은 2차에서 WHERE id/version 조건과 version 증가를 같은 UPDATE로 구현해야 한다.
- 공통 코드 비활성화는 기존 참조를 유지한다. 신규 선택 차단은 2차 저장 서비스에서 검사한다.

## 초기 데이터

npm run db:seed는 현재 소스의 프로젝트 원문 8개, 공통 코드 그룹 2개와 상세 4개를 등록한다. 기술·이미지·게시글은 임의로 추가하지 않는다.

전체 트랜잭션으로 실행하며 기존 slug/코드는 덮어쓰지 않는다. 재실행은 최초 이관된 내용을 갱신하지 않는다. 기존 소스 파일도 삭제하지 않는다.

## 개발 DB 적용

2026-10-21 적용 완료: oz_dev_admin 연결과 빈 개발 DB를 확인한 뒤 임시 스키마 통합 검사 → migrate deploy → seed 순으로 실행했다. 최초에는 언어별 내용을 포함한 테이블 9개를 생성했다. 후속 migration에서 한국어 원문을 Project로 이전하고 ProjectTranslation을 제거해 현재 애플리케이션 테이블은 8개다. 공통 코드 그룹 2개·상세 4개, 프로젝트 원문 8개를 유지한다. 앱 계정의 CREATE 권한은 변경하지 않았다.

.env.local의 MIGRATION_DATABASE_URL에 개발 DB migration 소유자 연결을 설정한다. 비밀번호·URL을 로그나 채팅에 출력하지 않는다. 운영 DB를 지정하지 않는다.

```powershell
npm run db:validate
npm run db:generate
npm run db:test
npm run db:migrate:deploy
npm run db:seed
```

- db:test는 migration 관리자 권한으로 고유한 oz_test_UUID 스키마를 생성하고 migration/seed/제약을 검사한 뒤 해당 스키마만 제거한다. public 데이터는 변경하지 않는다. 강제 종료하면 테스트 스키마가 남을 수 있다.
- 최초 migration은 빈 DB 기준이다. 이미 Project 테이블이 있는 다른 환경에 그대로 적용하지 말고 기존 구조와 migration 이력을 먼저 확인한다.
- migrate deploy는 준비된 SQL을 적용하므로 shadow DB가 필요 없다. 이후 migrate dev를 사용할 때는 별도 shadow DB 설정이 필요하다.
- 적용 후 앱 계정의 실제 테이블 SELECT/INSERT/UPDATE/DELETE 권한과 읽기·쓰기 동작을 확인한다. 기존 ALTER DEFAULT PRIVILEGES는 migration 실행자에 따라 적용 여부가 달라질 수 있다. 권한을 임의로 확대하지 않는다.
- migrate reset/db push는 사용하지 않는다. CHECK와 부분 인덱스는 수동 SQL이므로 후속 migration에서도 보존한다.

## 이후 관계

게시글은 posts.projectId nullable FK로 프로젝트와 연결한다. 프로젝트 유무는 NULL 여부로 계산한다. 아이디어는 실제 저장 기능 도입 시 project_ideas 연결 테이블을 추가한다. 공통 파일에는 post_assets 등 화면별 FK 연결 테이블을 추가한다.

## 이번 검증 결과

- 단위 테스트 19개 통과(초기 데이터 변환·기존 행 보존·실패 롤백 포함).
- Prisma validate/generate, TypeScript 검사, 신규 스크립트 ESLint, git diff --check 통과.
- 실제 PostgreSQL 임시 스키마에서 migration, seed 재실행, 코드 그룹/FK/날짜/본문 제약, 대표 이미지 1개 제한, 원본 파일 보존 검사를 통과했다. 테스트 스키마는 제거했다.
- 개발 DB migration·초기 데이터 적용 완료. oz_dev_app으로 9개 테이블의 SELECT/INSERT/UPDATE/DELETE 권한을 각각 확인하고, 실제 Tag INSERT/UPDATE/DELETE를 트랜잭션에서 확인한 후 롤백했다. 권한 확대는 수행하지 않았다.
- 빌드·UI smoke는 이번 데이터 기반 변경에서 재실행하지 않았다.

## 프로젝트 다국어 구조 제거

사용자 요청으로 20261021010000_project_original_content migration을 추가·개발 DB에 적용했다. 최초 migration 이력은 수정하지 않았다. 한국어 내용을 우선 이전하고, 영어만 있는 프로젝트는 그 원문을 사용하며, 내용이 없는 프로젝트가 있으면 전체 migration을 취소한다.

제거 전 번역 데이터 16건을 저장소 밖 work-logs/2026-10-21/database-backups에 JSON으로 백업했다. 기존 영어 번역 소스도 유지한다. 화면의 언어별 프로젝트 문구는 아직 TS 데이터를 사용하므로 DB 조회 전환 시 원문 표시로 연결해야 한다.

실제 임시 스키마에서 원문 이전과 번역 테이블 제거·제약 검사를 통과했다. 적용 후 앱 계정으로 프로젝트 8개의 제목·요약·본문이 기존 한국어 원문과 일치하고 seed 재실행 시 0건 변경됨을 확인했다. 단위 테스트 19개, 타입 검사, 변경 파일 ESLint도 통과했다.

개발 DB 적용 확인: 프로젝트 8개, 한국어 8건·영어 8건. 한국어 제목/소개/본문/문서 버전은 적용 전 백업과 일치하며 영어 제목/본문은 현재 영어 소스와 일치한다. seed 재실행 시 기존 번역 불변, 앱 계정 번역 테이블 CRUD 권한 확인. 임시 스키마에서 언어 제한·중복·FK·본문·삭제 전파를 검증했다. 운영 DB는 변경하지 않았다.

## 2026-10-21 공개 프로젝트 DB 조회 연결

홈 카드·프로젝트 목록·상세 및 상세 메타데이터는 server/services/projects.ts에서 개발/운영 환경의 DATABASE_URL로 조회한다. Project.isVisible=true만 읽고 시작일 내림차순, NULL은 마지막으로 정렬한다. 공통 코드 표시명과 ProjectTranslation의 ko/en 내용을 사용하고, 영어 누락 시 한국어로 대체한다. 상세에는 원문 표시 안내를 제공한다. src/content/projects.ts와 언어 사전의 프로젝트 항목은 seed 자료로 유지한다.

이제 홈·프로젝트 화면에는 DB 연결이 필요하다. 로컬은 SSH 터널, 운영은 별도 운영 DATABASE_URL과 migration/seed를 먼저 준비해야 한다. DB 실패 시 오류 화면을 표시하며 TS 예시 데이터로 대체하지 않는다.

## 2026-10-21 관리자 저장·분류·첨부 연결

프로젝트 관리자를 TS 초안에서 개발 DB 조회/저장으로 전환했다. 분류와 유형은 공통 코드에서 선택하며 기술은 TECHNOLOGY, 주제 태그는 TOPIC으로 저장한다. 기술은 공통 코드 자동완성에서 골라 프로젝트 태그로 저장하며 초기 선택지는 React, Next.js, PostgreSQL이다. 언어별 본문/요약/제목과 ProjectTag/ProjectAsset 연결을 트랜잭션으로 저장하고 version 충돌을 차단한다. 외부 썸네일 URL 지원을 위해 20261021030000_project_thumbnail_url migration을 개발 DB에 적용했다. 기존 값은 NULL로 유지하며 데이터 삭제/변경은 없다. 운영은 이 migration을 먼저 적용해야 신규 공개 조회와 호환된다. 운영 저장은 여전히 차단한다.
