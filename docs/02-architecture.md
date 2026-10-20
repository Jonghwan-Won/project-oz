# 아키텍처

## 서버 구성
브라우저 → HTTPS 역방향 프록시 → Next.js Node 서버 → PostgreSQL / 영속 파일 저장소.
작업 스케줄러 → 작업용 CLI 컨테이너 → 동일한 서버 서비스 모듈 → DB/허용된 외부 API.

Next.js는 화면만 담당하는 프론트 서버가 아니다. 이 단계에서는 인증·조회·수정·업무 로직까지 함께 제공하는 단일 애플리케이션이다. 로그인과 동적 게시판 때문에 정적 export만으로 배포하지 않는다.

## 저장소 구조(생성할 때의 목표)
```text
README.md
AGENTS.md
docs/
src/
  app/
    (public)/                 # 홈/about/board/projects/lab/work/help
    (account)/                # login/account/inquiries
    (admin)/admin/            # 관리자 layout + 기능 페이지
    api/                      # 인증 콜백, 업로드, health 등 HTTP 경계
  components/                 # ui/layout/editor 등
  features/                   # posts/projects/inquiries UI·검증 스키마
  server/
    auth/                     # 세션, 역할, 권한, 소유권
    services/                 # 업무 로직 및 DB 접근
    db/                       # Prisma 연결
    jobs/                     # 생성/수집/발행 작업
    storage/                  # 공개/비공개 파일 처리
  styles/                     # 토큰, 전역 CSS
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/                      # 작업 실행·검증 CLI
tests/                        # 권한, 서비스, 통합, E2E
public/fonts/                 # 허가된 폰트/라이선스
docker/                       # 개발·운영 Compose 및 Dockerfile
.github/workflows/            # GitHub를 선택했을 경우
.env.example                  # 키 이름만, 비밀값 없음
package.json
package-lock.json
```

## 요청 처리 원칙
- Server Components는 서비스 함수를 직접 호출한다. 내부 호출을 위해 자기 HTTP API를 우회 호출하지 않는다.
- 폼 변경은 Server Actions를 기본으로 한다. 외부 API/인증 콜백/파일 다운로드처럼 HTTP 계약이 필요한 부분은 Route Handlers를 사용한다.
- Action과 Handler는 둘 다 외부에서 호출 가능한 경계다. 서버 검증과 권한 검사를 생략하지 않는다.
- 서비스는 actor(검증된 사용자 또는 시스템 작업 주체)와 검증된 입력을 받아 동작한다. 단순 admin=true 파라미터 금지.
- 공개 DTO와 관리자 DTO를 분리한다. 문의 이메일이나 세션 정보를 공개 컴포넌트 props에 넣지 않는다.
- 공개 목록만 캐시하고 게시/비공개 변경 후 해당 태그·경로를 무효화한다. 보호 데이터는 공용 캐시 금지.
- app 시작 시 외부 API/운영 DB에 의존하는 빌드를 하지 않는다. 초기화와 migration은 별도 단계다.

## 기술 선택
PostgreSQL은 관계·트랜잭션·예약 작업·권한 모델에 적합한 권장안이다. Prisma로 스키마와 migration 이력을 관리하되 DB 제약을 대신하지 않는다. 패키지 및 Node의 정확한 버전은 구현 시작일의 지원되는 안정 버전/보안 공지를 확인해 고정한다. 이 문서에서 검증하지 않은 미래 버전을 단정하지 않는다.

Redis, Kafka, Elasticsearch, Spring은 초기 구성에서 제외한다. 검색량·작업량·별도 앱 API 요구가 실제로 커졌을 때 도입 근거를 다시 기록한다. Spring으로 분리할 때는 서비스 경계와 API 계약을 먼저 이전하고, 두 ORM이 같은 테이블의 migration을 동시에 소유하지 않게 한다.
