import { ButtonLink } from '@/components/ui/Button';
import { getMessages } from '@/i18n/server';

export async function generateMetadata() {
  const { messages } = await getMessages();
  return { title: messages.account.metadata };
}

export default async function Login() {
  const { messages } = await getMessages();
  const copy = messages.account;
  return (
    <div className="page">
      <span className="eyebrow">ACCOUNT</span>
      <h1>{copy.title}</h1>
      <p className="lead">{copy.intro}</p>
      <div className="notice">{copy.notice}</div>
      <ButtonLink href="/" variant="primary">
        {copy.home}
      </ButtonLink>
    </div>
  );
}
