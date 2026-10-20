import { getMessages } from '@/i18n/server';
import { OzMotion } from '@/components/OzMotion';
import Image from 'next/image';
import Link from 'next/link';
import { BoardPreview } from '@/components/BoardPreview';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects } from '@/content/projects';
import { posts, getCategoryLabel } from '@/content/site';
import s from './page.module.css';
const tools = [
  {
    name: 'Codex',
    logo: 'codex',
    href: 'https://openai.com/codex/',
  },
  {
    name: 'React',
    logo: 'react',
    href: 'https://react.dev/',
  },
  {
    name: 'Next.js',
    logo: 'nextjs',
    href: 'https://nextjs.org/',
  },
  {
    name: 'TypeScript',
    logo: 'typescript',
    href: 'https://www.typescriptlang.org/',
  },
  {
    name: 'Synology',
    logo: 'synology',
    href: 'https://www.synology.com/',
  },
  {
    name: 'Docker',
    logo: 'docker',
    href: 'https://www.docker.com/',
  },
] as const;
export default async function Home() {
  const { messages } = await getMessages();
  const copy = messages.home;
  return (
    <>
      <section id="about" tabIndex={-1} className={s.hero}>
        <div className={s.copy}>
          <span className="eyebrow">THE WORLD OF DDOZA / 2026</span>
          <h1>
            {copy.heroStart}
            <br />
            <span className="accentDot">
              <mark className="textHighlight">{copy.heroHighlight}</mark>{' '}
              {copy.heroEnd}
            </span>
          </h1>
          <p>
            {copy.greeting}
            <br />
            {copy.intro}
          </p>
          <Link className="textLink" href="/about">
            {copy.aboutLink}
          </Link>
          <div className={s.heroNote}>
            DEVELOP · RECORD · CONNECT <span>THE WORLD OF OZ</span>
          </div>
        </div>
        <div className={s.motionScene}>
          <OzMotion labels={messages.motion} />
        </div>
      </section>
      <section id="projects" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">01 / PROJECTS</span>
            <h2 className="accentDot">{copy.projectsTitle}</h2>
          </div>
          <Link className="textLink" href="/projects">
            {copy.projectsLink}
          </Link>
        </div>
        <div className="projectGrid">
          {getPublicProjects()
            .slice(0, 2)
            .map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                labels={messages}
              />
            ))}
        </div>
      </section>
      <section id="board" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">02 / NOTES</span>
            <h2 className="accentDot">{copy.boardTitle}</h2>
          </div>
          <Link className="textLink" href="/board">
            {copy.boardLink}
          </Link>
        </div>
        <BoardPreview
          posts={posts.slice(0, 6).map((post) => ({
            ...post,
            category: getCategoryLabel(post.category, messages),
          }))}
          labels={messages.boardPreview}
        />
        <div className={s.categories}>
          {['AI 정보', '연예 이슈', '채용·공채', '주식·코인', '부동산'].map(
            (category, index) => (
              <Link
                key={category}
                href={'/board?category=' + encodeURIComponent(category)}
              >
                {copy.categories[index]} ↗
              </Link>
            ),
          )}
        </div>
      </section>
      <section id="help" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">03 / CONTACT</span>
            <h2>{copy.helpTitle}</h2>
          </div>
          <Link className="textLink" href="/help">
            {copy.helpLink}
          </Link>
        </div>
        <div className={s.helpGrid}>
          <Link href="/help#faq">
            <span className="eyebrow">FAQ ↗</span>
            <h3>{copy.faqTitle}</h3>
            <p>{copy.faqDescription}</p>
          </Link>
          <Link href="/help#contact">
            <span className="eyebrow">CONTACT ↗</span>
            <h3>{copy.contactTitle}</h3>
            <p>{copy.contactDescription}</p>
          </Link>
        </div>
      </section>
      <section
        className={`section ${s.credits}`}
        aria-labelledby="credits-heading"
      >
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">MADE WITH / THE WORLD OF OZ</span>
            <h2 id="credits-heading">
              {copy.creditsStart}
              <br />
              {copy.creditsEnd}
            </h2>
          </div>
          <p>
            {copy.creditsIntro}
            <br />
            {copy.creditsDescription}
          </p>
        </div>
        <div className={s.toolGrid}>
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className={s.toolCard}
              target="_blank"
              rel="noreferrer"
              aria-label={`${tool.name} ${copy.officialSite}`}
            >
              <div className={s.toolBrand}>
                <Image
                  src={`/logos/${tool.logo}.svg`}
                  width={64}
                  height={64}
                  alt=""
                  className={s.toolLogo}
                />
                <span className={s.toolName}>{tool.name}</span>
              </div>
              <div>
                <span className={s.toolRole}>{copy.tools[tool.logo].role}</span>
                <p>{copy.tools[tool.logo].description}</p>
              </div>
              <span className={s.toolArrow} aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
          <div className={s.nextCompanion}>
            <span className={s.nextSymbol} aria-hidden="true">
              ＋
            </span>
            <h3>{copy.nextTitle}</h3>
            <p>
              {copy.nextIntro}
              <br />
              {copy.nextDescription}
            </p>
            <span className="eyebrow">THE JOURNEY CONTINUES</span>
          </div>
        </div>
        <p className={s.creditsNote}>
          {copy.creditsNoteStart}
          <br />
          {copy.creditsNoteEnd}
        </p>
      </section>
    </>
  );
}
