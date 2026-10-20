# 프로젝트 등록

현재 프로젝트는 `projects.ts`에서 관리합니다. UI와 상세 본문은 `../i18n/ko.ts`, `../i18n/en.ts`의 `projectItems`에 같은 slug로 추가합니다.

- `type`: 결과물 유형. 실제 필요한 코드를 두 언어의 `projectTypes`에 추가합니다. 현재는 `website`만 등록되어 있습니다.
- `origin`: 작업 배경. `personal`(개인), `education`(교육), `company`(회사).
- `lifecycle`: IDEA / BUILDING / TESTING / RELEASED / ARCHIVED.
- `visibility`: PUBLIC만 홈·목록·상세에 노출합니다. PRIVATE는 상세 주소로도 조회되지 않습니다.

목록 필터는 공개 데이터에 사용된 유형만 표시하며 유형이 하나 이하면 생략합니다. 검색 URL에는 번역된 이름 대신 안정적인 코드(예: `?category=website`)를 사용합니다.

학원·회사 프로젝트를 추가할 때 목적, 기간, 팀 규모, 본인 역할, 해결한 문제와 결과, 기술 및 공개 가능한 링크를 본문에 정리합니다. 회사 자료는 공개 가능한 범위만 사용합니다. 관리자 등록 화면과 DB 연동은 아직 구현하지 않았습니다.

프로젝트는 사용자 제공 최신순 `order` 오름차순으로 표시합니다. 홈은 앞의 2개만 노출합니다. `placeholder` 작업은 임시 데이터이며 실제 참여 내용이 준비되기 전까지 유형·진행 상태를 생략합니다. 썸네일은 현재 공통 임시 그래픽을 사용합니다.
