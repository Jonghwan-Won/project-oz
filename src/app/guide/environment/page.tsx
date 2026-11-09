import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminSession } from '@/server/auth';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import { getGuideMessages } from '@/i18n/guide-server';
import s from './environment.module.css';
import { NetworkDiagram } from './NetworkDiagram';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getGuideMessages();
  return {
    title: messages.environment.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function EnvironmentPage() {
  if (!(await getAdminSession(await headers()))) notFound();
  const { messages } = await getGuideMessages();
  const copy = messages.environment;
  return (
    <div className={`page ${s.page}`}>
      <h1>
        {copy.title}
        <span className="accentDot" />
      </h1>
      <p className={s.intro}>{copy.intro}</p>
      <div className={s.links}>
        <CommonButtonLink href="/guide">{copy.backToGuide}</CommonButtonLink>
        <CommonButtonLink href="/lab/markdown">
          {copy.markdownLink}
        </CommonButtonLink>
      </div>
      <section id="network" className={s.section}>
        <h2>{copy.networkTitle}</h2>
        <p>{copy.networkDescription}</p>
        <NetworkDiagram messages={messages.diagram} />
      </section>
      <section id="history" className={s.section}>
        <h2>{copy.reasonsTitle}</h2>
        <ul className={s.checklist}>
          {copy.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>
      <section id="production-db" className={s.section}>
        <h2>{copy.checklistTitle}</h2>
        <ol className={s.checklist}>
          {copy.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p className={s.note}>{copy.note}</p>
      </section>
      <p>{copy.docsNote}</p>
    </div>
  );
}
