# 공통 UI

공통 상호작용은 Radix UI Primitives를 기반으로 만들고, 모양은 CSS Modules와 `src/app/globals.css`의 테마 변수로 관리합니다. 설치한 패키지는 `@radix-ui/react-dropdown-menu`입니다. MUI/Tailwind 전체 테마는 도입하지 않았습니다.

- 버튼과 링크: 기존 `Button`, `ButtonLink`를 사용합니다.
- 카드 링크: `interactiveCard`를 사용해 26px 모서리·은은한 배경 전환·2px 상승을 통일합니다. 키보드 포커스에도 적용하며 동작 줄이기 설정에서는 이동하지 않습니다.
- 알림: `OzAlert`의 `variant`는 `default`(생략 가능)/`error`입니다. 제목 없이 그라데이션·본문·회색 확인 버튼을 표시하고 아이콘 JSX는 주석으로 보관합니다. 본문은 16px, `width`는 px 단위 숫자(기본 360)이며 화면 너비를 넘지 않습니다. 높이는 본문에 맞추고 긴 내용은 모달 안에서 스크롤합니다. `confirmLabel` 기본값은 `확인`이고 `open/onClose/content`로 제어합니다.
- 드롭다운: `DropdownMenu.tsx`의 Root, Trigger, Content, RadioGroup, RadioItem을 사용합니다. 포털·포커스·키보드 이동·바깥 클릭 닫기는 Radix가 처리하고 목록 크기·선택 표시는 공통 CSS를 따릅니다.
- 헤더 아이콘: `headerIcon` 클래스의 44px 버튼을 사용합니다.
- 색상: 배경은 `--bg`, 카드/메뉴는 `--surface`, 본문은 `--ink`, 보조 문구는 `--muted`, 테두리는 `--line`입니다. 바이올렛 배경은 `--accent`, 그 위 글자는 `--on-accent`를 사용합니다.
- 기본 배경은 다크 `#000000`, 라이트 `#FFFFFF`입니다. 카드·메뉴·테두리에는 중립 회색을 사용하고 블루·바이올렛을 강조색으로 사용합니다.
- 강조 글자와 포커스는 `--accent-ink`를 사용합니다. 라이트 테마에서는 읽기 쉽도록 짙은 바이올렛 `#5940AD`를 사용합니다. 주 강조색은 `#BAACFF`, 블루 보조색은 `--accent-blue`(`#86BAFF`)입니다.

테마는 html의 `data-theme="dark|light"`로 결정합니다. 헤더에서 변경하면 검증된 값을 `ddoza-theme` 쿠키에 1년간 저장하고 서버 렌더링에 반영합니다. 초기값은 다크입니다. 현재 OS 테마 자동 감지 기능은 없습니다.

## 에디터·파일

RichTextEditor/RichTextView는 Tiptap JSON 편집·출력을 공통 처리한다. FileUpload는 NAS 업로드, AssetLinks는 원본 이름 다운로드 링크에 사용한다. 저장·권한·현재 제한은 [에디터·파일 문서](../../../docs/15-editor-files.md)를 따른다.

## 버튼 스타일·컬러·크기

- primary: 저장·등록. 배경 --accent(#BAACFF), 글자 --on-accent(#161025), hover #D0C6FF.
- neutral(기본): 취소·수정. 배경 --surface, 글자 --ink, 테두리 --line.
- ghost: 보조 도구. 투명 배경, --ink, --line, hover --hover.
- sm: 최소 높이 44px, 패딩 10px 16px, 글자 13px. md(기본): 48px / 14px 23px / 14px. lg: 56px / 17px 28px / 16px.
- focus: --accent-ink 외곽선. disabled: 불투명도 40%. 저장 중 및 업로드 중 중복 제출을 차단한다.

/guide#examples에 세 스타일 × 세 크기의 실제 버튼과 다크/라이트 색상표를 제공한다. 프로젝트 저장은 primary, 취소는 neutral을 사용한다.

## 공통 폼과 모달

관리자 목록은 `SearchPanel → Grid → Pagination` 순서로 구성한다. SearchPanel은 검색 조건과 초기화/조회 버튼을 제공하며 Enter로도 조회한다. 입력 조건과 적용 조건을 분리하고 조회·초기화·페이지 크기 변경 시 첫 페이지로 이동한다. Pagination은 첫/이전/번호/다음/마지막 페이지와 5·10·20·50건 선택을 제공한다. 검색 결과가 없어도 빈 Grid와 1/1 페이지를 유지한다.

프로젝트 검색: 검색어(한·영 제목/소개·주소·기술·태그), 작업 구분, 유형, 진행 상태, 공개 범위. 미지정·비활성 분류도 검색 가능하다. 게시판 검색: 검색어(제목·주소·요약·본문), 카테고리, 공개 범위. 현재 전달받은 개발 목록을 검색하며 운영·대량 데이터 연결 시 서버 검색/페이징으로 전환한다. 대시보드는 집계 화면, 분류/미디어/사이트 관리는 준비 화면이다.

Input/TextArea는 테마·포커스·비활성 스타일을 공유한다. SelectBox는 Radix Select 기반 값 선택이며 DropdownMenu는 동작 메뉴다. FilePicker는 파일 선택 표시, FileUpload는 FilePicker에 NAS 업로드를 연결한다. Modal은 제목 왼쪽·actions 오른쪽, 본문만 스크롤하며 Escape와 포커스 복귀를 처리한다. /guide#form-controls에서 예제를 확인한다. 프로젝트 관리에는 이 공통 컴포넌트를 적용했다.

Tiptap Image의 네 모서리 핸들로 이미지 크기를 비율 유지하며 변경한다. width/height는 JSON에 저장하고 출력에도 반영한다. Tiptap 사용 확장은 MIT 라이선스로 수정·상업 이용 가능하나 저작권 및 라이선스 고지를 유지해야 한다.

## 프로젝트 공통 상세
ProjectDetailContent는 공개 카드 팝업·관리자 미리보기·직접 상세 URL에서 같은 커버/제목/속성/태그/본문/첨부를 렌더링한다. ProjectPreviewLink는 일반 클릭을 Modal로 열고 수정키를 누른 링크 클릭과 직접 URL은 원래 상세 경로를 유지한다. 관리자 미리보기는 현재 편집값을 사용하며 저장하지 않는다.

검색 버튼은 sm(최소44px)로 표시한다. 프로젝트 체크박스는 현재 페이지 전체 선택과 개별 선택을 제공하고 선택이 없으면 삭제 버튼을 비활성화한다. 삭제 확인은 공통 Modal을 사용한다.
