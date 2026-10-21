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
