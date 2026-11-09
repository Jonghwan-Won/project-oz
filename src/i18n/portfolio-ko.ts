/**
 * 메인 포트폴리오 화면과 공통 헤더·푸터(PortfolioHeader, SiteFrame) 문구.
 * ko.ts의 messages.portfolio로 연결한다. `{name}` 자리표시는 화면에서 바꿔 넣는다.
 */
/** 이력 한 줄. tag는 재직 중·교육처럼 붙일 때만, current는 지금 다니는 곳. */
type CareerItem = {
  period: string;
  org: string;
  role: string;
  tag?: string;
  current: boolean;
};

export const portfolioKo = {
  meta: {
    title: '원종환 | 풀스택 개발자 포트폴리오',
    description: '원종환의 개인·교육 프로젝트와 실무 개발 이력을 소개합니다.',
    ogDescription: '개인 프로젝트부터 실무 개발까지, 원종환의 작업 기록.',
  },
  header: {
    logoLabel: '포트폴리오 처음으로',
    sectionNav: '포트폴리오 섹션',
    sections: { profile: '프로필', projects: '프로젝트', works: '작업' },
    menu: '메뉴',
    menuOpen: '메뉴 열기',
    menuClose: '메뉴 닫기',
    pages: { lab: '실험실', admin: '관리자', guide: 'UI 가이드' },
    newWindow: ' (새 창)',
  },
  footerNav: {
    label: '주요 페이지',
    home: '홈',
    projects: '프로젝트',
    blog: 'Blog',
    lab: '실험실',
    guide: 'UI 가이드',
    admin: '관리자',
  },
  downloads: {
    label: '이력서·포트폴리오 PDF',
    resume: '이력서.pdf',
    portfolio: '포트폴리오.pdf',
    openNewTab: '{file} 새 탭에서 열기',
  },
  hero: {
    titleStart: '요구를 듣고, 운영을 알고,',
    titleEmphasis: '직접 만듭니다.',
    lead: '그룹웨어 컨설팅과 인프라 운영을 거쳐 지금은 서버부터 화면까지 만드는 9년 차 풀스택 개발자, 원종환입니다.',
    profileButton: '프로필 보기',
  },
  profile: {
    headlineStart: '듣는 일에서 시작해',
    headlineEmphasis: '만드는 일',
    headlineEnd: '까지 왔습니다.',
    bodyStart:
      '9년 동안 세 자리에서 일했습니다. 고객의 이야기를 듣고 방향을 제안하던 컨설턴트에서, 서버와 네트워크를 지키던 운영자를 거쳐, 지금은 ',
    bodyStrong: '풀스택 웹 개발자',
    bodyEnd:
      '로 일하고 있습니다. 그래서 기능을 만들 때 고객이 실제로 원하는 것인지, 운영에서 문제없이 돌아갈지를 함께 봅니다.',
    careerTitle: '직무 연관 이력',
    stackTitle: '기술 스택',
    stackEmpty: '등록된 기술 태그가 없습니다.',
  },
  /** 직무 연관 이력(최신순). current는 지금 다니는 곳. */
  career: [
    {
      period: '2023. 01 - 현재',
      org: '엠투엠글로벌',
      role: 'SI 프로젝트 풀스택 웹 개발',
      tag: '재직 중',
      current: true,
    },
    {
      period: '2022. 07 - 2022. 12',
      org: '비트캠프 강남본원',
      role: '"JAVA 기반 AWS 웹 개발자 양성 과정" 수료',
      tag: '교육',
      current: false,
    },
    {
      period: '2018. 03 - 2022. 05',
      org: '비에스온',
      role: 'IT지원팀 · 서버·네트워크 인프라 운영',
      current: false,
    },
    {
      period: '2016. 11 - 2018. 02',
      org: '지오유아이티',
      role: '고객사 맞춤 그룹웨어 컨설팅',
      current: false,
    },
  ] as CareerItem[],
  /** 프로필 카드: 경력의 세 단계를 오래된 순으로. 아이콘은 화면에서 순서대로 붙인다. */
  stories: [
    {
      step: '그룹웨어 컨설팅',
      title: '듣고, 방향을 제안했습니다',
      body: '고객사 담당자에게 지금의 업무 방식을 듣고 요구사항을 정리해, 그룹웨어를 업무에 맞게 구성하는 방향을 제안했습니다. 요청 뒤에 있는 실제 필요를 묻는 습관이 여기서 생겼습니다.',
    },
    {
      step: 'IT지원 · 인프라 운영',
      title: '멈추지 않게 운영했습니다',
      body: 'IT지원팀에서 서버와 네트워크 등 인프라를 운영했습니다. 만든 것이 실제 환경에서 어떻게 돌아가고, 문제가 생기면 어디부터 살펴야 하는지 몸으로 익혔습니다.',
    },
    {
      step: '풀스택 웹 개발',
      title: '이제 직접 만듭니다',
      body: 'SI 업체에서 Java·Spring 서버와 Vue·React 화면, 데이터베이스까지 고객사가 요청한 기능을 처음부터 끝까지 개발하고 있습니다. 앞의 두 경험이 기능을 설계하는 기준이 됩니다.',
    },
  ],
  /** 분야별로 어떤 기술을 어디에 썼는지. 공개 프로젝트 설명이 바뀌면 함께 고친다. */
  stackNotes: {
    Backend: [
      'Java·Spring Boot로 업무 기능의 API와 비즈니스 로직 구현',
      'MyBatis·JPA로 조회·등록·수정 데이터 처리',
      '대량 등록·수정, 재고 동기화 같은 배치와 외부 시스템 연계',
      'PlanB의 Spring Security·JWT 인증 구성과 Swagger 기반 API 문서화',
    ],
    Frontend: [
      'React·Next.js, Vue.js·Nuxt.js로 고객·판매자·관리자 화면 구현',
      'Mantine·MUI·Vuetify 컴포넌트로 서비스·관리 화면 구성',
      'PlanB에서 Vuex 상태 관리와 Axios API 통신 사용',
      '하이브리드 앱의 웹 화면과 반응형 화면 구현',
    ],
    Database: [
      'MySQL·PostgreSQL·Oracle·MSSQL 등 프로젝트 환경에 맞춘 RDB 사용',
      'Redis 연동',
    ],
    Tools: [
      'Git·GitHub, 농협몰의 SVN으로 소스와 변경 이력 관리',
      'OZ에서 Docker·GitHub Actions로 이미지 빌드, Cloudflare Tunnel로 서비스 연결',
      'PlanB의 PortOne(아임포트) 결제 요청·주문 저장, 조공의 카카오맵 API 연동',
    ],
  } as Record<string, string[]>,
  stackTabs: {
    label: '기술 분야',
    usage: '이렇게 사용했어요',
    iconCredit: '일부 아이콘 제공:',
  },
  projects: {
    intro: '교육 과정과 개인 작업으로 만든 프로젝트입니다.',
    empty: '공개된 프로젝트가 없습니다.',
    detail: '{title} 상세 보기',
    more: '자세히 보기',
    techLabel: '사용 기술',
    moreTech: '외 {count}개',
    completed: '개발 완료',
  },
  views: {
    label: '프로젝트 보기 방식',
    large: '크게 보기',
    small: '작게 보기',
    list: '리스트 보기',
  },
  works: {
    intro:
      '실무에서 참여한 프로젝트입니다. 공개 가능한 범위와 담당한 역할을 중심으로 정리했습니다.',
    empty: '공개된 실무 프로젝트가 없습니다.',
    rail: '실무 작업 목록, 좌우로 스크롤',
    previous: '이전 작업',
    next: '다음 작업',
    showList: '전체 리스트 보기',
    showCards: '카드로 보기',
  },
  contact: {
    title: '연락하기',
    availability: '편하게 연락 주세요',
    closingStart: '함께 좋은 서비스를',
    closingEmphasis: '만들고 싶은 분들께.',
    description:
      '요구를 듣는 일부터 운영까지 겪어 본 개발자로서, 화면부터 서버까지 필요한 기능을 직접 만들어 갑니다. 프로젝트와 협업에 관한 이야기를 편하게 전해 주세요.',
  },
  email: {
    hint: '이메일 주소 복사',
    copied: '복사했습니다',
    failed: '복사하지 못했어요',
    copiedStatus: '{email} 주소를 복사했습니다.',
    failedStatus: '복사하지 못했습니다. {email} 주소를 직접 입력해 주세요.',
  },
};

export type PortfolioMessages = typeof portfolioKo;
