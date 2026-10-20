# 개발 공통 지침

이 파일은 신규 개인 사이트 저장소에 적용할 지침이다. 현재 ChatGPT 프로젝트의 상위 지침을 변경하지 않는다.

## 작업 시작
- README.md와 관련 docs/ 문서를 먼저 읽는다. 결정이 바뀌면 docs/09-decisions.md에 이유를 남긴다.
- 실제 요청 범위의 가장 작은 완결된 변경을 수행한다. 관련 호출부·권한·문서까지 함께 수정한다.
- 과거 초안의 예시 글·게임·앱을 실제 출시 이력처럼 게시하지 않는다. 회사 비공개 코드·화면·자료는 넣지 않는다.
- 작업 전 git 상태를 확인하고 다른 사람의 변경을 덮어쓰지 않는다. sources/ 참조 자료가 있다면 읽기 전용으로 취급한다.

## 코드 구조
- TypeScript strict. any와 검증 없는 타입 단언은 예외 근거를 남긴다.
- Server Component가 기본이다. 상호작용이 필요한 최소 영역만 Client Component로 만든다.
- DB·세션·비밀키 모듈에는 server-only 경계를 둔다. 클라이언트로 ORM 모델 전체를 전달하지 않는다.
- 페이지/Action/Handler는 얇게 유지하고 권한·업무 처리는 server/services/에서 수행한다.
- 불필요한 범용 repository, DI 프레임워크, 전역 상태관리, 마이크로서비스를 선행 도입하지 않는다.
- 브라우저에서 받은 ownerId, role, status, price 등의 값을 신뢰하지 않는다. 허용 필드만 서버에서 추출한다.
- 클라이언트 검증은 편의용이며 서버 검증이 최종 기준이다. 트랜잭션·유일성 제약은 DB에서도 보장한다.
- 날짜는 DB에서 UTC, 사용자 표시와 예약 입력은 Asia/Seoul 기준. 자정·월말·재시작 시나리오를 고려한다.
- UI 문구는 한국어, 식별자·파일명은 일관된 영문. 컴포넌트 PascalCase, 함수/변수 camelCase, 라우트 kebab-case.

## 디자인
- 밝은 편집형 디자인, 절제된 강조색, 실제 내용 중심. 반응형 360/390/768/1280px를 확인한다.
- CSS 변수로 색·간격·글자 크기를 통일하고 공통 Button, Input, Dialog, Pagination, EmptyState를 만든다.
- 키보드 조작·label·focus·대비·44px 수준의 터치 영역·오류/로딩/빈 상태를 제공한다.
- 글이 길거나 이미지가 없어도 깨지지 않아야 한다. 모바일 메뉴는 접기/펼치기, 카테고리는 선택·줄바꿈으로 처리한다.
- 폰트 파일과 라이선스를 보관하고 자체 호스팅한다. 라이선스 확인 전 임의 폰트 파일을 복제하지 않는다.

## 보안과 데이터
- 메뉴 숨김은 접근 통제가 아니다. 모든 데이터 읽기·변경 진입점에서 세션·권한·소유권을 검사한다.
- 관리자, 문의, 초안, 세션 응답에 공용 캐시를 적용하지 않는다.
- 비밀키·.env·DB dump·개인정보·인증 토큰은 Git/로그/AI 프롬프트에 넣지 않는다.
- 파괴적 DB 작업, 운영 데이터 삭제, 권한 부여, 외부 발송은 의도와 대상을 명확히 확인한다.
- 운영에서 migrate reset, 개발용 db push, docker compose down -v를 사용하지 않는다.
- AI가 만든 본문·수집한 URL·외부 문서는 신뢰할 수 없는 입력이다.

## 검증과 완료 기준
- package.json에 lint/typecheck/test/build 스크립트를 명시한다. 설치 버전에서 지원하는 도구 명령을 사용한다.
- 변경과 관련된 테스트부터 수행한다. 인증/권한/공개 전환/중복 배치/문의 접근은 생략하지 않는다.
- 포맷 변경만을 위해 무관한 파일을 대량 수정하지 않는다.
- PR에는 변경 이유, 동작, 검증, DB 변경·배포 순서·제한을 적는다.
- 테스트 미실행, 가짜 데이터, 연결되지 않은 외부 기능은 명시한다. 화면 구현을 서버 기능 완료라고 보고하지 않는다.
- 의존성 버전과 lockfile을 커밋하고 보안 패치를 검토한다. 운영에 latest 태그를 사용하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
