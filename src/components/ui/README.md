# 공통 UI

공통 상호작용은 Radix UI Primitives를 기반으로 만들고, 모양은 CSS Modules와 `src/app/globals.css`의 테마 변수로 관리합니다. 설치한 패키지는 `@radix-ui/react-dropdown-menu`입니다. MUI/Tailwind 전체 테마는 도입하지 않았습니다.

- 버튼과 링크: 기존 `Button`, `ButtonLink`를 사용합니다.
- 드롭다운: `DropdownMenu.tsx`의 Root, Trigger, Content, RadioGroup, RadioItem을 사용합니다. 포털·포커스·키보드 이동·바깥 클릭 닫기는 Radix가 처리하고 목록 크기·선택 표시는 공통 CSS를 따릅니다.
- 헤더 아이콘: `headerIcon` 클래스의 44px 버튼을 사용합니다.
- 색상: 배경은 `--bg`, 카드/메뉴는 `--surface`, 본문은 `--ink`, 보조 문구는 `--muted`, 테두리는 `--line`입니다. 라임 배경은 `--accent`, 그 위 글자는 `--on-accent`를 사용합니다.
- 기본 배경은 다크 `#000000`, 라이트 `#FFFFFF`입니다. 카드·메뉴·테두리에는 중립 회색을 사용하고 라임만 강조색으로 유지합니다.
- 강조 글자와 포커스는 `--accent-ink`를 사용합니다. 라이트 테마에서는 읽기 쉽도록 더 짙은 녹색을 사용하고 주 강조색 `#C7F36B`는 유지합니다.

테마는 html의 `data-theme="dark|light"`로 결정합니다. 헤더에서 변경하면 검증된 값을 `ddoza-theme` 쿠키에 1년간 저장하고 서버 렌더링에 반영합니다. 초기값은 다크입니다. 현재 OS 테마 자동 감지 기능은 없습니다.
