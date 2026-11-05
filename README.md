# ddozaa · OZ

Next.js 기반 개인 작업실입니다. 공개 사이트와 프로젝트·게시글 관리 기능을 제공하며, 운영용 데이터는 PostgreSQL과 파일 저장소를 사용합니다.

## 현재 구현

- 한국어·영어 공개 페이지, 프로젝트와 게시글 조회, 상세 미리보기
- PostgreSQL 기반 프로젝트·게시글·문의·공통코드·첨부파일 관리
- GitHub OAuth 로그인과 DB 세션. `GITHUB_ADMIN_ID`에 지정한 계정만 관리자 권한을 가집니다.
- 운영 이미지 빌드: GitHub Actions가 `linux/amd64` 이미지를 검사하고 GHCR에 커밋 SHA 태그로 게시합니다. NAS 컨테이너 배포는 수동입니다.

문의는 비로그인 방문자도 등록할 수 있습니다. 일반 방문자에게 관리자 화면이 표시되더라도 변경 작업은 허용하지 않습니다. 실제 현재 권한 범위는 [접근 정책](docs/16-접근-정책.md)을 기준으로 합니다.

## 로컬 실행

Node.js 24.18.x를 사용합니다.

```powershell
npm ci
npm run dev
```

기본 UI는 `http://127.0.0.1:3000`에서 열립니다. DB 기능·인증을 사용하려면 아래 환경변수를 로컬 `.env.local`에 설정하고 개발 DB 연결을 준비하세요. 이 저장소에는 `.env.example`이 없습니다. 설정 절차는 [로컬 개발](docs/05-로컬-개발.md)을 따릅니다.

| 변수                                       | 용도                         |
| ------------------------------------------ | ---------------------------- |
| `DATABASE_URL`                             | 앱의 PostgreSQL 연결         |
| `MIGRATION_DATABASE_URL`                   | Prisma migration용 연결      |
| `STORAGE_ROOT`                             | 업로드 파일의 영속 저장 경로 |
| `BETTER_AUTH_URL`                          | 앱의 기준 URL                |
| `BETTER_AUTH_SECRET`                       | 세션·인증 비밀키, 32자 이상  |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth 앱              |
| `GITHUB_ADMIN_ID`                          | 관리자 GitHub 숫자 ID        |

## 자주 쓰는 확인 명령

```powershell
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run build
```

## 운영 준비 상태

운영은 Cloudflare Tunnel을 통한 HTTPS 접속, GitHub 관리자 로그인, PostgreSQL과 영속 파일 저장소를 사용합니다. `/api/health`는 앱 생존만 확인하며 DB 연결을 보장하지 않습니다. 배포 절차와 남은 검증은 [배포·운영](docs/06-배포-운영.md)을 참고하세요.

## 문서

- [요구사항](docs/01-요구사항.md) · [아키텍처](docs/02-아키텍처.md) · [데이터베이스](docs/03-데이터베이스.md)
- [보안 기준](docs/04-보안-기준.md) · [개발 환경](docs/05-로컬-개발.md) · [배포·운영](docs/06-배포-운영.md)
- [로드맵](docs/08-로드맵.md) · [현재 구현 상태](docs/10-현재-구현-상태.md) · [아이디어](docs/13-아이디어.md)
- 문서는 공개 가능한 구조·설정 예시·기술 결정을 다룹니다. 실제 접속 주소, 장비 세부 정보, 배포·장애·백업 기록과 데이터 스냅샷은 비공개로 관리합니다.
- 내부 문서 뷰어는 관리자 전용입니다. 저장소를 공개하면 문서 자체는 누구나 읽을 수 있습니다.
- 코드 작성 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다.
