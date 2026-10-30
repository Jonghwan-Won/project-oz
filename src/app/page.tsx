import { getPostCategories } from '@/server/services/post-categories';
import { getMessages } from '@/i18n/server';
import { OzParticles } from '@/components/OzParticles';
import { CommonButtonLink } from '@/components/ui/CommonButton';
import Image from 'next/image';
import Link from 'next/link';
import { BoardPreview } from '@/components/BoardPreview';
import { ProjectCard } from '@/components/ProjectCard';
import { getPublicProjects } from '@/server/services/projects';
import { getCategoryLabel } from '@/content/site';
import s from './page.module.css';
import { getPublicPosts } from '@/server/services/posts';
import { HomeSectionNav } from '@/components/HomeSectionNav';
const tools = [
  {
    name: 'Codex',
    logo: 'codex',
  },
  {
    name: 'GitHub',
    logo: 'github',
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
    name: 'PostgreSQL',
    logo: 'postgresql',
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
  const categoryOptions = await getPostCategories();
  const projects = await getPublicProjects(locale);
  const posts = await getPublicPosts(locale);
  const copy = messages.home;
  return (
    <>
      <HomeSectionNav labels={messages.navigation} />
      <section id="about" tabIndex={-1} className={s.hero}>
        <OzParticles label={messages.brandMotion.description} />
        <div className={s.copy}>
          {/* <span className={s.heroEyebrow}>DDOZAA / A WORLD IN THE MAKING</span> */}
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
          <CommonButtonLink className={s.aboutButton} href="/about">
            {copy.aboutLink}
          </CommonButtonLink>
        </div>
      </section>
      <section id="projects" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <h2 className="accentDot">{copy.projectsTitle}</h2>
          </div>
          <Link className="textLink" href="/projects">
            {copy.projectsLink}
          </Link>
        </div>
        <div className="projectGrid">
          {projects.slice(0, 2).map((project) => (
            <ProjectCard key={project.id} project={project} locale={locale} />
          ))}
        </div>
      </section>
      <section id="board" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <h2 className="accentDot">{copy.boardTitle}</h2>
          </div>
          <Link className="textLink" href="/board">
            {copy.boardLink}
          </Link>
        </div>
        <BoardPreview
          posts={posts.slice(0, 6).map((post) => ({
            ...post,
            category: getCategoryLabel(post.category, locale, categoryOptions),
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
                {copy.categories[index]}
              </Link>
            ),
          )}
        </div>
      </section>
      <section id="help" tabIndex={-1} className="section">
        <div className="sectionHeading">
          <div>
            <h2>{copy.helpTitle}</h2>
          </div>
        </div>
        <Link className={`interactiveCard ${s.helpCard}`} href="/help">
          <div>
            <span className={s.helpEyebrow}>FAQ &amp; CONTACT</span>
            <h3>{copy.helpCardTitle}</h3>
            <p>{copy.helpCardDescription}</p>
          </div>
          <span className={s.helpArrow} aria-hidden="true"></span>
        </Link>
      </section>
      <section
        className={`section ${s.credits}`}
        aria-labelledby="credits-heading"
      >
        <div className="sectionHeading">
          <div>
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
                  src={`/logos/${tool.logo}.${'svg'}`}
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
          {/* <div className={s.nextCompanion}>
            <span className={s.nextSymbol} aria-hidden="true">
              ＋
            </span>
            <h3>{copy.nextTitle}</h3>
          </div> */}
        </div>
      </section>
    </>
  );
}
