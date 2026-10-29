import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import s from './environment.module.css';
import { NetworkDiagram } from './NetworkDiagram';

export const metadata: Metadata = {
  title: '개발·운영 환경 구조도',
  robots: { index: false, follow: false },
};

const flows = [
  {
    id: 'web',
    title: '01 · 사용자가 사이트를 볼 때',
    description:
      '외부 HTTPS 접속 확인 완료. 개발 PC를 꺼도 NAS에서 계속 실행됩니다.',
    steps: [
      ['외부 브라우저', '도메인으로 HTTPS 요청', 'TCP 443'],
      ['집 공유기', '공인 주소의 443을 NAS로 전달', '포트포워딩'],
      [
        'DSM 역방향 프록시',
        '인증서로 HTTPS 처리 → 내부 HTTP 전달',
        '127.0.0.1:13000',
      ],
      ['OZ 웹 컨테이너', 'Next.js 화면과 API를 함께 실행', '컨테이너 3000'],
    ],
    note: '운영 웹은 아직 운영 DB에 연결하지 않았습니다. /guide와 테스트 API는 운영에서 404입니다.',
  },
  {
    id: 'development',
    title: '02 · 집이나 외부 PC에서 개발할 때',
    description: '소스와 개발 서버는 각 PC에, 공용 개발 DB는 NAS에 있습니다.',
    steps: [
      ['로컬 개발 PC', 'VS Code · Node.js · npm run dev', 'Next.js :3000'],
      [
        '로컬 DB 접속점',
        '.env.local의 DATABASE_URL이 가리키는 주소',
        '127.0.0.1:15432',
      ],
      ['SSH 터널', '외부에서는 Tailscale을 통해 NAS에 접속', '창을 열어 유지'],
      [
        'NAS 개발 DB',
        'PostgreSQL · oz_dev · 앱 계정 oz_dev_app',
        '컨테이너 5432',
      ],
    ],
    note: 'SELECT 1 연결 검사까지 확인했습니다. DBeaver는 자체 SSH 터널을 사용합니다. 실제 CRUD와 migration은 아직 미검증입니다.',
  },
  {
    id: 'deployment',
    title: '03 · 작업한 소스를 사이트에 반영할 때',
    description:
      '이미지 생성·검사·게시는 자동, NAS에서 컨테이너 교체는 수동입니다.',
    steps: [
      ['GitHub main', '작업 브랜치 push → PR → main 병합', '소스 보관'],
      ['GitHub Actions', 'linux/amd64 빌드 → 컨테이너 응답 검사', '자동'],
      ['GHCR', '검사한 이미지를 커밋 SHA 태그로 보관', '비공개 이미지'],
      ['NAS Docker', '새 이미지 다운로드 → 웹 컨테이너 교체', '수동'],
    ],
    note: 'Git push나 기존 컨테이너 재시작만으로 운영 화면이 바뀌지는 않습니다. 이미지 다운로드 인증과 웹 실행은 별개입니다.',
  },
];

const history = [
  {
    title: 'PC마다 DB를 두려던 계획에서 NAS 공용 개발 DB로',
    paragraphs: [
      '처음에는 개발하는 PC마다 PostgreSQL을 실행하려고 했습니다. 집과 외부에서 같은 개발 데이터를 사용하고 싶어, 개발 DB도 NAS에서 실행하는 구성을 선택했습니다. 소스와 개발 서버는 각 PC에 두고 DB만 공유합니다.',
      '개발 작업이 운영 데이터에 영향을 주지 않도록 DB 컨테이너·계정·데이터 폴더를 나눴습니다. 이 구성에서는 DB를 사용하기 위해 각 PC에 Docker Desktop을 설치할 필요가 없습니다.',
    ],
  },
  {
    title: '외부 PC에서 소스만 받았더니 API가 실행되지 않았습니다',
    paragraphs: [
      'Git으로 소스를 받은 뒤 /guide에서 API를 호출했지만 pg 패키지를 찾지 못했습니다. Git은 패키지 목록과 잠금 파일을 전달할 뿐 설치된 node_modules까지 전달하지 않기 때문입니다. npm ci로 같은 버전의 패키지를 설치해 해결했습니다.',
      '그다음 이 PC의 .env.local과 SSH 터널을 별도로 설정했습니다. Tailscale은 외부 PC가 NAS에 닿는 경로를, SSH 터널은 PC의 15432 포트를 NAS 안의 개발 DB로 연결하는 경로를 담당합니다. API를 거친 SELECT 1 성공까지 확인했습니다.',
    ],
  },
  {
    title: '이미지는 어디에서 빌드할까? GitHub Actions를 선택했습니다',
    paragraphs: [
      'NAS의 Docker에서 직접 빌드하거나, PC에 Docker를 설치해 빌드하는 방법도 있습니다. 당시 이 PC에는 Docker가 없었고 NAS에서 빌드까지 맡기면 자원을 더 사용하므로, GitHub Actions에서 빌드하고 NAS는 완성된 이미지를 실행하는 방식을 제안해 선택했습니다. 실제 NAS 빌드 성능을 비교 측정한 결과는 아닙니다.',
      'Docker 대신 Actions를 쓰는 관계는 아닙니다. Actions가 제공하는 Linux 컴퓨터에서 기존 Dockerfile로 Docker 이미지를 만듭니다. NAS에 맞는 linux/amd64로 빌드하고, 컨테이너를 잠깐 실행해 홈·health 응답과 개발 경로 차단을 검사한 뒤 GHCR에 게시합니다.',
      '첫 시도에서는 이미지 생성은 성공했지만 서버가 준비되기 전에 health 검사가 접속해 실패했습니다. 시작 중 연결 오류를 제한적으로 재시도하도록 고친 뒤 검사와 게시까지 성공했습니다.',
    ],
  },
  {
    title: '새 도메인을 사기 전에 기존 NAS 주소를 활용했습니다',
    paragraphs: [
      '기존에 DSM 관리에 사용하던 Synology DDNS 주소와 인증서가 있었습니다. 새 도메인을 구매하지 않고 같은 도메인의 기본 HTTPS 443을 웹사이트에 사용하고, DSM 관리는 기존 5001 포트로 구분했습니다.',
      '웹 컨테이너는 NAS 자신의 127.0.0.1:13000에서만 열고 DSM 역방향 프록시가 연결하도록 했습니다. 인증서로 외부 HTTPS를 처리한 뒤 내부 HTTP로 Next.js에 전달합니다. NAS 안에서 HTTP와 HTTPS 프록시 검사를 차례로 통과했습니다.',
    ],
  },
  {
    title: 'NAS 안에서는 됐지만 휴대폰에서는 열리지 않았습니다',
    paragraphs: [
      '내부 HTTPS는 성공했는데 외부 접속은 시간 초과였습니다. 공용 DNS는 맞았고 DSM 방화벽도 비활성화 상태여서 공유기의 포트포워딩을 확인했습니다. 기존 서비스 규칙은 있었지만 웹사이트용 TCP 443 규칙은 없었습니다.',
      '집 PC에 원격 접속할 수 없어 NAS를 경유하는 임시 SSH 터널로 공유기 관리 화면을 열었습니다. 공유기 HTTP 80만 잠시 허용해 확인하고, 외부 TCP 443을 NAS의 443으로 전달하는 규칙을 추가했습니다. 이후 휴대폰과 외부 PC에서 접속에 성공했습니다.',
      '작업 후 공유기에서 로그아웃하고 18080 터널을 닫았습니다. NAS SSH 허용 목록에서도 공유기 주소를 제거해 원래의 DB 목적지만 남겼습니다.',
    ],
  },
  {
    title: '첫 공개는 웹부터, NAS 배포는 수동으로 시작했습니다',
    paragraphs: [
      '현재 공개 콘텐츠는 소스에 있어 운영 DB 연결이나 migration 없이도 웹사이트를 띄울 수 있었습니다. 먼저 웹 컨테이너와 외부 HTTPS 접속을 완성하고, 인증·권한과 실제 DB 기능은 후속 작업으로 남겼습니다.',
      'main에 반영하면 이미지 빌드·검사·GHCR 게시는 자동으로 실행됩니다. NAS에서는 읽기 권한 토큰으로 이미지를 내려받아 컨테이너를 생성했습니다. 다음 업데이트도 새 이미지 다운로드와 컨테이너 교체가 필요하며, 이 부분의 자동 배포는 아직 구성하지 않았습니다.',
    ],
  },
];

export default async function EnvironmentPage() {
  if (!(await getAdminSession(await headers()))) notFound();
  return (
    <div className={`page ${s.page}`}>
      <h1>
        개발부터 배포까지
        <span className="accentDot" />
      </h1>
      <p className={s.intro}>
        2026년 10월 21일 작업일지에서 확인한 환경입니다. 실시간 상태판이 아닌
        구성 설명이며, 실제 주소와 인증 정보는 개인 설정에 보관합니다.
      </p>
      <div className={s.links}>
        <CommonButtonLink href="/guide">가이드로 돌아가기</CommonButtonLink>
        <CommonButtonLink href="/lab/markdown">
          Markdown 문서 보기
        </CommonButtonLink>
      </div>
      <div className={s.summary}>
        <div>
          <strong>공개 웹</strong>
          <span>NAS 컨테이너 · HTTPS 확인</span>
        </div>
        <div>
          <strong>개발 DB</strong>
          <span>NAS PostgreSQL · SSH 연결 확인</span>
        </div>
        <div>
          <strong>운영 DB</strong>
          <span>별도 컨테이너 · 웹 연동 전</span>
        </div>
      </div>
      <nav className={s.links} aria-label="구조도 목차">
        <a href="#network">네트워크 전체 구조</a>
        <a href="#history">이 구성이 되기까지</a>
        <a href="#production-db">운영 DB 연결 순서</a>
        {flows.map((flow) => (
          <a href={`#${flow.id}`} key={flow.id}>
            {flow.title}
          </a>
        ))}
      </nav>
      <section id="network" className={s.section}>
        <h2>네트워크 전체 구조</h2>
        <p>
          일반 사용자의 공개 웹 접속과 개발자의 사설 DB 접속은 서로 다른 경로를
          사용합니다. 환경과 네트워크 설명을 이 화면에서 함께 봅니다.
        </p>
        <NetworkDiagram />
        <p className={s.note}>
          Tailscale은 일반 방문자의 웹 접속에 필요하지 않습니다. NAS만
          Tailscale에 연결했다고 집 공유기 관리 화면까지 자동으로 열리는 것은
          아닙니다. 공유기 접근용 임시 터널은 작업 후 제거했습니다.
        </p>
      </section>
      {flows.map((flow) => (
        <section key={flow.id} id={flow.id} className={s.section}>
          <h2>{flow.title}</h2>
          <p>{flow.description}</p>
          <ol className={s.flow} aria-label={flow.title}>
            {flow.steps.map(([title, description, label], index) => (
              <li key={title}>
                <span className={s.number}>{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className={s.label}>{label}</span>
              </li>
            ))}
          </ol>
          <p className={s.note}>{flow.note}</p>
        </section>
      ))}
      <section id="history" className={s.section}>
        <h2>이 구성이 되기까지</h2>
        <p>
          처음의 요구와 선택지, 선택한 이유, 실제로 확인한 결과를 순서대로
          정리했습니다.
        </p>
        <ol className={s.history}>
          {history.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </li>
          ))}
        </ol>
      </section>
      <section id="production-db" className={s.section}>
        <h2>다음 단계 · 운영 웹을 운영 DB에 연결하기</h2>
        <p>
          현재 NAS 웹은 DB 없이 실행되며, 개발 DB에 연결된 상태가 아닙니다. 실제
          데이터를 저장·조회하는 기능을 붙일 때 운영 웹은 운영 DB를 사용합니다.
          아래는 앞으로의 작업 순서입니다.
        </p>
        <ol className={s.checklist}>
          <li>
            NAS 웹과 운영 DB의 컨테이너 이름, Docker 네트워크, 운영 앱 계정과 DB
            이름을 확인합니다. 환경변수 전체나 비밀번호는 출력하지 않습니다.
          </li>
          <li>
            먼저 개발 DB에서 스키마 migration과 서버 조회 기능을
            구현·검증합니다. 접속 정보만 넣어도 현재 정적 콘텐츠가 DB 조회로
            바뀌지는 않습니다.
          </li>
          <li>
            운영 DB 백업과 적용할 migration을 확인하고, 별도 migration 계정으로
            검증한 변경을 적용합니다.
          </li>
          <li>
            웹과 운영 DB가 통신할 Docker 네트워크를 연결하고, 웹 컨테이너 실행
            환경의 DATABASE_URL에 운영 앱 계정을 설정합니다. 이미지나 Git에는
            비밀번호를 넣지 않습니다.
          </li>
          <li>
            운영용 새 이미지로 웹 컨테이너를 교체한 뒤 실제 조회·권한·오류
            응답을 검사합니다. 기존 health 200은 DB 연결 성공을 보장하지
            않습니다.
          </li>
        </ol>
        <p className={s.note}>
          NAS 컨테이너끼리는 Docker 내부의 운영 DB 이름과 5432 포트를
          사용합니다. 개발 PC용 127.0.0.1:15432 SSH 터널 주소는 운영 웹에서
          사용하지 않습니다. 운영 앱에는 관리자 계정 대신 oz_app을 사용합니다.
        </p>
      </section>
      <section className={s.section}>
        <h2>NAS 안에서는 이렇게 나뉩니다</h2>
        <div className={s.containers}>
          <div>
            <h3>project-oz-web</h3>
            <p>
              공개 화면과 API. 호스트 포트는 loopback에만 연결하며 DSM 프록시가
              접근합니다.
            </p>
          </div>
          <div>
            <h3>project-oz-db-dev</h3>
            <p>
              공용 개발 PostgreSQL. 개발 전용 계정과 postgres-dev 데이터 폴더를
              사용합니다.
            </p>
          </div>
          <div>
            <h3>운영 PostgreSQL</h3>
            <p>
              개발 DB와 계정·데이터 폴더를 분리합니다. 현재 공개 웹에서는
              사용하지 않습니다.
            </p>
          </div>
        </div>
        <p className={s.note}>
          운영·개발 DB가 같은 Docker 네트워크를 사용합니다. 별도 컨테이너가
          네트워크 격리를 뜻하지는 않습니다.
        </p>
      </section>
      <section className={s.section}>
        <h2>확인한 것과 남은 것</h2>
        <ul className={s.checklist}>
          <li>
            확인 완료 · 외부 PC 개발 DB 연결, NAS 웹 실행, 인증서와 프록시, 외부
            HTTPS 접속
          </li>
          <li>정리 완료 · 공유기 접근용 임시 SSH 허용과 18080 터널 제거</li>
          <li>
            남은 작업 · Prisma migration, 실제 CRUD, 인증·권한, 운영 DB 연동
          </li>
          <li>
            미검증 · NAS 재부팅 후 자동 복구, 장시간 안정성, 백업 복원, 인증서
            자동 갱신
          </li>
        </ul>
        <p>
          원본 개인 작업일지는 저장소 밖에 보관합니다. 상세 설명은 Markdown
          뷰어의 docs/11-environment.md에서 볼 수 있습니다.
        </p>
      </section>
    </div>
  );
}
