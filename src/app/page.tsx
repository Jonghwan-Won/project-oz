import { getMessages } from '@/i18n/server';
import { OzParticles } from '@/components/OzParticles';
import { ButtonLink } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { BoardPreview } from '@/components/BoardPreview';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects } from '@/server/services/projects';
import { posts, getCategoryLabel } from '@/content/site';
import s from './page.module.css';
const tools = [
  {
    name: 'Codex',
    logo: 'codex',
  },
  {
    name: 'React',
    logo: 'react',
  },
  {
    name: 'Next.js',
    logo: 'nextjs',
  },
  {
    name: 'TypeScript',
    logo: 'typescript',
  },
  {
    name: 'Synology',
    logo: 'synology-standard',
  },
  {
    name: 'Docker',
    logo: 'docker',
  },
] as const;
export default async function Home() {
  const { messages, locale } = await getMessages();
  const projects = await getPublicProjects(locale);
  const copy = messages.home;
  return (
    <>
      <section id="about" tabIndex={-1} className={s.hero}>
        <OzParticles label={messages.brandMotion.description} />
        <div className={s.copy}>
          <span className={s.heroEyebrow}>DDOZA / A WORLD IN THE MAKING</span>
          <h1>
            {copy.heroStart}
            <br />
            <span className={s.heroHighlight}>{copy.heroHighlight}</span>{' '}
            {copy.heroEnd}
            <span className={s.heroPeriod}>.</span>
          </h1>
          <p>
            {copy.greeting}
            <br />
            {copy.intro}
          </p>
          <ButtonLink className={s.aboutButton} href="/about">
            {copy.aboutLink}
          </ButtonLink>
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
          {projects.slice(0, 2).map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              labels={messages}
              locale={locale}
            />
          ))}
        </div>
      </section>
      <section id="board" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">02 / BOARD</span>
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
          <Link className="interactiveCard" href="/help#faq">
            <span className="eyebrow">FAQ ↗</span>
            <h3>{copy.faqTitle}</h3>
            <p>{copy.faqDescription}</p>
          </Link>
          <Link className="interactiveCard" href="/help#contact">
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
            <div key={tool.name} className={s.toolCard}>
              <div className={s.toolBrand}>
                <Image
                  src={`/logos/${tool.logo}.svg`}
                  width={tool.logo === 'synology-standard' ? 148 : 64}
                  height={64}
                  alt=""
                  className={
                    tool.logo === 'synology-standard'
                      ? s.wordmarkLogo
                      : s.toolLogo
                  }
                />
                <span className={s.toolName}>{tool.name}</span>
              </div>
            </div>
          ))}
          <div className={s.nextCompanion}>
            <span className={s.nextSymbol} aria-hidden="true">
              ＋
            </span>
            <h3>{copy.nextTitle}</h3>
          </div>
        </div>
      </section>
    </>
  );
}
