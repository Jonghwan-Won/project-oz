# 프로젝트 등록

현재 프로젝트는 `projects.ts`에서 관리합니다. UI와 상세 본문은 `../i18n/ko.ts`, `../i18n/en.ts`의 `projectItems`에 같은 slug로 추가합니다.

- `type`: 결과물 유형. 실제 필요한 코드를 두 언어의 `projectTypes`에 추가합니다. 현재는 `website`만 등록되어 있습니다.
- `origin`: 작업 배경. `personal`(개인), `education`(교육), `company`(회사).
- `lifecycle`: IDEA / BUILDING / TESTING / RELEASED / ARCHIVED.
- `visibility`: PUBLIC만 홈·목록·상세에 노출합니다. PRIVATE는 상세 주소로도 조회되지 않습니다.
- `thumbnail`: 선택적인 public 이미지 경로(예: `/images/project.webp`). 값이 있으면 이미지만, 없으면 궤도 그래픽과 한 줄 말줄임 제목을 썸네일에 표시합니다.

목록 필터는 공개 데이터에 사용된 유형만 표시하며 유형이 하나 이하면 생략합니다. 검색 URL에는 번역된 이름 대신 안정적인 코드(예: `?category=website`)를 사용합니다.

학원·회사 프로젝트를 추가할 때 목적, 기간, 팀 규모, 본인 역할, 해결한 문제와 결과, 기술 및 공개 가능한 링크를 본문에 정리합니다. 회사 자료는 공개 가능한 범위만 사용합니다. 개발 모드의 `/admin`에 등록·수정 화면 초안이 있으며 DB와 공개 사이트에는 반영되지 않습니다. 새로고침·메뉴 이동 시 임시 변경은 초기화됩니다.

프로젝트는 사용자 제공 최신순 `order` 오름차순으로 표시합니다. 홈은 앞의 2개만 노출합니다. `placeholder` 작업은 임시 데이터이며 실제 참여 내용이 준비되기 전까지 유형·진행 상태를 생략합니다. 현재 등록 데이터에는 썸네일이 없어 기본 궤도 그래픽을 사용합니다.

## 2026-10-21 공개 프로젝트 DB 조회 연결

홈 카드·프로젝트 목록·상세 및 상세 메타데이터는 server/services/projects.ts에서 개발/운영 환경의 DATABASE_URL로 조회한다. Project.visibility=PUBLIC만 읽고 position/id 순으로 정렬하며 홈은 앞의 2개를 표시한다. 공통 코드 표시명과 ProjectTranslation의 ko/en 내용을 사용하고, 영어 누락 시 한국어로 대체한다. 상세에는 원문 표시 안내를 제공한다. src/content/projects.ts와 언어 사전의 프로젝트 항목은 seed 및 개발 관리자 초안 자료로 유지하며 공개 화면의 데이터 원본은 아니다. 관리자 저장·파일 조회/업로드는 아직 연결하지 않았다. 본문은 heading/paragraph의 텍스트만 안전하게 렌더링하며 다른 에디터 노드는 추후 구현한다.

이제 홈·프로젝트 화면에는 DB 연결이 필요하다. 로컬은 SSH 터널, 운영은 별도 운영 DATABASE_URL과 migration/seed를 먼저 준비해야 한다. DB 실패 시 오류 화면을 표시하며 TS 예시 데이터로 대체하지 않는다.
