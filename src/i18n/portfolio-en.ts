import type { PortfolioMessages } from './portfolio-ko';

/** English copy for the main portfolio page and the shared header/footer. */
export const portfolioEn = {
  meta: {
    title: 'Jonghwan Won | Full-Stack Developer Portfolio',
    description:
      'Personal and training projects and professional development work by Jonghwan Won.',
    ogDescription:
      'From personal projects to client work: a record of what Jonghwan Won builds.',
  },
  header: {
    logoLabel: 'Back to the top of the portfolio',
    sectionNav: 'Portfolio sections',
    sections: { profile: 'Profile', projects: 'Projects', works: 'Works' },
    menu: 'Menu',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    pages: { lab: 'Lab', admin: 'Admin', guide: 'UI Guide' },
    newWindow: ' (opens in a new tab)',
  },
  footerNav: {
    label: 'Main pages',
    home: 'Home',
    projects: 'Projects',
    blog: 'Blog',
    lab: 'Lab',
    guide: 'UI Guide',
    admin: 'Admin',
  },
  downloads: {
    label: 'Résumé and portfolio PDFs',
    resume: 'Resume.pdf',
    portfolio: 'Portfolio.pdf',
    openNewTab: 'Open {file} in a new tab',
  },
  hero: {
    titleStart: 'I listen to needs, know operations,',
    titleEmphasis: 'and build it myself.',
    lead: "I'm Jonghwan Won, a full-stack developer with nine years of experience. After groupware consulting and infrastructure operations, I now build everything from the server to the screen.",
    profileButton: 'View profile',
  },
  profile: {
    headlineStart: 'I started by listening,',
    headlineEmphasis: 'and now I build',
    headlineEnd: '.',
    bodyStart:
      'Over nine years I have worked in three roles: a consultant who listened to clients and proposed a direction, an operator who kept servers and networks running, and now a ',
    bodyStrong: 'full-stack web developer',
    bodyEnd:
      '. So when I build a feature, I check both whether it is what the client really needs and whether it will run smoothly in production.',
    careerTitle: 'Relevant experience',
    stackTitle: 'Tech stack',
    stackEmpty: 'No technology tags yet.',
  },
  career: [
    {
      period: '2023. 01 - Present',
      org: 'M2M Global',
      role: 'Full-stack web development for SI projects',
      tag: 'Current',
      current: true,
    },
    {
      period: '2022. 07 - 2022. 12',
      org: 'Bitcamp Gangnam',
      role: 'Completed the "Java-based AWS Web Developer" program',
      tag: 'Training',
      current: false,
    },
    {
      period: '2018. 03 - 2022. 05',
      org: 'BS-ON',
      role: 'IT Support · server and network infrastructure operations',
      current: false,
    },
    {
      period: '2016. 11 - 2018. 02',
      org: 'Zioyouit',
      role: 'Custom groupware consulting for clients',
      current: false,
    },
  ],
  stories: [
    {
      step: 'Groupware consulting',
      title: 'I listened and proposed a direction',
      body: 'I listened to how client staff actually worked, organized their requirements, and proposed how to configure the groupware around their work. This is where I learned to ask about the real need behind a request.',
    },
    {
      step: 'IT support · infrastructure',
      title: 'I kept things running',
      body: 'On the IT support team I operated infrastructure such as servers and networks. I learned first-hand how software behaves in a real environment and where to look first when something breaks.',
    },
    {
      step: 'Full-stack web development',
      title: 'Now I build it myself',
      body: 'At an SI company I develop the features clients ask for from start to finish: Java·Spring servers, Vue·React screens, and the database. My two earlier roles shape how I design those features.',
    },
  ],
  stackNotes: {
    Backend: [
      'Implemented business APIs and logic with Java and Spring Boot',
      'Handled querying, creating, and updating data with MyBatis and JPA',
      'Built batch jobs such as bulk updates and inventory sync, plus integrations with external systems',
      'Set up Spring Security and JWT authentication and Swagger API docs for PlanB',
    ],
    Frontend: [
      'Built customer, seller, and admin screens with React·Next.js and Vue.js·Nuxt.js',
      'Composed service and admin screens with Mantine, MUI, and Vuetify components',
      'Used Vuex state management and Axios API calls in PlanB',
      'Implemented web views for hybrid apps and responsive layouts',
    ],
    Database: [
      'Used the RDB each project required, including MySQL, PostgreSQL, Oracle, and MSSQL',
      'Integrated Redis',
    ],
    Tools: [
      'Managed source and history with Git·GitHub, and SVN for NongHyup Mall',
      'Built images with Docker and GitHub Actions for OZ, served through Cloudflare Tunnel',
      "Integrated PortOne (I'mport) payments and order saving for PlanB, and the Kakao Map API for Jogong",
    ],
  } as Record<string, string[]>,
  stackTabs: {
    label: 'Tech areas',
    usage: 'How I used them',
    iconCredit: 'Some icons by',
  },
  projects: {
    intro: 'Projects I built in training programs and on my own.',
    empty: 'No public projects yet.',
    detail: 'View details of {title}',
    more: 'View details',
    techLabel: 'Technologies',
    moreTech: '{count} more',
    completed: 'Completed',
  },
  views: {
    label: 'Project view',
    large: 'Large',
    small: 'Small',
    list: 'List',
  },
  works: {
    intro:
      'Projects I took part in professionally, described within what can be made public and focused on my role.',
    empty: 'No public work projects yet.',
    rail: 'Work projects, scroll sideways',
    previous: 'Previous project',
    next: 'Next project',
    showList: 'View full list',
    showCards: 'View as cards',
  },
  contact: {
    title: 'Contact',
    availability: 'Feel free to reach out',
    closingStart: "If you'd like to build",
    closingEmphasis: 'a good service together.',
    description:
      'As a developer who has gone from gathering requirements to running production, I build the features you need from the screen to the server. Feel free to reach out about projects or collaboration.',
  },
  email: {
    hint: 'Copy email address',
    copied: 'Copied',
    failed: "Couldn't copy",
    copiedStatus: 'Copied {email}.',
    failedStatus: "Couldn't copy. Please type {email} yourself.",
  },
} satisfies PortfolioMessages;
