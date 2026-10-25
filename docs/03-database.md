# PostgreSQL 논리 설계

아래는 초기 논리 모델이며 실행 가능한 DDL/Prisma 스키마가 아니다. 구현 단계마다 필요한 테이블을 migration으로 추가한다.

## 공통
- id: UUID, created_at/updated_at: timestamptz, 실제 저장 UTC.
- FK와 UNIQUE, NOT NULL, CHECK를 적용한다. ORM 입력 검증만으로 무결성을 보장하지 않는다.
- timestamp 표시/예약은 Asia/Seoul. cron_expression과 timezone을 별도로 저장한다.
- 콘텐츠 수정 충돌 방지용 version 정수 또는 updated_at 조건부 UPDATE를 사용한다.
- 관계형 필드를 무분별한 JSONB에 넣지 않는다. 작업 설정 등 제한된 구조만 JSONB로 두고 서버 스키마 검증한다.

## 계정·권한
| 테이블 | 핵심 필드·제약 |
|---|---|
| users | id, display_name, status(ACTIVE/SUSPENDED), timestamps |
| auth tables | accounts/sessions/verification 등은 선택한 인증 라이브러리 공식 schema 소유. 별도 임의 토큰 테이블과 중복하지 않음 |
| roles | id, code UNIQUE: MEMBER/ADMIN |
| permissions | id, code UNIQUE: post.create/update/publish, project.manage, inquiry.create/manage, menu.manage, role.manage, automation.manage |
| user_roles | user_id + role_id 복합 PK |
| role_permissions | role_id + permission_id 복합 PK |

GUEST는 비로그인 요청 상태이지 DB 사용자나 할당 가능한 역할이 아니다. 소유권은 역할과 별도 검사한다. 계정 삭제는 문의 보존 정책에 따라 익명화/삭제를 명시하고 무조건 CASCADE로 기록을 없애지 않는다.

## 메뉴·분류
| 테이블 | 핵심 필드·제약 |
|---|---|
| menus | id, parent_id FK menus, key UNIQUE, label, route_key, category_id nullable, position, enabled, permission_code nullable |
| categories | id, scope(POST/PROJECT), parent_id FK categories, slug, name, position, enabled; UNIQUE(scope,slug) |

depth 숫자만 저장하면 상위 관계를 알 수 없다. parent_id를 원본으로 하고 depth/path는 조회 시 계산한다. 초기 메뉴 편집 최대 3단계. 동일 트리 변경은 DB 트랜잭션과 트리별 잠금으로 직렬화하고 순환/자기 참조/교차 scope/깊이 초과를 검사한다. 부모 삭제 시 자식이 있으면 거부하거나 명시적으로 이동한다. DB RESTRICT를 기본으로 한다.

menus.route_key는 코드의 허용된 라우트 목록에 매핑한다. 카테고리 추가는 DB로 가능하지만 새로운 화면 기능은 코드 구현이 필요하다. 메뉴 permission_code는 표시 조건이며 API의 인가 정책을 바꾸지 못한다.

## 게시글
| 테이블 | 핵심 필드·제약 |
|---|---|
| posts | id, slug UNIQUE, category_id, author_id, title, body_markdown, excerpt, origin(MANUAL/AI), review_status(PENDING/APPROVED/REJECTED), status(DRAFT/SCHEDULED/PUBLISHED/ARCHIVED), scheduled_at, published_at, version |
| post_sources | id, post_id, url, title, publisher, retrieved_at; UNIQUE(post_id,url) |

초기에는 대표 카테고리 하나. 태그와 다중 카테고리는 실제 요구가 생기면 추가한다. AI 생성 job_run과 post 연결은 job_runs.output_post_id로 관리한다.
공개 조회 조건은 status=PUBLISHED AND published_at<=now() AND category.enabled. 예약 작업은 검토 승인·현재 상태를 다시 확인한다. PUBLISHED에는 published_at 필수, SCHEDULED에는 scheduled_at 필수 CHECK. 공개 상태 변경과 감사 로그는 같은 트랜잭션.
인덱스: (status,published_at DESC,id), (category_id,status,published_at DESC,id), (status,scheduled_at).

## 프로젝트
| 테이블 | 핵심 필드·제약 |
|---|---|
| projects | id, slug UNIQUE, category_id, title, summary, body_markdown, lifecycle, is_visible BOOLEAN, released_at, version |
| project_links | id, project_id, type(WEBSITE/APP_STORE/GOOGLE_PLAY/REPOSITORY/DEMO), label, url, position |
| project_updates | id, project_id, title, body_markdown, visibility, created_at |

실험실과 프로젝트 테이블을 따로 만들지 않는다. 프로젝트는 is_visible로 노출을 제어하고 시작일 최신순으로 보여준다. 공개 전환은 링크 검증과 권한 확인 후 수행한다. 실험실에서의 세부 기록 공개 여부도 각각 유지한다.

## 문의·파일·운영
| 테이블 | 핵심 필드·제약 |
|---|---|
| inquiries | id, owner_id, type(CONTACT/BUG), title, body, page_url, status, version |
| inquiry_replies | id, inquiry_id, author_id, body, created_at |
| faqs | id, question, answer_markdown, published, position |
| assets | id, storage_key UNIQUE, original_name, mime_type, bytes, owner_id, visibility, inquiry_id nullable, project_id nullable |
| automation_jobs | id, name, kind, category_id, schedule, timezone, enabled, review_required, config_json, next_run_at |
| job_runs | id, job_id, occurrence_key, status, attempts, lease_until, heartbeat_at, started_at, finished_at, error_code, output_post_id UNIQUE nullable; UNIQUE(job_id,occurrence_key) |
| audit_logs | id, actor_id nullable, actor_type, action, resource_type, resource_id, request_id, redacted_metadata, created_at |

問い合わせ/inquiries는 (owner_id,created_at DESC), job_runs는 (status,lease_until), automation_jobs는 (enabled,next_run_at) 인덱스. 감사 로그에는 본문·세션·토큰을 저장하지 않는다.
첨부는 스토리지 경로만 DB 저장. 비공개 파일은 문의 소유권을 거쳐 다운로드한다. 실제 도입 시 assets 관계 제약과 파일 제거 작업을 함께 구현한다.

## 변경 관리
로컬: migrate dev → SQL 검토 → 테스트 → migration 커밋. 운영: 백업 → migrate deploy → 상태 확인. 이미 적용된 migration을 수정하지 않는다. 컬럼 제거·타입 축소는 expand/contract 두 단계 배포로 진행한다. 이미지 롤백이 DB 롤백을 의미하지 않는다.

## 2026-10-21 한국어·영어 콘텐츠 지원으로 변경

최신 정책은 한국어·영어 두 언어 지원이다. Project에는 공통 정보를, ProjectTranslation에는 locale(ko/en), title, summary, body, bodySchemaVersion을 저장한다. 아래 원문 단일 저장·번역 제거 기록은 당시 이력이며 이 정책으로 대체한다. 게시글 DB 도입 시에도 Post와 PostTranslation을 분리한다. 게시글 테이블·관리자 영어 입력·공개 화면 DB 조회·언어 버튼 변경은 아직 구현하지 않았다.

### 2026-10-22 고객사·삭제 표시
Project.customerName(varchar200, 기본 빈 문자열), deletedAt(timestamptz nullable) 추가. 삭제는 version을 확인하고 deletedAt/updatedAt/version을 함께 갱신한다. 공개 조회와 파일 공개 권한 판정은 deletedAt IS NULL 조건을 적용한다. ProjectTranslation/ProjectTag/ProjectAsset와 NAS 파일은 보존하며 복구는 DB에서 수행한다. 개발 DB에 마이그레이션 적용 완료.
