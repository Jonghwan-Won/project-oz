import Image from 'next/image';
import { getMessages } from '@/i18n/server';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.about };
}

export default async function About() {
  const { messages } = await getMessages();
  const copy = messages.about;
  return (
    <div className="page">
      <span className="eyebrow">ABOUT / THE PERSON BEHIND OZ</span>
      <h1>{copy.title}</h1>
      <div className="aboutGrid">
        <div className="prose">
          <p>
            {copy.intro}
            <br />
            {copy.welcome}
          </p>
          {copy.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <div className="notice">{copy.notice}</div>
        </div>
        <Image
          className="aboutArtwork"
          src="/images/oz-two-worlds.webp"
          width={1536}
          height={1024}
          alt={copy.imageAlt}
        />
      </div>
    </div>
  );
}
