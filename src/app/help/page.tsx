import { getMessages } from '@/i18n/server';
import { HelpActions } from './HelpActions';
import { ContactCard } from '@/components/ContactCard';
import s from './help.module.css';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.navigation.help };
}

export default async function Help() {
  const { messages, locale } = await getMessages();
  const copy = messages.contact;
  return (
    <div className={`page ${s.help}`}>
      <header className={s.intro}>
        {/* <span className={s.eyebrow}>{copy.faqLabel}</span> */}
        <h1 className="accentDot">{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      <div className={s.directContact}>
        <ContactCard
          title={messages.home.contactTitle}
          description={messages.home.contactDescription}
          locale={locale}
        />
      </div>
      <section
        id="faq"
        className={s.faqSection}
        aria-labelledby="help-faq-title"
      >
        <h2 id="help-faq-title">{copy.faqLabel}</h2>
        <div className={s.faqList}>
          {copy.faq.map((item, index) => (
            <details className={s.faq} key={item.question}>
              <summary>
                <span className={s.faqNumber}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{item.question}</span>
                <span className={s.faqIcon} aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <HelpActions copy={copy} />
    </div>
  );
}
