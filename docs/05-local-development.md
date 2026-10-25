# 로컬 개발

## 원칙

2026-10-21 변경: 현재 기본 구성은 각 PC의 Next.js + NAS 공용 개발 PostgreSQL이다. 아래 PC별 Compose 절차는 대안으로 보존한다. 운영 DB에 연결해 개발하지 않는다.

## 개발 가이드와 테이블 없는 연결 테스트

개발 모드에서는 GNB 헤더 우측 버튼 영역의 책 아이콘으로 `/guide`에 이동할 수 있다. 아이콘의 접근성 이름과 툴팁은 개발 가이드이며 영어 UI도 지원한다. production 빌드에는 이 바로가기를 표시하지 않고, 가이드 경로 자체도 서버에서 404 처리한다.

`/guide#alerts`에서 사이트 전용 CommonAlert의 기본 제목·사용자 지정 제목 예제를 확인한다. `src/components/ui/CommonAlert.tsx`의 open/onClose/content와 선택적 title을 사용한다. title은 상단 작은 문구이며 생략 시 `OZ · MESSAGE`다. content는 줄바꿈을 보존하는 본문이고 confirmLabel로 확인 버튼 문구를 바꿀 수 있다. C 시안의 반투명 그라데이션 패널에 B 시안의 둥근 버튼을 결합했다. 네이티브 dialog의 모달 포커스·배경 접근 차단을 활용하며 확인 버튼·Escape로 닫고 배경 클릭으로는 닫지 않는다. 삭제 동의용 confirm이나 toast는 이번 범위가 아니다.

`/lab/markdown`은 README와 docs의 번호 있는 Markdown 문서를 선택해 읽는 개발 전용 뷰어다. 다른 UTF-8 `.md`/`.markdown` 파일(최대 1 MiB)도 브라우저에서 열 수 있다. 선택한 파일은 서버에 업로드하거나 저장하지 않는다. HTML 실행과 이미지 자동 로드는 차단한다. `/guide/environment`는 2026-10-21 개인 작업일지를 바탕으로 공개 웹·개발 DB·배포 흐름을 정리한 구조도이며 실시간 상태판은 아니다. 두 경로 모두 production에서 404다.

`npm run dev` 실행 후 `/guide`에서 공통 UI·색상·기본 날짜 입력·설계된 역할과 API·DB 연결을 확인한다. 페이지와 `/api/guide`는 development 환경에서만 제공하고 production에서는 404다. `/lab` 이동과 공개 메뉴는 유지한다. 인증·역할 검사는 아직 미구현이다.

NAS DB를 쓰려면 PC의 **별도 PowerShell 창**에서 SSH 터널을 열어 유지한다. DSM_USER는 실제 DSM 계정명, DEV_DB_CONTAINER_IP는 개발 DB 컨테이너 IP, NAS_SSH_HOST는 NAS 접속 주소로 바꾼다. 외부에서는 NAS 내부 IP 대신 Tailscale 주소를 사용한다. 실제 주소는 개인 작업일지에서 확인한다.

```powershell
ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 127.0.0.1:15432:DEV_DB_CONTAINER_IP:5432 DSM_USER@NAS_SSH_HOST
```

SSH가 비밀번호를 물으면 DSM 계정 비밀번호를 입력한다. 입력 중 문자가 표시되지 않는 것은 정상이다. 연결 성공 시 별도 완료 문구 없이 터미널이 계속 대기하고, 그 창을 닫으면 터널도 종료된다. `Connection reset` 또는 인증 오류가 나오면 터널이 열린 것이 아니므로 NAS 주소·계정·접속 허용 상태를 확인한다.

프로젝트 루트 `.env.local`에 아래 항목을 직접 설정한다. CHANGE_ME는 비밀번호를 URL 인코딩한 값으로 바꾼다. 기존 파일 전체를 덮어쓰지 않는다. 비밀번호를 채팅·Git·로그에 남기지 않는다.

```dotenv
DATABASE_URL="postgresql://oz_dev_app:CHANGE_ME@127.0.0.1:15432/oz_dev"
```

환경 설정은 개발 서버에 자동 반영될 수 있다. 반영되지 않으면 재시작한다. 가이드에서 API 호출 → DB 연결 확인을 누른다. DB 테스트는 pg 드라이버로 `SELECT 1`만 실행하며 테이블·migration을 만들지 않는다. 연결·쿼리 타임아웃은 3초이며 원본 DB 오류와 접속 정보는 응답에 포함하지 않는다. 이 검사는 Prisma·실제 CRUD 검증과 별개다.

별도 터미널에서 `node tests/guide.smoke.mjs`로 가이드·API·잘못된 요청·DB 응답 형식을 검사한다. DB 503은 연결 미완료이며 출력에 구분한다. 다른 포트라면 GUIDE_TEST_URL을 지정한다.

## PC별 DB 구성 대안 (이전 계획)

Mac M1 또는 개인 Windows에서 Next 개발 서버를 직접 실행하고 PostgreSQL만 Docker로 띄운다. 운영 NAS DB에 연결해 개발하지 않는다. 로컬 DB/스토리지/키/테스트 계정은 운영과 분리한다. 회사 PC는 회사의 설치·외부 저장소·AI 사용 정책이 허용할 때만 사용한다.

## 준비

- Git, 지원 중인 Node LTS, npm, Docker Desktop 또는 해당 OS의 Docker 환경.
- 버전은 package.json engines, .node-version, package-lock.json에 고정한다.
- Next App Router + TypeScript + src 디렉터리 + ESLint를 사용한다. 초기 CSS Modules, Tailwind는 필수가 아니다.
- 이 문서의 명령은 실제 scaffold가 구성된 후의 목표 명령이며 현재 ZIP에서 실행할 수 없다.

## 최초 실행 절차

1. 새 저장소 clone, 이 문서 패키지를 루트에 배치한다.
2. .env.example을 .env.local로 복사하고 로컬 값만 설정한다.
3. `docker compose -f docker/compose.dev.yml up -d db`
4. `npm ci`
5. `npm run db:generate` 및 `npm run db:migrate:dev`
6. `npm run db:seed` (개발 환경만)
7. `npm run dev`, http://localhost:3000 접속.

## 환경변수 계약

| 변수                   | 용도                                     |
| ---------------------- | ---------------------------------------- |
| DATABASE_URL           | 실행용 제한 DB 계정                      |
| MIGRATION_DATABASE_URL | migration 전용 계정; 도구 실행 시만 주입 |
| APP_URL                | OAuth redirect와 canonical 기준          |
| AUTH_SECRET            | 인증 라이브러리가 요구하는 서버 비밀     |
| OAUTH_CLIENT_ID/SECRET | 공급자 확정 후 실제 키 이름 적용         |
| STORAGE_ROOT           | 로컬 업로드 루트, public/ 밖             |
| AI_API_KEY / AI_MODEL  | 자동화 단계에서 추가, 브라우저 비공개    |

Next는 .env.local을 읽지만 Prisma/별도 CLI가 같은 파일을 자동으로 읽는다고 가정하지 않는다. db:* 및 jobs:* 스크립트에서 환경 로딩을 명시하고 운영에서는 파일 대신 환경을 주입한다. 환경 검증에서 누락·오류를 조기 실패시킨다.

## 개발용 Compose 계약

- PostgreSQL은 `127.0.0.1:5432:5432`에만 노출하고 로컬 볼륨으로 영속화한다.
- 이미지 major는 로컬/운영 동일하게, 패치/digest도 관리한다.
- 로컬 Node에서 DB hostname은 localhost, 컨테이너 앱에서는 서비스명 db를 사용한다.
- Apple Silicon은 로컬 arm64 DB 이미지를 사용해도 되지만 NAS 이미지 빌드는 linux/amd64로 명시한다.
- 테스트 DB는 개발 DB와도 분리한다. seed는 가짜 데이터이며 운영 관리자 자동 생성 금지.

## 작업 흐름

main에서 feature/* 브랜치 → 작은 변경 → 관련 테스트 → lint/typecheck/build → commit/push → PR/MR → merge.
기존 운영 데이터 dump를 개발 PC로 무심코 복제하지 않는다. 필요하면 익명화 데이터만 사용한다.

## 목표 스크립트

dev / build / start / lint / typecheck / test / test:e2e / db:generate / db:migrate:dev / db:migrate:deploy / db:seed / jobs:tick.
정확한 실행 명령과 인증 콜백 URL은 버전/공급자 확정 후 README에 기록한다. 의존성 설치 시 확인되지 않은 버전 번호를 복사하지 않는다.
