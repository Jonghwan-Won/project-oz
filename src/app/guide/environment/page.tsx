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

export default async function EnvironmentPage() {
  if (!(await getAdminSession(await headers()))) notFound();
  return (
    <div className={`page ${s.page}`}>
      <h1>
        개발부터 배포까지
        <span className="accentDot" />
      </h1>
      <p className={s.intro}>
        공개 가능한 구성 설명입니다. 실제 주소, 계정, 호스트 경로와 개인
        구축·장애 기록은 비공개로 관리하며 이 화면은 현재 서버 상태를 보증하지
        않습니다.
      </p>
      <div className={s.links}>
        <CommonButtonLink href="/guide">가이드로 돌아가기</CommonButtonLink>
        <CommonButtonLink href="/lab/markdown">
          Markdown 문서 보기
        </CommonButtonLink>
      </div>
      <section id="network" className={s.section}>
        <h2>네트워크 전체 구조</h2>
        <p>
          공개 웹은 HTTPS 진입점과 웹 컨테이너를 거쳐 운영 DB에 연결합니다. 개발
          PC는 별도 사설 연결과 SSH 터널로 개발 DB를 사용합니다. DB와 관리
          접속은 인터넷에 직접 공개하지 않습니다.
        </p>
        <NetworkDiagram />
      </section>
      <section id="history" className={s.section}>
        <h2>구성을 선택한 이유</h2>
        <ul className={s.checklist}>
          <li>
            개발·운영 DB와 계정·파일 저장소를 분리해 개발 변경의 영향을
            줄입니다.
          </li>
          <li>
            Docker 대신 Actions를 쓰는 관계가 아니라, GitHub Actions에서 Docker
            이미지를 빌드하고 검사한 뒤 운영 호스트에서 실행하는 구성입니다.
          </li>
          <li>
            업로드와 DB를 영속 저장소에 두어 컨테이너 교체 후에도 유지합니다.
          </li>
          <li>이미지는 커밋 SHA로 식별하며 운영 컨테이너 교체는 수동입니다.</li>
        </ul>
      </section>
      <section id="production-db" className={s.section}>
        <h2>운영 변경 전 확인</h2>
        <ol className={s.checklist}>
          <li>
            개발 환경에서 변경을 검증하고 대상 DB와 호환되는 이미지·migration을
            확인합니다.
          </li>
          <li>DB와 업로드를 함께 백업하고 복원 가능성을 검증합니다.</li>
          <li>
            별도 migration 계정으로 변경을 적용하고 웹에는 최소 권한 앱 계정을
            사용합니다.
          </li>
          <li>
            실행 환경에 비밀값과 영속 볼륨을 연결하며 Git·이미지에 포함하지
            않습니다.
          </li>
          <li>배포 후 로그인, 공개·비공개 조회와 첨부 접근을 확인합니다.</li>
        </ol>
        <p className={s.note}>
          health 응답은 DB 연결이나 권한 검증을 대신하지 않습니다. 같은 호스트의
          폴더 분리는 네트워크 격리나 외부 백업을 대신하지 않습니다.
        </p>
      </section>
      <p>
        상세 절차는 Markdown 뷰어의 docs/06-배포-운영.md와
        docs/11-환경-구축-기록.md를 참고하세요.
      </p>
    </div>
  );
}
