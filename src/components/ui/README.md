# 공통 UI

공용 UI 컴포넌트의 파일·export 이름은 `Common` 접두사로 통일합니다. 상호작용과 기본 동작은 Mantine을 사용하고, 사이트 고유 모양은 CSS Modules와 `src/app/globals.css`의 테마 변수로 조정합니다. 전역 `MantineProvider`는 기존 다크·라이트 선택과 바이올렛 브랜드 색을 반영합니다.

- 버튼과 링크: 기존 `CommonButton`, `CommonButtonLink`를 사용합니다.
- 카드 링크: `interactiveCard`를 사용해 26px 모서리·은은한 배경 전환·2px 상승을 통일합니다. 키보드 포커스에도 적용하며 동작 줄이기 설정에서는 이동하지 않습니다.
- 알림: `CommonAlert`의 `variant`는 `default`(생략 가능)/`error`입니다. 본문과 확인 버튼은 가운데 정렬하며 확인은 강조색을 사용합니다. 본문은 16px, `width`는 px 단위 숫자(기본 360)이며 화면 너비를 넘지 않습니다. 높이는 본문에 맞추고 긴 내용은 모달 안에서 스크롤합니다. `confirmLabel` 기본값은 `확인`이고 `open/onClose/content`로 제어합니다.
- 확인과 로딩: `CommonConfirm`은 `CommonAlert`와 같은 카드 스타일로 확인/취소를 받고, `CommonLoading`은 브랜드 강조색의 원형 회전 스피너를 전체 화면에 표시합니다. 저장 결과 알림은 응답 성공/오류에 맞춰 `CommonAlert`로 표시합니다.
- 선택 목록과 메뉴: 값 선택에는 Mantine `Select`를 감싼 `CommonSelectBox`, 동작 메뉴에는 Mantine `Menu`를 사용합니다.
- 헤더 아이콘: `headerIcon` 클래스의 44px 버튼을 사용합니다.
- 관리자 프로젝트 폼의 Mantine 선택 컨트롤은 사이트 강조색 대신 기본 블루를 명시하고, 기술·태그 다음에 노출 여부(Y/N)를 배치합니다.
- 색상: 배경은 `--bg`, 카드/메뉴는 `--surface`, 본문은 `--ink`, 보조 문구는 `--muted`, 테두리는 `--line`입니다. 바이올렛 배경은 `--accent`, 그 위 글자는 `--on-accent`를 사용합니다.
- 기본 배경은 다크 `#000000`, 라이트 `#FFFFFF`입니다. 카드·메뉴·테두리에는 중립 회색을 사용하고 블루·바이올렛을 강조색으로 사용합니다.
- 강조 글자와 포커스는 `--accent-ink`를 사용합니다. 라이트 테마에서는 읽기 쉽도록 짙은 바이올렛 `#5940AD`를 사용합니다. 주 강조색은 `#BAACFF`, 블루 보조색은 `--accent-blue`(`#86BAFF`)입니다.

테마는 html의 `data-theme="dark|light"`로 결정합니다. 헤더에서 변경하면 검증된 값을 `ddoza-theme` 쿠키에 1년간 저장하고 서버 렌더링에 반영합니다. 초기값은 다크입니다. 현재 OS 테마 자동 감지 기능은 없습니다.

## 에디터·파일

CommonRichTextEditor/CommonRichTextView는 Tiptap JSON 편집·출력을 공통 처리한다. CommonRichTextEditor는 기본적으로 이미지 업로드 버튼을 제공하며, `uploadsEnabled={false}`이면 버튼을 숨겨 로컬 화면 예제처럼 업로드 없이 편집 UI를 보여 줄 수 있다. CommonFileUpload는 NAS 업로드, CommonAssetLinks는 원본 이름 다운로드 링크에 사용한다. 저장·권한·현재 제한은 [에디터·파일 문서](../../../docs/15-editor-files.md)를 따른다.

## 버튼 스타일·컬러·크기

- primary: 저장·등록. 배경 --accent(#BAACFF), 글자 --on-accent(#161025), hover #D0C6FF.
- neutral(기본): 취소·수정. 배경 --surface, 글자 --ink, 테두리 --line.
- ghost: 보조 도구. 투명 배경, --ink, --line, hover --hover.
- sm: 최소 높이 44px, 패딩 10px 16px, 글자 13px. md(기본): 48px / 14px 23px / 14px. lg: 56px / 17px 28px / 16px.
- focus: --accent-ink 외곽선. disabled: 불투명도 40%. 저장 중 및 업로드 중 중복 제출을 차단한다.

/guide의 공통 UI 탭에 세 스타일 × 세 크기의 실제 버튼과 다크/라이트 색상표를 제공한다. 프로젝트 저장은 primary, 취소는 neutral을 사용한다.

## 공통 폼과 모달

관리자 목록은 `CommonSearchPanel → CommonGrid → CommonPagination` 순서로 구성한다. CommonGrid는 Mantine Table을 렌더링하고 `columns` 설정으로 헤더·셀·정렬·너비를 받는다. 선택 체크박스 같은 인터랙션도 셀 렌더러에서 지정하며, 빈 결과 메시지·행 키·더블클릭·가로 스크롤을 공통 처리한다. CommonSearchPanel은 검색 조건과 초기화/조회 버튼을 제공하며 Enter로도 조회한다. 입력 조건과 적용 조건을 분리하고 조회·초기화·페이지 크기 변경 시 첫 페이지로 이동한다. CommonPagination은 첫/이전/번호/다음/마지막 페이지와 5·10·20·50건 선택을 제공한다. 검색 결과가 없어도 빈 Grid와 1/1 페이지를 유지한다.

프로젝트 검색: 검색어(한·영 제목/소개·주소·기술·태그), 작업 구분, 유형, 공개 범위. 미지정·비활성 분류도 검색 가능하다. 게시판 검색: 검색어(제목·주소·요약·본문), 카테고리, 공개 범위. 현재 전달받은 개발 목록을 검색하며 운영·대량 데이터 연결 시 서버 검색/페이징으로 전환한다. 대시보드는 집계 화면, 분류/미디어/사이트 관리는 준비 화면이다.

CommonInput/CommonTextArea는 Mantine TextInput/Textarea, 체크·라디오는 Mantine Checkbox/Radio, CommonSelectBox는 Mantine Select 기반이다. 프로젝트 사용 기술은 Mantine Autocomplete 추천 목록에서, 주제 태그는 CommonInput에서 입력한다. 선택한 기술과 태그는 `ProjectTag`로 폼·카드·상세 화면에서 같은 모양으로 표시한다. 사용 기술 추천 목록은 활성 TECHNOLOGY 공통 코드에서 가져온다. CommonFilePicker는 기본 파일 선택 input을 OZ 스타일로 표시하고 CommonFileUpload는 NAS 업로드를 처리한다. CommonModal은 Mantine Modal의 포커스 제한·복귀 동작을 사용하면서 제목·actions·스크롤 영역은 사이트 스타일로 구성한다. `size`는 `sm`(480px)·`md`(720px)·`lg`(960px)·`xl`(1180px) 또는 숫자 너비(px)를 받으며 기본값은 `xl`이다. `fillHeight`를 켜면 화면의 최대 높이로 프레임을 고정하고 본문 영역을 스크롤한다. 화면이 좁으면 너비를 뷰포트 안으로 제한한다. /guide의 공통 UI 탭에서 에디터와 첨부 예제도 확인한다. 프로젝트 관리에는 이 공통 컴포넌트를 적용했다.

Tiptap Image의 네 모서리 핸들로 이미지 크기를 비율 유지하며 변경한다. width/height는 JSON에 저장하고 출력에도 반영한다. Tiptap 사용 확장은 MIT 라이선스로 수정·상업 이용 가능하나 저작권 및 라이선스 고지를 유지해야 한다.

## 프로젝트 공통 상세

ProjectDetailContent는 공개 카드 팝업·관리자 미리보기·직접 상세 URL에서 같은 제목/기술/프로젝트 정보/커버/본문/태그/첨부를 렌더링한다. 공개 목록에는 상세 본문과 첨부를 포함하지 않으며 ProjectPreviewLink는 클릭 시 프로젝트 ID로 상세를 요청해 CommonModal을 연다. 수정키를 누른 링크 클릭과 직접 URL은 상세 경로를 유지한다. 관리자 미리보기는 현재 편집값을 사용하며 저장하지 않는다.

검색 버튼은 sm(최소44px)로 표시한다. 프로젝트 체크박스는 현재 페이지 전체 선택과 개별 선택을 제공하고 선택이 없으면 삭제 버튼을 비활성화한다. 삭제 확인은 공통 CommonModal을 사용한다.
