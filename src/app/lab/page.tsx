import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuideMessages } from '@/i18n/guide-server';
import s from '../guide/guide.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.lab.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LabPage() {
  const { messages } = await getGuideMessages();
  const copy = messages.lab;
  const tools = [
    ['ideas', copy.ideasTitle, copy.ideasDescription, '01 / CAPTURE'],
    ['markdown', copy.markdownTitle, copy.markdownDescription, '02 / READ'],
  ] as const;
  return (
    <main className={`page ${s.guide}`}>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>
        {copy.title}
        <span className="accentDot" />
      </h1>
      <p>{copy.description}</p>
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
        {copy.guideLink}
      </Link>
    </main>
  );
}
