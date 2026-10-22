import { getMessages } from '@/i18n/server';
import { createOzParticles } from '@/components/oz-particles';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import s from './about.module.css';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.about };
}

export default async function About() {
  const { messages } = await getMessages();
  const copy = messages.about;
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div>
          <h1>{copy.title}</h1>
          <p className={s.intro}>{copy.intro}</p>
          <p className={s.lead}>{copy.welcome}</p>
          <CommonButtonLink href="/projects">{copy.projectsLink}</CommonButtonLink>
        </div>
        <div className={s.signature}>
          <svg viewBox="0 0 440 280" role="img" aria-label={copy.imageAlt}>
            {createOzParticles(1300).map((point, index) => (
              <circle
                key={index}
                cx={point.x + 218}
                cy={point.y + 140}
                r={point.size * 0.8}
                fill={`hsl(${218 + ((point.x + 200) / 400) * 52}, 80%, 72%)`}
              />
            ))}
          </svg>
          <span className={s.signatureLabel}>SMALL IDEAS. NEW REALITIES.</span>
        </div>
      </section>
      <div className={s.stories}>
        {copy.sections.slice(0, 2).map((section, index) => (
          <section key={section.title} className={s.story}>
            <span className={s.number}>0{index + 1}</span>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
      <section className={s.origin}>
        <div className={s.wordmark} aria-hidden="true">
          dd<span>oz</span>a
        </div>
        <div>
          <h2>{copy.sections[2].title}</h2>
          <p>{copy.sections[2].body}</p>
        </div>
      </section>
      <section className={s.tools}>
        <h2>{copy.toolsTitle}</h2>
        <p>{copy.toolsBody}</p>
      </section>
      <section className={s.closing}>
        <p>{copy.notice}</p>
        <CommonButtonLink href="/board">{copy.boardLink}</CommonButtonLink>
      </section>
    </div>
  );
}
