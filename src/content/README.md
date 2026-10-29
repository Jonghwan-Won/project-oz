# 콘텐츠 데이터

공개 프로젝트와 게시글은 운영 시 PostgreSQL에서 읽고 관리 화면에서 저장합니다. 이 폴더의 TypeScript 데이터는 초기 seed 원본 및 코드 관리 콘텐츠로 사용되며, 운영 DB의 변경 사항을 자동으로 덮어쓰지 않습니다.

## 초기 프로젝트 데이터

- `projects.ts`: seed 대상 프로젝트의 slug, 유형, 작업 구분, 노출 여부 등 초기 메타데이터
- `../i18n/ko.ts`, `../i18n/en.ts`: seed용 프로젝트의 언어별 제목·요약·본문
- `scripts/seed-data.mjs`: 위 자료를 DB에 최초 등록하는 seed 처리

운영 화면의 내용을 바꿀 때 seed 원본만 수정해도 기존 DB 행은 자동 갱신되지 않습니다. 프로젝트·게시글의 실제 필드와 migration은 `prisma/schema.prisma`와 `prisma/migrations/`가 기준입니다. 운영 데이터를 seed로 초기화하거나 덮어쓰지 마세요.

공개 프로젝트는 `isVisible=true`이고 삭제되지 않은 행만 표시합니다. 상세 정렬·언어별 콘텐츠 fallback 등 동작은 서버 서비스를 따릅니다. 코드에 없는 필드나 상태를 이 안내만으로 추정하지 마세요.
