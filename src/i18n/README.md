# 문구와 다국어

## UI 문구

공개 화면의 인터페이스 문구는 `ko.ts`, `en.ts`에서 관리합니다. 두 파일은 같은 `Messages` 타입을 만족해야 합니다. 메인 포트폴리오와 공통 헤더·푸터 문구는 양이 많아 `portfolio-ko.ts`/`portfolio-en.ts`로 나누고 `messages.portfolio`로 연결합니다. locale만 받아 클라이언트 트리에서도 쓰는 공용 컴포넌트(프로젝트 상세·카드·미리보기, 연락처 카드)는 `shared-copy.ts`의 `sharedCopy(locale)`를 씁니다. 관리자 화면은 한국어 전용입니다. 페이지 서버 컴포넌트는 `getMessages()`를 사용하고, 클라이언트 컴포넌트에는 필요한 label만 전달합니다. 번역 사전에 JSX나 HTML을 넣지 말고 렌더링 구조는 컴포넌트에서 처리합니다.

실험실(`/lab`)과 UI 가이드(`/guide`) 문구는 `guide-ko.ts`, `guide-en.ts`에서 따로 관리하며 두 파일은 같은 `GuideMessages` 타입을 만족해야 합니다. 서버 컴포넌트는 `guide-server.ts`의 `getGuideMessages()`를 사용합니다. 가이드가 보여주는 `src/components/ui/` 공통 컴포넌트는 선택 `labels` prop을 받고, 생략하면 기존 한국어 문구를 사용합니다. 관리자 화면은 한국어 전용이므로 `labels`를 넘기지 않습니다. `{name}` 형태의 자리표시자는 컴포넌트에서 값으로 바꿉니다.

## 사용자 콘텐츠

프로젝트와 게시글의 제목·요약·본문은 UI 번역 사전이 아니라 DB의 번역 테이블에 저장됩니다. 초기 seed 자료는 프로젝트 slug를 `projects.ts`와 언어 사전에서 맞춰 `scripts/seed-data.mjs`로 등록합니다. 상세 데이터 구조는 [콘텐츠 데이터 안내](../content/README.md)와 Prisma 스키마를 참고하세요.

## 언어 전환

헤더에서 한국어/영어를 선택하면 검증된 locale을 `ddoza-locale` 쿠키에 저장하고 현재 경로를 유지합니다. 기본 언어는 한국어입니다. 언어별 URL·검색엔진 경로·hreflang은 현재 제공하지 않습니다.

## 오류 및 테마 문구

오류 복구 문구는 `errors.ts`에서 관리합니다. 문구에서 강조나 구조가 필요하면 의미 단위의 번역 필드로 나누고 JSX는 페이지에서 구성합니다. 전역 오류 화면은 실제 예외 원문이나 스택을 사용자에게 표시하지 않습니다.
