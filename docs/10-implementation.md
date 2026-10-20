# 2026-10-20 구현 상태

## 이번 범위
원본 문서의 전체 제품을 한 번에 완료한 것이 아니라 로컬 Next 프로젝트와 공개 UI를 구현한 첫 단계입니다. 08-roadmap의 인증 공급자는 미정이므로 2단계는 미구현입니다.

- Next 16.4.2, React 19.3.0, Node 24.18.0, Prisma 7.10.1. npm registry에서 확인. Prisma latest는 8 RC여서 안정 7.x 선택.
- App Router, TypeScript strict, CSS Modules + 공통 토큰, 시스템 글꼴 사용. 외부 폰트 다운로드 없음.
- 브랜드 ddozaa, 프로젝트명 OZ. SVG 캐릭터는 수정 가능한 첫 콘셉트.
- 홈/소개/프로젝트/실험실/게시판/도움·문의/로그인 안내/404/health.
- 게시판: 저장소 관리 콘텐츠 1개, 제목 검색/카테고리/상세. 가상의 경력·출시 앱·뉴스는 넣지 않음.
- 관리자: 모든 하위 경로에서 서버 redirect로 접근 차단. 인증/권한 구현으로 간주하지 않음.
- Prisma: Project 최소 모델과 클라이언트 생성만 준비. DB 연결 서비스/전체 논리 모델/마이그레이션/seed/실제 영속화 미구현.
- PostgreSQL 개발 Compose는 loopback 바인딩. Dockerfile은 non-root Next standalone 실행. Docker 미설치로 실제 기동 미검증.
- CI 검증 정의는 app을 저장소 루트로 삼는 기준. 원격 Git 저장소/CI 실행/이미지 게시/외부 배포 없음.

## 다음 작업
OAuth 공급자와 공개용 경력·연락처를 확정한 뒤 DB 세션/권한을 구현합니다. 이후 콘텐츠 CRUD·비공개 문의·NAS 배포·예약 발행·AI 순서를 유지합니다. 문의 작성 폼은 저장 기능 이전에 개인정보를 받지 않도록 아직 제공하지 않습니다.

## 의존성 주의
Next ESLint 설정의 braces → micromatch → fast-glob 체인에 high 취약점 5건이 audit에 집계됩니다. braces registry 최신 3.0.3에도 패치가 없어 강제 downgrade하지 않았습니다. 개발 도구에 한정하며 운영 의존성 감사 결과를 README에 기록합니다. ESLint 10은 Next 하위 플러그인의 peer 범위와 충돌하여 scaffold 호환 버전 9.39.5를 고정했습니다. 향후 Next lint 플러그인 업데이트 시 함께 교체합니다.

참고: https://if.kakao.com/2026 / https://nextjs.org/docs/app/getting-started/installation / https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference

## 최종 검증
- lint/typecheck/test/build, Prisma validate/generate, HTTP smoke 통과.
- 홈 360/390/768/1280px 가로 넘침 없음. 390px 모바일 메뉴 열기/페이지 이동/카테고리 빈 상태 확인.
- 운영 의존성 audit 0건, 개발 도구 high 5건.
- verification/의 PC 및 모바일 이미지는 상위 프로젝트 폴더에 저장.

