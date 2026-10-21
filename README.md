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

- 반응형 홈, 소개, 프로젝트 목록·상세와 진행 상태 표시.
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
`src/components/ui/Button.tsx`의 `Button`(동작/폼), `ButtonLink`(화면 이동)를 사용한다. `size`: sm/md/lg, `variant`: neutral/primary/ghost. 기본은 md/neutral이며 폰트 패밀리는 전역 설정을 상속한다. 예: `<ButtonLink href="/lab" variant="primary" size="lg">실험실</ButtonLink>`. 메뉴 토글·캐러셀 화살표는 전용 컨트롤로 유지한다.

## 프로젝트 구성

상단 메뉴는 소개 · 프로젝트 · 기록 · 연락입니다. OZ는 개인/웹사이트/개발 중 프로젝트로 표시하고, 기존 `/lab`은 `/projects`로 이동합니다. 유형 필터는 공개 프로젝트에서 쓰는 유형이 두 개 이상일 때 표시합니다. 등록 방법과 현재 제한은 [콘텐츠 관리](src/content/README.md)를 참고하세요.

## 언어 선택과 오류 화면

로그인 왼쪽 지구본에서 한국어·영어를 바꿀 수 있습니다. 선택은 쿠키에 저장되고 현재 주소·검색 조건을 유지합니다. 공개 화면의 UI와 메타데이터가 번역되며, 사용자 게시글은 작성된 원문을 유지합니다. 같은 URL을 사용하며 언어별 검색 색인은 아직 지원하지 않습니다. 언어 쿠키 때문에 공개 페이지는 요청 시 서버에서 렌더링합니다.

`/error`에서 오류 디자인을 확인할 수 있습니다. 실제 없는 주소는 404로 처리하고, 페이지·루트 오류에는 재시도와 홈 이동을 제공합니다. [다국어 관리](src/i18n/README.md)를 참고하세요.

## 공통 UI와 테마

언어 선택 목록은 Radix UI 기반 공통 드롭다운입니다. 지구본 오른쪽의 해/달 버튼에서 다크·라이트 테마를 바꾸며 선택은 쿠키에 저장됩니다. 주 색상은 바이올렛 `#BAACFF`, 보조색은 블루 `#86BAFF`입니다. [공통 UI 규칙](src/components/ui/README.md)을 참고하세요.

## 프로젝트 데이터 기반 1차

스키마·migration·초기 데이터 및 DB 검증 절차는 [프로젝트 데이터 기반](docs/14-project-data-foundation.md)을 참고합니다. 현재 화면의 DB 연결은 후속 단계이며, 실제 개발 DB 적용 상태는 해당 문서에서 구분합니다.
