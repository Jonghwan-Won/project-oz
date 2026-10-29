import type { Metadata } from 'next';
import Link from 'next/link';
import s from '../guide/guide.module.css';

export const metadata: Metadata = {
  title: '실험실',
  robots: { index: false, follow: false },
};

const tools = [
  [
    'ideas',
    '아이디어 저장소',
    '아이디어를 모으고 우선순위와 설계 흐름을 살펴봅니다.',
    '01 / CAPTURE',
  ],
  [
    'markdown',
    'Markdown 뷰어',
    '프로젝트 문서를 선택하거나 Markdown 파일을 열어봅니다.',
    '02 / READ',
  ],
] as const;

export default function LabPage() {
  return (
    <main className={`page ${s.guide}`}>
      <p className="eyebrow">PLAYGROUND</p>
      <h1>
        실험실
        <span className="accentDot" />
      </h1>
      <p>
        아이디어와 도구를 시험하는 공간입니다. 가이드의 공통 UI·개발 정보와
        분리해 두었습니다.
      </p>
      <div className={s.labGrid}>
        {tools.map(([slug, title, description, kicker]) => (
          <Link className={s.labCard} href={`/lab/${slug}`} key={slug}>
            <span>{kicker}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
      <Link className="textLink" href="/guide">
        개발 가이드 →
      </Link>
    </main>
  );
}
