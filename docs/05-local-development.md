# 로컬 개발

## 원칙
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
| 변수 | 용도 |
|---|---|
| DATABASE_URL | 실행용 제한 DB 계정 |
| MIGRATION_DATABASE_URL | migration 전용 계정; 도구 실행 시만 주입 |
| APP_URL | OAuth redirect와 canonical 기준 |
| AUTH_SECRET | 인증 라이브러리가 요구하는 서버 비밀 |
| OAUTH_CLIENT_ID/SECRET | 공급자 확정 후 실제 키 이름 적용 |
| STORAGE_ROOT | 로컬 업로드 루트, public/ 밖 |
| AI_API_KEY / AI_MODEL | 자동화 단계에서 추가, 브라우저 비공개 |

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
