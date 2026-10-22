# ddozaa — 프로젝트 OZ

Next.js App Router + TypeScript로 만든 개인 작업실의 첫 실행 버전입니다. 브랜드는 ddozaa, 캐릭터는 OZ입니다. 원본 설계의 전체 운영 기능을 완료한 상태는 아닙니다.

## 실행

새 기능 제안과 미구현 아이디어는 [OZ 아이디어 저장소](docs/13-ideas.md)에 기록합니다. “OZ 아이디어 목록 보여줘”라고 요청하면 이 문서를 기준으로 확인할 수 있습니다.

Node 24.18.0 기준. 이 `app` 폴더에서 실행합니다.

```powershell
npm ci
npm run dev
```

http://127.0.0.1:3000 에서 확인합니다. 포트를 사용 중이면 터미널에 표시된 주소를 확인하세요. UI 실행에는 DB나 비밀키가 필요하지 않습니다.

## 구현된 것

- 반응형 홈, 소개, 프로젝트 목록·상세와 기간·기술 요약 표시.
- 기록 카테고리·제목 검색·상세. 브랜드 소개 글 1개는 저장소 관리 콘텐츠입니다.
- FAQ 펼치기, 버그·문의 안내, 로그인 준비 안내, 404.
- 관리자 모든 하위 경로는 서버에서 `/login`으로 이동. 실제 관리자 UI/인증은 아직 없습니다.
- 무채색 다크·그레이 테마, 스크롤 시 반투명 블러 헤더, 모바일 접이식 메뉴. OZ SVG는 화면에서 무채색으로 표시합니다.
- 홈 메뉴는 소개/프로젝트/기록/연락 섹션으로 이동하며 프리뷰에서 기존 상세·목록으로 진입합니다.
- Prisma 최소 Project 스키마, 개발 DB Compose, non-root standalone Dockerfile, CI 검사 정의.

## 코드 포맷

VS Code에서 이 `app` 폴더를 열고 권장 확장인 Prettier(`esbenp.prettier-vscode`)를 설치하면 저장 시 자동 포맷됩니다. 작은따옴표와 LF 줄바꿈을 사용하며 나머지는 Prettier 기본 규칙을 따릅니다. 생성 코드와 빌드 결과는 제외합니다.

전체 파일 정렬은 `npm run format`, 포맷 확인은 `npm run format:check`로 실행합니다. 기존 파일은 일괄 변경하지 않았으므로 전체 확인 시 미정렬 파일이 표시될 수 있습니다.

## 검사 명령

```powershell
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run db:generate
npm run build
# 개발 서버를 실행한 별도 터미널에서:
npm run test:smoke
```

2026-10-20: 위 검사 통과. smoke는 공개 페이지, 미등록 상세 404, 관리자 하위 경로 redirect, 빈 카테고리, health를 확인합니다. `/api/health`는 앱 생존 확인이며 DB readiness를 의미하지 않습니다.

## 개발 DB (선택)

2026-10-21: 기본 개발 DB는 NAS의 공용 개발 PostgreSQL로 변경했다. `npm run dev` 후 `/guide`에서 UI 사용법과 API·DB 연결을 확인할 수 있다. SSH 터널과 `.env.local` 설정은 [로컬 개발 문서](docs/05-local-development.md)를 따른다. 가이드는 운영 모드에서 404이며 테이블을 만들지 않는다. 아래 Compose는 PC별 DB를 사용할 때의 대안이다.

Docker 설치 후 다음을 실행합니다. 현재 기기에서는 Docker가 없어 DB 기동·마이그레이션 적용·Docker 이미지 빌드를 검증하지 못했습니다.

```powershell
Copy-Item .env.example .env.local
docker compose -f docker/compose.dev.yml up -d db
npm run db:generate
npm run db:migrate:dev -- --name init
```

개발용 계정과 비밀번호는 로컬 전용입니다. CLI는 `.env.local`을 명시적으로 읽습니다. 전체 DB 논리 모델은 docs/03-database.md에 있고, 실제 구현은 단계별로 추가합니다. 앱은 아직 DB에서 콘텐츠를 조회하지 않습니다.

## 남은 단계 / 주의

OAuth 공급자 확정 → DB 세션과 권한 → 콘텐츠 CRUD → 비공개 문의 → NAS 배포 → 예약·AI. 실제 계정·문의 저장·자동 발행·외부 배포는 미구현입니다. 경력/연락처는 확인된 공개용 자료로 채워야 합니다.

`npm audit --omit=dev`: 취약점 0건. 전체 감사에는 Next 린트 의존성의 high 5건이 남아 있습니다. 현재 registry에 패치가 없어 강제 downgrade를 하지 않았습니다. 상세 이유는 [구현 상태](docs/10-implementation.md)를 참고하세요.

전체 요구사항은 [문서](docs/01-requirements.md), 공통 개발 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다. Git 저장소와 CI는 `app`을 루트로 사용하는 기준이며 원격 저장소는 생성하지 않았습니다.

2026-10-20 UI 변경 검증: lint, typecheck, 기존 테스트, production build, 경로 smoke 통과. 360/390/768/1280px에서 가로 넘침 없음 확인. 모바일 메뉴 열기/선택/닫기/Escape, 섹션 이동, 실험실 카드 상세 이동 확인. 화면은 ../verification/dark-desktop.png 및 dark-mobile-menu.png에 저장. 실제 iOS Safari 기기에서의 유리 효과는 별도 확인이 필요하다.

## 공통 버튼

`src/components/ui/CommonButton.tsx`의 `CommonButton`(동작/폼), `CommonButtonLink`(화면 이동)를 사용한다. `size`: sm/md/lg, `variant`: neutral/primary/ghost. 기본은 md/neutral이며 폰트 패밀리는 전역 설정을 상속한다. 예: `<CommonButtonLink href="/lab" variant="primary" size="lg">실험실</CommonButtonLink>`. 메뉴 토글·캐러셀 화살표는 전용 컨트롤로 유지한다.

## 프로젝트 구성

상단 메뉴는 소개 · 프로젝트 · 기록 · 연락입니다. 개발 모드에서는 실험실(`/lab`)과 개발 가이드(`/guide`)를 별도 화면으로 제공합니다. 실험실은 아이디어 저장소와 Markdown 뷰어를, 가이드는 공통 UI와 API·환경 정보를 다룹니다. OZ는 개인/웹사이트/개발 중 프로젝트로 표시합니다. 유형 필터는 공개 프로젝트에서 쓰는 유형이 두 개 이상일 때 표시합니다. 등록 방법과 현재 제한은 [콘텐츠 관리](src/content/README.md)를 참고하세요.

## 언어 선택과 오류 화면

로그인 왼쪽 지구본에서 한국어·영어를 바꿀 수 있습니다. 선택은 쿠키에 저장되고 현재 주소·검색 조건을 유지합니다. 공개 화면의 UI와 메타데이터가 번역되며, 사용자 게시글은 작성된 원문을 유지합니다. 같은 URL을 사용하며 언어별 검색 색인은 아직 지원하지 않습니다. 언어 쿠키 때문에 공개 페이지는 요청 시 서버에서 렌더링합니다.

`/error`에서 오류 디자인을 확인할 수 있습니다. 실제 없는 주소는 404로 처리하고, 페이지·루트 오류에는 재시도와 홈 이동을 제공합니다. [다국어 관리](src/i18n/README.md)를 참고하세요.

## 공통 UI와 테마

공통 버튼·입력·선택·모달·페이지네이션·파일 선택·로딩은 Mantine 기반으로 제공합니다. 다크·라이트 선택은 기존 쿠키 설정을 유지하고, Mantine 테마는 브랜드 바이올렛 색에 맞춥니다. [공통 UI 규칙](src/components/ui/README.md)을 참고하세요.

## 프로젝트 데이터 기반 1차

스키마·migration·초기 데이터 및 DB 검증 절차는 [프로젝트 데이터 기반](docs/14-project-data-foundation.md)을 참고합니다. 현재 화면의 DB 연결은 후속 단계이며, 실제 개발 DB 적용 상태는 해당 문서에서 구분합니다.

## 2026-10-21 한국어·영어 콘텐츠 지원으로 변경

최신 정책은 한국어·영어 두 언어 지원이다. Project에는 공통 정보를, ProjectTranslation에는 locale(ko/en), title, summary, body, bodySchemaVersion을 저장한다. 아래 원문 단일 저장·번역 제거 기록은 당시 이력이며 이 정책으로 대체한다. 게시글 DB 도입 시에도 Post와 PostTranslation을 분리한다. 게시글 테이블·관리자 영어 입력·공개 화면 DB 조회·언어 버튼 변경은 아직 구현하지 않았다.

## 2026-10-21 공개 프로젝트 DB 조회 연결

홈 카드·프로젝트 목록·상세 및 상세 메타데이터는 server/services/projects.ts에서 개발/운영 환경의 DATABASE_URL로 조회한다. Project.visibility=PUBLIC만 읽고 position/id 순으로 정렬하며 홈은 앞의 2개를 표시한다. 공통 코드 표시명과 ProjectTranslation의 ko/en 내용을 사용하고, 영어 누락 시 한국어로 대체한다. 상세에는 원문 표시 안내를 제공한다. src/content/projects.ts와 언어 사전의 프로젝트 항목은 seed 및 개발 관리자 초안 자료로 유지하며 공개 화면의 데이터 원본은 아니다. 관리자 저장·파일 조회/업로드는 아직 연결하지 않았다. 본문은 heading/paragraph의 텍스트만 안전하게 렌더링하며 다른 에디터 노드는 추후 구현한다.

이제 홈·프로젝트 화면에는 DB 연결이 필요하다. 로컬은 SSH 터널, 운영은 별도 운영 DATABASE_URL과 migration/seed를 먼저 준비해야 한다. DB 실패 시 오류 화면을 표시하며 TS 예시 데이터로 대체하지 않는다.

## 공통 에디터·NAS 첨부

관리자 프로젝트 소개는 Tiptap 공통 에디터로 편집한다. 썸네일 URL/이미지 업로드 및 첨부 업로드·다운로드를 제공하며 파일은 NAS 개발 저장소에 실제 저장된다. 관리자 프로젝트 저장·파일 연결은 아직 화면 상태다. 운영 업로드는 인증 연결 전 차단한다. [상세 설정과 제한](docs/15-editor-files.md)을 참고한다.

## 프로젝트 관리 현재 상태

로컬 /admin/projects는 개발 DB 조회·실제 저장을 지원한다. 유형/작업 구분/상태/기술/태그와 한국어·영어 소개를 편집하며 저장 시 썸네일·본문 이미지·첨부 연결도 반영한다. 이전의 프로젝트 임시 저장 설명은 현재 적용되지 않는다. 운영 저장·게시판 DB 저장·관리자 인증은 아직 미구현이다. /guide의 공통 UI 탭에서 버튼 스타일·컬러·크기를 확인한다.

## 2026-10-22 현재 동작과 배포 순서

이 절이 위 개발 이력의 미구현 표기를 대체합니다. 공개 메인/목록 카드는 공통 프로젝트 상세 팝업으로 열리며 직접 상세 URL도 유지합니다. 로컬 관리자에서는 검색·프론트 페이지네이션, 고객사·한/영 소개·태그·썸네일/첨부의 실제 DB 저장, 선택 논리 삭제를 지원합니다. 에디터는 표·NAS 이미지 삽입·크기 조절을 지원합니다. 삭제는 원본 데이터/NAS 파일을 보존하고 복구 UI는 아직 없습니다. 서버 LIMIT/OFFSET 페이징은 IDEA-006 후속 개선사항입니다.

DATABASE_URL 미설정 시 프로젝트는 빈 목록으로 표시하므로 DB 없는 컨테이너 시작 검사와 기본 UI 실행이 가능합니다. URL을 설정한 뒤 DB 연결에 실패하면 오류 화면으로 안내하며 예시 데이터로 대체하지 않습니다. 운영에서 실제 프로젝트를 표시하려면 운영 DB에 migration/seed를 적용하고 DATABASE_URL 및 파일 읽기용 STORAGE_ROOT를 런타임 환경으로 전달해야 합니다. 이번 변경의 migration 세 개(한국어/영어 분리, 썸네일 URL, 고객사/삭제 표시)를 앱 업데이트 전에 적용합니다. 로컬 관리자 쓰기와 업로드는 계속 개발 환경의 loopback+same-origin+oz_dev DB로 제한하며 운영 관리자 인증·쓰기·게시판 DB 저장은 후속 작업입니다.

사용자의 명시적 요청이 있을 때만 브라우저 UI 검증을 수행합니다. 기본 확인은 lint/typecheck/test/build 등 터미널 검사로 진행하며 사용자 실행 서버를 임의로 시작·종료·재시작하지 않습니다.
