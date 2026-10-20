import { ButtonLink } from '@/components/ui/Button';
import { getMessages } from '@/i18n/server';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.help };
}

export default async function Help() {
  const { messages } = await getMessages();
  const copy = messages.contact;
  return (
    <div className="page">
      <span className="eyebrow">CONTACT / LET’S CONNECT</span>
      <h1>{copy.title}</h1>
      <p className="lead">{copy.intro}</p>
      <div className="filter">
        <a href="#faq">FAQ</a>
        <a href="#bug">{copy.bugLabel}</a>
        <a href="#contact">{copy.contactLabel}</a>
      </div>
      <section id="faq">
        <h2>{copy.faqLabel}</h2>
        {copy.faq.map((item) => (
          <details className="faq" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
      <section id="bug" className="prose">
        <h2>{copy.bugTitle}</h2>
        <p>{copy.bugDescription}</p>
      </section>
      <section id="contact" className="prose">
        <h2>{copy.contactTitle}</h2>
        <p>{copy.contactDescription}</p>
        <ButtonLink variant="primary" href="/login">
          {copy.accountLink}
        </ButtonLink>
      </section>
    </div>
  );
}
